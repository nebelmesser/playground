// Shared only by the two granular experiments. Contacts store tangential
// displacement: static arches are supported by actual forces and torques.
export function makeDEM(bodies, options = {}) {
  const o = { width: 30, height: 24, stiffness: 700, tangential: 350, damping: 7, friction: .5, basal: 0, basalStatic: 0, gravity: 0, floor: true, ceiling: true, outlet: 0, ...options };
  const contacts = new Map(); let serial = 0, dissipated = 0, maxOverlap = 0, bearing = [];
  function plane(b, penetration, nx, ny, id, dt) {
    if (penetration <= 0) return;
    const vn = b.vx * nx + b.vy * ny, fn = Math.max(0, o.stiffness * penetration ** 1.5 - o.damping * Math.sqrt(penetration) * vn);
    const tx = -ny, ty = nx, vt = b.vx * tx + b.vy * ty - b.omega * b.r;
    const key = `${b.id}:w${id}`, old = contacts.get(key) || { displacement: 0, seen: 0 };
    old.displacement += vt * dt; old.seen = serial;
    const kt = o.tangential * Math.sqrt(penetration), limit = o.friction * fn;
    const ft = Math.max(-limit, Math.min(limit, -kt * old.displacement - 1.5 * vt));
    old.displacement = -(ft + 1.5 * vt) / Math.max(kt, 1e-12); contacts.set(key, old);
    b.fx += fn * nx + ft * tx; b.fy += fn * ny + ft * ty; b.torque -= b.r * ft;
    maxOverlap = Math.max(maxOverlap, penetration / b.r);
  }
  function pair(a, b, dt) {
    const dx = b.x - a.x, dy = b.y - a.y, rr = a.r + b.r, d2 = dx * dx + dy * dy;
    if (d2 >= rr * rr) return;
    const distance = Math.sqrt(d2) || 1e-9, nx = dx / distance, ny = dy / distance, tx = -ny, ty = nx, overlap = rr - distance;
    const rvx = b.vx - a.vx, rvy = b.vy - a.vy, vn = rvx * nx + rvy * ny, vt = rvx * tx + rvy * ty - a.omega * a.r - b.omega * b.r;
    const fn = Math.max(0, o.stiffness * overlap ** 1.5 - o.damping * Math.sqrt(overlap) * vn);
    const key = `${a.id}:${b.id}`, old = contacts.get(key) || { displacement: 0, seen: 0 };
    old.displacement += vt * dt; old.seen = serial;
    const kt = o.tangential * Math.sqrt(overlap), limit = o.friction * fn;
    const ft = Math.max(-limit, Math.min(limit, kt * old.displacement + 1.5 * vt));
    old.displacement = (ft - 1.5 * vt) / Math.max(kt, 1e-12); contacts.set(key, old);
    const fx = -fn * nx + ft * tx, fy = -fn * ny + ft * ty;
    a.fx += fx; a.fy += fy; b.fx -= fx; b.fy -= fy;
    a.torque += a.r * ft; b.torque += b.r * ft;
    dissipated += dt * o.damping * Math.sqrt(overlap) * vn * vn;
    maxOverlap = Math.max(maxOverlap, overlap / Math.min(a.r, b.r));
    if (fn > .15) bearing.push({ a: a.id, b: b.id, force: fn, tangent: ft });
  }
  return {
    bodies, options: o, contacts,
    get bearing() { return bearing; }, get dissipated() { return dissipated; }, get maxOverlap() { return maxOverlap; },
    step(dt, external) {
      serial++; maxOverlap = 0; bearing = [];
      for (const b of bodies) { b.fx = 0; b.fy = b.inTransit ? 0 : -o.gravity * b.mass; b.torque = 0; }
      external?.(bodies, dt);
      // One larger intruder is checked separately; the ordinary grains use cells.
      const small = bodies.filter(b => !b.large && !b.inTransit), large = bodies.filter(b => b.large && !b.inTransit);
      let diameter = .1; for (const b of small) diameter = Math.max(diameter, b.r * 2);
      const cells = new Map();
      for (const b of small) { const x = Math.floor(b.x / diameter), y = Math.floor(b.y / diameter), key = `${x},${y}`; let bucket = cells.get(key); if (!bucket) cells.set(key, bucket = []); bucket.push(b); }
      for (const a of small) {
        const cx = Math.floor(a.x / diameter), cy = Math.floor(a.y / diameter);
        for (let y = cy - 1; y <= cy + 1; y++) for (let x = cx - 1; x <= cx + 1; x++) for (const b of cells.get(`${x},${y}`) || []) if (b.id > a.id) pair(a, b, dt);
      }
      for (let i = 0; i < large.length; i++) { for (const b of small) pair(b, large[i], dt); for (let j = i + 1; j < large.length; j++) pair(large[i], large[j], dt); }
      for (const b of bodies) {
        if (b.inTransit) continue;
        plane(b, b.r - b.x, 1, 0, 'left', dt); plane(b, b.x + b.r - o.width, -1, 0, 'right', dt);
        if (o.ceiling) plane(b, b.y + b.r - o.height, 0, -1, 'top', dt);
        if (o.floor) {
          const left = (o.width - o.outlet) / 2, right = (o.width + o.outlet) / 2;
          if (!o.outlet || b.x <= left || b.x >= right) plane(b, b.r - b.y, 0, 1, 'bottom', dt);
          else {
            // Rounded outlet corners, rather than a floor that vanishes under centres.
            for (const [x, id] of [[left, 'lipL'], [right, 'lipR']]) {
              const dx = b.x - x, dy = b.y, d = Math.hypot(dx, dy);
              if (d < b.r && d > 1e-10) plane(b, b.r - d, dx / d, dy / d, id, dt);
            }
          }
        }
        if (b.fixed) { b.vx = b.vy = b.omega = 0; continue; }
        const speed = Math.hypot(b.vx, b.vy), force = Math.hypot(b.fx, b.fy), basal = b.basal ?? o.basal, stat = b.basalStatic ?? o.basalStatic;
        if (speed < .018 && force <= stat * b.mass) { b.vx = b.vy = 0; }
        else {
          const directionX = speed > 1e-9 ? b.vx / speed : b.fx / (force || 1), directionY = speed > 1e-9 ? b.vy / speed : b.fy / (force || 1);
          let vx = b.vx + dt * b.fx / b.mass, vy = b.vy + dt * b.fy / b.mass;
          const reduction = basal * dt, projection = vx * directionX + vy * directionY;
          if (projection > reduction) { vx -= reduction * directionX; vy -= reduction * directionY; }
          else if (force < stat * b.mass) vx = vy = 0;
          b.vx = vx; b.vy = vy;
        }
        b.omega += dt * b.torque / b.inertia; b.omega *= Math.exp(-.05 * dt);
        b.x += dt * b.vx; b.y += dt * b.vy; b.angle += dt * b.omega;
      }
      for (const [key, contact] of contacts) if (contact.seen !== serial) contacts.delete(key);
    },
    kinetic() { let E = 0; for (const b of bodies) E += .5 * b.mass * (b.vx * b.vx + b.vy * b.vy) + .5 * b.inertia * b.omega * b.omega; return E; },
  };
}
export function body(id, x, y, r, extra = {}) { const mass = r * r; return { id, x, y, r, mass, inertia: .5 * mass * r * r, vx: 0, vy: 0, omega: 0, angle: 0, fx: 0, fy: 0, torque: 0, ...extra }; }

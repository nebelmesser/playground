export const W = 240, H = 170, CELLS = W * H;
export const MIN_RADIUS = 2, MAX_RADIUS = 12, MAX_CITIES = 24;
export const clamp = (x: number, a: number, b: number) => Math.max(a, Math.min(b, x));
export const cell = (x: number, y: number) => clamp(Math.floor(y), 0, H - 1) * W + clamp(Math.floor(x), 0, W - 1);
export type Params = {
    relief: number;
    uphill: number;
    downhill: number;
    reuse: number;
    evaporation: number;
    density: number;
    spread: number;
    exploration: number;
    agentCount: number;
    agentSpeed: number;
    brush: number;
};
export const DEFAULTS: Params = { relief: 1, uphill: 7, downhill: 3, reuse: 2, evaporation: 25, density: 1, spread: 1.8, exploration: .3, agentCount: 800, agentSpeed: 9, brush: 9 };
export type City = {
    id: number;
    x: number;
    y: number;
    radius: number;
};
export type Pair = {
    key: string;
    a: number;
    b: number;
    weight: number;
};
export type Agent = {
    x: number;
    y: number;
    angle: number;
    pair: string;
    source: number;
    target: number;
    effort: number;
    direct: number;
    elapsed: number;
    decision: number;
    confidence: number;
    wait: number;
};
export function seeded(seed: number) { return () => { seed |= 0; seed = seed + 0x6D2B79F5 | 0; let t = Math.imul(seed ^ seed >>> 15, 1 | seed); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
export class World {
    params: Params;
    terrain = new Float32Array(CELLS);
    memory = new Float32Array(CELLS);
    cities: City[] = [];
    agents: Agent[] = [];
    journeys = 0;
    syncedRevision = -1;
    time = 0;
    terrainVersion = 0;
    revision = 0;
    nextId = 1;
    random: () => number;
    constructor(seed = Math.floor(Math.random() * 2 ** 30), params = { ...DEFAULTS }) {
        this.params = params;
        this.random = seeded(seed);
        this.generate();
        for (const [x, y, radius] of [[32, 40, 4], [91, 29, 8], [161, 36, 5], [211, 60, 3], [48, 104, 7], [118, 87, 10], [181, 111, 6], [89, 144, 3], [219, 147, 4]])
            this.addCity(x, y, radius);
    }
    invalidate() { this.revision++; }
    addCity(x: number, y: number, radius = 5) {
        if (this.cities.length >= MAX_CITIES || this.cities.some(c => Math.hypot(c.x - x, c.y - y) < 4))
            return null;
        const city = { id: this.nextId++, x: clamp(x, radius, W - radius), y: clamp(y, radius, H - radius), radius };
        this.cities.push(city);
        this.invalidate();
        return city;
    }
    moveCity(city: City, x: number, y: number) {
        city.x = clamp(x, city.radius, W - city.radius);
        city.y = clamp(y, city.radius, H - city.radius);
        this.invalidate();
    }
    resizeCity(city: City, radius: number) {
        city.radius = clamp(radius, MIN_RADIUS, Math.min(MAX_RADIUS, city.x, W - city.x, city.y, H - city.y));
        this.invalidate();
    }
    removeCity(id: number) { this.cities = this.cities.filter(c => c.id !== id); this.invalidate(); }
    connectionsFor(city: City) {
        if (this.cities.length < 2)
            return 0;
        return Math.min(this.cities.length - 1, 1 + Math.floor((city.radius / MAX_RADIUS) ** 2 * (this.cities.length - 2) * this.params.density));
    }
    pairs(): Pair[] {
        const pairs = new Map<string, Pair>();
        for (const city of this.cities) {
            const neighbors = this.cities.filter(c => c !== city).sort((a, b) => Math.hypot(a.x - city.x, a.y - city.y) / Math.sqrt(a.radius) - Math.hypot(b.x - city.x, b.y - city.y) / Math.sqrt(b.radius) || a.id - b.id);
            for (const other of neighbors.slice(0, this.connectionsFor(city))) {
                const a = Math.min(city.id, other.id), b = Math.max(city.id, other.id), key = `${a}:${b}`;
                pairs.set(key, { key, a, b, weight: Math.sqrt(city.radius * other.radius) / 5 });
            }
        }
        return [...pairs.values()].sort((a, b) => b.weight - a.weight || a.a - b.a || a.b - b.b);
    }
    createAgent(pair: Pair): Agent {
        const reverse = this.random() < .5;
        const source = this.cities.find(c => c.id === (reverse ? pair.b : pair.a))!;
        const target = this.cities.find(c => c.id === (reverse ? pair.a : pair.b))!;
        const angle = Math.atan2(target.y - source.y, target.x - source.x) + (this.random() - .5) * 1.2;
        const offset = this.random() * source.radius * .8;
        return { x: source.x + Math.cos(angle) * offset, y: source.y + Math.sin(angle) * offset, angle, pair: pair.key, source: source.id, target: target.id, effort: 0, direct: Math.hypot(target.x - source.x, target.y - source.y), elapsed: 0, decision: 0, confidence: .25, wait: this.random() * 3 };
    }
    syncAgents() {
        const pairs = this.pairs();
        if (!pairs.length) {
            this.agents = [];
            this.syncedRevision = this.revision;
            return;
        }
        const total = pairs.reduce((sum, p) => sum + p.weight, 0);
        const allocations = pairs.map(pair => ({ pair, count: Math.floor(this.params.agentCount * pair.weight / total), fraction: (this.params.agentCount * pair.weight / total) % 1 }));
        let remaining = this.params.agentCount - allocations.reduce((sum, a) => sum + a.count, 0);
        allocations.sort((a, b) => b.fraction - a.fraction);
        for (const allocation of allocations) {
            if (remaining <= 0)
                break;
            allocation.count++;
            remaining--;
        }
        const previous = new Map<string, Agent[]>();
        for (const agent of this.agents) {
            const group = previous.get(agent.pair) ?? [];
            group.push(agent);
            previous.set(agent.pair, group);
        }
        this.agents = [];
        for (const { pair, count } of allocations) {
            const group = (previous.get(pair.key) ?? []).slice(0, count);
            while (group.length < count)
                group.push(this.createAgent(pair));
            this.agents.push(...group);
        }
        this.syncedRevision = this.revision;
    }
    forget() { this.memory.fill(0); this.agents = []; this.journeys = 0; this.invalidate(); }
    deposit(x: number, y: number, amount: number) {
        const px = x - .5, py = y - .5, ix = Math.floor(px), iy = Math.floor(py), fx = px - ix, fy = py - iy;
        for (let dy = 0; dy <= 1; dy++)
            for (let dx = 0; dx <= 1; dx++) {
                const nx = ix + dx, ny = iy + dy;
                if (nx < 0 || ny < 0 || nx >= W || ny >= H)
                    continue;
                const i = ny * W + nx;
                this.memory[i] = Math.min(5, this.memory[i] + amount * (dx ? fx : 1 - fx) * (dy ? fy : 1 - fy));
            }
    }
    steer(agent: Agent, target: City) {
        const distance = Math.hypot(target.x - agent.x, target.y - agent.y);
        let best = -Infinity, heading = agent.angle;
        for (let k = -4; k <= 4; k++) {
            const turn = k * .34 + (this.random() - .5) * .2;
            const angle = agent.angle + turn, nx = agent.x + Math.cos(angle) * 2, ny = agent.y + Math.sin(angle) * 2;
            if (nx < .5 || ny < .5 || nx > W - .5 || ny > H - .5)
                continue;
            const progress = (distance - Math.hypot(target.x - nx, target.y - ny)) / 2;
            const trail = Math.log1p(this.memory[cell(nx, ny)]);
            const cost = this.travelCost(agent.x, agent.y, nx, ny) / 2;
            const score = progress * 1.6 + Math.cos(turn) * .45 + this.params.reuse * trail * (.2 + .8 * Math.max(0, progress)) - .8 * Math.log(cost) + (this.random() - .5) * (.2 + this.params.exploration * 2.5);
            if (score > best) {
                best = score;
                heading = angle;
            }
        }
        agent.angle = best === -Infinity ? agent.angle + Math.PI : heading;
    }
    moveAgent(agent: Agent, distance: number) {
        if (distance <= 0)
            return;
        const nx = clamp(agent.x + Math.cos(agent.angle) * distance, .5, W - .5), ny = clamp(agent.y + Math.sin(agent.angle) * distance, .5, H - .5);
        const cost = this.travelCost(agent.x, agent.y, nx, ny), factor = distance / Math.max(distance, cost);
        const x = agent.x + (nx - agent.x) * factor, y = agent.y + (ny - agent.y) * factor;
        const walked = Math.hypot(x - agent.x, y - agent.y);
        agent.effort += this.travelCost(agent.x, agent.y, x, y);
        // Reinforcement happens only underneath a moving agent. A completed trip
        // improves its future local signal; it never paints a whole route at once.
        this.deposit((x + agent.x) * .5, (y + agent.y) * .5, walked * .035 * (.3 + agent.confidence));
        agent.x = x;
        agent.y = y;
    }
    step(dt: number) {
        if (this.syncedRevision !== this.revision)
            this.syncAgents();
        this.time += dt;
        const decay = Math.exp(-Math.LN2 * dt / this.params.evaporation);
        for (let i = 0; i < CELLS; i++)
            this.memory[i] *= decay;
        const cities = new Map(this.cities.map(c => [c.id, c]));
        for (const agent of this.agents) {
            if (agent.wait > 0) {
                agent.wait -= dt;
                continue;
            }
            const target = cities.get(agent.target), source = cities.get(agent.source);
            if (!target || !source)
                continue;
            agent.elapsed += dt;
            // Even overlapping circles require a real journey between their centres.
            const arrival = Math.max(.7, Math.min(target.radius * .45, Math.hypot(target.x - source.x, target.y - source.y) * .2));
            if (Math.hypot(agent.x - target.x, agent.y - target.y) < arrival) {
                agent.confidence = clamp(agent.direct / Math.max(agent.direct, agent.effort), .1, 1);
                this.journeys++;
                agent.source = target.id;
                agent.target = source.id;
                agent.direct = Math.hypot(target.x - source.x, target.y - source.y);
                agent.effort = 0;
                agent.elapsed = 0;
                agent.angle += Math.PI;
                agent.decision = 0;
                agent.wait = .1 + this.random() * .6;
                continue;
            }
            if (agent.elapsed > 150) {
                agent.x = source.x;
                agent.y = source.y;
                agent.effort = 0;
                agent.elapsed = 0;
                agent.confidence = .15;
                agent.angle = Math.atan2(target.y - source.y, target.x - source.x);
                agent.wait = this.random() * 2;
                continue;
            }
            agent.decision -= dt;
            if (agent.decision <= 0) {
                this.steer(agent, target);
                agent.decision = .18 + this.random() * .12;
            }
            this.moveAgent(agent, this.params.agentSpeed * dt);
        }
    }
    generate() {
        const bumps = Array.from({ length: 32 }, () => ({ x: this.random() * W, y: this.random() * H, radius: 12 + this.random() * 45, amplitude: this.random() * 2 - 0.9 }));
        let min = Infinity, max = -Infinity;
        for (let y = 0; y < H; y++)
            for (let x = 0; x < W; x++) {
                let h = 0;
                for (const b of bumps)
                    h += b.amplitude * Math.exp(-((x - b.x) ** 2 + (y - b.y) ** 2) / (b.radius ** 2));
                h += 0.05 * Math.sin(x * 0.13 + Math.sin(y * 0.07)) * Math.cos(y * 0.15) + 0.02 * Math.sin(x * 0.37 + y * 0.23);
                this.terrain[y * W + x] = h;
                min = Math.min(min, h);
                max = Math.max(max, h);
            }
        for (let i = 0; i < CELLS; i++)
            this.terrain[i] = (this.terrain[i] - min) / (max - min);
        this.terrainVersion++;
        this.invalidate();
    }
    height(x: number, y: number) {
        x = clamp(x - 0.5, 0, W - 1);
        y = clamp(y - 0.5, 0, H - 1);
        const ix = Math.floor(x), iy = Math.floor(y), fx = x - ix, fy = y - iy;
        const a = this.terrain[iy * W + ix], b = this.terrain[iy * W + Math.min(ix + 1, W - 1)];
        const c = this.terrain[Math.min(iy + 1, H - 1) * W + ix], d = this.terrain[Math.min(iy + 1, H - 1) * W + Math.min(ix + 1, W - 1)];
        return (a * (1 - fx) + b * fx) * (1 - fy) + (c * (1 - fx) + d * fx) * fy;
    }
    travelCost(x: number, y: number, nx: number, ny: number) {
        const length = Math.hypot(nx - x, ny - y);
        const dh = (this.height(nx, ny) - this.height(x, y)) * this.params.relief;
        return length + Math.abs(dh) * 35 * (dh > 0 ? this.params.uphill : this.params.downhill);
    }
    sculpt(x: number, y: number, direction: number, dt: number) {
        const radius = this.params.brush;
        for (let iy = Math.max(0, Math.floor(y - radius)); iy < Math.min(H, y + radius); iy++)
            for (let ix = Math.max(0, Math.floor(x - radius)); ix < Math.min(W, x + radius); ix++) {
                const d = Math.hypot(ix + 0.5 - x, iy + 0.5 - y) / radius;
                if (d < 1)
                    this.terrain[iy * W + ix] = clamp(this.terrain[iy * W + ix] + direction * dt * 0.2 * (1 - d * d) ** 2, 0, 1);
            }
        this.terrainVersion++;
        this.invalidate();
    }
}

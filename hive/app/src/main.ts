import './style.css';
import { World, W, H, DEFAULTS, MIN_RADIUS, MAX_RADIUS, clamp, type Params, type City } from './simulation';
import { Renderer, type Camera } from './renderer';
const $ = <T extends HTMLElement>(id: string) => document.getElementById(id) as T;
const canvas = $<HTMLCanvasElement>('field');
const world = new World();
let renderer: Renderer;
const camera: Camera = { x: W / 2, y: H / 2, scale: 1 };
let mode = 0, tool = 'move', selected = 0, hovered = 0, pointer = [-999, -999], lastTime = 0, lastStats = 0;
let speed = 1, paused = false, accumulator = 0;
function changed() { if (world.syncedRevision !== world.revision)
    world.syncAgents(); updateStats(); }
function fit() { camera.x = W / 2; camera.y = H / 2; camera.scale = Math.min(innerWidth / W, innerHeight / H) * .97; }
function toWorld(x: number, y: number) { return [camera.x + (x - innerWidth / 2) / camera.scale, camera.y + (y - innerHeight / 2) / camera.scale]; }
fit();
let noticeTimer = 0;
function notice(message: string) { $('notice').textContent = message; $('notice').classList.add('visible'); clearTimeout(noticeTimer); noticeTimer = window.setTimeout(() => $('notice').classList.remove('visible'), 2500); }
type Control = {
    key: keyof Params;
    label: string;
    min: number;
    max: number;
    step: number;
    format: (v: number) => string;
};
const fixed = (suffix = '', digits = 1) => (v: number) => v.toFixed(digits) + suffix;
const groups: [
    string,
    Control[]
][] = [
    ['Terrain', [
            { key: 'relief', label: 'Relief', min: 0, max: 2, step: .05, format: fixed('×', 2) },
            { key: 'uphill', label: 'Climbing cost', min: 0, max: 20, step: .5, format: fixed('×') },
            { key: 'downhill', label: 'Descending cost', min: 0, max: 20, step: .5, format: fixed('×') },
            { key: 'brush', label: 'Brush radius', min: 3, max: 25, step: 1, format: fixed('', 0) },
        ]],
    ['Road network', [
            { key: 'density', label: 'Connection density', min: .2, max: 1.5, step: .05, format: fixed('×', 2) },
            { key: 'spread', label: 'Road spread', min: .6, max: 3, step: .1, format: fixed() },
            { key: 'exploration', label: 'Exploration', min: 0, max: 1, step: .01, format: v => `${Math.round(v * 100)}%` },
            { key: 'agentCount', label: 'Agents', min: 100, max: 2500, step: 100, format: fixed('', 0) },
            { key: 'agentSpeed', label: 'Walking speed', min: 3, max: 18, step: .5, format: fixed() },
            { key: 'reuse', label: 'Trail attraction', min: 0, max: 4, step: .1, format: fixed('×') },
            { key: 'evaporation', label: 'Route memory half-life', min: 5, max: 120, step: 5, format: fixed(' s', 0) },
        ]],
];
for (const [title, controls] of groups) {
    const heading = document.createElement('h3');
    heading.className = 'group-title';
    heading.textContent = title;
    $('controls').append(heading);
    for (const c of controls) {
        const el = document.createElement('div');
        el.className = 'control';
        el.innerHTML = `<div class="control-head"><label for="${c.key}">${c.label}</label><output id="${c.key}-value">${c.format(DEFAULTS[c.key])}</output></div><input type="range" id="${c.key}" min="${c.min}" max="${c.max}" step="${c.step}" value="${DEFAULTS[c.key]}">`;
        $('controls').append(el);
        $<HTMLInputElement>(c.key).oninput = e => { world.params[c.key] = Number((e.target as HTMLInputElement).value); $(c.key + '-value').textContent = c.format(world.params[c.key]); if (c.key !== 'brush' && c.key !== 'spread') {
            world.invalidate();
            changed();
        } };
    }
}
function settings(open: boolean) { $('settings').hidden = !open; $('settings-toggle').setAttribute('aria-expanded', String(open)); }
$('settings-toggle').onclick = () => settings($('settings').hidden);
$('settings-close').onclick = () => settings(false);
$('fit').onclick = fit;
$('pause').onclick = () => { paused = !paused; $('pause').textContent = paused ? 'Resume' : 'Pause'; $('pause').setAttribute('aria-pressed', String(paused)); };
$('speed').onclick = () => { speed = [1, 2, 4, 8][([1, 2, 4, 8].indexOf(speed) + 1) % 4]; $('speed').textContent = speed + '×'; };
$('reset-roads').onclick = () => { world.forget(); changed(); notice('Road memory cleared'); };
$('new-terrain').onclick = () => { world.generate(); world.forget(); changed(); notice('New terrain · cities kept in place'); };
$('clear-cities').onclick = () => { world.cities = []; world.forget(); selected = 0; changed(); };
function removeCity() { if (selected) {
    world.removeCity(selected);
    selected = 0;
    changed();
} }
$('remove-city').onclick = removeCity;
$<HTMLInputElement>('diameter').oninput = e => { const city = world.cities.find(c => c.id === selected); if (city) {
    world.resizeCity(city, Number((e.target as HTMLInputElement).value) / 2);
    changed();
} };
for (const b of document.querySelectorAll<HTMLButtonElement>('[data-view]'))
    b.onclick = () => { mode = Number(b.dataset.view); document.querySelectorAll<HTMLButtonElement>('[data-view]').forEach(other => other.setAttribute('aria-pressed', String(other === b))); };
const hints: Record<string, string> = { move: 'Drag a city to move · drag its rim to resize · drag empty ground to pan', city: 'Click empty ground to add a city · drag its rim to set its diameter', raise: 'Hold and drag to raise land · adjust brush in Settings', lower: 'Hold and drag to carve valleys · adjust brush in Settings' };
function selectTool(next: string) { tool = next; document.querySelectorAll<HTMLButtonElement>('[data-tool]').forEach(b => b.setAttribute('aria-pressed', String(b.dataset.tool === tool))); $('hint').textContent = hints[tool]; canvas.style.cursor = tool === 'move' ? 'grab' : 'crosshair'; }
for (const b of document.querySelectorAll<HTMLButtonElement>('[data-tool]'))
    b.onclick = () => selectTool(b.dataset.tool!);
function hit(x: number, y: number) {
    const tolerance = 7 / camera.scale;
    for (const city of [...world.cities].reverse()) {
        const distance = Math.hypot(x - city.x, y - city.y);
        if (distance <= city.radius + tolerance)
            return { city, resize: distance > city.radius * .65 && Math.abs(distance - city.radius) <= tolerance };
    }
    return null;
}
type Action = {
    kind: 'pan' | 'move' | 'resize' | 'paint';
    city?: City;
    offset?: number[];
    radius?: number;
    distance?: number;
};
let action: Action | null = null;
const pointers = new Map<number, {
    x: number;
    y: number;
}>();
let pinchDistance = 0;
function zoom(factor: number, x: number, y: number) { const before = toWorld(x, y); camera.scale = clamp(camera.scale * factor, Math.min(innerWidth / W, innerHeight / H) * .6, 35); const after = toWorld(x, y); camera.x += before[0] - after[0]; camera.y += before[1] - after[1]; }
canvas.addEventListener('pointerdown', e => {
    if (e.button !== 0)
        return;
    canvas.focus({ preventScroll: true });
    canvas.setPointerCapture(e.pointerId);
    pointers.set(e.pointerId, { x: e.clientX, y: e.clientY });
    pointer = toWorld(e.clientX, e.clientY);
    if (pointers.size === 2) {
        action = null;
        const [a, b] = [...pointers.values()];
        pinchDistance = Math.hypot(a.x - b.x, a.y - b.y);
        return;
    }
    if (tool === 'raise' || tool === 'lower') {
        action = { kind: 'paint' };
        return;
    }
    const target = hit(pointer[0], pointer[1]);
    if (target) {
        selected = target.city.id;
        action = { kind: target.resize ? 'resize' : 'move', city: target.city, offset: [target.city.x - pointer[0], target.city.y - pointer[1]], radius: target.city.radius, distance: Math.hypot(pointer[0] - target.city.x, pointer[1] - target.city.y) };
        updateStats();
        return;
    }
    if (tool === 'city') {
        if (pointer[0] < 0 || pointer[1] < 0 || pointer[0] > W || pointer[1] > H)
            return;
        const city = world.addCity(pointer[0], pointer[1]);
        if (city) {
            selected = city.id;
            changed();
        }
        else
            notice('Up to 24 cities · leave space between their centres');
        action = null;
    }
    else {
        selected = 0;
        updateStats();
        action = { kind: 'pan' };
    }
});
canvas.addEventListener('pointermove', e => {
    const old = pointers.get(e.pointerId);
    if (old)
        pointers.set(e.pointerId, { x: e.clientX, y: e.clientY });
    if (pointers.size >= 2) {
        const [a, b] = [...pointers.values()];
        const d = Math.hypot(a.x - b.x, a.y - b.y);
        if (pinchDistance > 0)
            zoom(d / pinchDistance, (a.x + b.x) / 2, (a.y + b.y) / 2);
        pinchDistance = d;
        return;
    }
    if (action?.kind === 'pan' && old) {
        camera.x -= (e.clientX - old.x) / camera.scale;
        camera.y -= (e.clientY - old.y) / camera.scale;
    }
    pointer = toWorld(e.clientX, e.clientY);
    if (action?.kind === 'move' && action.city) {
        world.moveCity(action.city, pointer[0] + action.offset![0], pointer[1] + action.offset![1]);
        changed();
    }
    if (action?.kind === 'resize' && action.city) {
        world.resizeCity(action.city, action.radius! + Math.hypot(pointer[0] - action.city.x, pointer[1] - action.city.y) - action.distance!);
        changed();
    }
    const target = (tool === 'move' || tool === 'city') ? hit(pointer[0], pointer[1]) : null;
    hovered = target?.city.id ?? 0;
    canvas.style.cursor = target ? (target.resize ? 'nwse-resize' : 'move') : tool === 'move' ? 'grab' : 'crosshair';
});
function release(e: PointerEvent) { pointers.delete(e.pointerId); action = null; pinchDistance = 0; }
canvas.addEventListener('pointerup', release);
canvas.addEventListener('pointercancel', release);
canvas.addEventListener('lostpointercapture', release);
canvas.addEventListener('pointerleave', () => { if (!action) {
    pointer = [-999, -999];
    hovered = 0;
} });
canvas.addEventListener('wheel', e => { e.preventDefault(); zoom(Math.exp(-e.deltaY * .001), e.clientX, e.clientY); pointer = toWorld(e.clientX, e.clientY); }, { passive: false });
window.addEventListener('keydown', e => {
    if ((e.target as HTMLElement).matches('input,button,select,textarea'))
        return;
    if (e.key === 'Delete' || e.key === 'Backspace') {
        e.preventDefault();
        removeCity();
    }
    if (['1', '2', '3', '4'].includes(e.key))
        selectTool(['move', 'city', 'raise', 'lower'][Number(e.key) - 1]);
    if (e.key === 'Escape') {
        selected = 0;
        settings(false);
        updateStats();
    }
});
window.addEventListener('resize', fit);
document.addEventListener('visibilitychange', () => { lastTime = 0; accumulator = 0; action = null; pointers.clear(); });
function updateStats() {
    const pairs = world.pairs();
    $('summary').textContent = `${world.cities.length} cities · ${pairs.length} pairs`;
    $('routing-state').textContent = paused ? 'Paused' : 'Trails evolving';
    const city = world.cities.find(c => c.id === selected);
    $('selection').hidden = !city;
    if (city) {
        $('city-name').textContent = `City ${city.id}`;
        $('diameter-value').textContent = (city.radius * 2).toFixed(1);
        const slider = $<HTMLInputElement>('diameter');
        slider.value = String(city.radius * 2);
        slider.min = String(MIN_RADIUS * 2);
        slider.max = String(Math.min(MAX_RADIUS, city.x, W - city.x, city.y, H - city.y) * 2);
        $('city-connections').textContent = `${world.connectionsFor(city)} chosen pairs · ${pairs.filter(p => p.a === city.id || p.b === city.id).length} total connections`;
    }
}
function fail(error: unknown) { $('fatal-error').hidden = false; $('fatal-error').textContent = error instanceof Error ? error.message : String(error); console.error(error); }
function frame(now: number) {
    if (document.hidden) {
        lastTime = 0;
        requestAnimationFrame(frame);
        return;
    }
    const dt = lastTime ? Math.min((now - lastTime) / 1000, .1) : 0;
    lastTime = now;
    try {
        if (action?.kind === 'paint' && pointer[0] >= 0 && pointer[1] >= 0 && pointer[0] < W && pointer[1] < H) {
            world.sculpt(pointer[0], pointer[1], tool === 'raise' ? 1 : -1, dt);
            changed();
        }
        if (!paused) {
            accumulator += dt * speed;
            while (accumulator >= 1 / 30) {
                world.step(1 / 30);
                accumulator -= 1 / 30;
            }
        }
        renderer.draw(world, camera, mode, pointer, tool === 'raise' || tool === 'lower', selected, hovered);
        if (now - lastStats > 300) {
            updateStats();
            lastStats = now;
        }
        requestAnimationFrame(frame);
    }
    catch (error) {
        fail(error);
    }
}
canvas.addEventListener('webglcontextlost', e => { e.preventDefault(); fail(new Error('Graphics context lost. Reload to restart.')); });
try {
    renderer = new Renderer(canvas);
    updateStats();
    requestAnimationFrame(frame);
}
catch (error) {
    fail(error);
}

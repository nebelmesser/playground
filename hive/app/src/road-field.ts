import { W, H, CELLS, type World } from './simulation.ts';
// Terrain-aware splatting turns route usage into continuous soft corridors.
// A steep height change suppresses lateral spread; no blur crosses a ridge freely.
export function roadField(world: World, density = new Float32Array(CELLS)) {
    density.fill(0);
    const spread = world.params.spread, radius = Math.ceil(spread * 2.5);
    const kernel: {
        dx: number;
        dy: number;
        weight: number;
    }[] = [];
    for (let dy = -radius; dy <= radius; dy++)
        for (let dx = -radius; dx <= radius; dx++) {
            const d = dx * dx + dy * dy;
            if (d > radius * radius)
                continue;
            kernel.push({ dx, dy, weight: Math.exp(-d / (2 * spread * spread)) / (2.5066 * spread) });
        }
    for (let i = 0; i < CELLS; i++) {
        const amount = world.memory[i];
        if (amount < .001)
            continue;
        const x = i % W, y = Math.floor(i / W), height = world.terrain[i];
        for (const { dx, dy, weight } of kernel) {
            const nx = x + dx, ny = y + dy;
            if (nx < 0 || ny < 0 || nx >= W || ny >= H)
                continue;
            const target = ny * W + nx;
            const midpoint = Math.floor((y + ny) * .5) * W + Math.floor((x + nx) * .5);
            const relief = Math.abs(world.terrain[midpoint] - height) + Math.abs(world.terrain[target] - world.terrain[midpoint]);
            density[target] += amount * weight * Math.exp(-relief * world.params.relief * 65);
        }
    }
    return density;
}

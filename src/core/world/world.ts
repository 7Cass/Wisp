export interface WorldGrid {
  width: number;
  height: number;
  tick: number;
}

export function createWorld(width: number, height: number): WorldGrid {
  return {
    width,
    height,
    tick: 0
  };
}

export function advanceTick(world: WorldGrid): void {
  world.tick++;
}

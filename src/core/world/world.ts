export interface WorldGrid {
  width: number;
  height: number;
  tick: number;
}

export interface Room {
  x: number;
  y: number;
  w: number;
  h: number;
  centerX: number;
  centerY: number;
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

export function roomsOverlap(a: Room, b: Room, padding: number = 1): boolean {
  const ax1 = a.x - padding;
  const ay1 = a.y - padding;
  const ax2 = a.x + a.w + padding;
  const ay2 = a.y + a.h + padding;

  const bx1 = b.x - padding;
  const by1 = b.y - padding;
  const bx2 = b.x + b.w + padding;
  const by2 = b.y + b.h + padding;

  // if one is totally at left/right/above/below of the other -> do not overlap them
  if (ax2 <= bx1 || bx2 <= ax1) return false;
  if (ay2 <= by1 || by2 <= ay1) return false;

  return true;
}

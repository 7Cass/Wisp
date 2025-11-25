export interface Viewport {
  x: number;
  y: number;
  width: number;
  height: number;
}

/**
 * Create a basic viewport at (0, 0).
 */
export function createViewport(width: number, height: number): Viewport {
  return {
    x: 0,
    y: 0,
    width: Math.min(25, width),
    height: Math.min(25, height),
  };
}

/**
 * MOve a viewport in dx/dy, respecting the world boundaries.
 */
export function moveViewport(
  vp: Viewport,
  dx: number,
  dy: number,
  worldWidth: number,
  worldHeight: number
): void {
  let newX = vp.x + dx;
  let newY = vp.y + dy;

  // Clamp horizontal
  if (newX < 0) newX = 0;
  if (newX + vp.width > worldWidth) {
    newX = Math.max(0, worldWidth - vp.width);
  }

  // Clamp vertical
  if (newY < 0) newY = 0;
  if (newY + vp.height > worldHeight) {
    newY = Math.max(0, worldHeight - vp.height);
  }

  vp.x = newX;
  vp.y = newY;
}

/**
 * Return the boundaries (min/max) in world coordinates
 * that the viewport currently covers
 */
export function getViewportBounds(vp: Viewport) {
  return {
    minX: vp.x,
    minY: vp.y,
    maxX: vp.x + vp.width - 1,
    maxY: vp.y + vp.height - 1,
  };
}

/**
 * Centralize viewport around the (targetX, targetY) respecting the world limits
 */
export function centerViewportOn(
  vp: Viewport,
  targetX: number,
  targetY: number,
  worldWidth: number,
  worldHeight: number
): void {
  let newX = targetX - Math.floor(vp.width / 2);
  let newY = targetY - Math.floor(vp.height / 2);

  // Clamp horizontal
  if (newX < 0) newX = 0;
  if (newX + vp.width > worldWidth) {
    newX = Math.max(0, worldWidth - vp.width);
  }

  // Clamp vertical
  if (newY < 0) newY = 0;
  if (newY + vp.height > worldHeight) {
    newY = Math.max(0, worldHeight - vp.height);
  }

  vp.x = newX;
  vp.y = newY;
}

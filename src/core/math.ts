import type {WorldGrid} from './world/world';
import {KindId} from './ecs/components';

export function inBounds(world: WorldGrid, x: number, y: number): boolean {
  return !(x < 0 ||
    x >= world.width ||
    y < 0 ||
    y >= world.height);
}

export function isMovableKind(kind: KindId): boolean {
  return kind === 'creature';
}

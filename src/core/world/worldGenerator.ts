import {Room, roomsOverlap, WorldGrid} from './world';
import {ChunkManager} from './chunkManager';
import {TerrainTile, TerrainType} from '../tile';
import {VegetationTile} from '../layers/vegetation';

export function generateWorldLayout(world: WorldGrid, chunks: ChunkManager): void {
  const { width, height } = world;

  // Initialize with empty tiles
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const terrain: TerrainTile = { type: TerrainType.Wall };
      const vegetation: VegetationTile = { type: 'none' };
      chunks.setTerrainAt(x, y, terrain);
      chunks.setVegetationAt(x, y, vegetation);
    }
  }

  // Add random bushes and grass
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      if (Math.random() < 0.125) {
        const grass: VegetationTile = { type: 'grass' };
        chunks.setVegetationAt(x, y, grass);
      }

      if (Math.random() < 0.05) {
        const bush: VegetationTile = { type: 'bush' };
        chunks.setVegetationAt(x, y, bush);
      }
    }
  }

  const minRoomSize = 3;
  const maxRoomSize = 5;
  const roomCount = Math.max(5, Math.floor(width * height * 15));

  const rooms: Room[] = [];

  function carveRoom(room: Room) {
    for (let y = room.y; y < room.y + room.h; y++) {
      for (let x = room.x; x < room.x + room.w; x++) {
        if (y > 0 && y < height - 1 && x > 0 && x < width - 1) {
          const tile: TerrainTile = { type: TerrainType.Empty };
          chunks.setTerrainAt(x, y, tile);
        }
      }
    }
  }

  function carveHorizontalCorridor(x1: number, x2: number, y: number) {
    const from = Math.min(x1, x2);
    const to = Math.max(x1, x2);
    const corridorWidth = Math.random() < 0.3 ? 2 : 1;

    for (let x = from; x <= to; x++) {
      for (let dy = 0; dy < corridorWidth; dy++) {
        const yy = y + dy;
        if (yy > 0 && yy < height - 1 && x > 0 && x < width - 1) {
          const tile: TerrainTile = { type: TerrainType.Empty };
          chunks.setTerrainAt(x, yy, tile);
        }
      }
    }
  }

  function carveVerticalCorridor(y1: number, y2: number, x: number) {
    const from = Math.min(y1, y2);
    const to = Math.max(y1, y2);
    const corridorWidth = Math.random() < 0.3 ? 2 : 1;

    for (let y = from; y <= to; y++) {
      for (let dx = 0; dx < corridorWidth; dx++) {
        const xx = x + dx;
        if (y > 0 && y < height - 1 && xx > 0 && xx < width - 1)  {
          const tile: TerrainTile = { type: TerrainType.Empty };
          chunks.setTerrainAt(xx, y, tile);
        }
      }
    }
  }

  // Generate rectangular rooms
  for (let i = 0; i < roomCount; i++) {
    const w = Math.floor(Math.random() * (maxRoomSize - minRoomSize + 1)) + minRoomSize;
    const h = Math.floor(Math.random() * (maxRoomSize - minRoomSize + 1)) + minRoomSize;

    if (w >= width - 2 || h >= height - 2) {
      continue;
    }

    const x = Math.floor(Math.random() * (width - w - 2)) + 1;
    const y = Math.floor(Math.random() * (height - h - 2)) + 1;

    const centerX = Math.floor(x + w / 2);
    const centerY = Math.floor(y + h / 2);

    const candidate: Room = { x, y, w, h, centerX, centerY };

    let overlaps = false;
    for (const room of rooms) {
      if (roomsOverlap(candidate, room, 1)) {
        overlaps = true;
        break;
      }
    }

    if (overlaps) {
      continue;
    }

    rooms.push(candidate);
    carveRoom(candidate);
  }

  // Connect rooms with corridors (L shape)
  for (let i = 1; i < rooms.length; i++) {
    const prevRoom = rooms[i - 1];
    const currentRoom = rooms[i];

    if (prevRoom.centerX === currentRoom.centerX || prevRoom.centerY === currentRoom.centerY) {
      carveHorizontalCorridor(prevRoom.centerX, currentRoom.centerX, prevRoom.centerY);
      carveVerticalCorridor(prevRoom.centerY, currentRoom.centerY, currentRoom.centerX);
    } else {
      if (Math.random() < 0.5) {
        carveHorizontalCorridor(prevRoom.centerX, currentRoom.centerX, prevRoom.centerY);
        carveVerticalCorridor(prevRoom.centerY, currentRoom.centerY, currentRoom.centerX);
      } else {
        carveVerticalCorridor(prevRoom.centerY, currentRoom.centerY, prevRoom.centerX);
        carveHorizontalCorridor(prevRoom.centerX, currentRoom.centerX, currentRoom.centerY);
      }
    }
  }

  // Connect random rooms
  for (let i = 0; i < rooms.length - 1; i++) {
    if (Math.random() < 0.3) {
      const a = rooms[i];
      const b = rooms[Math.floor(Math.random() * rooms.length)];

      if (Math.random() < 0.5) {
        carveHorizontalCorridor(a.centerX, b.centerX, a.centerY);
        carveVerticalCorridor(a.centerY, b.centerY, b.centerX);
      } else {
        carveVerticalCorridor(a.centerY, b.centerY, a.centerX);
        carveHorizontalCorridor(a.centerX, b.centerX, b.centerY);
      }
    }
  }
}

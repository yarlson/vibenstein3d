import { LevelData, EnemyType, LightType } from '../types/level';
import { createCeilingLight, createEmptyLightsGrid } from '../utils/LevelUtils';

// Create a base lights grid
const baseLightsGrid = createEmptyLightsGrid(10, 10);

// Add custom lights
baseLightsGrid[1][1] = LightType.CeilingLamp; // Simple light with default parameters
baseLightsGrid[1][8] = createCeilingLight({ color: '#ff5500', intensity: 3 });
baseLightsGrid[2][2] = createCeilingLight({ color: '#aaffff', intensity: 2, distance: 15 });
baseLightsGrid[4][7] = createCeilingLight({ color: '#ffcc00', intensity: 2.5 });
baseLightsGrid[5][4] = createCeilingLight({ color: '#aaddff', intensity: 2.2, distance: 10 });
baseLightsGrid[6][8] = createCeilingLight({ color: '#ff8800', intensity: 1.8 });
baseLightsGrid[8][1] = createCeilingLight({ color: '#ffaa22', intensity: 2 });
baseLightsGrid[8][4] = createCeilingLight({ color: '#ffffff', intensity: 3, distance: 18 });
baseLightsGrid[8][8] = createCeilingLight({ color: '#ffaaaa', intensity: 2.5 });

export const level1: LevelData = {
  name: 'Level 1: Training Ground',
  grid: [
    [1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
    [1, 0, 0, 0, 0, 0, 1, 3, 0, 1],
    [1, 0, 0, 0, 1, 0, 1, 1, 2, 1],
    [1, 0, 0, 0, 0, 0, 0, 0, 0, 1],
    [1, 0, 1, 0, 4, 0, 1, 0, 0, 1],
    [1, 0, 1, 0, 0, 0, 1, 0, 0, 1],
    [1, 0, 1, 1, 0, 1, 1, 0, 0, 1],
    [1, 0, 0, 0, 0, 0, 0, 0, 0, 1],
    [1, 0, 0, 0, 0, 0, 0, 0, 0, 1],
    [1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
  ],
  // Use the prepared lights grid
  lights: baseLightsGrid,
  enemies: [
    { position: [2, 2], type: EnemyType.Grunt },
    { position: [7, 7], type: EnemyType.Guard, rotation: Math.PI },
  ],
  playerSpawn: [4, 4], // Center of the map
};

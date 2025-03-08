import { LightType, LightConfig } from '../types/level';

/**
 * Creates a ceiling lamp light configuration with the specified properties
 * @param options Custom properties for the light
 * @returns A LightConfig object for a ceiling lamp
 */
export const createCeilingLight = (options: {
  color?: string;
  intensity?: number;
  distance?: number;
}): LightConfig => {
  return {
    type: LightType.CeilingLamp,
    color: options.color || '#ffaa55', // Default warm light
    intensity: options.intensity || 2.5,
    distance: options.distance || 12,
  };
};

/**
 * Creates a wall sconce light configuration with the specified properties
 * @param options Custom properties for the light
 * @returns A LightConfig object for a wall sconce
 */
export const createWallSconce = (options: {
  color?: string;
  intensity?: number;
  distance?: number;
}): LightConfig => {
  return {
    type: LightType.WallSconce,
    color: options.color || '#ffcc88', // Default warmer light
    intensity: options.intensity || 1.8,
    distance: options.distance || 8,
  };
};

/**
 * Creates a floor lamp light configuration with the specified properties
 * @param options Custom properties for the light
 * @returns A LightConfig object for a floor lamp
 */
export const createFloorLamp = (options: {
  color?: string;
  intensity?: number;
  distance?: number;
}): LightConfig => {
  return {
    type: LightType.FloorLamp,
    color: options.color || '#ffffff', // Default white light
    intensity: options.intensity || 2.0,
    distance: options.distance || 10,
  };
};

/**
 * Creates a lights grid with the specified dimensions, filled with no lights (0)
 * @param width Width of the grid
 * @param height Height of the grid
 * @returns A 2D array of zeros (no lights)
 */
export const createEmptyLightsGrid = (
  width: number,
  height: number
): (number | LightConfig)[][] => {
  return Array(height)
    .fill(0)
    .map(() => Array(width).fill(0));
};

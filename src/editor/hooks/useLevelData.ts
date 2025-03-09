import { useState, useEffect } from 'react';
import { LevelData } from '../../types/level';
import { loadLevelData, createEmptyLevel } from '../utils/levelUtils';

/**
 * Hook for loading and working with level data
 * @param initialLevelPath Optional path to the initial level JSON file
 * @returns An object with the level data and functions to work with it
 */
export const useLevelData = (initialLevelPath?: string) => {
  const [levelData, setLevelData] = useState<LevelData | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  
  // Load the initial level data
  useEffect(() => {
    if (initialLevelPath) {
      loadLevel(initialLevelPath);
    } else {
      // If no initial level, create an empty one
      setLevelData(createEmptyLevel());
    }
  }, [initialLevelPath]);
  
  /**
   * Load a level from the given path
   * @param path Path to the level JSON file
   */
  const loadLevel = async (path: string) => {
    setIsLoading(true);
    setError(null);
    
    try {
      const data = await loadLevelData(path);
      setLevelData(data);
    } catch (err) {
      console.error('Error loading level:', err);
      setError('Failed to load level data');
    } finally {
      setIsLoading(false);
    }
  };
  
  /**
   * Create a new empty level
   * @param rows Number of rows
   * @param cols Number of columns
   */
  const createNewLevel = (rows?: number, cols?: number) => {
    setLevelData(createEmptyLevel(rows, cols));
    setError(null);
  };
  
  /**
   * Update the level data
   * @param updatedData The updated level data
   */
  const updateLevelData = (updatedData: LevelData) => {
    setLevelData(updatedData);
  };
  
  /**
   * Update a specific part of the level data
   * @param key The key to update
   * @param value The new value
   */
  const updateLevelPart = <K extends keyof LevelData>(key: K, value: LevelData[K]) => {
    if (levelData) {
      setLevelData({
        ...levelData,
        [key]: value
      });
    }
  };
  
  return {
    levelData,
    isLoading,
    error,
    loadLevel,
    createNewLevel,
    updateLevelData,
    updateLevelPart
  };
}; 
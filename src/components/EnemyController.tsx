// Create a component to handle enemy management
import { LevelData } from '../types/level.ts';
import { useFrame, useThree } from '@react-three/fiber';
import { useEnemyStore } from '../state/enemyStore.ts';
import { useGameStore } from '../state/gameStore.ts';
import { useEffect } from 'react';
import * as THREE from 'three';

interface EnemyControllerProps {
  level: LevelData;
}

export const EnemyController: React.FC<EnemyControllerProps> = ({ level }) => {
  const { scene, camera } = useThree();
  const { initializeEnemies, updateEnemies, cleanupEnemies, setWalls } = useEnemyStore();
  const { walls, setShakeCamera } = useGameStore();

  // Initialize enemies
  useEffect(() => {
    // Set up the camera shake function
    setShakeCamera((intensity = 0.5) => {
      const duration = 0.2; // seconds
      const startTime = performance.now() / 1000;

      const applyShake = () => {
        const currentTime = performance.now() / 1000;
        const elapsed = currentTime - startTime;

        if (elapsed < duration) {
          // Apply random offset to camera
          const offset = new THREE.Vector3(
            (Math.random() - 0.5) * intensity,
            (Math.random() - 0.5) * intensity,
            0
          );
          camera.position.add(offset);

          // Continue shaking
          requestAnimationFrame(applyShake);
        }
      };

      // Start shaking
      applyShake();
    });

    // Set walls in the enemy store
    setWalls(walls);

    // Initialize enemies from level data
    initializeEnemies(level, scene, camera);

    // Cleanup on unmount
    return () => {
      // Check if this is a true unmount or just a React remount
      const isFullUnmount =
        document.body.classList.contains('unmounting') ||
        document.hidden ||
        window.location.href.includes('unmount=true');

      cleanupEnemies(isFullUnmount);
    };
  }, [level, scene, camera, initializeEnemies, setWalls, cleanupEnemies, walls, setShakeCamera]);

  // Update enemies each frame
  useFrame((_, delta) => {
    const time = performance.now() / 1000;
    updateEnemies(delta, time);
  });

  return null;
};

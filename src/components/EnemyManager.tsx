import React, { useEffect, useRef, useCallback } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { LevelData, EnemySpawn } from '../types/level';
import { Enemy } from '../entities/Enemy';

interface EnemyManagerProps {
  level: LevelData;
}

export const EnemyManager: React.FC<EnemyManagerProps> = ({ level }) => {
  const { scene, camera } = useThree();
  const enemiesRef = useRef<Enemy[]>([]);
  const wallsRef = useRef<THREE.Object3D[]>([]);
  const worldCenterRef = useRef<THREE.Vector3>(new THREE.Vector3());
  const initialized = useRef<boolean>(false);
  
  // Function to spawn an enemy, memoized with useCallback
  const spawnEnemy = useCallback((spawnData: EnemySpawn) => {
    const [x, z] = spawnData.position;
    const position = new THREE.Vector3(
      x - 5, // Adjust for level grid offset
      0.5,   // Half height above ground
      z - 5  // Adjust for level grid offset
    );
    
    // Create enemy instance
    const enemy = new Enemy(scene, position, camera, spawnData.type);
    
    // Create mesh and add to scene
    enemy.create();
    
    // Apply initial rotation if specified
    if (spawnData.rotation !== undefined) {
      enemy.getMesh().rotation.y = spawnData.rotation;
    }
    
    // Add to enemies array
    enemiesRef.current.push(enemy);
  }, [scene, camera]);
  
  // Function to shake the camera, memoized with useCallback
  const shakeCamera = useCallback((intensity: number = 0.5) => {
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
  }, [camera]);
  
  // Initialize enemy spawns
  useEffect(() => {
    if (initialized.current) return;
    initialized.current = true;
    
    // Calculate world center based on level dimensions
    if (level.dimensions) {
      worldCenterRef.current.set(
        -level.dimensions.width / 2,
        0,
        -level.dimensions.depth / 2
      );
    }
    
    // Get wall meshes from the scene for collision detection
    wallsRef.current = window.walls || [];
    
    // Make a global enemies array for external access
    window.enemies = enemiesRef.current;
    
    // Spawn initial enemies based on level data
    level.enemies.forEach((spawnData) => {
      spawnEnemy(spawnData);
    });
    
    // Add camera shake function to window
    window.shakeCamera = shakeCamera;
    
    // Initialize particles array for effects
    window.particles = [];
    
    return () => {
      // Clean up enemies when component unmounts
      enemiesRef.current.forEach((enemy) => {
        enemy.destroy();
      });
      
      // Clean up global references
      enemiesRef.current = [];
      window.enemies = [];
      window.particles = [];
      window.shakeCamera = undefined;
    };
  }, [level, scene, camera, spawnEnemy, shakeCamera]);
  
  // Update enemies every frame
  useFrame((_, delta) => {
    const time = performance.now() / 1000;
    
    // Update enemies
    enemiesRef.current.forEach((enemy) => {
      enemy.update(delta, time, wallsRef.current);
    });
    
    // Update particles if they exist
    if (window.particles) {
      for (let i = window.particles.length - 1; i >= 0; i--) {
        const particle = window.particles[i];
        
        // Update position based on velocity
        if (particle.userData.velocity) {
          particle.position.add(particle.userData.velocity.clone().multiplyScalar(delta));
        }
        
        // Apply gravity
        if (particle.userData.velocity) {
          particle.userData.velocity.y -= 9.8 * delta;
        }
        
        // Update lifetime
        particle.userData.lifetime += delta;
        
        // Check if particle has exceeded max lifetime
        if (particle.userData.lifetime > particle.userData.maxLifetime) {
          // Remove particle
          scene.remove(particle);
          window.particles.splice(i, 1);
        }
      }
    }
  });
  
  // This component doesn't render anything directly
  return null;
}; 
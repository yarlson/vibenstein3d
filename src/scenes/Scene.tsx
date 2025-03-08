import { Canvas } from '@react-three/fiber';
import { useRef, useEffect } from 'react';
import { Physics } from '@react-three/cannon';
import { Player, PLAYER_HEIGHT } from '../components/Player';
import { Floor } from '../components/Floor';
import { LevelGrid } from '../components/LevelGrid';
import { Stats } from '@react-three/drei';
import { level1 } from '../levels/level1';
import { MiniRadar, MiniRadarTracker } from '../components/MiniRadar';
import { Mesh, Object3D } from 'three';
import { useGameStore } from '../state/gameStore';

export const Scene = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const playerRef = useRef<Mesh>(null);
  const { registerRadarEnemy, registerRadarItem, clearRadarEntities } = useGameStore();

  // Register example radar entities when the component mounts
  useEffect(() => {
    // Clear any existing entities
    clearRadarEntities();
    
    // Create some example enemy objects
    for (let i = 0; i < 5; i++) {
      const enemyRef = { current: new Object3D() };
      
      // Position them around the level
      enemyRef.current.position.set(
        (Math.random() - 0.5) * 40,
        0,
        (Math.random() - 0.5) * 40
      );
      
      // Add enemy type for coloring
      enemyRef.current.userData = { type: 'enemy' };
      
      // Register with the radar
      registerRadarEnemy(enemyRef);
    }
    
    // Create some example item objects (keys)
    for (let i = 0; i < 3; i++) {
      const itemRef = { current: new Object3D() };
      
      // Position them around the level
      itemRef.current.position.set(
        (Math.random() - 0.5) * 30,
        0,
        (Math.random() - 0.5) * 30
      );
      
      // Add key type for coloring
      itemRef.current.userData = { type: 'key' };
      
      // Register with the radar
      registerRadarItem(itemRef);
    }
    
    // Create some example door objects
    for (let i = 0; i < 2; i++) {
      const doorRef = { current: new Object3D() };
      
      // Position them around the level
      doorRef.current.position.set(
        (Math.random() - 0.5) * 35,
        0,
        (Math.random() - 0.5) * 35
      );
      
      // Add door type for coloring
      doorRef.current.userData = { type: 'door' };
      
      // Register with the radar
      registerRadarItem(doorRef);
    }
    
    // Cleanup function
    return () => {
      clearRadarEntities();
    };
  }, [registerRadarEnemy, registerRadarItem, clearRadarEntities]);

  // Apply class to Stats component when it's mounted
  useEffect(() => {
    // Find the Stats panel in the DOM
    const statsPanel = document.querySelector('.stats');
    if (statsPanel) {
      statsPanel.classList.add('stats-panel');
    }

    // Remove class when component unmounts
    return () => {
      const statsPanel = document.querySelector('.stats');
      if (statsPanel) {
        statsPanel.classList.remove('stats-panel');
      }
    };
  }, []);

  return (
    <>
      <Canvas
        ref={canvasRef}
        camera={{
          position: [0, PLAYER_HEIGHT, 5],
          rotation: [0, 0, 0],
          fov: 75,
        }}
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100vw',
          height: '100vh',
        }}
        shadows
        dpr={[1, 1.5]}
      >
        {/* Minimal ambient light */}
        <ambientLight intensity={1} />

        {/* Physics world */}
        <Physics gravity={[0, -9.81, 0]}>
          {/* Player with spawn position from level data */}
          <Player spawnPosition={level1.playerSpawn} ref={playerRef} />

          {/* Floor */}
          <Floor />

          {/* Level Grid (includes walls and ceiling with lights) */}
          <LevelGrid level={level1} />
        </Physics>

        {/* Radar tracker - must be inside Canvas to use useFrame */}
        <MiniRadarTracker playerRef={playerRef} radarRadius={30} />

        {/* Performance stats with custom className */}
        <Stats className="stats-panel" />
      </Canvas>
      
      {/* Mini Radar UI - rendered outside Canvas */}
      <MiniRadar playerRef={playerRef} radarRadius={30} />
    </>
  );
};

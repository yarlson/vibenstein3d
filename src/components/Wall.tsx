import { useBox } from '@react-three/cannon';
import { Mesh } from 'three';
import { useEffect } from 'react';
import { WALL_HEIGHT } from '../types/level';
import { useGameStore } from '../state/gameStore';

interface WallProps {
  position: [number, number, number];
  size?: [number, number, number];
  color?: string;
}

export const Wall = ({ position, size = [1, WALL_HEIGHT, 1], color = '#553222' }: WallProps) => {
  // Get the add/remove wall functions from gameStore
  const { addWall, removeWall } = useGameStore();

  // Create a static box for the wall
  const [ref] = useBox<Mesh>(() => ({
    type: 'Static',
    position,
    args: size,
    userData: { type: 'wall', health: 100 }, // Add health for destructible walls
    material: { friction: 0.05 }, // Added reduced friction (lower than player for smoother sliding)
  }));

  // Add wall to gameStore walls array for bullet collision
  useEffect(() => {
    if (!ref.current) return;

    // Store reference to the current mesh for use in cleanup
    const currentMesh = ref.current;

    // Add wall to gameStore
    addWall(currentMesh);

    // Remove wall from gameStore when component unmounts
    return () => {
      removeWall(currentMesh);
    };
  }, [ref, addWall, removeWall]);

  return (
    <mesh ref={ref} castShadow receiveShadow>
      <boxGeometry args={size} />
      <meshStandardMaterial color={color} />
    </mesh>
  );
};

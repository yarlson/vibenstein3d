import { useBox } from '@react-three/cannon';
import { Mesh } from 'three';
import { useEffect } from 'react';
import { WALL_HEIGHT } from '../types/level';

interface WallProps {
  position: [number, number, number];
  size?: [number, number, number];
  color?: string;
}

export const Wall = ({ position, size = [1, WALL_HEIGHT, 1], color = '#553222' }: WallProps) => {
  // Create a static box for the wall
  const [ref] = useBox<Mesh>(() => ({
    type: 'Static',
    position,
    args: size,
    userData: { type: 'wall', health: 100 }, // Add health for destructible walls
    material: { friction: 0.05 }, // Added reduced friction (lower than player for smoother sliding)
  }));

  // Add wall to window.walls array for bullet collision
  useEffect(() => {
    if (!ref.current) return;

    // Store reference to the current mesh for use in cleanup
    const currentMesh = ref.current;

    // Initialize walls array if it doesn't exist
    if (!window.walls) {
      window.walls = [];
    }

    // Add wall to array
    window.walls.push(currentMesh);

    // Remove wall from array when component unmounts
    return () => {
      if (window.walls) {
        const index = window.walls.indexOf(currentMesh);
        if (index !== -1) {
          window.walls.splice(index, 1);
        }
      }
    };
  }, [ref]);

  return (
    <mesh ref={ref} castShadow receiveShadow>
      <boxGeometry args={size} />
      <meshStandardMaterial color={color} />
    </mesh>
  );
};

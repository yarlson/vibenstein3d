import { useBox } from '@react-three/cannon';
import { Mesh } from 'three';
import { useEffect } from 'react';

interface WallProps {
  position: [number, number, number];
  size?: [number, number, number];
  color?: string;
}

export const Wall = ({ position, size = [1, 2, 1], color = '#8B4513' }: WallProps) => {
  // Create a static box for the wall
  const [ref] = useBox<Mesh>(() => ({
    type: 'Static',
    position,
    args: size,
    userData: { type: 'wall', health: 100 }, // Add health for destructible walls
  }));

  // Add wall to window.walls array for bullet collision
  useEffect(() => {
    if (!ref.current) return;

    // Initialize walls array if it doesn't exist
    if (!window.walls) {
      window.walls = [];
    }

    // Add wall to array
    window.walls.push(ref.current);

    // Remove wall from array when component unmounts
    return () => {
      if (window.walls && ref.current) {
        const index = window.walls.indexOf(ref.current);
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

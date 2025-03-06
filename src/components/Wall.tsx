import { useBox } from '@react-three/cannon';
import { Mesh } from 'three';

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
  }));

  return (
    <mesh ref={ref} castShadow receiveShadow>
      <boxGeometry args={size} />
      <meshStandardMaterial color={color} />
    </mesh>
  );
}; 
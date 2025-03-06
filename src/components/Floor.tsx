import { usePlane } from '@react-three/cannon';
import { Mesh } from 'three';
import { CELL_SIZE } from '../types/level';

// Calculate floor size based on a 10x10 grid
const FLOOR_SIZE = CELL_SIZE * 10;

export const Floor = () => {
  // Create a static plane for the floor
  const [ref] = usePlane<Mesh>(() => ({
    rotation: [-Math.PI / 2, 0, 0], // Rotate to be horizontal
    position: [0, 0, 0],
    type: 'Static',
  }));

  return (
    <mesh ref={ref} receiveShadow>
      <planeGeometry args={[FLOOR_SIZE, FLOOR_SIZE]} />
      <meshStandardMaterial color="#444444" />
    </mesh>
  );
};

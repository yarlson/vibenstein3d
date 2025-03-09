import { usePlane } from '@react-three/cannon';
import { Mesh } from 'three';
import { CELL_SIZE, LevelDimensions } from '../types/level';

interface FloorProps {
  dimensions?: LevelDimensions;
}

export const Floor = ({ dimensions }: FloorProps) => {
  // Calculate floor size based on the provided dimensions or use a large default
  const floorWidth = dimensions?.width ? dimensions.width + 0.1 : CELL_SIZE * 20; // Add small buffer
  const floorDepth = dimensions?.depth ? dimensions.depth + 0.1 : CELL_SIZE * 20; // Add small buffer

  // Create a static plane for the floor
  // The floor needs to be positioned at the center of the level grid
  const [ref] = usePlane<Mesh>(() => ({
    rotation: [-Math.PI / 2, 0, 0], // Rotate to be horizontal
    position: [0, 0, 0], // Center of the world coordinates
    type: 'Static',
    material: { friction: 0.05 }, // Added reduced friction to match walls
  }));
  
  return (
    <mesh ref={ref}>
      <planeGeometry args={[floorWidth, floorDepth]} />
      <meshBasicMaterial color="#2d2518" />
    </mesh>
  );
};

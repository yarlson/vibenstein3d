import { usePlane } from '@react-three/cannon';
import { Mesh } from 'three';

export const Floor = () => {
  // Create a static plane for the floor
  const [ref] = usePlane<Mesh>(() => ({
    rotation: [-Math.PI / 2, 0, 0], // Rotate to be horizontal
    position: [0, 0, 0],
    type: 'Static',
  }));

  return (
    <mesh ref={ref} receiveShadow>
      <planeGeometry args={[100, 100]} />
      <meshStandardMaterial color="#444444" />
    </mesh>
  );
}; 
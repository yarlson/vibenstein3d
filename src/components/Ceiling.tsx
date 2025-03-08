import { usePlane } from '@react-three/cannon';
import { useMemo } from 'react';
import { Mesh } from 'three';
import { CELL_SIZE, WALL_HEIGHT } from '../types/level';

// Calculate ceiling size based on a 10x10 grid, slightly larger to avoid gaps at edges
const CEILING_SIZE = CELL_SIZE * 10 + 0.05;

// Height of the ceiling from the floor - exact wall height for no gap
const CEILING_HEIGHT = WALL_HEIGHT; // Exactly at wall height, no gap

// Light fixture configuration
interface LightConfig {
  position: [number, number]; // Grid position [x, z]
  color?: string;
  intensity?: number;
  distance?: number;
}

interface CeilingProps {
  lights?: LightConfig[]; // Optional array of light configurations
}

export const Ceiling = ({ lights = [] }: CeilingProps) => {
  // Create a static plane for the ceiling
  const [ref] = usePlane<Mesh>(() => ({
    rotation: [Math.PI / 2, 0, 0], // Rotate to be horizontal but facing down
    position: [0, CEILING_HEIGHT, 0],
    type: 'Static',
  }));

  // Create a grid texture pattern (we're not loading actual textures to keep it simple)
  const ceilingMaterial = useMemo(() => {
    return {
      color: '#222222',
      roughness: 0.8,
      metalness: 0.2,
    };
  }, []);

  // Create edge trim positions to visually seal the gap between walls and ceiling
  const edgeTrim = useMemo(() => {
    const halfSize = CEILING_SIZE / 2;
    const trimHeight = 0.05; // Height of the trim
    const trimThickness = 0.1; // Thickness of the trim

    return [
      // North edge
      {
        position: [0, CEILING_HEIGHT - trimHeight / 2, -halfSize + trimThickness / 2],
        size: [CEILING_SIZE, trimHeight, trimThickness],
      },
      // South edge
      {
        position: [0, CEILING_HEIGHT - trimHeight / 2, halfSize - trimThickness / 2],
        size: [CEILING_SIZE, trimHeight, trimThickness],
      },
      // East edge
      {
        position: [halfSize - trimThickness / 2, CEILING_HEIGHT - trimHeight / 2, 0],
        size: [trimThickness, trimHeight, CEILING_SIZE],
      },
      // West edge
      {
        position: [-halfSize + trimThickness / 2, CEILING_HEIGHT - trimHeight / 2, 0],
        size: [trimThickness, trimHeight, CEILING_SIZE],
      },
    ];
  }, []);

  // Create light fixtures
  const lightFixtures = useMemo(() => {
    return lights.map((light, index) => {
      // Calculate world coordinates from grid position
      const x = (light.position[0] - 5) * CELL_SIZE; // Center on a 10x10 grid
      const z = (light.position[1] - 5) * CELL_SIZE;

      return {
        position: [x, CEILING_HEIGHT - 0.05, z] as [number, number, number], // Just below ceiling
        color: light.color || '#ffffff',
        intensity: light.intensity || 1,
        distance: light.distance || 10,
        key: `light-${index}`,
      };
    });
  }, [lights]);

  return (
    <group>
      {/* Ceiling plane */}
      <mesh ref={ref} receiveShadow>
        <planeGeometry args={[CEILING_SIZE, CEILING_SIZE, 10, 10]} />
        <meshStandardMaterial {...ceilingMaterial} wireframe={false} />
      </mesh>

      {/* Ceiling edge trim to visually seal gaps */}
      {edgeTrim.map((trim, index) => (
        <mesh
          key={`trim-${index}`}
          position={trim.position as [number, number, number]}
          castShadow
          receiveShadow
        >
          <boxGeometry args={trim.size as [number, number, number]} />
          <meshStandardMaterial color="#111111" />
        </mesh>
      ))}

      {/* Light fixtures */}
      {lightFixtures.map((fixture) => (
        <group key={fixture.key} position={fixture.position}>
          {/* Light fixture mesh */}
          <mesh castShadow>
            <boxGeometry args={[0.5, 0.1, 0.5]} />
            <meshStandardMaterial color="#333333" />
          </mesh>

          {/* Light bulb mesh with emissive material */}
          <mesh position={[0, -0.1, 0]}>
            <sphereGeometry args={[0.15, 16, 16]} />
            <meshStandardMaterial
              color="#888888"
              emissive={fixture.color}
              emissiveIntensity={2.5}
            />
          </mesh>

          {/* Point light */}
          <pointLight
            color={fixture.color}
            intensity={fixture.intensity || 2.5}
            distance={fixture.distance || 15}
            decay={1.5}
            castShadow
            shadow-mapSize-width={512}
            shadow-mapSize-height={512}
          />
        </group>
      ))}
    </group>
  );
};

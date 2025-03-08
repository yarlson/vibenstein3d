import { usePlane } from '@react-three/cannon';
import { useMemo } from 'react';
import { Mesh } from 'three';
import { CELL_SIZE, WALL_HEIGHT } from '../types/level';

// Calculate ceiling size dynamically based on the scene
interface CeilingSizeProps {
  width?: number;
  depth?: number;
}

// Light fixture configuration
interface LightConfig {
  position: [number, number]; // Grid position [x, z]
  color?: string;
  intensity?: number;
  distance?: number;
}

interface CeilingProps {
  lights?: LightConfig[]; // Optional array of light configurations
  size?: CeilingSizeProps; // Optional custom size for the ceiling
}

export const Ceiling = ({ lights = [], size }: CeilingProps) => {
  // Calculate ceiling size based on provided size or default to a reasonable size
  // Adding a small buffer (0.05) to avoid gaps at the edges
  const ceilingWidth = size?.width ? size.width + 0.05 : CELL_SIZE * 20 + 0.05;
  const ceilingDepth = size?.depth ? size.depth + 0.05 : CELL_SIZE * 20 + 0.05;

  // Use WALL_HEIGHT as the ceiling height
  const ceilingHeight = WALL_HEIGHT;

  // Create a static plane for the ceiling
  const [ref] = usePlane<Mesh>(() => ({
    rotation: [Math.PI / 2, 0, 0], // Rotate to be horizontal but facing down
    position: [0, ceilingHeight, 0],
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
    const halfWidth = ceilingWidth / 2;
    const halfDepth = ceilingDepth / 2;
    const trimHeight = 0.05; // Height of the trim
    const trimThickness = 0.1; // Thickness of the trim

    return [
      // North edge
      {
        position: [0, ceilingHeight - trimHeight / 2, -halfDepth + trimThickness / 2],
        size: [ceilingWidth, trimHeight, trimThickness],
      },
      // South edge
      {
        position: [0, ceilingHeight - trimHeight / 2, halfDepth - trimThickness / 2],
        size: [ceilingWidth, trimHeight, trimThickness],
      },
      // East edge
      {
        position: [halfWidth - trimThickness / 2, ceilingHeight - trimHeight / 2, 0],
        size: [trimThickness, trimHeight, ceilingDepth],
      },
      // West edge
      {
        position: [-halfWidth + trimThickness / 2, ceilingHeight - trimHeight / 2, 0],
        size: [trimThickness, trimHeight, ceilingDepth],
      },
    ];
  }, [ceilingWidth, ceilingDepth, ceilingHeight]);

  // Calculate grid centers for light positions
  const gridCenterX = ceilingWidth / (2 * CELL_SIZE);
  const gridCenterZ = ceilingDepth / (2 * CELL_SIZE);

  // Create light fixtures
  const lightFixtures = useMemo(() => {
    return lights.map((light, index) => {
      // Calculate world coordinates from grid position
      // Adjust for the dynamic grid size by using the calculated grid centers
      const x = (light.position[0] - gridCenterX) * CELL_SIZE;
      const z = (light.position[1] - gridCenterZ) * CELL_SIZE;

      return {
        position: [x, ceilingHeight - 0.05, z] as [number, number, number], // Just below ceiling
        color: light.color || '#ffffff',
        intensity: light.intensity || 1,
        distance: light.distance || 10,
        key: `light-${index}`,
      };
    });
  }, [lights, ceilingHeight, gridCenterX, gridCenterZ]);

  return (
    <group>
      {/* Ceiling plane */}
      <mesh ref={ref} receiveShadow>
        <planeGeometry args={[ceilingWidth, ceilingDepth, 10, 10]} />
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

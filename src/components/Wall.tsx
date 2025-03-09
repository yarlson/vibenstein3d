import { useBox } from '@react-three/cannon';
import { Mesh, Color, MeshStandardMaterial } from 'three';
import { useEffect, useMemo } from 'react';
import { WALL_HEIGHT } from '../types/level';
import { useGameStore } from '../state/gameStore';

interface WallProps {
  position: [number, number, number];
  size?: [number, number, number];
  // The base color from the level definition
  color?: string;
  // Optional explicit gradient colors; if not provided, they are derived from the base color
  topColor?: string;
  bottomColor?: string;
}

export const Wall = ({
                       position,
                       size = [1, WALL_HEIGHT, 1],
                       color = '#553222',
                       topColor,
                       bottomColor,
                     }: WallProps) => {
  // Get the add/remove wall functions from gameStore
  const { addWall, removeWall } = useGameStore();

  // Create a static box for the wall
  const [ref] = useBox<Mesh>(() => ({
    type: 'Static',
    position,
    args: size,
    userData: { type: 'wall', health: 100 },
    material: { friction: 0.05 },
  }));

  // Derive gradient colors from the base color if topColor or bottomColor are not provided.
  const computedTopColor = useMemo(() => {
    const base = new Color(color);
    // Lighten the base color by mixing it with white (15% white)
    return topColor ? new Color(topColor) : base.clone().lerp(new Color(0xffffff), 0.15);
  }, [color, topColor]);

  const computedBottomColor = useMemo(() => {
    const base = new Color(color);
    // Darken the base color by mixing it with black (15% black)
    return bottomColor ? new Color(bottomColor) : base.clone().lerp(new Color(0x000000), 0.15);
  }, [color, bottomColor]);

  // Create a custom gradient material using onBeforeCompile.
  const gradientMaterial = useMemo(() => {
    const mat = new MeshStandardMaterial({
      color, // Base color is set, though it will be overridden by the gradient
    });
    mat.onBeforeCompile = (shader) => {
      // Add uniforms for the gradient colors
      shader.uniforms.topColor = { value: computedTopColor };
      shader.uniforms.bottomColor = { value: computedBottomColor };

      // Inject a varying to pass the vertex's y coordinate to the fragment shader
      shader.vertexShader = `
        varying float vY;
      ` + shader.vertexShader;

      // Replace the vertex transform to capture the local y coordinate
      shader.vertexShader = shader.vertexShader.replace(
          `#include <begin_vertex>`,
          `#include <begin_vertex>
          vY = transformed.y;`
      );

      // Add uniforms and varying declaration in the fragment shader
      shader.fragmentShader = `
        uniform vec3 topColor;
        uniform vec3 bottomColor;
        varying float vY;
      ` + shader.fragmentShader;

      // Replace the default diffuse assignment with a mix between bottomColor and topColor.
      // We map vY from -size[1]/2 to size[1]/2 to a 0-1 range.
      shader.fragmentShader = shader.fragmentShader.replace(
          `vec4 diffuseColor = vec4( diffuse, opacity );`,
          `
        float mixFactor = smoothstep(-${(size[1] / 2).toFixed(2)}, ${(size[1] / 2).toFixed(2)}, vY);
        vec3 gradColor = mix(bottomColor, topColor, mixFactor);
        vec4 diffuseColor = vec4(gradColor, opacity);
        `
      );
    };
    return mat;
  }, [color, computedTopColor, computedBottomColor, size]);

  // Add wall to gameStore for collision detection
  useEffect(() => {
    if (!ref.current) return;
    const currentMesh = ref.current;
    addWall(currentMesh);
    return () => {
      removeWall(currentMesh);
    };
  }, [ref, addWall, removeWall]);

  return (
      <mesh ref={ref} castShadow receiveShadow>
        <boxGeometry args={size} />
        <primitive object={gradientMaterial} attach="material" />
      </mesh>
  );
};

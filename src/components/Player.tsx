import { useEffect, useRef, useState } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { useBox } from '@react-three/cannon';
import { Mesh, Vector3, Group } from 'three';
import { PointerLockControls } from '@react-three/drei';
import { CELL_SIZE } from '../types/level';
import { Weapon } from './Weapon';

const MOVE_SPEED = 15;
export const PLAYER_HEIGHT = 1.8;
const PLAYER_RADIUS = 0.5;
const JUMP_FORCE = 6;
const DAMPING = 0.2;

interface PlayerProps {
  spawnPosition?: [number, number];
}

export const Player = ({ spawnPosition = [0, 0] }: PlayerProps) => {
  const worldX = (spawnPosition[0] - 5) * CELL_SIZE;
  const worldZ = (spawnPosition[1] - 5) * CELL_SIZE;

  const [ref, api] = useBox<Mesh>(() => ({
    mass: 1,
    type: 'Dynamic',
    position: [worldX, PLAYER_HEIGHT / 2, worldZ],
    args: [PLAYER_RADIUS, PLAYER_HEIGHT, PLAYER_RADIUS],
    fixedRotation: true,
    userData: { type: 'player' },
    linearDamping: DAMPING,
  }));

  const { camera } = useThree();
  const weaponGroup = useRef<Group>(null);

  useEffect(() => {
    camera.rotation.set(0, 0, 0);
  }, [camera]);

  const [movement, setMovement] = useState({
    forward: false,
    backward: false,
    left: false,
    right: false,
    jump: false,
  });

  const velocity = useRef<Vector3>(new Vector3());
  const [onGround, setOnGround] = useState(true);

  useEffect(() => {
    return api.velocity.subscribe((v) => {
      velocity.current.set(v[0], v[1], v[2]);
      // Determine if on the ground by checking the vertical velocity
      setOnGround(Math.abs(v[1]) < 0.1);
    });
  }, [api.velocity]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      switch (e.code) {
        case 'KeyW':
        case 'ArrowUp':
          setMovement((prev) => ({ ...prev, forward: true }));
          break;
        case 'KeyS':
        case 'ArrowDown':
          setMovement((prev) => ({ ...prev, backward: true }));
          break;
        case 'KeyA':
        case 'ArrowLeft':
          setMovement((prev) => ({ ...prev, left: true }));
          break;
        case 'KeyD':
        case 'ArrowRight':
          setMovement((prev) => ({ ...prev, right: true }));
          break;
        case 'Space':
          setMovement((prev) => ({ ...prev, jump: true }));
          break;
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      switch (e.code) {
        case 'KeyW':
        case 'ArrowUp':
          setMovement((prev) => ({ ...prev, forward: false }));
          break;
        case 'KeyS':
        case 'ArrowDown':
          setMovement((prev) => ({ ...prev, backward: false }));
          break;
        case 'KeyA':
        case 'ArrowLeft':
          setMovement((prev) => ({ ...prev, left: false }));
          break;
        case 'KeyD':
        case 'ArrowRight':
          setMovement((prev) => ({ ...prev, right: false }));
          break;
        case 'Space':
          setMovement((prev) => ({ ...prev, jump: false }));
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, []);

  useFrame(() => {
    // Compute horizontal movement direction based on camera rotation
    const direction = new Vector3();
    const frontVector = new Vector3(0, 0, Number(movement.backward) - Number(movement.forward));
    const sideVector = new Vector3(Number(movement.left) - Number(movement.right), 0, 0);
    direction
      .subVectors(frontVector, sideVector)
      .normalize()
      .multiplyScalar(MOVE_SPEED)
      .applyEuler(camera.rotation);

    // Only update horizontal velocity; keep the vertical velocity intact for jumping/gravity.
    api.velocity.set(direction.x, velocity.current.y, direction.z);

    // Handle jump with an impulse (if on ground)
    if (movement.jump && onGround) {
      api.applyImpulse([0, JUMP_FORCE, 0], [0, 0, 0]);
      setMovement((prev) => ({ ...prev, jump: false }));
    }

    // Update camera position to follow the player's physics body
    if (ref.current) {
      ref.current.getWorldPosition(camera.position);
      camera.position.y += PLAYER_HEIGHT * 0.5; // Position camera at eye level
    }
  });

  return (
    <>
      <mesh ref={ref} visible={false}>
        <boxGeometry args={[PLAYER_RADIUS * 2, PLAYER_HEIGHT, PLAYER_RADIUS * 2]} />
        <meshStandardMaterial color="red" transparent opacity={0.5} />
      </mesh>
      <PointerLockControls />
      <group ref={weaponGroup}>
        <primitive object={camera}>
          <Weapon />
        </primitive>
      </group>
    </>
  );
};

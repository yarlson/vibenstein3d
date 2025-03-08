import { useEffect, useRef, useState, useCallback, forwardRef, useImperativeHandle } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { useBox } from '@react-three/cannon';
import { Mesh, Vector3 } from 'three';
import { PointerLockControls } from '@react-three/drei';
import { CELL_SIZE } from '../types/level';
import { Weapon } from './Weapon';

const MOVE_SPEED = 10;
export const PLAYER_HEIGHT = 1.8;
const PLAYER_RADIUS = 0.5;
const JUMP_FORCE = 6;
const DAMPING = 0.2;

// Extend the Window interface to include our mobile control handlers
declare global {
  interface Window {
    mobileControlHandlers?: {
      onMove: (x: number, y: number) => void;
      onJump: () => void;
      onStopMove: () => void;
    };
    mobileCameraControls?: {
      rotateCameraY: (amount: number) => void;
    };
    playerMovement?: {
      setJump: (jump: boolean) => void;
    };
  }
}

interface PlayerProps {
  spawnPosition?: [number, number];
}

// Expose the player's mesh ref to parent components
export const Player = forwardRef<Mesh, PlayerProps>(({ spawnPosition = [0, 0] }, ref) => {
  const worldX = (spawnPosition[0] - 5) * CELL_SIZE;
  const worldZ = (spawnPosition[1] - 5) * CELL_SIZE;

  const [playerRef, api] = useBox<Mesh>(() => ({
    mass: 1,
    type: 'Dynamic',
    position: [worldX, PLAYER_HEIGHT / 2, worldZ],
    args: [PLAYER_RADIUS, PLAYER_HEIGHT, PLAYER_RADIUS],
    fixedRotation: true,
    userData: { type: 'player' },
    linearDamping: DAMPING,
    material: { friction: 0.1 },
  }));

  // Forward the internal ref to the external ref
  useImperativeHandle(ref, () => playerRef.current as Mesh);

  const { camera } = useThree();
  const controlsRef = useRef(null);

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

  // Mobile joystick movement values
  const [mobileMovement, setMobileMovement] = useState({
    x: 0, // Left/right (-1 to 1)
    y: 0, // Forward/backward (-1 to 1)
    active: false,
  });

  const velocity = useRef<Vector3>(new Vector3());
  const [onGround, setOnGround] = useState(true);
  const playerPosition = useRef<[number, number, number]>([0, 0, 0]);

  useEffect(() => {
    // Subscribe to position updates
    const unsubscribePosition = api.position.subscribe((p) => {
      playerPosition.current = p;
    });

    // Subscribe to velocity updates
    const unsubscribeVelocity = api.velocity.subscribe((v) => {
      velocity.current.set(v[0], v[1], v[2]);

      // If y velocity is very small and we're close to the ground level,
      // consider the player on the ground
      const isNearGround = playerPosition.current[1] < PLAYER_HEIGHT / 1.8;
      const hasLowVerticalVelocity = Math.abs(v[1]) < 0.1;

      setOnGround(hasLowVerticalVelocity && isNearGround);
    });

    return () => {
      unsubscribeVelocity();
      unsubscribePosition();
    };
  }, [api.velocity, api.position]);

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

  // Add a jump cooldown to prevent spamming
  const [jumpCooldown, setJumpCooldown] = useState(false);

  // Mobile control handlers with useCallback to prevent unnecessary re-renders
  const handleMobileMove = useCallback((x: number, y: number) => {
    setMobileMovement({
      x,
      y,
      active: true,
    });
  }, []);

  const handleMobileJump = useCallback(() => {
    // Only jump if on ground and not in cooldown
    if (onGround && !jumpCooldown) {
      // Get current velocity to preserve horizontal movement
      const currentVel = velocity.current;

      // Apply direct velocity change instead of impulse
      api.velocity.set(currentVel.x, JUMP_FORCE * 1.2, currentVel.z);

      // Also apply an impulse for extra force
      api.applyImpulse([0, JUMP_FORCE * 0.8, 0], [0, 0, 0]);

      // Set cooldown to prevent jump spamming
      setJumpCooldown(true);
      setTimeout(() => {
        setJumpCooldown(false);
      }, 500); // 500ms cooldown
    }
  }, [onGround, jumpCooldown, api, velocity]);

  const handleMobileStopMove = useCallback(() => {
    setMobileMovement({
      x: 0,
      y: 0,
      active: false,
    });
  }, []);

  // Handle mobile camera rotation
  const handleCameraRotation = useCallback(
    (amount: number) => {
      if (controlsRef.current) {
        // Get current rotation
        const current = camera.rotation.y;

        // Apply rotation
        camera.rotation.y = current + amount;
      }
    },
    [camera]
  );

  // Export mobile control handlers to window for access from MobileControls component
  useEffect(() => {
    window.mobileControlHandlers = {
      onMove: handleMobileMove,
      onJump: handleMobileJump,
      onStopMove: handleMobileStopMove,
    };

    window.mobileCameraControls = {
      rotateCameraY: handleCameraRotation,
    };

    return () => {
      window.mobileControlHandlers = undefined;
      window.mobileCameraControls = undefined;
    };
  }, [handleMobileMove, handleMobileJump, handleMobileStopMove, handleCameraRotation]);

  // Export player movement API to window
  useEffect(() => {
    // Expose player movement controls to window for mobile controls
    window.playerMovement = {
      setJump: (jump: boolean) => {
        setMovement((prev) => ({ ...prev, jump }));
      },
    };

    return () => {
      window.playerMovement = undefined;
    };
  }, []);

  useFrame(() => {
    // Compute direction based on input type
    const direction = new Vector3();

    if (mobileMovement.active) {
      // Mobile controls - use the joystick values directly
      // Note: y is inverted because positive y is backward in our game
      direction.set(-mobileMovement.x, 0, -mobileMovement.y);
    } else {
      // Keyboard controls - use the boolean movement state
      const frontVector = new Vector3(0, 0, Number(movement.backward) - Number(movement.forward));
      const sideVector = new Vector3(Number(movement.left) - Number(movement.right), 0, 0);
      direction.subVectors(frontVector, sideVector);
    }

    if (direction.length() > 0) {
      direction.normalize().multiplyScalar(MOVE_SPEED).applyEuler(camera.rotation);

      // Only update horizontal velocity; keep the vertical velocity intact for jumping/gravity.
      api.velocity.set(direction.x, velocity.current.y, direction.z);
    } else if (
      !mobileMovement.active &&
      !movement.forward &&
      !movement.backward &&
      !movement.left &&
      !movement.right
    ) {
      // No movement input - stop horizontal movement but keep vertical
      api.velocity.set(0, velocity.current.y, 0);
    }

    // Handle jump with an impulse (if on ground)
    if (movement.jump && onGround) {
      // Get current velocity to preserve horizontal movement
      const currentVel = velocity.current;

      // Apply direct velocity change
      api.velocity.set(currentVel.x, JUMP_FORCE, currentVel.z);

      // Also apply an impulse for extra force
      api.applyImpulse([0, JUMP_FORCE * 0.5, 0], [0, 0, 0]);

      setMovement((prev) => ({ ...prev, jump: false }));
    }

    // Update camera position to follow the player's physics body
    if (playerRef.current) {
      playerRef.current.getWorldPosition(camera.position);
      camera.position.y += PLAYER_HEIGHT * 0.5; // Position camera at eye level
    }
  });

  return (
    <>
      <mesh ref={playerRef} visible={false}>
        <boxGeometry args={[PLAYER_RADIUS * 2, PLAYER_HEIGHT, PLAYER_RADIUS * 2]} />
        <meshStandardMaterial color="red" transparent opacity={0.5} />
      </mesh>
      <PointerLockControls ref={controlsRef} />
      <primitive object={camera}>
        <Weapon />
      </primitive>
    </>
  );
});

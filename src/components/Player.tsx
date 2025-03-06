import { useRef, useState, useEffect } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { useBox } from '@react-three/cannon';
import { Vector3 } from 'three';
import { PointerLockControls } from '@react-three/drei';
import { Mesh } from 'three';

// Movement speed constants - increased for better responsiveness
const MOVE_SPEED = 10;
export const PLAYER_HEIGHT = 1.8;
const PLAYER_RADIUS = 0.5;
const JUMP_FORCE = 8;

export const Player = () => {
  const [ref, api] = useBox<Mesh>(() => ({
    mass: 1,
    type: 'Dynamic',
    position: [0, PLAYER_HEIGHT / 2, 0],
    args: [PLAYER_RADIUS, PLAYER_HEIGHT, PLAYER_RADIUS],
    fixedRotation: true,
    userData: { type: 'player' },
    linearDamping: 0.5,
  }));

  // Get Three.js camera
  const { camera } = useThree();

  // Set initial camera rotation on mount
  useEffect(() => {
    camera.rotation.set(0, 0, 0);
  }, [camera]);

  // Movement state
  const [movement, setMovement] = useState({
    forward: false,
    backward: false,
    left: false,
    right: false,
    jump: false,
  });
  
  // Velocity state
  const velocity = useRef<Vector3>(new Vector3());
  
  // Track if player is on ground
  const [onGround, setOnGround] = useState(true);
  
  // Subscribe to physics body position changes
  useEffect(() => {
    const unsubscribe = api.velocity.subscribe((v) => {
      velocity.current.set(v[0], v[1], v[2]);
      
      // Check if player is on ground (very simple check)
      setOnGround(Math.abs(v[1]) < 0.1);
    });
    
    return unsubscribe;
  }, [api.velocity]);
  
  // Set up keyboard controls
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
  
  // Update player position and camera
  useFrame(() => {
    // Calculate movement direction based on camera orientation
    const direction = new Vector3();
    const frontVector = new Vector3(0, 0, Number(movement.backward) - Number(movement.forward));
    const sideVector = new Vector3(Number(movement.left) - Number(movement.right), 0, 0);
    
    direction
      .subVectors(frontVector, sideVector)
      .normalize()
      .multiplyScalar(MOVE_SPEED)
      .applyEuler(camera.rotation);
    
    // Apply movement to physics body
    api.velocity.set(direction.x, velocity.current.y, direction.z);
    
    // Handle jumping - only allow jumping when on ground
    if (movement.jump && onGround) {
      api.velocity.set(velocity.current.x, JUMP_FORCE, velocity.current.z);
      setMovement((prev) => ({ ...prev, jump: false }));
    }
    
    // Update camera position to follow player
    ref.current?.getWorldPosition(camera.position);
    // Adjust camera height to be at eye level
    camera.position.y = PLAYER_HEIGHT - 0.2; // Fixed height for better stability
  });
  
  return (
    <>
      {/* Player physics body (invisible) */}
      <mesh ref={ref} visible={false}>
        <boxGeometry args={[PLAYER_RADIUS * 2, PLAYER_HEIGHT, PLAYER_RADIUS * 2]} />
        <meshStandardMaterial color="red" transparent opacity={0.5} />
      </mesh>
      
      {/* Pointer lock controls for mouse look */}
      <PointerLockControls />
    </>
  );
}; 
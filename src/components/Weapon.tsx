import { useEffect, useRef, useState } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { Raycaster, Vector3, Vector2, Mesh } from 'three';
import { useGameStore } from '../state/gameStore';
import { WEAPON_STATS, WeaponType } from '../types/weapons';

// Constants for weapon movement
const WEAPON_POSITION = new Vector3(0.3, -0.2, -0.5);
const WEAPON_SWAY = {
  amount: 0.002,
  speed: 1,
};

export const Weapon = () => {
  const { camera } = useThree();
  const {
    currentWeapon,
    shoot,
    reload,
    switchWeapon,
    isReloading,
  } = useGameStore();

  const [showMuzzleFlash, setShowMuzzleFlash] = useState(false);
  const raycaster = useRef(new Raycaster());
  const muzzleFlashRef = useRef<Mesh>(null);
  const weaponModelRef = useRef<Mesh>(null);
  const swayOffset = useRef(0);

  // Handle weapon switching
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      switch (e.code) {
        case 'Digit1':
          switchWeapon(WeaponType.Pistol);
          break;
        case 'Digit2':
          switchWeapon(WeaponType.MachineGun);
          break;
        case 'Digit3':
          switchWeapon(WeaponType.Shotgun);
          break;
        case 'KeyR':
          reload();
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [switchWeapon, reload]);

  // Handle shooting
  useEffect(() => {
    const handleMouseDown = () => {
      if (!isReloading) {
        performShot();
      }
    };

    window.addEventListener('mousedown', handleMouseDown);
    return () => window.removeEventListener('mousedown', handleMouseDown);
  }, [isReloading]);

  const performShot = () => {
    const weaponStats = WEAPON_STATS[currentWeapon];
    const didShoot = shoot();
    
    if (didShoot) {
      // Show muzzle flash
      setShowMuzzleFlash(true);
      setTimeout(() => setShowMuzzleFlash(false), weaponStats.muzzleFlashDuration * 1000);

      // Calculate spread and perform raycasting
      const shots = currentWeapon === WeaponType.Shotgun ? 8 : 1;
      
      for (let i = 0; i < shots; i++) {
        const spread = weaponStats.spread;
        const spreadX = (Math.random() - 0.5) * spread;
        const spreadY = (Math.random() - 0.5) * spread;

        raycaster.current.setFromCamera(
          new Vector2(spreadX, spreadY),
          camera
        );

        const intersects = raycaster.current.intersectObjects(
          // Get all objects in the scene that can be hit
          camera.parent?.children || [],
          true
        );

        // Handle hits
        if (intersects.length > 0) {
          const hit = intersects[0];
          if (hit.object.userData.type === 'enemy') {
            // TODO: Implement enemy damage
            console.log('Hit enemy!', hit.object);
          } else {
            // Create impact effect
            createImpactEffect(hit.point);
          }
        }
      }
    }
  };

  const createImpactEffect = (position: Vector3) => {
    // TODO: Implement particle effects for impacts
    console.log('Impact at', position);
  };

  // Update weapon sway
  useFrame((_, delta) => {
    if (weaponModelRef.current) {
      // Calculate weapon sway
      swayOffset.current += delta * WEAPON_SWAY.speed;
      const sway = Math.sin(swayOffset.current) * WEAPON_SWAY.amount;
      
      // Apply sway to the base position
      weaponModelRef.current.position.copy(WEAPON_POSITION).add(new Vector3(sway, 0, 0));
    }
  });

  return (
    <group position={[0, 0, 0]} rotation={[0, 0, 0]}>
      {/* Weapon model */}
      <mesh ref={weaponModelRef}>
        <boxGeometry args={[0.1, 0.1, 0.3]} />
        <meshStandardMaterial color="#333333" />
      </mesh>

      {/* Muzzle flash */}
      {showMuzzleFlash && (
        <mesh 
          ref={muzzleFlashRef}
          position={[WEAPON_POSITION.x, WEAPON_POSITION.y, WEAPON_POSITION.z - 0.5]}
        >
          <sphereGeometry args={[0.05, 8, 8]} />
          <meshBasicMaterial color="#ffff00" />
        </mesh>
      )}
    </group>
  );
}; 
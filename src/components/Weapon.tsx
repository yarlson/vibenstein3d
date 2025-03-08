import { useEffect, useRef } from 'react';
import { useThree } from '@react-three/fiber';
import { useGameStore } from '../state/gameStore';
import { WeaponType } from '../types/weapons';
import { Pistol } from '../weapons/Pistol';
import { Gun } from '../weapons/Gun';

export const Weapon = () => {
  const { scene, camera } = useThree();
  const { switchWeapon, reload, isReloading, setGunInstance } = useGameStore();

  const gunRef = useRef<Gun | null>(null);

  // Initialize the weapon
  useEffect(() => {
    // Create initial pistol
    gunRef.current = new Pistol(scene, camera);
    gunRef.current.create();

    // Store gun instance in the game store instead of window
    setGunInstance({
      startFiring: () => gunRef.current?.startFiring(),
      stopFiring: () => gunRef.current?.stopFiring(),
    });

    return () => {
      // Cleanup when component unmounts
      if (gunRef.current?.mesh) {
        camera.remove(gunRef.current.mesh);
      }
      // Reset gun instance in the store with empty functions
      setGunInstance({
        startFiring: () => {}, // Empty function instead of null
        stopFiring: () => {}, // Empty function instead of null
      });
    };
  }, [scene, camera, setGunInstance]);

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
      if (!isReloading && gunRef.current) {
        gunRef.current.startFiring();
      }
    };

    const handleMouseUp = () => {
      if (gunRef.current) {
        gunRef.current.stopFiring();
      }
    };

    window.addEventListener('mousedown', handleMouseDown);
    window.addEventListener('mouseup', handleMouseUp);

    return () => {
      window.removeEventListener('mousedown', handleMouseDown);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isReloading]);

  // Update gun
  useEffect(() => {
    const updateGun = () => {
      if (gunRef.current) {
        gunRef.current.update(1 / 60); // Assuming 60 FPS
        requestAnimationFrame(updateGun);
      }
    };
    updateGun();
  }, []);

  return null; // The gun mesh is added directly to the camera
};

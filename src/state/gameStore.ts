import { create } from 'zustand';
import { WeaponType, WEAPON_STATS } from '../types/weapons';
import * as THREE from 'three';

interface GameState {
  keysCollected: number;
  doorsOpen: Set<string>;
  collectKey: () => void;
  openDoor: (doorId: string) => void;
  isDoorOpen: (doorId: string) => boolean;

  currentWeapon: WeaponType;
  ammo: Record<WeaponType, number>;
  isReloading: boolean;
  lastShotTime: number;
  switchWeapon: (weapon: WeaponType) => void;
  shoot: () => boolean;
  reload: () => void;
  addAmmo: (weapon: WeaponType, amount: number) => void;

  // Camera effects
  shakeCamera: ((intensity: number) => void) | null;
  setShakeCamera: (shakeFunction: (intensity: number) => void) => void;

  // Particles
  particles: THREE.Mesh[];
  addParticle: (particle: THREE.Mesh) => void;
  removeParticle: (particle: THREE.Mesh) => void;

  // Impact markers (separate from particles)
  impactMarkers: THREE.Mesh[];
  addImpactMarker: (marker: THREE.Mesh) => void;
  removeImpactMarker: (marker: THREE.Mesh) => void;

  // Walls for collision detection
  walls: THREE.Object3D[];
  addWall: (wall: THREE.Object3D) => void;
  removeWall: (wall: THREE.Object3D) => void;

  // Gun instance for mobile controls
  gunInstance: {
    startFiring: (() => void) | null;
    stopFiring: (() => void) | null;
  };
  setGunInstance: (gun: { startFiring: () => void; stopFiring: () => void }) => void;
}

export const useGameStore = create<GameState>((set, get) => ({
  keysCollected: 0,
  doorsOpen: new Set<string>(),

  collectKey: () => set((state) => ({ keysCollected: state.keysCollected + 1 })),

  openDoor: (doorId: string) => {
    const { keysCollected, doorsOpen } = get();

    if (keysCollected > doorsOpen.size) {
      set((state) => {
        const newDoorsOpen = new Set(state.doorsOpen);
        newDoorsOpen.add(doorId);
        return { doorsOpen: newDoorsOpen };
      });
      return true;
    }
    return false;
  },

  isDoorOpen: (doorId: string) => get().doorsOpen.has(doorId),

  currentWeapon: WeaponType.Pistol,
  ammo: {
    [WeaponType.Pistol]: WEAPON_STATS[WeaponType.Pistol].maxAmmo,
    [WeaponType.MachineGun]: WEAPON_STATS[WeaponType.MachineGun].maxAmmo,
    [WeaponType.Shotgun]: WEAPON_STATS[WeaponType.Shotgun].maxAmmo,
  },
  isReloading: false,
  lastShotTime: 0,

  switchWeapon: (weapon: WeaponType) => {
    if (!get().isReloading) {
      set({ currentWeapon: weapon });
    }
  },

  shoot: () => {
    const state = get();
    const weaponStats = WEAPON_STATS[state.currentWeapon];
    const currentTime = Date.now();
    const timeSinceLastShot = (currentTime - state.lastShotTime) / 1000;

    if (
      !state.isReloading &&
      state.ammo[state.currentWeapon] >= weaponStats.ammoPerShot &&
      timeSinceLastShot >= 1 / weaponStats.fireRate
    ) {
      set((state) => ({
        ammo: {
          ...state.ammo,
          [state.currentWeapon]: state.ammo[state.currentWeapon] - weaponStats.ammoPerShot,
        },
        lastShotTime: currentTime,
      }));
      return true;
    }
    return false;
  },

  reload: () => {
    const state = get();
    const weaponStats = WEAPON_STATS[state.currentWeapon];

    if (!state.isReloading && state.ammo[state.currentWeapon] < weaponStats.maxAmmo) {
      set({ isReloading: true });

      setTimeout(() => {
        set((state) => ({
          isReloading: false,
          ammo: {
            ...state.ammo,
            [state.currentWeapon]: weaponStats.maxAmmo,
          },
        }));
      }, weaponStats.reloadTime * 1000);
    }
  },

  addAmmo: (weapon: WeaponType, amount: number) => {
    set((state) => ({
      ammo: {
        ...state.ammo,
        [weapon]: Math.min(state.ammo[weapon] + amount, WEAPON_STATS[weapon].maxAmmo),
      },
    }));
  },

  // Camera shake
  shakeCamera: null,
  setShakeCamera: (shakeFunction) => set({ shakeCamera: shakeFunction }),

  // Particles
  particles: [],
  addParticle: (particle) =>
    set((state) => ({
      particles: [...state.particles, particle],
    })),
  removeParticle: (particle) =>
    set((state) => ({
      particles: state.particles.filter((p) => p !== particle),
    })),

  // Impact markers
  impactMarkers: [],
  addImpactMarker: (marker) =>
    set((state) => ({
      impactMarkers: [...state.impactMarkers, marker],
    })),
  removeImpactMarker: (marker) =>
    set((state) => ({
      impactMarkers: state.impactMarkers.filter((m) => m !== marker),
    })),

  // Walls
  walls: [],
  addWall: (wall) =>
    set((state) => ({
      walls: [...state.walls, wall],
    })),
  removeWall: (wall) =>
    set((state) => ({
      walls: state.walls.filter((w) => w !== wall),
    })),

  // Gun instance
  gunInstance: {
    startFiring: null,
    stopFiring: null,
  },
  setGunInstance: (gun) =>
    set({
      gunInstance: gun,
    }),
}));

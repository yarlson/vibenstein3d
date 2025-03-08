import { create } from 'zustand';
import { WeaponType, WEAPON_STATS } from '../types/weapons';

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

  // Player position for minimap
  playerPosition: [number, number, number];
  updatePlayerPosition: (position: [number, number, number]) => void;
}

export const useGameStore = create<GameState>((set, get) => ({
  keysCollected: 0,
  doorsOpen: new Set<string>(),

  collectKey: () => set((state) => ({ keysCollected: state.keysCollected + 1 })),

  openDoor: (doorId: string) =>
    set((state) => ({
      doorsOpen: new Set([...state.doorsOpen, doorId]),
    })),

  isDoorOpen: (doorId: string) => get().doorsOpen.has(doorId),

  currentWeapon: WeaponType.Pistol,
  ammo: {
    [WeaponType.Pistol]: WEAPON_STATS[WeaponType.Pistol].maxAmmo,
    [WeaponType.MachineGun]: WEAPON_STATS[WeaponType.MachineGun].maxAmmo,
    [WeaponType.Shotgun]: WEAPON_STATS[WeaponType.Shotgun].maxAmmo,
  },
  isReloading: false,
  lastShotTime: 0,

  // Initialize player position
  playerPosition: [0, 0, 0],
  updatePlayerPosition: (position: [number, number, number]) => set({ playerPosition: position }),

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
}));

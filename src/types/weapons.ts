export enum WeaponType {
  Pistol = 'pistol',
  MachineGun = 'machinegun',
  Shotgun = 'shotgun',
}

export interface WeaponStats {
  damage: number;
  fireRate: number;
  spread: number;
  ammoPerShot: number;
  maxAmmo: number;
  muzzleFlashDuration: number;
  reloadTime: number;
}

export const WEAPON_STATS: Record<WeaponType, WeaponStats> = {
  [WeaponType.Pistol]: {
    damage: 25,
    fireRate: 2,
    spread: 0.02,
    ammoPerShot: 1,
    maxAmmo: 100,
    muzzleFlashDuration: 0.05,
    reloadTime: 1,
  },
  [WeaponType.MachineGun]: {
    damage: 15,
    fireRate: 10,
    spread: 0.05,
    ammoPerShot: 1,
    maxAmmo: 200,
    muzzleFlashDuration: 0.03,
    reloadTime: 2,
  },
  [WeaponType.Shotgun]: {
    damage: 10,
    fireRate: 1,
    spread: 0.15,
    ammoPerShot: 8,
    maxAmmo: 50,
    muzzleFlashDuration: 0.1,
    reloadTime: 2.5,
  },
};

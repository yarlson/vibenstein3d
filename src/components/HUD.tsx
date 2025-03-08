import { useGameStore } from '../state/gameStore';
import { WeaponType } from '../types/weapons';

const weaponNames: Record<WeaponType, string> = {
  [WeaponType.Pistol]: 'Pistol',
  [WeaponType.MachineGun]: 'Machine Gun',
  [WeaponType.Shotgun]: 'Shotgun',
};

export const HUD = () => {
  const { currentWeapon, ammo, isReloading } = useGameStore();

  return (
    <div
      style={{
        position: 'fixed',
        bottom: '20px',
        right: '20px',
        padding: '10px 15px',
        backgroundColor: 'rgba(0, 0, 0, 0.7)',
        color: 'white',
        fontFamily: 'monospace',
        borderRadius: '5px',
        userSelect: 'none',
        zIndex: 1000,
        fontSize: 'clamp(14px, 2vw, 16px)', // Responsive font size
        maxWidth: '250px',
        minWidth: '150px',
        boxShadow: '0 0 10px rgba(0, 0, 0, 0.5)',
      }}
    >
      <div style={{ marginBottom: '5px', fontWeight: 'bold' }}>
        {weaponNames[currentWeapon]}
        {isReloading && ' (Reloading...)'}
      </div>
      <div>Ammo: {ammo[currentWeapon]}</div>
    </div>
  );
};

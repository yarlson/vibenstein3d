import { useGameStore } from '../state/gameStore';
import { usePlayerStore } from '../state/playerStore';
import { WeaponType } from '../types/weapons';

const weaponNames: Record<WeaponType, string> = {
  [WeaponType.Pistol]: 'Pistol',
  [WeaponType.MachineGun]: 'Machine Gun',
  [WeaponType.Shotgun]: 'Shotgun',
};

export const HUD = () => {
  // Use gameStore for weapon-related state
  const { currentWeapon, ammo, isReloading } = useGameStore();

  // Use playerStore for player health
  const { playerHealth, maxPlayerHealth, isPlayerDead } = usePlayerStore();

  // Calculate health percentage for the health bar
  const healthPercentage = (playerHealth / maxPlayerHealth) * 100;

  // Determine health bar color based on health percentage
  let healthBarColor = '#4CAF50'; // Green
  if (healthPercentage < 30) {
    healthBarColor = '#F44336'; // Red
  } else if (healthPercentage < 60) {
    healthBarColor = '#FFC107'; // Amber
  }

  return (
    <>
      {/* Weapon info */}
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

      {/* Health bar */}
      <div
        style={{
          position: 'fixed',
          bottom: '20px',
          left: '20px',
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
          Health: {playerHealth}/{maxPlayerHealth}
          {isPlayerDead && ' (DEAD)'}
        </div>
        <div
          style={{ width: '100%', backgroundColor: '#555', borderRadius: '3px', height: '10px' }}
        >
          <div
            style={{
              width: `${healthPercentage}%`,
              height: '100%',
              backgroundColor: healthBarColor,
              borderRadius: '3px',
              transition: 'width 0.3s ease',
            }}
          />
        </div>
      </div>

      {/* Death screen overlay */}
      {isPlayerDead && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            width: '100vw',
            height: '100vh',
            backgroundColor: 'rgba(136, 0, 0, 0.4)',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            alignItems: 'center',
            color: 'white',
            fontSize: '32px',
            fontFamily: 'Arial, sans-serif',
            zIndex: 2000,
          }}
        >
          <div style={{ marginBottom: '20px', textShadow: '0 0 10px #000' }}>YOU DIED</div>
          <button
            onClick={() => window.location.reload()}
            style={{
              padding: '10px 20px',
              fontSize: '18px',
              backgroundColor: '#444',
              color: 'white',
              border: 'none',
              borderRadius: '5px',
              cursor: 'pointer',
            }}
          >
            Restart
          </button>
        </div>
      )}
    </>
  );
};

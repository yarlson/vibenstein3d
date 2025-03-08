import { useGameStore } from '../state/gameStore';

/**
 * Utility function to trigger camera shake effect
 * @param intensity - Shake intensity, defaults to 0.5
 */
export const triggerCameraShake = (intensity = 0.5) => {
  const gameShakeCamera = useGameStore.getState().shakeCamera;
  if (typeof gameShakeCamera === 'function') {
    gameShakeCamera(intensity);
  }
}; 
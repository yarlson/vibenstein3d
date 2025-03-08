import { create } from 'zustand';

interface PlayerState {
  playerPosition: [number, number, number];
  playerHealth: number;
  maxPlayerHealth: number;
  isPlayerDead: boolean;

  // Mobile control handlers
  mobileControlHandlers: {
    onMove: ((x: number, y: number) => void) | null;
    onJump: (() => void) | null;
    onStopMove: (() => void) | null;
  };

  // Camera controls
  cameraControls: {
    rotateCameraY: ((amount: number) => void) | null;
  };

  // Player movement controls
  playerMovement: {
    setJump: ((jump: boolean) => void) | null;
  };

  // Actions
  updatePlayerPosition: (position: [number, number, number]) => void;
  takeDamage: (amount: number) => void;
  healPlayer: (amount: number) => void;

  // Actions for mobile controls
  setMobileControlHandlers: (handlers: {
    onMove: (x: number, y: number) => void;
    onJump: () => void;
    onStopMove: () => void;
  }) => void;

  // Actions for camera controls
  setCameraControls: (controls: { rotateCameraY: (amount: number) => void }) => void;

  // Actions for player movement
  setPlayerMovement: (movement: { setJump: (jump: boolean) => void }) => void;
}

export const usePlayerStore = create<PlayerState>((set) => ({
  // Initial state
  playerPosition: [0, 0, 0],
  playerHealth: 100,
  maxPlayerHealth: 100,
  isPlayerDead: false,

  // Initialize mobile control handlers as null
  mobileControlHandlers: {
    onMove: null,
    onJump: null,
    onStopMove: null,
  },

  // Initialize camera controls as null
  cameraControls: {
    rotateCameraY: null,
  },

  // Initialize player movement as null
  playerMovement: {
    setJump: null,
  },

  // Actions
  updatePlayerPosition: (position: [number, number, number]) =>
    set(() => ({ playerPosition: position })),

  takeDamage: (amount: number) =>
    set((state) => {
      const newHealth = Math.max(0, state.playerHealth - amount);
      return {
        playerHealth: newHealth,
        isPlayerDead: newHealth <= 0,
      };
    }),

  healPlayer: (amount: number) =>
    set((state) => ({
      playerHealth: Math.min(state.maxPlayerHealth, state.playerHealth + amount),
    })),

  // Set mobile control handlers
  setMobileControlHandlers: (handlers) =>
    set(() => ({
      mobileControlHandlers: handlers,
    })),

  // Set camera controls
  setCameraControls: (controls) =>
    set(() => ({
      cameraControls: controls,
    })),

  // Set player movement
  setPlayerMovement: (movement) =>
    set(() => ({
      playerMovement: movement,
    })),
}));

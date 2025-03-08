import { useEffect, useState, useRef, useCallback } from 'react';
import { useGameStore } from '../state/gameStore';
import { usePlayerStore } from '../state/playerStore';

interface Position {
  x: number;
  y: number;
}

// Interface for mobile control buttons with custom properties
interface MobileControlButton extends HTMLDivElement {
  onTouchEnd?: () => void;
}

// No longer need to extend Window interface as we're using Zustand stores

// Helper function to detect if the device is actually a mobile device
const isMobileDevice = (): boolean => {
  // Check for touch support
  const hasTouchSupport = 'ontouchstart' in window || navigator.maxTouchPoints > 0;

  // Check for mobile user agent (this is not 100% reliable but helps as an additional check)
  const mobileUserAgent = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
    navigator.userAgent
  );

  // Check screen size (most mobile devices are less than 1024px wide)
  const isSmallScreen = window.innerWidth < 1024;

  // For this application, we'll consider it a mobile device if it has touch support
  // AND either has a mobile user agent or a small screen
  return hasTouchSupport && (mobileUserAgent || isSmallScreen);
};

export const MobileControls = () => {
  const [joystickActive, setJoystickActive] = useState(false);
  const [joystickStart, setJoystickStart] = useState<Position>({ x: 0, y: 0 });
  const [joystickCurrent, setJoystickCurrent] = useState<Position>({ x: 0, y: 0 });
  const [lookActive, setLookActive] = useState(false);
  const { reload, gunInstance } = useGameStore();
  const { mobileControlHandlers, cameraControls } = usePlayerStore();
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  // Initialize refs (must be done unconditionally)
  const lookStartRef = useRef<Position>({ x: 0, y: 0 });
  const lastLookPosRef = useRef<Position>({ x: 0, y: 0 });
  const touchIdRef = useRef<Record<string, number>>({
    joystick: -1,
    look: -1,
  });

  // Check if device is mobile on mount and window resize
  useEffect(() => {
    const checkMobileDevice = () => {
      setIsMobile(isMobileDevice());
    };

    // Initial check
    checkMobileDevice();

    // Re-check on resize (orientation change on mobile)
    window.addEventListener('resize', checkMobileDevice);

    return () => {
      window.removeEventListener('resize', checkMobileDevice);
    };
  }, []);

  // Check fullscreen status when component mounts and on change
  useEffect(() => {
    // Only execute the body if it's a mobile device
    if (isMobile) {
      const handleFullscreenChange = () => {
        setIsFullscreen(!!document.fullscreenElement);
      };

      document.addEventListener('fullscreenchange', handleFullscreenChange);
      return () => {
        document.removeEventListener('fullscreenchange', handleFullscreenChange);
      };
    }
    // Always return a cleanup function (empty if not mobile)
    return () => {};
  }, [isMobile]);

  // Handle fullscreen toggle - wrapped in useCallback to prevent recreation on each render
  const toggleFullscreen = useCallback(() => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch((err) => {
        console.error(`Error attempting to enable fullscreen: ${err.message}`);
      });
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen();
      }
    }
  }, []);

  // Handle shooting - wrapped in useCallback to prevent recreation on each render
  const handleShoot = useCallback(() => {
    // Use the gunInstance from the game store to start firing
    if (gunInstance.startFiring) {
      gunInstance.startFiring();
    }
  }, [gunInstance]);

  // Handle stop shooting - wrapped in useCallback to prevent recreation on each render
  const handleStopShoot = useCallback(() => {
    // Use the gunInstance from the game store to stop firing
    if (gunInstance.stopFiring) {
      gunInstance.stopFiring();
    }
  }, [gunInstance]);

  // Handle reload - wrapped in useCallback to prevent recreation on each render
  const handleReload = useCallback(() => {
    reload();
  }, [reload]);

  // Handle jump - wrapped in useCallback to prevent recreation on each render
  const handleJump = useCallback(() => {
    // Use the jump handler from the player store
    if (mobileControlHandlers.onJump) {
      mobileControlHandlers.onJump();
    }
  }, [mobileControlHandlers]);

  // Handle touch events for mobile controls
  useEffect(() => {
    const handleTouchStart = (e: TouchEvent) => {
      e.preventDefault();

      // Get the touch target
      const target = e.target as HTMLElement;
      const touch = e.touches[0];

      // Handle different control elements
      if (target.classList.contains('joystick-area') && touchIdRef.current.joystick === -1) {
        touchIdRef.current.joystick = touch.identifier;
        setJoystickActive(true);
        setJoystickStart({ x: touch.clientX, y: touch.clientY });
        setJoystickCurrent({ x: touch.clientX, y: touch.clientY });
      } else if (target.classList.contains('look-area') && touchIdRef.current.look === -1) {
        touchIdRef.current.look = touch.identifier;
        setLookActive(true);
        lookStartRef.current = { x: touch.clientX, y: touch.clientY };
        lastLookPosRef.current = { x: touch.clientX, y: touch.clientY };
      } else if (target.classList.contains('shoot-button')) {
        handleShoot();
      } else if (target.classList.contains('jump-button')) {
        handleJump();
      } else if (target.classList.contains('reload-button')) {
        handleReload();
      } else if (target.classList.contains('fullscreen-button')) {
        toggleFullscreen();
      }

      // Store onTouchEnd handler for buttons
      if (target.classList.contains('button')) {
        const button = target as MobileControlButton;
        if (target.classList.contains('shoot-button')) {
          button.onTouchEnd = handleStopShoot;
        }
      }
    };

    const handleTouchMove = (e: TouchEvent) => {
      e.preventDefault();

      // Process all active touches
      for (let i = 0; i < e.changedTouches.length; i++) {
        const touch = e.changedTouches[i];

        // Movement joystick
        if (touch.identifier === touchIdRef.current.joystick) {
          setJoystickCurrent({ x: touch.clientX, y: touch.clientY });

          // Calculate joystick offset
          const deltaX = touch.clientX - joystickStart.x;
          const deltaY = touch.clientY - joystickStart.y;

          // Normalize to -1 to 1 range with a maximum radius
          const maxRadius = 50;
          const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
          const normalizedX = distance > maxRadius ? (deltaX / distance) * maxRadius : deltaX;
          const normalizedY = distance > maxRadius ? (deltaY / distance) * maxRadius : deltaY;

          // Convert to -1 to 1 range
          const normalizedXRatio = normalizedX / maxRadius;
          const normalizedYRatio = normalizedY / maxRadius;

          // Call the movement handler from the player store if available
          if (mobileControlHandlers.onMove) {
            mobileControlHandlers.onMove(normalizedXRatio, normalizedYRatio);
          }
        }

        // Camera look
        else if (touch.identifier === touchIdRef.current.look) {
          const currentX = touch.clientX;
          const deltaCameraX = currentX - lastLookPosRef.current.x;

          // Apply rotation to camera using the camera controls from the player store
          if (cameraControls.rotateCameraY && Math.abs(deltaCameraX) > 0) {
            cameraControls.rotateCameraY(-deltaCameraX * 0.01);
          }

          // Update last position
          lastLookPosRef.current = {
            x: currentX,
            y: touch.clientY,
          };
        }
      }
    };

    const handleTouchEnd = (e: TouchEvent) => {
      for (let i = 0; i < e.changedTouches.length; i++) {
        const touch = e.changedTouches[i];

        // Movement joystick touch ended
        if (touch.identifier === touchIdRef.current.joystick) {
          touchIdRef.current.joystick = -1;
          setJoystickActive(false);

          // Call the stop move handler from the player store
          if (mobileControlHandlers.onStopMove) {
            mobileControlHandlers.onStopMove();
          }
        }

        // Camera look touch ended
        else if (touch.identifier === touchIdRef.current.look) {
          touchIdRef.current.look = -1;
          setLookActive(false);
        }
      }
    };

    // Only add event listeners if mobile
    if (isMobile) {
      // Add event listeners to whole document to make sure we catch all touches
      document.addEventListener('touchstart', handleTouchStart, { passive: false });
      document.addEventListener('touchmove', handleTouchMove, { passive: false });
      document.addEventListener('touchend', handleTouchEnd);
      document.addEventListener('touchcancel', handleTouchEnd);

      return () => {
        document.removeEventListener('touchstart', handleTouchStart);
        document.removeEventListener('touchmove', handleTouchMove);
        document.removeEventListener('touchend', handleTouchEnd);
        document.removeEventListener('touchcancel', handleTouchEnd);
      };
    }
    return () => {};
  }, [
    isMobile,
    joystickStart,
    handleShoot,
    handleStopShoot,
    handleReload,
    handleJump,
    toggleFullscreen,
    mobileControlHandlers,
    cameraControls,
  ]);

  // Don't render controls if not on mobile
  if (!isMobile) {
    return null;
  }

  // Calculate joystick position
  const joystickOffset = joystickActive
    ? {
        x: joystickCurrent.x - joystickStart.x,
        y: joystickCurrent.y - joystickStart.y,
      }
    : { x: 0, y: 0 };

  // Limit joystick movement radius
  const maxRadius = 50;
  const distance = Math.sqrt(
    joystickOffset.x * joystickOffset.x + joystickOffset.y * joystickOffset.y
  );
  const limitedOffset =
    distance > maxRadius
      ? {
          x: (joystickOffset.x / distance) * maxRadius,
          y: (joystickOffset.y / distance) * maxRadius,
        }
      : joystickOffset;

  return (
    <div className="mobile-controls">
      {/* Left side - Movement joystick */}
      <div className="joystick-container">
        <div className="joystick-area">
          <div
            className="joystick-base"
            style={{
              opacity: joystickActive ? 0.7 : 0.3,
            }}
          />
          <div
            className="joystick-stick"
            style={{
              transform: `translate(${limitedOffset.x}px, ${limitedOffset.y}px)`,
              opacity: joystickActive ? 1 : 0.5,
            }}
          />
        </div>
      </div>

      {/* Right side - Look area */}
      <div className="look-container">
        <div
          className="look-area"
          style={{
            opacity: lookActive ? 0.3 : 0.1,
          }}
        />
      </div>

      {/* Action buttons */}
      <div className="action-buttons">
        <button className="button shoot-button">FIRE</button>
        <button className="button jump-button">JUMP</button>
        <button className="button reload-button">RELOAD</button>
        <button className="button fullscreen-button">
          {isFullscreen ? 'EXIT FULL' : 'FULLSCREEN'}
        </button>
      </div>

      {/* Add CSS for mobile controls */}
      <style>
        {`
        .mobile-controls {
          position: fixed;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          pointer-events: none;
          z-index: 1000;
          touch-action: none;
        }

        .joystick-container {
          position: absolute;
          bottom: 100px;
          left: 50px;
          width: 150px;
          height: 150px;
          pointer-events: none;
        }

        .joystick-area {
          position: absolute;
          width: 150px;
          height: 150px;
          border-radius: 75px;
          pointer-events: auto;
        }

        .joystick-base {
          position: absolute;
          width: 100px;
          height: 100px;
          border-radius: 50px;
          background-color: rgba(255, 255, 255, 0.2);
          border: 2px solid rgba(255, 255, 255, 0.3);
          top: 25px;
          left: 25px;
        }

        .joystick-stick {
          position: absolute;
          width: 50px;
          height: 50px;
          border-radius: 25px;
          background-color: rgba(255, 255, 255, 0.5);
          border: 2px solid rgba(255, 255, 255, 0.7);
          top: 50px;
          left: 50px;
          transform: translate(0, 0);
        }

        .look-container {
          position: absolute;
          top: 0;
          right: 0;
          width: 50%;
          height: 100%;
          pointer-events: none;
        }

        .look-area {
          position: absolute;
          width: 100%;
          height: 100%;
          background-color: rgba(0, 0, 255, 0.1);
          pointer-events: auto;
        }

        .action-buttons {
          position: absolute;
          bottom: 20px;
          right: 20px;
          display: flex;
          flex-direction: column;
          gap: 10px;
          pointer-events: none;
        }

        .button {
          width: 80px;
          height: 80px;
          border-radius: 40px;
          background-color: rgba(255, 255, 255, 0.2);
          border: 2px solid rgba(255, 255, 255, 0.5);
          color: white;
          font-weight: bold;
          font-size: 14px;
          pointer-events: auto;
          touch-action: manipulation;
        }

        .shoot-button {
          background-color: rgba(255, 50, 50, 0.3);
        }

        .jump-button {
          background-color: rgba(50, 255, 50, 0.3);
        }

        .reload-button {
          background-color: rgba(50, 50, 255, 0.3);
        }

        .fullscreen-button {
          width: 100px;
          height: 40px;
          border-radius: 20px;
          font-size: 12px;
          background-color: rgba(100, 100, 100, 0.3);
        }
      `}
      </style>
    </div>
  );
};

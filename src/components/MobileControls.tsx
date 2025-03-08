import { useEffect, useState } from 'react';
import { useGameStore } from '../state/gameStore';

interface Position {
  x: number;
  y: number;
}

export const MobileControls = () => {
  const [joystickActive, setJoystickActive] = useState(false);
  const [joystickStart, setJoystickStart] = useState<Position>({ x: 0, y: 0 });
  const [joystickCurrent, setJoystickCurrent] = useState<Position>({ x: 0, y: 0 });
  const { shoot, reload } = useGameStore();
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Check fullscreen status when component mounts and on change
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
    };
  }, []);

  // Handle fullscreen toggle
  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      // Enter fullscreen
      document.documentElement.requestFullscreen().catch((err) => {
        console.error(`Error attempting to enable fullscreen: ${err.message}`);
      });
    } else {
      // Exit fullscreen
      if (document.exitFullscreen) {
        document.exitFullscreen();
      }
    }
  };

  // Max distance the joystick can move
  const maxJoystickDistance = 50;

  // Handle touch events for the joystick
  useEffect(() => {
    // Skip all touch handlers if device doesn't support touch
    if (!('ontouchstart' in window)) return;

    const handleTouchStart = (e: TouchEvent) => {
      // Check if touch is in the left half of the screen for movement
      if (e.touches[0].clientX < window.innerWidth / 2) {
        setJoystickActive(true);
        setJoystickStart({
          x: e.touches[0].clientX,
          y: e.touches[0].clientY,
        });
        setJoystickCurrent({
          x: e.touches[0].clientX,
          y: e.touches[0].clientY,
        });
      }
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (joystickActive) {
        // Find the touch that started the joystick
        for (let i = 0; i < e.touches.length; i++) {
          const touch = e.touches[i];

          // Check if this touch is in the left half of screen (our joystick area)
          if (touch.clientX < window.innerWidth / 2) {
            setJoystickCurrent({
              x: touch.clientX,
              y: touch.clientY,
            });

            // Calculate direction vector
            let deltaX = touch.clientX - joystickStart.x;
            let deltaY = touch.clientY - joystickStart.y;

            // Normalize to maxJoystickDistance
            const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
            if (distance > maxJoystickDistance) {
              deltaX = (deltaX / distance) * maxJoystickDistance;
              deltaY = (deltaY / distance) * maxJoystickDistance;
            }

            // Normalize to values between -1 and 1 for movement
            const normalizedX = deltaX / maxJoystickDistance;
            const normalizedY = deltaY / maxJoystickDistance;

            // Call the movement handler if available
            if (window.mobileControlHandlers?.onMove) {
              window.mobileControlHandlers.onMove(normalizedX, normalizedY);
            }

            break;
          }
        }
      }
    };

    const handleTouchEnd = (e: TouchEvent) => {
      // Check if all touches in left half are gone
      let leftSideTouchExists = false;

      for (let i = 0; i < e.touches.length; i++) {
        if (e.touches[i].clientX < window.innerWidth / 2) {
          leftSideTouchExists = true;
          break;
        }
      }

      if (!leftSideTouchExists) {
        setJoystickActive(false);
        if (window.mobileControlHandlers?.onStopMove) {
          window.mobileControlHandlers.onStopMove();
        }
      }
    };

    // Add event listeners
    window.addEventListener('touchstart', handleTouchStart);
    window.addEventListener('touchmove', handleTouchMove);
    window.addEventListener('touchend', handleTouchEnd);
    window.addEventListener('touchcancel', handleTouchEnd);

    return () => {
      window.removeEventListener('touchstart', handleTouchStart);
      window.removeEventListener('touchmove', handleTouchMove);
      window.removeEventListener('touchend', handleTouchEnd);
      window.removeEventListener('touchcancel', handleTouchEnd);
    };
  }, [joystickActive, joystickStart]);

  // Separate event handlers for jump and shoot to avoid conflicts
  useEffect(() => {
    if (!('ontouchstart' in window)) return;

    // Jump button handler
    const handleJumpTouch = (e: TouchEvent) => {
      e.preventDefault(); // Prevent default behavior
      if (window.mobileControlHandlers?.onJump) {
        window.mobileControlHandlers.onJump();
      }
    };

    // Shoot button handler
    const handleShootTouch = (e: TouchEvent) => {
      e.preventDefault(); // Prevent default behavior
      shoot();
    };

    // Reload button handler
    const handleReloadTouch = (e: TouchEvent) => {
      e.preventDefault(); // Prevent default behavior
      reload();
    };

    // Fullscreen button handler
    const handleFullscreenTouch = (e: TouchEvent) => {
      e.preventDefault(); // Prevent default behavior
      toggleFullscreen();
    };

    // Get the buttons after they're rendered
    const jumpButton = document.getElementById('mobile-jump-button');
    const shootButton = document.getElementById('mobile-shoot-button');
    const reloadButton = document.getElementById('mobile-reload-button');
    const fullscreenButton = document.getElementById('mobile-fullscreen-button');

    // Add event listeners to the specific buttons
    if (jumpButton) {
      jumpButton.addEventListener('touchstart', handleJumpTouch);
    }

    if (shootButton) {
      shootButton.addEventListener('touchstart', handleShootTouch);
    }

    if (reloadButton) {
      reloadButton.addEventListener('touchstart', handleReloadTouch);
    }

    if (fullscreenButton) {
      fullscreenButton.addEventListener('touchstart', handleFullscreenTouch);
    }

    return () => {
      // Clean up event listeners
      if (jumpButton) {
        jumpButton.removeEventListener('touchstart', handleJumpTouch);
      }

      if (shootButton) {
        shootButton.removeEventListener('touchstart', handleShootTouch);
      }

      if (reloadButton) {
        reloadButton.removeEventListener('touchstart', handleReloadTouch);
      }

      if (fullscreenButton) {
        fullscreenButton.removeEventListener('touchstart', handleFullscreenTouch);
      }
    };
  }, [shoot, reload]);

  // Only render on touch devices
  if (!('ontouchstart' in window)) {
    return null;
  }

  // Calculate joystick styles
  const joystickBaseStyle: React.CSSProperties = {
    position: 'fixed',
    left: '80px',
    bottom: '80px',
    width: '100px',
    height: '100px',
    borderRadius: '50%',
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    border: '2px solid rgba(255, 255, 255, 0.5)',
    transform: 'translate(-50%, 50%)',
    zIndex: 1000,
    pointerEvents: 'none',
  };

  const joystickKnobStyle: React.CSSProperties = {
    position: 'absolute',
    width: '60px',
    height: '60px',
    borderRadius: '50%',
    backgroundColor: 'rgba(255, 255, 255, 0.6)',
    top: '50%',
    left: '50%',
    transform: joystickActive
      ? `translate(calc(-50% + ${joystickCurrent.x - joystickStart.x}px), calc(-50% + ${
          joystickCurrent.y - joystickStart.y
        }px))`
      : 'translate(-50%, -50%)',
    transition: joystickActive ? 'none' : 'transform 0.2s ease-out',
    zIndex: 1001,
    pointerEvents: 'none',
  };

  const jumpButtonStyle: React.CSSProperties = {
    position: 'fixed',
    right: '80px',
    top: '80px',
    width: '80px',
    height: '80px',
    borderRadius: '50%',
    backgroundColor: 'rgba(120, 220, 120, 0.5)',
    border: '2px solid rgba(120, 220, 120, 0.7)',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    color: 'white',
    fontSize: '16px',
    fontWeight: 'bold',
    transform: 'translate(50%, -50%)',
    zIndex: 1000,
  };

  const shootButtonStyle: React.CSSProperties = {
    position: 'fixed',
    right: '80px',
    bottom: '80px',
    width: '80px',
    height: '80px',
    borderRadius: '50%',
    backgroundColor: 'rgba(220, 120, 120, 0.5)',
    border: '2px solid rgba(220, 120, 120, 0.7)',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    color: 'white',
    fontSize: '16px',
    fontWeight: 'bold',
    transform: 'translate(50%, 50%)',
    zIndex: 1000,
  };

  const reloadButtonStyle: React.CSSProperties = {
    position: 'fixed',
    right: '180px',
    bottom: '80px',
    width: '60px',
    height: '60px',
    borderRadius: '50%',
    backgroundColor: 'rgba(120, 120, 220, 0.5)',
    border: '2px solid rgba(120, 120, 220, 0.7)',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    color: 'white',
    fontSize: '14px',
    fontWeight: 'bold',
    transform: 'translate(50%, 50%)',
    zIndex: 1000,
  };

  const fullscreenButtonStyle: React.CSSProperties = {
    position: 'fixed',
    left: '20px',
    top: '20px',
    width: '40px',
    height: '40px',
    borderRadius: '50%',
    backgroundColor: 'rgba(80, 80, 80, 0.6)',
    border: '2px solid rgba(120, 120, 120, 0.7)',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    color: 'white',
    fontSize: '14px',
    fontWeight: 'bold',
    zIndex: 1000,
  };

  return (
    <>
      {/* Joystick */}
      <div style={joystickBaseStyle}>
        <div style={joystickKnobStyle}></div>
      </div>

      {/* Jump button */}
      <div id="mobile-jump-button" style={jumpButtonStyle}>
        JUMP
      </div>

      {/* Shoot button */}
      <div id="mobile-shoot-button" style={shootButtonStyle}>
        FIRE
      </div>

      {/* Reload button */}
      <div id="mobile-reload-button" style={reloadButtonStyle}>
        RELOAD
      </div>

      {/* Fullscreen button */}
      <div id="mobile-fullscreen-button" style={fullscreenButtonStyle}>
        {isFullscreen ? '✕' : '⛶'}
      </div>

      {/* Left side touch area - fullscreen but invisible */}
      <div
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '50%',
          height: '100%',
          zIndex: 998, // Lower than the buttons
          pointerEvents: 'auto',
        }}
      ></div>
    </>
  );
};

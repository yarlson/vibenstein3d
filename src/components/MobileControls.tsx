import { useEffect, useState, useRef, useCallback } from 'react';
import { useGameStore } from '../state/gameStore';

interface Position {
  x: number;
  y: number;
}

// Extend Window interface to include camera controls
declare global {
  interface Window {
    mobileCameraControls?: {
      rotateCameraY: (amount: number) => void;
    };
  }
}

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
  const { shoot, reload } = useGameStore();
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
  }, []);

  // Max distance the joystick can move
  const maxJoystickDistance = 50;

  // Handle touch events for movement joystick and camera rotation
  useEffect(() => {
    // Define all handler functions
    const handleTouchStart = (e: TouchEvent) => {
      for (let i = 0; i < e.changedTouches.length; i++) {
        const touch = e.changedTouches[i];

        // Left side of screen - Movement joystick
        if (touch.clientX < window.innerWidth / 2 && touchIdRef.current.joystick === -1) {
          touchIdRef.current.joystick = touch.identifier;
          setJoystickActive(true);
          setJoystickStart({
            x: touch.clientX,
            y: touch.clientY,
          });
          setJoystickCurrent({
            x: touch.clientX,
            y: touch.clientY,
          });
        }

        // Right side of screen - Camera controls
        else if (touch.clientX >= window.innerWidth / 2 && touchIdRef.current.look === -1) {
          // Avoid assigning right-side control if touching a button
          const element = document.elementFromPoint(touch.clientX, touch.clientY);
          const isButton = element?.id?.includes('mobile-');

          // Check if the element or any of its parents is a mobile control button
          const isMobileControl = element?.closest('.mobile-control-button') !== null;

          if (!isButton && !isMobileControl) {
            touchIdRef.current.look = touch.identifier;
            setLookActive(true);
            lookStartRef.current = {
              x: touch.clientX,
              y: touch.clientY,
            };
            lastLookPosRef.current = {
              x: touch.clientX,
              y: touch.clientY,
            };
          } else {
            console.log('Touch on control button detected, not starting camera rotation');
          }
        }
      }
    };

    const handleTouchMove = (e: TouchEvent) => {
      // Only prevent default if we're handling this touch
      const handlingSpecificTouch = Array.from(e.changedTouches).some(
        (touch) =>
          touch.identifier === touchIdRef.current.joystick ||
          touch.identifier === touchIdRef.current.look
      );

      if (handlingSpecificTouch) {
        e.preventDefault(); // Prevent default to avoid scrolling
      }

      // Handle each touch
      for (let i = 0; i < e.changedTouches.length; i++) {
        const touch = e.changedTouches[i];

        // Joystick movement
        if (touch.identifier === touchIdRef.current.joystick) {
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
        }

        // Camera look
        else if (touch.identifier === touchIdRef.current.look) {
          const currentX = touch.clientX;
          const deltaCameraX = currentX - lastLookPosRef.current.x;

          // Apply rotation to camera - rotate Y axis (horizontal)
          if (window.mobileCameraControls?.rotateCameraY && Math.abs(deltaCameraX) > 0) {
            window.mobileCameraControls.rotateCameraY(-deltaCameraX * 0.01);
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

          if (window.mobileControlHandlers?.onStopMove) {
            window.mobileControlHandlers.onStopMove();
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
      // Use a check to avoid handling events on our control buttons
      const documentTouchStart = (e: TouchEvent) => {
        // Check if the touch starts on one of our control buttons
        const target = e.target as Element;
        if (target?.closest('.mobile-control-button') || target?.id?.includes('mobile-')) {
          // Skip handling, let the button handle it
          console.log('Touch on control, skipping document handler');
          return;
        }
        handleTouchStart(e);
      };

      document.addEventListener('touchstart', documentTouchStart, { passive: false });
      document.addEventListener('touchmove', handleTouchMove, { passive: false });
      document.addEventListener('touchend', handleTouchEnd);
      document.addEventListener('touchcancel', handleTouchEnd);

      return () => {
        document.removeEventListener('touchstart', documentTouchStart);
        document.removeEventListener('touchmove', handleTouchMove);
        document.removeEventListener('touchend', handleTouchEnd);
        document.removeEventListener('touchcancel', handleTouchEnd);
      };
    }

    // Return empty cleanup if not mobile
    return () => {};
  }, [joystickActive, joystickStart, isMobile, maxJoystickDistance]);

  // Setup button touch handlers
  useEffect(() => {
    // Create button elements with their own distinct event handlers
    const createButton = (
      id: string,
      style: React.CSSProperties,
      label: string,
      action: (e: TouchEvent) => void
    ) => {
      const button = document.createElement('div');
      button.id = id;
      button.innerText = label;
      button.setAttribute('class', 'mobile-control-button');

      // Apply styles
      Object.entries(style).forEach(([key, value]) => {
        // @ts-expect-error - Dynamically setting style properties
        button.style[key] = value;
      });

      // Setup event handler - using both touchstart and mousedown for better response
      button.addEventListener(
        'touchstart',
        (e) => {
          console.log(`${id} touchstart event fired`);
          e.preventDefault();
          e.stopPropagation(); // Stop event from bubbling up
          action(e);
        },
        { passive: false }
      );

      button.addEventListener('mousedown', (e) => {
        console.log(`${id} mousedown event fired`);
        e.preventDefault();
        e.stopPropagation();
        action(e as unknown as TouchEvent);
      });

      document.body.appendChild(button);
      return button;
    };

    // Jump button handler
    const handleJump = (e: TouchEvent) => {
      e.preventDefault();
      e.stopPropagation();
      if (window.mobileControlHandlers?.onJump) {
        window.mobileControlHandlers.onJump();
      }
    };

    // Fire button handler
    const handleFire = (e: TouchEvent) => {
      e.preventDefault();
      e.stopPropagation();
      shoot();
    };

    // Reload button handler
    const handleReload = (e: TouchEvent) => {
      e.preventDefault();
      e.stopPropagation();
      reload();
    };

    // Fullscreen button handler
    const handleFullscreen = (e: TouchEvent) => {
      e.preventDefault();
      e.stopPropagation();
      toggleFullscreen();
    };

    // Only create buttons if mobile
    if (isMobile) {
      // Remove any existing buttons
      document.querySelectorAll('.mobile-control-button').forEach((el) => {
        el.remove();
      });

      // Create all the buttons
      const buttons: HTMLElement[] = [];

      buttons.push(
        createButton(
          'mobile-jump-button',
          {
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
            zIndex: '2000',
            touchAction: 'none',
            pointerEvents: 'auto', // Ensure pointer events are enabled
            cursor: 'pointer', // Show pointer cursor on hover
          },
          'JUMP',
          handleJump
        )
      );

      buttons.push(
        createButton(
          'mobile-fire-button',
          {
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
            zIndex: '2000',
            touchAction: 'none',
            pointerEvents: 'auto', // Ensure pointer events are enabled
            cursor: 'pointer', // Show pointer cursor on hover
          },
          'FIRE',
          handleFire
        )
      );

      buttons.push(
        createButton(
          'mobile-reload-button',
          {
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
            zIndex: '2000',
            touchAction: 'none',
            pointerEvents: 'auto', // Ensure pointer events are enabled
            cursor: 'pointer', // Show pointer cursor on hover
          },
          'RELOAD',
          handleReload
        )
      );

      buttons.push(
        createButton(
          'mobile-fullscreen-button',
          {
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
            zIndex: '2000',
            touchAction: 'none',
            pointerEvents: 'auto', // Ensure pointer events are enabled
            cursor: 'pointer', // Show pointer cursor on hover
          },
          isFullscreen ? '✕' : '⛶',
          handleFullscreen
        )
      );

      // Remove buttons when component unmounts
      return () => {
        buttons.forEach((button) => button.remove());
      };
    }

    // Return empty cleanup if not mobile
    return () => {};
  }, [shoot, reload, isFullscreen, toggleFullscreen, isMobile]);

  // If not mobile, don't render anything
  if (!isMobile) {
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

  // Camera rotation indicator
  const lookIndicatorStyle: React.CSSProperties = {
    position: 'fixed',
    right: '50%',
    bottom: '200px',
    transform: 'translateX(50%)',
    color: 'rgba(255, 255, 255, 0.5)',
    zIndex: 999,
    pointerEvents: 'none',
    fontFamily: 'sans-serif',
    fontSize: '14px',
    textAlign: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    padding: '5px 10px',
    borderRadius: '4px',
    opacity: lookActive ? 1 : 0,
    transition: 'opacity 0.2s ease-out',
  };

  return (
    <>
      {/* Visual indicator for the joystick */}
      <div style={joystickBaseStyle}>
        <div style={joystickKnobStyle}></div>
      </div>

      {/* Camera look indicator */}
      <div style={lookIndicatorStyle}>Drag right side to look around</div>

      {/* The actual control buttons are created in useEffect and appended to the body */}
    </>
  );
};

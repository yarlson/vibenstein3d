import { useEffect, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Object3D, Vector3 } from 'three';
import { useGameStore } from '../state/gameStore';
import { create } from 'zustand';

// Store to communicate between the inner and outer components
interface RadarState {
  objects: RadarObject[];
  radarRadius: number;
  updateObjects: (objects: RadarObject[]) => void;
  setRadarRadius: (radius: number) => void;
}

const useRadarStore = create<RadarState>((set) => ({
  objects: [],
  radarRadius: 20, // Default radar radius
  updateObjects: (objects) => set({ objects }),
  setRadarRadius: (radius) => set({ radarRadius: radius }),
}));

interface RadarObject {
  id: string;
  position: Vector3;
  type: 'enemy' | 'key' | 'door' | 'player' | 'item';
  color: string;
}

// This component lives inside the Canvas and uses useFrame
export const MiniRadarTracker = ({ 
  playerRef,
  radarRadius
}: {
  playerRef: React.RefObject<Object3D>;
  radarRadius?: number;
}) => {
  const { radarEnemies, radarItems } = useGameStore();
  const updateObjects = useRadarStore(state => state.updateObjects);
  const setRadarRadius = useRadarStore(state => state.setRadarRadius);
  
  // Update radar radius if provided
  useEffect(() => {
    if (radarRadius !== undefined) {
      setRadarRadius(radarRadius);
    }
  }, [radarRadius, setRadarRadius]);
  
  // Update radar objects position inside Canvas with useFrame
  useFrame(() => {
    if (!playerRef.current) return;
    
    const updatedObjects: RadarObject[] = [];
    
    // Add player
    updatedObjects.push({
      id: 'player',
      position: playerRef.current.position.clone(),
      type: 'player',
      color: '#00ff00', // Green for player
    });
    
    // Add enemies
    radarEnemies.forEach((enemyRef, index) => {
      if (enemyRef.current) {
        updatedObjects.push({
          id: `enemy-${index}`,
          position: enemyRef.current.position.clone(),
          type: 'enemy',
          color: '#ff0000', // Red for enemies
        });
      }
    });
    
    // Add items
    radarItems.forEach((itemRef, index) => {
      if (itemRef.current) {
        const isKey = itemRef.current.userData?.type === 'key';
        const isDoor = itemRef.current.userData?.type === 'door';
        
        updatedObjects.push({
          id: `item-${index}`,
          position: itemRef.current.position.clone(),
          type: isKey ? 'key' : isDoor ? 'door' : 'item',
          color: isKey ? '#ffff00' : isDoor ? '#0000ff' : '#ffffff',
        });
      }
    });
    
    // Update the store with new objects data
    updateObjects(updatedObjects);
  });
  
  // This component doesn't render anything
  return null;
};

// This component lives outside the Canvas and renders the UI
interface MiniRadarProps {
  playerRef: React.RefObject<Object3D>;
  radarRadius?: number;
}

export const MiniRadar: React.FC<MiniRadarProps> = ({
  playerRef,
  radarRadius
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const radarObjects = useRadarStore(state => state.objects);
  const storeRadarRadius = useRadarStore(state => state.radarRadius);
  const setRadarRadius = useRadarStore(state => state.setRadarRadius);
  
  // Update radar radius if provided
  useEffect(() => {
    if (radarRadius !== undefined) {
      setRadarRadius(radarRadius);
    }
  }, [radarRadius, setRadarRadius]);
  
  // Draw radar
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !playerRef.current) return;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Draw radar background
    ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
    ctx.beginPath();
    ctx.arc(canvas.width / 2, canvas.height / 2, canvas.width / 2, 0, Math.PI * 2);
    ctx.fill();
    
    // Draw radar grid (outer circle)
    ctx.strokeStyle = 'rgba(0, 255, 0, 0.6)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(canvas.width / 2, canvas.height / 2, canvas.width / 2 - 4, 0, Math.PI * 2);
    ctx.stroke();
    
    // Draw middle circle
    ctx.strokeStyle = 'rgba(0, 255, 0, 0.4)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.arc(canvas.width / 2, canvas.height / 2, canvas.width / 4, 0, Math.PI * 2);
    ctx.stroke();
    
    // Draw crosshairs
    ctx.beginPath();
    ctx.moveTo(canvas.width / 2, 4);
    ctx.lineTo(canvas.width / 2, canvas.height - 4);
    ctx.moveTo(4, canvas.height / 2);
    ctx.lineTo(canvas.width - 4, canvas.height / 2);
    ctx.stroke();
    
    // Find player object
    const playerObj = radarObjects.find(obj => obj.type === 'player');
    if (!playerObj) return;
    
    // Get player position and rotation
    const playerPos = playerObj.position;
    const playerRotY = playerRef.current.rotation.y;
    
    // Draw radar objects
    radarObjects.forEach(obj => {
      if (obj.type === 'player') return; // Skip player (we're drawing from player's perspective)
      
      // Calculate relative position to player
      const relX = obj.position.x - playerPos.x;
      const relZ = obj.position.z - playerPos.z;
      
      // Rotate point based on player's rotation
      const rotatedX = relX * Math.cos(-playerRotY) - relZ * Math.sin(-playerRotY);
      const rotatedZ = relX * Math.sin(-playerRotY) + relZ * Math.cos(-playerRotY);
      
      // Skip if object is out of radar range
      const distance = Math.sqrt(rotatedX * rotatedX + rotatedZ * rotatedZ);
      if (distance > storeRadarRadius) return;
      
      // Convert to screen coordinates
      const screenX = canvas.width / 2 + (rotatedX / storeRadarRadius) * (canvas.width / 2 - 10);
      const screenY = canvas.height / 2 + (rotatedZ / storeRadarRadius) * (canvas.height / 2 - 10);
      
      // Draw dot with glow effect
      ctx.fillStyle = obj.color;
      const dotSize = obj.type === 'enemy' ? 5 : 3;
      
      // Draw glow
      const gradient = ctx.createRadialGradient(
        screenX, screenY, 0,
        screenX, screenY, dotSize * 2
      );
      gradient.addColorStop(0, obj.color);
      gradient.addColorStop(1, 'rgba(0,0,0,0)');
      
      ctx.beginPath();
      ctx.fillStyle = gradient;
      ctx.arc(screenX, screenY, dotSize * 2, 0, Math.PI * 2);
      ctx.fill();
      
      // Draw dot
      ctx.beginPath();
      ctx.fillStyle = obj.color;
      ctx.arc(screenX, screenY, dotSize, 0, Math.PI * 2);
      ctx.fill();
    });
    
    // Draw player in center
    ctx.fillStyle = 'rgba(0, 255, 0, 0.8)';
    ctx.beginPath();
    ctx.arc(canvas.width / 2, canvas.height / 2, 5, 0, Math.PI * 2);
    ctx.fill();
    
    // Draw player direction arrow
    ctx.strokeStyle = 'rgba(0, 255, 0, 0.8)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(canvas.width / 2, canvas.height / 2);
    ctx.lineTo(
      canvas.width / 2, 
      canvas.height / 2 - 18
    );
    ctx.stroke();
    
    // Draw arrowhead
    ctx.beginPath();
    ctx.moveTo(canvas.width / 2, canvas.height / 2 - 18);
    ctx.lineTo(canvas.width / 2 - 4, canvas.height / 2 - 14);
    ctx.lineTo(canvas.width / 2 + 4, canvas.height / 2 - 14);
    ctx.closePath();
    ctx.fillStyle = 'rgba(0, 255, 0, 0.8)';
    ctx.fill();
    
  }, [radarObjects, playerRef, storeRadarRadius]);
  
  return (
    <div style={{ position: 'relative' }}>
      <div
        style={{
          position: 'fixed',
          top: '20px',
          right: '20px',
          width: '120px',
          height: '120px',
          borderRadius: '50%',
          overflow: 'hidden',
          zIndex: 1000,
          boxShadow: '0 0 15px rgba(0, 255, 0, 0.7)',
          border: '2px solid rgba(0, 255, 0, 0.7)',
        }}
      >
        <canvas
          ref={canvasRef}
          width={120}
          height={120}
          style={{ width: '100%', height: '100%' }}
        />
      </div>
      <div
        style={{
          position: 'fixed',
          top: '145px',
          right: '20px',
          color: 'rgba(0, 255, 0, 0.9)',
          fontFamily: 'monospace',
          fontSize: '14px',
          fontWeight: 'bold',
          textShadow: '0 0 5px rgba(0, 0, 0, 0.7)',
          zIndex: 1000,
          textAlign: 'center',
          width: '120px',
        }}
      >
        RADAR
      </div>
    </div>
  );
}; 
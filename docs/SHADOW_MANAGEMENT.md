# Dynamic Shadow Management System

This document explains the implementation of the dynamic shadow resolution and culling system used in the game to optimize performance while maintaining visual quality.

## Overview

The system dynamically adjusts shadow map resolution and enables/disables shadow casting based on:
1. Distance from the camera to each light
2. Current application performance (FPS)
3. Global shadow map count to prevent exceeding hardware limits

## Components

### 1. Global Shadow Map Store (`shadowMapStore.ts`)

The central store that tracks the total number of active shadow maps across all lights.

```typescript
// Maximum shadow maps allowed by hardware
export const MAX_SHADOW_MAPS = 16;

// Store interface
interface ShadowMapState {
  activeShadowMapCount: number;
  incrementShadowMapCount: () => number;
  decrementShadowMapCount: () => number;
  getShadowMapCount: () => number;
  canAddShadowMap: () => boolean;
}
```

Key features:
- Enforces a global limit of shadow-casting lights (16 by default)
- Provides methods to safely increment/decrement the counter
- Exposes a helper method `canAddShadowMap()` to check before enabling shadows

### 2. Shadow Utility Functions (`shadowUtils.ts`)

Contains algorithms for determining shadow map resolution and culling.

```typescript
// Calculate appropriate shadow map size based on distance
export function calculateShadowMapSize(distance: number): number;

// Determine if a light should cast shadows based on distance
export function shouldCastShadow(
  lightPosition: Vector3 | [number, number, number],
  cameraPosition: Vector3 | [number, number, number]
): boolean;
```

These functions use adaptive thresholds that change based on:
- Current frame rate
- Number of active shadow maps
- Distance from camera to light

### 3. DynamicPointLight Component (`DynamicPointLight.tsx`)

A wrapper for Three.js PointLight that automatically manages shadow properties.

```tsx
// Props interface
interface DynamicPointLightProps {
  position: [number, number, number];
  color?: string;
  intensity?: number;
  distance?: number;
  decay?: number;
}
```

Key behaviors:
1. On each frame, calculates distance to camera
2. Determines appropriate shadow map resolution
3. Only enables shadow casting if:
   - The light is close enough to the camera
   - The global shadow map count hasn't reached the limit
4. Properly cleans up and disposes shadow maps when not in use

### 4. Performance Monitoring (`performanceMonitor.ts` and `PerformanceMonitor.tsx`)

Tools for tracking performance metrics and displaying them in game.

```typescript
// Performance state interface
interface PerformanceState {
  activeShadowMaps: number;
  frameRate: number;
  updateActiveShadowMaps: (count: number) => void;
  updateFrameRate: (fps: number) => void;
}
```

Features:
- Real-time FPS calculation
- Shadow map count display
- Debug mode with shadow toggling (`Press 'H' key to toggle shadows`)
- Visual indicators when approaching shadow map limits

## How It Works

### Shadow Map Resolution Calculation

1. Close lights (< 5 units from camera) use 1024² shadow maps
2. Medium distance lights (5-10 units) use 512² shadow maps
3. Far lights (10-20 units) use 256² shadow maps
4. Very distant lights (> 20 units) use 128² shadow maps

These thresholds adapt based on performance:
- When FPS drops below 30, resolution sizes are reduced
- When many shadow maps are active, individual resolutions are lowered
- When FPS is high and few shadows are active, resolution can increase

### Shadow Culling Logic

1. Lights beyond a distance threshold (default 25 units) don't cast shadows
2. This threshold adapts based on performance:
   - Lowered when FPS drops 
   - Reduced when approaching the shadow map limit
3. Global limit enforcement:
   - If 16 lights are already casting shadows, additional lights won't cast shadows
   - Lights closer to the camera take priority

## Usage

Simply replace standard Three.js point lights with the `DynamicPointLight` component:

```tsx
// Before: Standard point light
<pointLight
  position={[0, 3, 0]}
  color="#ffffff"
  intensity={1.5}
  distance={10}
  castShadow
  shadow-mapSize-width={512}
  shadow-mapSize-height={512}
/>

// After: Dynamic point light
<DynamicPointLight
  position={[0, 3, 0]}
  color="#ffffff"
  intensity={1.5}
  distance={10}
/>
```

All shadow properties are managed automatically.

## Testing and Debugging

The system includes built-in debugging tools:

1. Visual Performance Monitor
   - Shows current FPS
   - Displays active shadow map count with color indicators
   - Green: Well within limits
   - Orange: Approaching limit
   - Red: At or exceeding limit

2. Debug Mode
   - Press 'H' to toggle all shadows on/off for testing
   - Enable by setting `debug={true}` prop on the PerformanceMonitor component

## Configuration

The system can be configured by adjusting constants in the source files:

1. `MAX_SHADOW_MAPS` in `shadowMapStore.ts` - Hardware limit (default: 16)
2. Resolution thresholds in `calculateShadowMapSize()` in `shadowUtils.ts`
3. Distance thresholds in `shouldCastShadow()` in `shadowUtils.ts`

## Performance Impact

The dynamic shadow system significantly improves performance by:
1. Reducing the total number of shadow maps
2. Using lower resolution for distant shadows
3. Preventing hardware limits from being exceeded
4. Adapting in real-time to maintain frame rate 
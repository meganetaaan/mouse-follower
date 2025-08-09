# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

- `npm run dev` - Start Vite development server for interactive demo
- `npm run build` - TypeScript compilation followed by Vite production build
- `npm test` - Run all tests with Vitest
- `npm run preview` - Preview the production build locally
- `npm run check:fix` - Run Biome linting and formatting with auto-fix

## Architecture Overview

This is a TypeScript mouse follower animation library built with Vite. It creates animated sprites that smoothly follow the mouse cursor or other targets using physics-based movement. The library supports multiple followers in formation and customizable sprite animations with transparency.

### Core Components

**Main Follower System** (`src/follower.ts`)
- Factory function `follower(options)` returns Follower instances
- Manages animation loop with `requestAnimationFrame`
- Handles DOM element creation and positioning
- Supports mouse tracking, target following, and formation behavior

**Physics Engine** (`src/follower/physics.ts`)
- Calculates smooth acceleration-based movement toward targets
- Implements velocity limiting and stop-within-distance behavior
- Pure functions for position/velocity calculations using delta time
- Vector math utilities for direction and distance calculations

**Sprite System** (`src/follower/sprite.ts`)
- Canvas-based sprite rendering with frame animation
- Supports sprite sheets with configurable frame counts
- Implements color-key transparency (green screen masking)
- Handles sprite loading, processing, and rendering

**Type Definitions** (`src/follower/types.ts`)
- Core interfaces: `Follower`, `FollowerOptions`, `Position`, `FollowTarget`
- Animation system types: `AnimationConfig`, `AnimationsConfig`
- Event types: `FollowerStartEvent`, `FollowerStopEvent`
- Sprite preset constants: `SPRITE_PRESET_STACK_CHAN`
- Default configuration values for physics and sprite parameters

### Key Technical Details

**Follow Target System**: Followers can follow:
- `mouseTarget()` - Returns a MouseTarget instance that tracks cursor position via global mouse events
- `FollowTarget` object - Any object with `x` and `y` properties (static or dynamic)
- Another `Follower` instance - Creates formation chains
- `offsetTarget(target, offsetX, offsetY)` - Creates a target with offset from another target

**Physics Configuration** (via `physics` option):
- `velocity` - Maximum movement speed (px/s, default: 400)
- `accel` - Acceleration rate toward target (px/s², default: 2000)
- `braking`:
  - `stopDistance` - Distance threshold to stop movement (px, default: 30)
  - `distance` - Distance to start braking (px, default: 200)
  - `strength` - Braking strength multiplier (default: 8.0)
  - `minVelocity` - Minimum velocity before stopping (px/s, default: 50)

**Sprite Animation** (via `sprite` option):
- Supports horizontal sprite sheets (frames laid out left-to-right)
- Canvas-based rendering with transparency masking support
- Configuration options:
  - `url` - Sprite sheet image URL
  - `width`/`height` - Sprite dimensions in pixels
  - `frames` - Number of frames in sprite sheet
  - `transparentColor` - Color for transparency masking (default: 'rgb(0, 255, 0)')
  - `animations` - Named animation configurations with frame positions
- Event-driven animation control via start/stop events
- Default preset: `SPRITE_PRESET_STACK_CHAN` (32x32px with walk and action animations)

## Testing Setup

Uses Vitest with jsdom environment for DOM testing. Key test patterns:
- Canvas API is mocked with `vi.fn()` for all 2D context methods
- Image loading is mocked with custom Image constructor
- Timer mocking with `vi.useFakeTimers()` for animation testing
- DOM cleanup in `afterEach` to remove follower elements

Each module has corresponding `.test.ts` files testing core functionality in isolation.

## Demo Application

The `src/main.ts` demonstrates various follower configurations:
- Single follower following mouse using `mouseTarget()` with Stack-chan sprite preset
- Formation of multiple followers in chain using `offsetTarget()`
- Event-driven animation system (action on stop, walk on start)
- Canvas-based sprite rendering with transparency
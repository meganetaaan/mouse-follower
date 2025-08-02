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
- `"mouse"` - Tracks cursor position via global mouse events
- `Position` object - Static or dynamic coordinate target
- Another `Follower` instance - Creates formation chains

**Physics Configuration**:
- `maxVelocity` - Maximum movement speed (px/s)
- `maxAccel` - Acceleration rate toward target (px/s²)
- `stopWithin` - Distance threshold to stop movement (px)

**Sprite Animation**:
- Supports horizontal sprite sheets (frames laid out left-to-right)
- Canvas-based rendering with transparency masking support
- Multiple animation configurations (walk, action, etc.)
- Event-driven animation control via start/stop events
- Default sprite: Stack-chan 32x32px with 4 frames

## Testing Setup

Uses Vitest with jsdom environment for DOM testing. Key test patterns:
- Canvas API is mocked with `vi.fn()` for all 2D context methods
- Image loading is mocked with custom Image constructor
- Timer mocking with `vi.useFakeTimers()` for animation testing
- DOM cleanup in `afterEach` to remove follower elements

Each module has corresponding `.test.ts` files testing core functionality in isolation.

## Demo Application

The `src/main.ts` demonstrates various follower configurations:
- Single follower following mouse with Stack-chan sprite
- Formation of multiple followers in chain
- Event-driven animation system (action on stop, walk on start)
- Canvas-based sprite rendering with transparency
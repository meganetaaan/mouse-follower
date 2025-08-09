// Mouse Follower Library - Main Entry Point

// Re-export physics utilities for advanced users
export {
	type PhysicsState,
	updatePhysics,
} from "./follower/physics.js";
export {
	type AnimationConfig,
	type AnimationsConfig,
	type Follower,
	type FollowerOptions,
	// Events
	type FollowerStartEvent,
	type FollowerStopEvent,
	type FollowTarget,
	// Core API
	follower,
	mouseTarget,
	offsetTarget,
	// Physics
	type PhysicsOptions,
	type Position,
	// Presets
	SPRITE_PRESET_STACK_CHAN,
	// Sprite System
	type SpriteOptions,
} from "./follower.js";

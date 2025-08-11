export interface Position {
	x: number;
	y: number;
}

export interface Velocity {
	x: number;
	y: number;
}

export interface PhysicsState {
	position: Position;
	velocity: Velocity;
	target: Position;
}

export interface FollowTarget {
	x: number;
	y: number;
}

export interface PhysicsOptions {
	velocity?: number;
	accel?: number;
	braking?: {
		stopDistance?: number;
		distance?: number;
		strength?: number;
		minVelocity?: number;
	};
}

// Configuration interface for Physics class constructor
export interface PhysicsConfig {
	maxAccel: number;
	maxVelocity: number;
	stopWithin: number;
	brakingStartDistance: number;
	brakingStrength: number;
	minStopVelocity: number;
}

// Configuration interface for Sprite class constructor
export interface SpriteConfig {
	spriteUrl: string;
	spriteWidth: number;
	spriteHeight: number;
	spriteFrames?: number;
	transparentColor?: string;
	animationInterval: number;
	animations: AnimationsConfig;
}

export interface AnimationConfig {
	start: [number, number]; // [x, y] position in sprite sheet
	numFrames: number;
	repeat: boolean;
	interval?: number; // Optional custom interval for this animation
}

export interface AnimationsConfig {
	[key: string]: AnimationConfig;
}

export interface SpriteOptions {
	url?: string;
	frames?: number;
	width?: number;
	height?: number;
	transparentColor?: string;
	animation?: {
		interval?: number;
	};
	animations?: AnimationsConfig;
}

export interface FollowerOptions {
	target?: FollowTarget;
	bindTo?: HTMLElement;
	physics?: PhysicsOptions;
	sprite?: SpriteOptions;
}

export interface FollowerStopEvent extends CustomEvent {
	type: "stop";
	detail: { follower: Follower };
}

export interface FollowerStartEvent extends CustomEvent {
	type: "start";
	detail: { follower: Follower };
}

export interface Follower extends Position {
	start(): Promise<void>;
	stop(): void;
	setTarget(target: FollowTarget): void;
	destroy(): void;
	playAnimation(name: string): void;
	pauseAnimation(): void;
	addEventListener(
		type: "stop",
		listener: (event: FollowerStopEvent) => void,
	): void;
	addEventListener(
		type: "start",
		listener: (event: FollowerStartEvent) => void,
	): void;
	addEventListener(type: string, listener: EventListener): void;
	removeEventListener(
		type: "stop",
		listener: (event: FollowerStopEvent) => void,
	): void;
	removeEventListener(
		type: "start",
		listener: (event: FollowerStartEvent) => void,
	): void;
	removeEventListener(type: string, listener: EventListener): void;
}

export class MouseTarget implements FollowTarget {
	x: number = 0;
	y: number = 0;
	private isTracking: boolean = false;

	constructor() {
		this.setupMouseTracking();
	}

	private setupMouseTracking(): void {
		if (!this.isTracking) {
			window.addEventListener("mousemove", (e) => {
				this.x = e.clientX;
				this.y = e.clientY;
			});
			this.isTracking = true;
		}
	}
}

export class OffsetTarget implements FollowTarget {
	private target: FollowTarget;
	private offsetX: number;
	private offsetY: number;

	constructor(target: FollowTarget, offsetX: number = 0, offsetY: number = 0) {
		this.target = target;
		this.offsetX = offsetX;
		this.offsetY = offsetY;
	}

	get x(): number {
		return this.target.x + this.offsetX;
	}

	get y(): number {
		return this.target.y + this.offsetY;
	}
}

export const DEFAULT_ANIMATIONS: AnimationsConfig = {
	walk: {
		start: [0, 0],
		numFrames: 4,
		repeat: true,
	},
	action: {
		start: [0, 0], // Temporarily using same animation as walk
		numFrames: 4,
		repeat: false,
	},
};

// Sprite presets
export function stackChanPreset(): SpriteOptions {
	return {
		url: new URL("../../assets/stack-chan.png", import.meta.url).href,
		width: 32,
		height: 32,
		frames: 4,
		transparentColor: "rgb(0, 255, 0)",
		animation: {
			interval: 125,
		},
		animations: {
			walk: {
				start: [0, 0],
				numFrames: 4,
				repeat: true,
				interval: 100,
			},
			action: {
				start: [0, 32], // Temporarily using same animation as walk
				numFrames: 4,
				repeat: false,
			},
		},
	};
}

export const SPRITE_PRESET_STACK_CHAN: SpriteOptions = stackChanPreset();

// Physics class interface
export interface IPhysics {
	update(deltaTime: number): void;
	setTarget(target: Position): void;
	getPosition(): Position;
	getVelocity(): Position;
	isMoving(threshold?: number): boolean;
}

// Sprite class interface
export interface ISprite {
	initialize(): Promise<void>;
	render(position: Position, direction?: SpriteDirection): void;
	playAnimation(name: string): void;
	pauseAnimation(): void;
	destroy(): void;
	isAnimating(): boolean;
}

// Sprite direction type (moved from sprite.ts for interface dependency)
export type SpriteDirection = "left" | "right";

export const DEFAULTS = {
	physics: {
		velocity: 400,
		accel: 2000,
		braking: {
			stopDistance: 30,
			distance: 200,
			strength: 8.0,
			minVelocity: 50.0,
		},
	},
	sprite: stackChanPreset(),
};

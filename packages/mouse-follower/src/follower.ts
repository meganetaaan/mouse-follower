import { Physics } from "./follower/physics.js";
import { Sprite } from "./follower/sprite.js";
import type {
	FollowerOptions,
	FollowerStartEvent,
	FollowerStopEvent,
	FollowTarget,
	Follower as IFollower,
	IPhysics,
	PhysicsConfig,
	Position,
	SpriteConfig,
	SpriteDirection,
} from "./follower/types.js";
import {
	DEFAULT_ANIMATIONS,
	DEFAULTS,
	MouseTarget,
	OffsetTarget,
} from "./follower/types.js";

interface ProcessedOptions {
	followTarget: FollowTarget;
	bindTo: HTMLElement;
	physicsConfig: PhysicsConfig;
	spriteConfig: SpriteConfig;
}

class FollowerImpl implements IFollower {
	private options: ProcessedOptions;
	private physics: IPhysics;
	private sprite: Sprite;
	private animationId?: number;
	private lastTime: number = 0;
	private isRunning: boolean = false;
	// Event system
	private eventTarget = new EventTarget();
	private wasMoving: boolean = false;

	get x(): number {
		return this.physics.getPosition().x;
	}

	set x(value: number) {
		const currentPos = this.physics.getPosition();
		this.physics.setTarget({ x: value, y: currentPos.y });
	}

	get y(): number {
		return this.physics.getPosition().y;
	}

	set y(value: number) {
		const currentPos = this.physics.getPosition();
		this.physics.setTarget({ x: currentPos.x, y: value });
	}

	constructor(options: FollowerOptions = {}) {
		// Process options
		const followTarget = options.target || mouseTarget();
		const bindTo = options.bindTo || document.body;

		const physicsConfig: PhysicsConfig = {
			maxVelocity: options.physics?.velocity ?? DEFAULTS.physics.velocity,
			maxAccel: options.physics?.accel ?? DEFAULTS.physics.accel,
			stopWithin:
				options.physics?.braking?.stopDistance ??
				DEFAULTS.physics.braking.stopDistance,
			brakingStartDistance:
				options.physics?.braking?.distance ?? DEFAULTS.physics.braking.distance,
			brakingStrength:
				options.physics?.braking?.strength ?? DEFAULTS.physics.braking.strength,
			minStopVelocity:
				options.physics?.braking?.minVelocity ??
				DEFAULTS.physics.braking.minVelocity,
		};

		const spriteConfig: SpriteConfig = {
			spriteUrl: options.sprite?.url ?? DEFAULTS.sprite.url ?? "/ugo-mini.png",
			spriteFrames: options.sprite?.frames ?? DEFAULTS.sprite.frames ?? 2,
			spriteWidth: options.sprite?.width ?? DEFAULTS.sprite.width ?? 32,
			spriteHeight: options.sprite?.height ?? DEFAULTS.sprite.height ?? 64,
			transparentColor:
				options.sprite?.transparentColor ??
				DEFAULTS.sprite.transparentColor ??
				"rgb(0, 255, 0)",
			animationInterval:
				options.sprite?.animation?.interval ??
				DEFAULTS.sprite.animation?.interval ??
				125,
			animations:
				options.sprite?.animations ??
				DEFAULTS.sprite.animations ??
				DEFAULT_ANIMATIONS,
		};

		this.options = {
			followTarget,
			bindTo,
			physicsConfig,
			spriteConfig,
		};

		// Initialize position to current target position
		const initialPosition = { x: followTarget.x, y: followTarget.y };

		// Create Physics and Sprite instances
		this.physics = new Physics(physicsConfig, initialPosition);
		this.sprite = new Sprite(spriteConfig, bindTo);
	}

	async start(): Promise<void> {
		if (this.isRunning) return;

		try {
			// Initialize the sprite
			await this.sprite.initialize();

			this.lastTime = performance.now();
			this.isRunning = true;

			// Start walking animation
			this.sprite.playAnimation("walk");

			this.animate();
		} catch (error) {
			console.error("Failed to initialize sprite:", error);
			throw error;
		}
	}

	stop(): void {
		this.isRunning = false;
		if (this.animationId) {
			cancelAnimationFrame(this.animationId);
			this.animationId = undefined;
		}
		this.sprite.pauseAnimation();
	}

	setTarget(target: FollowTarget): void {
		this.options.followTarget = target;
	}

	destroy(): void {
		this.stop();
		this.sprite.destroy();
	}

	playAnimation(name: string): void {
		this.sprite.playAnimation(name);
	}

	pauseAnimation(): void {
		this.sprite.pauseAnimation();
	}

	addEventListener(
		type: "stop",
		listener: (event: FollowerStopEvent) => void,
	): void;
	addEventListener(
		type: "start",
		listener: (event: FollowerStartEvent) => void,
	): void;
	addEventListener(type: string, listener: EventListener): void;
	addEventListener(
		type: string,
		listener: EventListener | ((event: unknown) => void),
	): void {
		this.eventTarget.addEventListener(type, listener);
	}

	removeEventListener(
		type: "stop",
		listener: (event: FollowerStopEvent) => void,
	): void;
	removeEventListener(
		type: "start",
		listener: (event: FollowerStartEvent) => void,
	): void;
	removeEventListener(type: string, listener: EventListener): void;
	removeEventListener(
		type: string,
		listener: EventListener | ((event: unknown) => void),
	): void {
		this.eventTarget.removeEventListener(type, listener);
	}

	private animate = (): void => {
		if (!this.isRunning) return;

		const currentTime = performance.now();
		const deltaTime = (currentTime - this.lastTime) / 1000;
		this.lastTime = currentTime;

		// Update physics
		const target = this.getTargetPosition();
		this.physics.setTarget(target);
		this.physics.update(deltaTime);

		// Get current position and velocity
		const position = this.physics.getPosition();
		const velocity = this.physics.getVelocity();

		// Determine sprite direction based on velocity
		let direction: SpriteDirection = "right";
		if (Math.abs(velocity.x) > 0.1) {
			direction = velocity.x < 0 ? "left" : "right";
		}

		// Render sprite at current position
		this.sprite.render(position, direction);

		// Detect movement state changes and emit events
		const isMoving = this.physics.isMoving(10.0);
		if (isMoving !== this.wasMoving) {
			if (isMoving) {
				this.eventTarget.dispatchEvent(
					new CustomEvent("start", {
						detail: { follower: this },
					}),
				);
			} else {
				this.eventTarget.dispatchEvent(
					new CustomEvent("stop", {
						detail: { follower: this },
					}),
				);
			}
			this.wasMoving = isMoving;
		}

		this.animationId = requestAnimationFrame(this.animate);
	};

	private getTargetPosition(): Position {
		const target = this.options.followTarget;
		return {
			x: target.x,
			y: target.y,
		};
	}
}

// Singleton mouse target instance
let mouseTargetInstance: MouseTarget | null = null;

export function follower(options?: FollowerOptions): IFollower {
	return new FollowerImpl(options);
}

export function mouseTarget(): MouseTarget {
	if (!mouseTargetInstance) {
		mouseTargetInstance = new MouseTarget();
	}
	return mouseTargetInstance;
}

export function offsetTarget(
	target: FollowTarget,
	offsetX: number = 0,
	offsetY: number = 0,
): OffsetTarget {
	return new OffsetTarget(target, offsetX, offsetY);
}

// Export all necessary types and presets
export {
	type AnimationConfig,
	type AnimationsConfig,
	type FollowerOptions,
	type FollowerStartEvent,
	type FollowerStopEvent,
	type FollowTarget,
	type PhysicsOptions,
	type Position,
	SPRITE_PRESET_STACK_CHAN,
	type SpriteOptions,
	stackChanPreset,
} from "./follower/types.js";

// Export the interface as type alias
export type Follower = IFollower;

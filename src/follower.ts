import {
	type PhysicsState,
	type Position,
	updatePhysics,
} from "./follower/physics";
import { createSprite, renderSpriteAt, type Sprite } from "./follower/sprite";
import {
	type AnimationsConfig,
	DEFAULT_ANIMATIONS,
	DEFAULTS,
	type FollowerOptions,
	type FollowerStartEvent,
	type FollowerStopEvent,
	type FollowTarget,
	type Follower as IFollower,
	MouseTarget,
	OffsetTarget,
} from "./follower/types";

interface FlattenedOptions {
	followTarget: FollowTarget;
	bindTo: HTMLElement;
	maxVelocity: number;
	maxAccel: number;
	stopWithin: number;
	brakingStartDistance: number;
	brakingStrength: number;
	minStopVelocity: number;
	animationInterval: number;
	spriteUrl: string;
	spriteFrames: number;
	spriteWidth: number;
	spriteHeight: number;
	transparentColor: string;
	animations: AnimationsConfig;
}

class FollowerImpl implements IFollower {
	private _x: number = 0;
	private _y: number = 0;

	get x(): number {
		return this._x;
	}

	set x(value: number) {
		this._x = value;
		if (this.physicsState) {
			this.physicsState.position.x = value;
		}
	}

	get y(): number {
		return this._y;
	}

	set y(value: number) {
		this._y = value;
		if (this.physicsState) {
			this.physicsState.position.y = value;
		}
	}

	private options: FlattenedOptions;
	private physicsState: PhysicsState;
	private sprite?: Sprite;
	private animationId?: number;
	private spriteIntervalId?: number;
	private lastTime: number = 0;
	private isRunning: boolean = false;
	// Animation properties
	private currentAnimation: string = "walk";
	private animationFrame: number = 0;
	// Event system
	private eventTarget = new EventTarget();
	private wasMoving: boolean = false;

	constructor(options: FollowerOptions = {}) {
		// Flatten nested options into the internal format
		this.options = {
			followTarget: options.target || mouseTarget(),
			bindTo: options.bindTo || document.body,
			// Physics options
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
			// Sprite options - merge with defaults
			spriteUrl: options.sprite?.url ?? DEFAULTS.sprite.url ?? "/ugo-mini.png",
			spriteFrames: options.sprite?.frames ?? DEFAULTS.sprite.frames ?? 2,
			spriteWidth: options.sprite?.width ?? DEFAULTS.sprite.width ?? 32,
			spriteHeight: options.sprite?.height ?? DEFAULTS.sprite.height ?? 64,
			transparentColor:
				options.sprite?.transparentColor ??
				DEFAULTS.sprite.transparentColor ??
				"rgb(0, 255, 0)",
			// Animation options
			animationInterval:
				options.sprite?.animation?.interval ??
				DEFAULTS.sprite.animation?.interval ??
				125,
			animations:
				options.sprite?.animations ??
				DEFAULTS.sprite.animations ??
				DEFAULT_ANIMATIONS,
		};

		// Initialize position to current target position
		const initialX = this.options.followTarget.x;
		const initialY = this.options.followTarget.y;

		this.physicsState = {
			position: { x: initialX, y: initialY },
			velocity: { x: 0, y: 0 },
			target: { x: initialX, y: initialY },
		};
		this._x = initialX;
		this._y = initialY;
	}

	async start(): Promise<void> {
		if (this.isRunning) return;

		const wrapper = document.createElement("div");
		wrapper.className = "mouse-follower";
		wrapper.style.position = "fixed";
		wrapper.style.left = "0";
		wrapper.style.top = "0";
		wrapper.style.pointerEvents = "none";
		wrapper.style.zIndex = "9999";
		this.options.bindTo.appendChild(wrapper);

		try {
			this.sprite = await createSprite(wrapper, {
				spriteUrl: this.options.spriteUrl,
				spriteWidth: this.options.spriteWidth,
				spriteHeight: this.options.spriteHeight,
				spriteFrames: this.options.spriteFrames,
				transparentColor: this.options.transparentColor,
			});

			this.lastTime = performance.now();
			this.isRunning = true;

			// Start walking animation
			this.playAnimation("walk");

			this.animate();
		} catch (error) {
			console.error("Failed to create sprite:", error);
			wrapper.remove();
			throw error;
		}
	}

	stop(): void {
		this.isRunning = false;
		if (this.animationId) {
			cancelAnimationFrame(this.animationId);
			this.animationId = undefined;
		}
		if (this.spriteIntervalId) {
			clearInterval(this.spriteIntervalId);
			this.spriteIntervalId = undefined;
		}
	}

	setTarget(target: FollowTarget): void {
		this.options.followTarget = target;
	}

	destroy(): void {
		this.stop();
		if (this.sprite) {
			const wrapper = this.sprite.element.parentElement;
			if (wrapper) {
				wrapper.remove();
			}
			this.sprite = undefined;
		}
	}

	playAnimation(name: string): void {
		const animation = this.options.animations[name];
		if (!animation || !this.sprite) return;

		// Stop current animation interval if it exists
		if (this.spriteIntervalId) {
			clearInterval(this.spriteIntervalId);
			this.spriteIntervalId = undefined;
		}

		// Set up new animation
		this.currentAnimation = name;
		this.animationFrame = 0;

		// Render first frame immediately
		this.renderAnimationFrame();

		// If it's a single frame animation or non-repeating animation that's done, don't set interval
		if (
			animation.numFrames === 1 ||
			(!animation.repeat && this.animationFrame >= animation.numFrames - 1)
		) {
			return;
		}

		// Set up interval for animation
		const interval = animation.interval || this.options.animationInterval;
		this.spriteIntervalId = window.setInterval(() => {
			if (!this.sprite) return;

			this.animationFrame++;

			if (this.animationFrame >= animation.numFrames) {
				if (animation.repeat) {
					this.animationFrame = 0;
				} else {
					// Animation finished, stop interval
					if (this.spriteIntervalId) {
						clearInterval(this.spriteIntervalId);
						this.spriteIntervalId = undefined;
					}
					// Keep showing last frame
					this.animationFrame = animation.numFrames - 1;
				}
			}

			this.renderAnimationFrame();
		}, interval);
	}

	pauseAnimation(): void {
		this.pauseSpriteAnimation();
	}

	private renderAnimationFrame(): void {
		if (!this.sprite) return;
		const animation = this.options.animations[this.currentAnimation];
		if (!animation) return;

		const x =
			animation.start[0] + this.animationFrame * this.options.spriteWidth;
		const y = animation.start[1];

		renderSpriteAt(this.sprite, x, y, this.sprite.facingDirection);
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

	private pauseSpriteAnimation(): void {
		if (this.spriteIntervalId) {
			clearInterval(this.spriteIntervalId);
			this.spriteIntervalId = undefined;
		}
	}

	private animate = (): void => {
		if (!this.isRunning) return;

		const currentTime = performance.now();
		const deltaTime = (currentTime - this.lastTime) / 1000;
		this.lastTime = currentTime;

		const target = this.getTargetPosition();
		this.physicsState.target = target;

		const config = {
			maxAccel: this.options.maxAccel,
			maxVelocity: this.options.maxVelocity,
			stopWithin: this.options.stopWithin,
			brakingStartDistance: this.options.brakingStartDistance,
			brakingStrength: this.options.brakingStrength,
			minStopVelocity: this.options.minStopVelocity,
		};

		this.physicsState = updatePhysics(this.physicsState, config, deltaTime);

		this._x = this.physicsState.position.x;
		this._y = this.physicsState.position.y;

		if (this.sprite) {
			// Update sprite direction based on velocity
			const velocityX = this.physicsState.velocity.x;
			if (Math.abs(velocityX) > 0.1) {
				// Only change direction if moving significantly
				const newDirection = velocityX < 0 ? "left" : "right";
				if (this.sprite.facingDirection !== newDirection) {
					this.sprite.facingDirection = newDirection;
					// Re-render current frame with new direction
					this.renderAnimationFrame();
				}
			}

			// Control sprite animation based on movement
			const currentSpeed = Math.sqrt(
				this.physicsState.velocity.x * this.physicsState.velocity.x +
					this.physicsState.velocity.y * this.physicsState.velocity.y,
			);

			// Detect movement state changes and emit events
			const isMoving = currentSpeed > 10.0; // Fixed threshold for movement detection
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

			const wrapper = this.sprite.element.parentElement as HTMLDivElement;
			const translateX = this.x - this.options.spriteWidth / 2;
			const translateY = this.y - this.options.spriteHeight / 2;
			wrapper.style.transform = `translate(${translateX}px, ${translateY}px)`;
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

// Export sprite presets and types
export {
	type FollowerStartEvent,
	type FollowerStopEvent,
	SPRITE_PRESET_STACK_CHAN,
} from "./follower/types";

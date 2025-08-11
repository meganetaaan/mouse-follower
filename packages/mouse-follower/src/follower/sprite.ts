import { Animation } from "./animation.js";
import { Canvas } from "./canvas.js";
import {
	createSpriteContainer,
	createWrapper,
	processSpriteImage,
} from "./sprite-utils.js";
import type { Position, SpriteConfig, SpriteDirection } from "./types.js";

/**
 * New Sprite class with separated concerns
 * Integrates Animation, Canvas, and DOM management
 */
export class Sprite {
	#animation: Animation;
	#canvas: Canvas;
	#wrapper?: HTMLDivElement;
	#container?: HTMLDivElement;
	#image?: HTMLImageElement;
	#config: SpriteConfig;
	#parent?: HTMLElement;
	#isInitialized: boolean = false;

	constructor(config: SpriteConfig, parent?: HTMLElement) {
		this.#config = config;
		this.#parent = parent;

		// Initialize Animation controller
		this.#animation = new Animation(
			config.animations,
			config.spriteWidth,
			config.spriteHeight,
			config.animationInterval,
		);

		// Initialize Canvas renderer
		this.#canvas = new Canvas(config.spriteWidth, config.spriteHeight);
	}

	/**
	 * Initialize sprite - load image and set up DOM
	 */
	async initialize(): Promise<void> {
		if (this.#isInitialized) {
			return;
		}

		// Load and process sprite image
		this.#image = await processSpriteImage(
			this.#config.spriteUrl,
			this.#config.transparentColor,
		);

		// Create DOM structure
		this.#wrapper = createWrapper();
		this.#container = createSpriteContainer(
			this.#config.spriteWidth,
			this.#config.spriteHeight,
		);

		// Build DOM hierarchy
		this.#container.appendChild(this.#canvas.getElement());
		this.#wrapper.appendChild(this.#container);

		// Attach to parent if provided
		if (this.#parent) {
			this.attach(this.#parent);
		}

		this.#isInitialized = true;
	}

	/**
	 * Attach sprite to DOM element
	 */
	attach(parent: HTMLElement): void {
		if (!this.#wrapper) {
			throw new Error("Sprite not initialized. Call initialize() first.");
		}

		// Remove from current parent if attached
		if (this.#wrapper.parentElement) {
			this.#wrapper.parentElement.removeChild(this.#wrapper);
		}

		// Attach to new parent
		parent.appendChild(this.#wrapper);
		this.#parent = parent;
	}

	/**
	 * Detach sprite from DOM
	 */
	detach(): void {
		if (this.#wrapper?.parentElement) {
			this.#wrapper.parentElement.removeChild(this.#wrapper);
		}
	}

	/**
	 * Destroy sprite and clean up resources
	 */
	destroy(): void {
		// Stop any running animation
		this.#animation.pause();

		// Remove from DOM
		this.detach();

		// Clear references
		this.#wrapper = undefined;
		this.#container = undefined;
		this.#image = undefined;
		this.#parent = undefined;
		this.#isInitialized = false;
	}

	/**
	 * Render sprite at given position with direction (ISprite compatible)
	 */
	render(position: Position, direction?: SpriteDirection): void {
		if (!this.#isInitialized || !this.#image) {
			return;
		}

		// Get current animation frame
		const frame = this.#animation.getCurrentFrame();

		// Render to canvas with default direction if not provided
		const renderDirection = direction || "right";
		this.#canvas.render(
			this.#image,
			frame,
			position.x,
			position.y,
			renderDirection,
		);
	}

	/**
	 * Alternative render method accepting x, y coordinates
	 */
	renderAt(x: number, y: number, direction: SpriteDirection): void {
		this.render({ x, y }, direction);
	}

	/**
	 * Play animation by name
	 */
	playAnimation(name: string): void {
		if (!this.#isInitialized) {
			return;
		}
		this.#animation.play(name);
	}

	/**
	 * Pause current animation
	 */
	pauseAnimation(): void {
		this.#animation.pause();
	}

	/**
	 * Check if animation is currently playing
	 */
	isAnimating(): boolean {
		return this.#animation.isPlaying;
	}

	/**
	 * Get current animation name
	 */
	getCurrentAnimation(): string {
		return this.#animation.name;
	}

	/**
	 * Get current frame index
	 */
	getCurrentFrameIndex(): number {
		return this.#animation.index;
	}
}

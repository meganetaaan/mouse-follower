import type { ISprite, Position, SpriteConfig, SpriteDirection } from "./types.js";

export interface Sprite {
	element: HTMLDivElement;
	canvas: HTMLCanvasElement;
	context: CanvasRenderingContext2D;
	currentFrame: number;
	frameCount: number;
	frameWidth: number;
	image: HTMLImageElement;
	facingDirection: SpriteDirection;
}

export function createSprite(
	parent: HTMLElement,
	config: SpriteConfig,
): Promise<Sprite> {
	return new Promise((resolve, reject) => {
		const element = document.createElement("div");
		const canvas = document.createElement("canvas");
		const context = canvas.getContext("2d");

		if (!context) {
			reject(new Error("Failed to get canvas 2D context"));
			return;
		}

		canvas.width = config.spriteWidth;
		canvas.height = config.spriteHeight;

		element.style.width = `${config.spriteWidth}px`;
		element.style.height = `${config.spriteHeight}px`;
		element.style.position = "absolute";
		element.style.pointerEvents = "none";

		element.appendChild(canvas);
		parent.appendChild(element);

		const image = new Image();
		image.crossOrigin = "anonymous";

		image.onload = () => {
			const sprite: Sprite = {
				element,
				canvas,
				context,
				currentFrame: 0,
				frameCount: config.spriteFrames || 2,
				frameWidth: config.spriteWidth,
				image,
				facingDirection: "right",
			};

			// Apply transparency and render first frame
			applyTransparencyAndRender(sprite, config.transparentColor);
			resolve(sprite);
		};

		image.onerror = () => {
			reject(new Error(`Failed to load sprite image: ${config.spriteUrl}`));
		};

		image.src = config.spriteUrl;
	});
}

function parseColor(colorString: string): [number, number, number] {
	// Handle rgb(r, g, b) format
	const rgbMatch = colorString.match(/rgb\((\d+),\s*(\d+),\s*(\d+)\)/);
	if (rgbMatch) {
		return [
			parseInt(rgbMatch[1]),
			parseInt(rgbMatch[2]),
			parseInt(rgbMatch[3]),
		];
	}

	// Handle hex format (#RRGGBB)
	const hexMatch = colorString.match(/^#([0-9a-fA-F]{6})$/);
	if (hexMatch) {
		const hex = hexMatch[1];
		return [
			parseInt(hex.slice(0, 2), 16),
			parseInt(hex.slice(2, 4), 16),
			parseInt(hex.slice(4, 6), 16),
		];
	}

	// Default to green screen if parsing fails
	return [0, 255, 0];
}

function applyTransparencyAndRender(
	sprite: Sprite,
	transparentColor?: string,
): void {
	if (!transparentColor) {
		// No transparency, just draw the current frame
		renderFrame(sprite);
		return;
	}

	const [targetR, targetG, targetB] = parseColor(transparentColor);

	// Create a temporary canvas to process the full image
	const tempCanvas = document.createElement("canvas");
	const tempContext = tempCanvas.getContext("2d");

	if (!tempContext) return;

	tempCanvas.width = sprite.image.width;
	tempCanvas.height = sprite.image.height;

	// Draw the full sprite sheet to temp canvas
	tempContext.drawImage(sprite.image, 0, 0);

	// Get image data and make transparent color transparent
	const imageData = tempContext.getImageData(
		0,
		0,
		tempCanvas.width,
		tempCanvas.height,
	);
	const data = imageData.data;

	for (let i = 0; i < data.length; i += 4) {
		const r = data[i];
		const g = data[i + 1];
		const b = data[i + 2];

		// Check if pixel matches the transparent color (with small tolerance)
		if (
			Math.abs(r - targetR) <= 5 &&
			Math.abs(g - targetG) <= 5 &&
			Math.abs(b - targetB) <= 5
		) {
			data[i + 3] = 0; // Set alpha to 0 (transparent)
		}
	}

	tempContext.putImageData(imageData, 0, 0);

	// Replace the original image with the processed one
	sprite.image.onload = () => renderFrame(sprite);
	sprite.image.src = tempCanvas.toDataURL();
}

function renderFrame(sprite: Sprite): void {
	const sourceX = sprite.currentFrame * sprite.frameWidth;
	renderSpriteAt(sprite, sourceX, 0);
}

export function renderSpriteAt(
	sprite: Sprite,
	sourceX: number,
	sourceY: number,
	direction?: SpriteDirection,
): void {
	sprite.context.clearRect(0, 0, sprite.canvas.width, sprite.canvas.height);

	const facingDirection = direction ?? sprite.facingDirection;

	// Save context state for transformation
	sprite.context.save();

	if (facingDirection === "left") {
		// Flip horizontally for left-facing sprite
		sprite.context.scale(-1, 1);
		sprite.context.drawImage(
			sprite.image,
			sourceX,
			sourceY,
			sprite.frameWidth,
			sprite.canvas.height,
			-sprite.frameWidth,
			0,
			sprite.frameWidth,
			sprite.canvas.height,
		);
	} else {
		// Normal right-facing sprite
		sprite.context.drawImage(
			sprite.image,
			sourceX,
			sourceY,
			sprite.frameWidth,
			sprite.canvas.height,
			0,
			0,
			sprite.frameWidth,
			sprite.canvas.height,
		);
	}

	// Restore context state
	sprite.context.restore();
}

export function updateSpriteFrame(sprite: Sprite, frame: number): void {
	sprite.currentFrame = frame % sprite.frameCount;
	renderFrame(sprite);
}

export function updateSpriteDirection(
	sprite: Sprite,
	direction: SpriteDirection,
): void {
	if (sprite.facingDirection !== direction) {
		sprite.facingDirection = direction;
		renderFrame(sprite);
	}
}

// Additional types for SpriteRenderer class (already imported above)

export class SpriteRenderer implements ISprite {
	private config: SpriteConfig;
	private parentElement: HTMLElement;
	private sprite?: Sprite;
	private currentAnimation?: string;
	private animationFrame: number = 0;
	private animationIntervalId?: number;
	private isInitialized: boolean = false;

	constructor(config: SpriteConfig, parentElement: HTMLElement) {
		if (!parentElement) {
			throw new Error("Parent element is required");
		}
		this.config = config;
		this.parentElement = parentElement;
	}

	async initialize(): Promise<void> {
		if (this.isInitialized) {
			return;
		}

		// Create wrapper element
		const wrapper = document.createElement("div");
		wrapper.className = "mouse-follower";
		wrapper.style.position = "fixed";
		wrapper.style.left = "0";
		wrapper.style.top = "0";
		wrapper.style.pointerEvents = "none";
		wrapper.style.zIndex = "9999";
		this.parentElement.appendChild(wrapper);

		try {
			this.sprite = await createSprite(wrapper, {
				spriteUrl: this.config.spriteUrl,
				spriteWidth: this.config.spriteWidth,
				spriteHeight: this.config.spriteHeight,
				spriteFrames: this.config.spriteFrames,
				transparentColor: this.config.transparentColor,
				animationInterval: this.config.animationInterval,
				animations: this.config.animations,
			});

			this.isInitialized = true;
		} catch (error) {
			wrapper.remove();
			throw error;
		}
	}

	render(position: Position, direction?: SpriteDirection): void {
		if (!this.isInitialized || !this.sprite) {
			return;
		}

		// Update sprite direction if provided
		if (direction && this.sprite.facingDirection !== direction) {
			this.sprite.facingDirection = direction;
		}

		// Render current frame
		this.renderCurrentFrame();

		// Position the wrapper
		const wrapper = this.sprite.element.parentElement as HTMLDivElement;
		const translateX = position.x - this.config.spriteWidth / 2;
		const translateY = position.y - this.config.spriteHeight / 2;
		wrapper.style.transform = `translate(${translateX}px, ${translateY}px)`;
	}

	playAnimation(name: string): void {
		if (!this.isInitialized || !this.sprite) {
			return;
		}

		const animation = this.config.animations[name];
		if (!animation) {
			return;
		}

		// Stop current animation if running
		this.pauseAnimation();

		// Set up new animation
		this.currentAnimation = name;
		this.animationFrame = 0;

		// Render first frame immediately
		this.renderCurrentFrame();

		// If it's a single frame animation or non-repeating animation, don't start interval
		if (animation.numFrames === 1) {
			return;
		}

		// Set up interval for animation
		const interval = animation.interval || this.config.animationInterval;
		this.animationIntervalId = window.setInterval(() => {
			if (!this.sprite || !this.currentAnimation) {
				return;
			}

			const currentAnimationConfig =
				this.config.animations[this.currentAnimation];
			if (!currentAnimationConfig) {
				return;
			}

			this.animationFrame++;

			if (this.animationFrame >= currentAnimationConfig.numFrames) {
				if (currentAnimationConfig.repeat) {
					this.animationFrame = 0;
				} else {
					// Animation finished, stop interval
					this.pauseAnimation();
					// Keep showing last frame
					this.animationFrame = currentAnimationConfig.numFrames - 1;
					return;
				}
			}

			this.renderCurrentFrame();
		}, interval);
	}

	pauseAnimation(): void {
		if (this.animationIntervalId) {
			clearInterval(this.animationIntervalId);
			this.animationIntervalId = undefined;
		}
	}

	destroy(): void {
		this.pauseAnimation();

		if (this.sprite) {
			const wrapper = this.sprite.element.parentElement;
			if (wrapper) {
				wrapper.remove();
			}
			this.sprite = undefined;
		}

		this.isInitialized = false;
	}

	isAnimating(): boolean {
		return this.animationIntervalId !== undefined;
	}

	private renderCurrentFrame(): void {
		if (!this.sprite || !this.currentAnimation) {
			return;
		}

		const animation = this.config.animations[this.currentAnimation];
		if (!animation) {
			return;
		}

		const x =
			animation.start[0] + this.animationFrame * this.config.spriteWidth;
		const y = animation.start[1];

		renderSpriteAt(this.sprite, x, y, this.sprite.facingDirection);
	}
}

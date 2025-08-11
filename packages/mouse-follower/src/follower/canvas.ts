import type { Frame } from "./animation.js";
import type { SpriteDirection } from "./types.js";

export class Canvas {
	#canvas: HTMLCanvasElement;
	#context: CanvasRenderingContext2D;
	#width: number;
	#height: number;

	constructor(width: number, height: number) {
		this.#width = width;
		this.#height = height;

		this.#canvas = document.createElement("canvas");
		this.#canvas.width = width;
		this.#canvas.height = height;

		const context = this.#canvas.getContext("2d");
		if (!context) {
			throw new Error("Failed to get 2D context");
		}
		this.#context = context;
	}

	render(
		sprite: HTMLImageElement,
		frame: Frame,
		x: number,
		y: number,
		direction: SpriteDirection,
	): void {
		// Clear canvas
		this.clear();

		// Save context state
		this.#context.save();

		// Apply transformations for direction
		if (direction === "left") {
			// Flip horizontally
			this.#context.scale(-1, 1);
			// Draw flipped sprite
			this.#context.drawImage(
				sprite,
				frame.sourceX,
				frame.sourceY,
				frame.width,
				frame.height,
				-frame.width, // Negative x to compensate for flip
				0,
				frame.width,
				frame.height,
			);
		} else {
			// Draw normal sprite
			this.#context.drawImage(
				sprite,
				frame.sourceX,
				frame.sourceY,
				frame.width,
				frame.height,
				0,
				0,
				frame.width,
				frame.height,
			);
		}

		// Restore context state
		this.#context.restore();

		// Update canvas position in DOM
		const parent = this.#canvas.parentElement;
		if (parent?.parentElement) {
			const wrapper = parent.parentElement as HTMLDivElement;
			const translateX = x - this.#width / 2;
			const translateY = y - this.#height / 2;
			wrapper.style.transform = `translate(${translateX}px, ${translateY}px)`;
		}
	}

	clear(): void {
		this.#context.clearRect(0, 0, this.#width, this.#height);
	}

	getElement(): HTMLCanvasElement {
		return this.#canvas;
	}
}

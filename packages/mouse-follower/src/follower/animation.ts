import type { AnimationsConfig } from "./types.js";

export interface Frame {
	sourceX: number;
	sourceY: number;
	width: number;
	height: number;
}

export class Animation {
	name: string = "";
	index: number = 0;
	isPlaying: boolean = false;
	#timer?: number;
	#config: AnimationsConfig;
	#frameInterval: number;
	#frameWidth: number;
	#frameHeight: number;

	constructor(
		config: AnimationsConfig,
		frameWidth: number,
		frameHeight: number,
		defaultInterval: number = 125,
	) {
		this.#config = config;
		this.#frameWidth = frameWidth;
		this.#frameHeight = frameHeight;
		this.#frameInterval = defaultInterval;
	}

	play(name: string): void {
		const animation = this.#config[name];
		if (!animation) {
			console.warn(`Animation "${name}" not found`);
			return;
		}

		// Stop current animation if playing
		if (this.isPlaying) {
			this.pause();
		}

		// Set up new animation
		this.name = name;
		this.index = 0;
		this.isPlaying = true;

		// Single frame animations don't need interval and are not considered "playing"
		if (animation.numFrames === 1) {
			this.isPlaying = false;
			return;
		}

		// Start animation interval
		const interval = animation.interval || this.#frameInterval;
		this.#timer = window.setInterval(() => {
			this.#updateFrame();
		}, interval);
	}

	pause(): void {
		if (this.#timer !== undefined) {
			clearInterval(this.#timer);
			this.#timer = undefined;
		}
		this.isPlaying = false;
	}

	getCurrentFrame(): Frame {
		const animation = this.#config[this.name];
		if (!animation) {
			// Return default frame if no animation is set
			return {
				sourceX: 0,
				sourceY: 0,
				width: this.#frameWidth,
				height: this.#frameHeight,
			};
		}

		const x = animation.start[0] + this.index * this.#frameWidth;
		const y = animation.start[1];

		return {
			sourceX: x,
			sourceY: y,
			width: this.#frameWidth,
			height: this.#frameHeight,
		};
	}

	#updateFrame(): void {
		const animation = this.#config[this.name];
		if (!animation) {
			this.pause();
			return;
		}

		this.index++;

		if (this.index >= animation.numFrames) {
			if (animation.repeat) {
				this.index = 0;
			} else {
				// Animation finished
				this.pause();
				this.index = animation.numFrames - 1; // Keep showing last frame
			}
		}
	}
}

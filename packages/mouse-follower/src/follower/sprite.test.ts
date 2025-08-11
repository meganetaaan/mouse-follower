import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
// Sprite class tests
import { Sprite } from "./sprite";
import type { AnimationsConfig, Position, SpriteConfig } from "./types";

// Mock HTML5 Canvas API

global.HTMLCanvasElement.prototype.getContext = vi.fn((contextId: string) => {
	if (contextId === "2d") {
		const mockContext = {
			drawImage: vi.fn(),
			clearRect: vi.fn(),
			getImageData: vi.fn(() => ({
				data: new Uint8ClampedArray(4),
			})),
			putImageData: vi.fn(),
			save: vi.fn(),
			restore: vi.fn(),
			scale: vi.fn(),
		};
		return mockContext;
	}
	return null;
	// biome-ignore lint/suspicious/noExplicitAny: mock
}) as any;

// Mock HTMLCanvasElement.prototype.toDataURL
global.HTMLCanvasElement.prototype.toDataURL = vi.fn(() => {
	// Return a simple 1x1 transparent PNG data URL
	return "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAAC0lEQVQIHWNgAAIAAAUAAY27m/MAAAAASUVORK5CYII=";
});

global.Image = class MockImage {
	onload: (() => void) | null = null;
	onerror: (() => void) | null = null;
	crossOrigin: string | null = null;
	private _src: string = "";

	get src(): string {
		return this._src;
	}

	set src(value: string) {
		this._src = value;
		// Simulate successful image load
		queueMicrotask(() => {
			if (this.onload) {
				this.onload();
			}
		});
	}

	get width(): number {
		return 64; // Mock width
	}

	get height(): number {
		return 32; // Mock height
	}
	// biome-ignore lint/suspicious/noExplicitAny: mock
} as any;

describe("Sprite class", () => {
	let parentElement: HTMLDivElement;

	const defaultAnimations: AnimationsConfig = {
		walk: {
			start: [0, 0],
			numFrames: 2,
			repeat: true,
			interval: 100,
		},
		action: {
			start: [64, 0],
			numFrames: 1,
			repeat: false,
			interval: 200,
		},
	};

	const defaultConfig: SpriteConfig = {
		spriteUrl: "data:image/png;base64,test",
		spriteWidth: 32,
		spriteHeight: 32,
		spriteFrames: 2,
		transparentColor: "rgb(0, 255, 0)",
		animationInterval: 125,
		animations: defaultAnimations,
	};

	beforeEach(() => {
		parentElement = document.createElement("div");
		document.body.appendChild(parentElement);
	});

	afterEach(() => {
		parentElement.remove();
		vi.clearAllTimers();
	});

	describe("constructor", () => {
		it("should initialize sprite renderer with config", async () => {
			const sprite = new Sprite(defaultConfig, parentElement);
			await sprite.initialize();

			expect(parentElement.children.length).toBe(1);
			const wrapper = parentElement.children[0]; // This is the wrapper div we created
			expect(wrapper.children.length).toBe(1);
			const spriteElement = wrapper.children[0]; // This is the sprite element div
			expect(spriteElement.children.length).toBe(1);
			expect(spriteElement.children[0].tagName).toBe("CANVAS"); // This is the canvas
		});

		it("should accept undefined parent element", () => {
			expect(() => {
				new Sprite(defaultConfig, undefined);
			}).not.toThrow();
		});
	});

	describe("initialize", () => {
		it("should create DOM elements and load sprite", async () => {
			const sprite = new Sprite(defaultConfig, parentElement);

			await sprite.initialize();

			const wrapper = parentElement.children[0] as HTMLDivElement;
			expect(wrapper.style.position).toBe("fixed");
			expect(wrapper.className).toBe("mouse-follower");

			const spriteElement = wrapper.children[0] as HTMLDivElement;
			expect(spriteElement.style.position).toBe("absolute");

			const canvas = spriteElement.children[0] as HTMLCanvasElement;
			expect(canvas.width).toBe(32);
			expect(canvas.height).toBe(32);
		});

		it("should reject on sprite load error", async () => {
			// Mock failing image
			class FailingMockImage {
				onload: (() => void) | null = null;
				onerror: (() => void) | null = null;
				crossOrigin = "";
				width = 64;
				height = 32;

				constructor() {
					queueMicrotask(() => {
						if (this.onerror) this.onerror();
					});
				}

				set src(_: string) {
					queueMicrotask(() => {
						if (this.onerror) this.onerror();
					});
				}
			}

			const originalImage = global.Image;
			global.Image = FailingMockImage as typeof Image;

			const sprite = new Sprite(defaultConfig, parentElement);

			await expect(sprite.initialize()).rejects.toThrow();

			global.Image = originalImage;
		});
	});

	describe("render", () => {
		it("should render sprite at given position", async () => {
			const sprite = new Sprite(defaultConfig, parentElement);
			await sprite.initialize();

			const position: Position = { x: 100, y: 50 };
			sprite.render(position);

			const wrapper = parentElement.children[0] as HTMLDivElement;
			expect(wrapper.style.transform).toBe("translate(84px, 34px)");
		});

		it("should render sprite with direction", async () => {
			const sprite = new Sprite(defaultConfig, parentElement);
			await sprite.initialize();

			const position: Position = { x: 100, y: 50 };
			sprite.render(position, "left");

			// Should have called scale(-1, 1) for left facing
			// This is tested implicitly through the sprite rendering
			const wrapper = parentElement.children[0] as HTMLDivElement;
			expect(wrapper.style.transform).toBe("translate(84px, 34px)");
		});

		it("should do nothing if not initialized", () => {
			const sprite = new Sprite(defaultConfig, parentElement);
			const position: Position = { x: 100, y: 50 };

			expect(() => sprite.render(position)).not.toThrow();
		});
	});

	describe("playAnimation", () => {
		vi.useFakeTimers();

		it("should start playing animation", async () => {
			const sprite = new Sprite(defaultConfig, parentElement);
			await sprite.initialize();

			sprite.playAnimation("walk");

			expect(sprite.isAnimating()).toBe(true);
		});

		it("should handle non-existent animation", async () => {
			const sprite = new Sprite(defaultConfig, parentElement);
			await sprite.initialize();

			sprite.playAnimation("invalid");

			expect(sprite.isAnimating()).toBe(false);
		});

		it("should stop previous animation when starting new one", async () => {
			const sprite = new Sprite(defaultConfig, parentElement);
			await sprite.initialize();

			sprite.playAnimation("walk");
			expect(sprite.isAnimating()).toBe(true);

			sprite.playAnimation("action"); // Single-frame animation
			expect(sprite.isAnimating()).toBe(false); // Should not be animating for single-frame
		});

		it("should handle single-frame animations", async () => {
			const sprite = new Sprite(defaultConfig, parentElement);
			await sprite.initialize();

			sprite.playAnimation("action"); // Single frame animation

			expect(sprite.isAnimating()).toBe(false);
		});

		it("should handle repeating animations", async () => {
			const sprite = new Sprite(defaultConfig, parentElement);
			await sprite.initialize();

			sprite.playAnimation("walk");

			// Advance time beyond one animation cycle
			vi.advanceTimersByTime(300);

			expect(sprite.isAnimating()).toBe(true);
		});

		it("should do nothing if not initialized", () => {
			const sprite = new Sprite(defaultConfig, parentElement);

			expect(() => sprite.playAnimation("walk")).not.toThrow();
			expect(sprite.isAnimating()).toBe(false);
		});
	});

	describe("pauseAnimation", () => {
		vi.useFakeTimers();

		it("should pause current animation", async () => {
			const sprite = new Sprite(defaultConfig, parentElement);
			await sprite.initialize();

			sprite.playAnimation("walk");
			expect(sprite.isAnimating()).toBe(true);

			sprite.pauseAnimation();
			expect(sprite.isAnimating()).toBe(false);
		});

		it("should do nothing if no animation is playing", async () => {
			const sprite = new Sprite(defaultConfig, parentElement);
			await sprite.initialize();

			expect(() => sprite.pauseAnimation()).not.toThrow();
			expect(sprite.isAnimating()).toBe(false);
		});
	});

	describe("destroy", () => {
		it("should clean up DOM elements", async () => {
			const sprite = new Sprite(defaultConfig, parentElement);
			await sprite.initialize();

			expect(parentElement.children.length).toBe(1);

			sprite.destroy();

			expect(parentElement.children.length).toBe(0);
		});

		it("should stop any running animations", async () => {
			const sprite = new Sprite(defaultConfig, parentElement);
			await sprite.initialize();

			sprite.playAnimation("walk");
			expect(sprite.isAnimating()).toBe(true);

			sprite.destroy();

			expect(sprite.isAnimating()).toBe(false);
		});

		it("should be safe to call multiple times", async () => {
			const sprite = new Sprite(defaultConfig, parentElement);
			await sprite.initialize();

			sprite.destroy();
			expect(() => sprite.destroy()).not.toThrow();
		});

		it("should be safe to call before initialization", () => {
			const sprite = new Sprite(defaultConfig, parentElement);

			expect(() => sprite.destroy()).not.toThrow();
		});
	});

	describe("isAnimating", () => {
		it("should return false initially", () => {
			const sprite = new Sprite(defaultConfig, parentElement);

			expect(sprite.isAnimating()).toBe(false);
		});

		it("should return true when animation is playing", async () => {
			const sprite = new Sprite(defaultConfig, parentElement);
			await sprite.initialize();

			sprite.playAnimation("walk");

			expect(sprite.isAnimating()).toBe(true);
		});

		it("should return false when animation is paused", async () => {
			const sprite = new Sprite(defaultConfig, parentElement);
			await sprite.initialize();

			sprite.playAnimation("walk");
			sprite.pauseAnimation();

			expect(sprite.isAnimating()).toBe(false);
		});
	});
});

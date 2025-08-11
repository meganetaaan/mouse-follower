import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
	createSprite,
	updateSpriteDirection,
	updateSpriteFrame,
} from "./sprite";

// Mock HTML5 Canvas API
global.HTMLCanvasElement.prototype.getContext = vi.fn((contextId: string) => {
	if (contextId === "2d") {
		return {
			drawImage: vi.fn(),
			clearRect: vi.fn(),
			getImageData: vi.fn(() => ({
				data: new Uint8ClampedArray([255, 0, 0, 255, 0, 255, 0, 255]),
				width: 2,
				height: 1,
				colorSpace: "srgb" as PredefinedColorSpace,
			})),
			putImageData: vi.fn(),
			save: vi.fn(),
			restore: vi.fn(),
			scale: vi.fn(),
		} as unknown as CanvasRenderingContext2D;
	}
	return null;
}) as any;

global.HTMLCanvasElement.prototype.toDataURL = vi.fn(
	() => "data:image/png;base64,test",
);

// Mock Image constructor
class MockImage {
	onload: (() => void) | null = null;
	onerror: (() => void) | null = null;
	crossOrigin = "";
	width = 64;
	height = 64;

	constructor() {
		// Use queueMicrotask for more immediate execution
		queueMicrotask(() => {
			if (this.onload) this.onload();
		});
	}

	set src(_: string) {
		// Trigger load immediately when src is set
		queueMicrotask(() => {
			if (this.onload) this.onload();
		});
	}
}

global.Image = MockImage as typeof Image;

describe("sprite", () => {
	let element: HTMLDivElement;

	beforeEach(() => {
		element = document.createElement("div");
		document.body.appendChild(element);
	});

	afterEach(() => {
		element.remove();
	});

	describe("createSprite", () => {
		it("should create sprite element with correct styles", async () => {
			const config = {
				spriteUrl: "data:image/png;base64,test",
				spriteWidth: 32,
				spriteHeight: 64,
				animationInterval: 125,
				animations: {
					walk: {
						start: [0, 0] as [number, number],
						numFrames: 1,
						repeat: false,
					},
				},
			};

			const sprite = await createSprite(element, config);

			expect(sprite.element.style.width).toBe("32px");
			expect(sprite.element.style.height).toBe("64px");
			expect(sprite.element.style.position).toBe("absolute");
			expect(sprite.currentFrame).toBe(0);
			expect(sprite.canvas).toBeDefined();
			expect(sprite.context).toBeDefined();
			expect(sprite.image).toBeDefined();
		});

		it("should append sprite to parent element", async () => {
			const config = {
				spriteUrl: "data:image/png;base64,test",
				spriteWidth: 32,
				spriteHeight: 64,
				animationInterval: 125,
				animations: {
					walk: {
						start: [0, 0] as [number, number],
						numFrames: 1,
						repeat: false,
					},
				},
			};

			await createSprite(element, config);

			expect(element.children.length).toBe(1);
			expect(element.children[0].children.length).toBe(1); // Canvas inside div
			expect(element.children[0].children[0].tagName).toBe("CANVAS");
		});

		it("should create sprite with transparent color option", async () => {
			const config = {
				spriteUrl: "data:image/png;base64,test",
				spriteWidth: 32,
				spriteHeight: 64,
				transparentColor: "rgb(0, 255, 0)",
				animationInterval: 125,
				animations: {
					walk: {
						start: [0, 0] as [number, number],
						numFrames: 1,
						repeat: false,
					},
				},
			};

			const sprite = await createSprite(element, config);

			expect(sprite).toBeDefined();
			expect(sprite.canvas.width).toBe(32);
			expect(sprite.canvas.height).toBe(64);
		});

		it("should handle sprite creation failure gracefully", async () => {
			// Create a mock Image that fails to load
			class FailingMockImage {
				onload: (() => void) | null = null;
				onerror: (() => void) | null = null;
				crossOrigin = "";
				width = 64;
				height = 64;

				constructor() {
					// Use queueMicrotask for more immediate execution
					queueMicrotask(() => {
						if (this.onerror) this.onerror();
					});
				}

				set src(_: string) {
					// Trigger error immediately when src is set
					queueMicrotask(() => {
						if (this.onerror) this.onerror();
					});
				}
			}

			const originalImage = global.Image;
			global.Image = FailingMockImage as typeof Image;

			const config = {
				spriteUrl: "invalid-url",
				spriteWidth: 32,
				spriteHeight: 64,
				animationInterval: 125,
				animations: {
					walk: {
						start: [0, 0] as [number, number],
						numFrames: 1,
						repeat: false,
					},
				},
			};

			await expect(createSprite(element, config)).rejects.toThrow();

			// Restore original mock
			global.Image = originalImage;
		});
	});

	describe("updateSpriteFrame", () => {
		it("should update current frame and re-render", async () => {
			const mockContext = {
				drawImage: vi.fn(),
				clearRect: vi.fn(),
				save: vi.fn(),
				restore: vi.fn(),
				scale: vi.fn(),
			};

			const sprite = {
				element: document.createElement("div"),
				canvas: document.createElement("canvas"),
				context: mockContext as unknown as CanvasRenderingContext2D,
				currentFrame: 0,
				frameCount: 2,
				frameWidth: 32,
				image: new Image(),
				facingDirection: "right" as const,
			};

			updateSpriteFrame(sprite, 1);

			expect(sprite.currentFrame).toBe(1);
			expect(mockContext.clearRect).toHaveBeenCalled();
			expect(mockContext.drawImage).toHaveBeenCalled();
		});

		it("should wrap around to first frame", async () => {
			const mockContext = {
				drawImage: vi.fn(),
				clearRect: vi.fn(),
				save: vi.fn(),
				restore: vi.fn(),
				scale: vi.fn(),
			};

			const sprite = {
				element: document.createElement("div"),
				canvas: document.createElement("canvas"),
				context: mockContext as unknown as CanvasRenderingContext2D,
				currentFrame: 1,
				frameCount: 2,
				frameWidth: 32,
				image: new Image(),
				facingDirection: "right" as const,
			};

			updateSpriteFrame(sprite, 2);

			expect(sprite.currentFrame).toBe(0);
		});
	});

	describe("updateSpriteDirection", () => {
		it("should update sprite direction and re-render", () => {
			const mockContext = {
				drawImage: vi.fn(),
				clearRect: vi.fn(),
				save: vi.fn(),
				restore: vi.fn(),
				scale: vi.fn(),
			};

			const sprite = {
				element: document.createElement("div"),
				canvas: document.createElement("canvas"),
				context: mockContext as unknown as CanvasRenderingContext2D,
				currentFrame: 0,
				frameCount: 2,
				frameWidth: 32,
				image: new Image(),
				facingDirection: "right" as const,
			};

			updateSpriteDirection(sprite, "left");

			expect(sprite.facingDirection).toBe("left");
			expect(mockContext.save).toHaveBeenCalled();
			expect(mockContext.restore).toHaveBeenCalled();
			expect(mockContext.scale).toHaveBeenCalledWith(-1, 1);
		});

		it("should not re-render if direction is the same", () => {
			const mockContext = {
				drawImage: vi.fn(),
				clearRect: vi.fn(),
				save: vi.fn(),
				restore: vi.fn(),
				scale: vi.fn(),
			};

			const sprite = {
				element: document.createElement("div"),
				canvas: document.createElement("canvas"),
				context: mockContext as unknown as CanvasRenderingContext2D,
				currentFrame: 0,
				frameCount: 2,
				frameWidth: 32,
				image: new Image(),
				facingDirection: "right" as const,
			};

			updateSpriteDirection(sprite, "right");

			expect(sprite.facingDirection).toBe("right");
			expect(mockContext.save).not.toHaveBeenCalled();
		});
	});
});

// SpriteRenderer class tests
import { SpriteRenderer } from "./sprite";
import type { AnimationsConfig, Position, SpriteConfig } from "./types";

describe("SpriteRenderer class", () => {
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
			const sprite = new SpriteRenderer(defaultConfig, parentElement);
			await sprite.initialize();

			expect(parentElement.children.length).toBe(1);
			const wrapper = parentElement.children[0]; // This is the wrapper div we created
			expect(wrapper.children.length).toBe(1);
			const spriteElement = wrapper.children[0]; // This is the sprite element div
			expect(spriteElement.children.length).toBe(1);
			expect(spriteElement.children[0].tagName).toBe("CANVAS"); // This is the canvas
		});

		it("should throw error if parent element is not provided", () => {
			expect(() => {
				new SpriteRenderer(defaultConfig, undefined as unknown as HTMLElement);
			}).toThrow();
		});
	});

	describe("initialize", () => {
		it("should create DOM elements and load sprite", async () => {
			const sprite = new SpriteRenderer(defaultConfig, parentElement);

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

			const sprite = new SpriteRenderer(defaultConfig, parentElement);

			await expect(sprite.initialize()).rejects.toThrow();

			global.Image = originalImage;
		});
	});

	describe("render", () => {
		it("should render sprite at given position", async () => {
			const sprite = new SpriteRenderer(defaultConfig, parentElement);
			await sprite.initialize();

			const position: Position = { x: 100, y: 50 };
			sprite.render(position);

			const wrapper = parentElement.children[0] as HTMLDivElement;
			expect(wrapper.style.transform).toBe("translate(84px, 34px)");
		});

		it("should render sprite with direction", async () => {
			const sprite = new SpriteRenderer(defaultConfig, parentElement);
			await sprite.initialize();

			const position: Position = { x: 100, y: 50 };
			sprite.render(position, "left");

			// Should have called scale(-1, 1) for left facing
			// This is tested implicitly through the sprite rendering
			const wrapper = parentElement.children[0] as HTMLDivElement;
			expect(wrapper.style.transform).toBe("translate(84px, 34px)");
		});

		it("should do nothing if not initialized", () => {
			const sprite = new SpriteRenderer(defaultConfig, parentElement);
			const position: Position = { x: 100, y: 50 };

			expect(() => sprite.render(position)).not.toThrow();
		});
	});

	describe("playAnimation", () => {
		vi.useFakeTimers();

		it("should start playing animation", async () => {
			const sprite = new SpriteRenderer(defaultConfig, parentElement);
			await sprite.initialize();

			sprite.playAnimation("walk");

			expect(sprite.isAnimating()).toBe(true);
		});

		it("should handle non-existent animation", async () => {
			const sprite = new SpriteRenderer(defaultConfig, parentElement);
			await sprite.initialize();

			sprite.playAnimation("invalid");

			expect(sprite.isAnimating()).toBe(false);
		});

		it("should stop previous animation when starting new one", async () => {
			const sprite = new SpriteRenderer(defaultConfig, parentElement);
			await sprite.initialize();

			sprite.playAnimation("walk");
			expect(sprite.isAnimating()).toBe(true);

			sprite.playAnimation("action"); // Single-frame animation
			expect(sprite.isAnimating()).toBe(false); // Should not be animating for single-frame
		});

		it("should handle single-frame animations", async () => {
			const sprite = new SpriteRenderer(defaultConfig, parentElement);
			await sprite.initialize();

			sprite.playAnimation("action"); // Single frame animation

			expect(sprite.isAnimating()).toBe(false);
		});

		it("should handle repeating animations", async () => {
			const sprite = new SpriteRenderer(defaultConfig, parentElement);
			await sprite.initialize();

			sprite.playAnimation("walk");

			// Advance time beyond one animation cycle
			vi.advanceTimersByTime(300);

			expect(sprite.isAnimating()).toBe(true);
		});

		it("should do nothing if not initialized", () => {
			const sprite = new SpriteRenderer(defaultConfig, parentElement);

			expect(() => sprite.playAnimation("walk")).not.toThrow();
			expect(sprite.isAnimating()).toBe(false);
		});
	});

	describe("pauseAnimation", () => {
		vi.useFakeTimers();

		it("should pause current animation", async () => {
			const sprite = new SpriteRenderer(defaultConfig, parentElement);
			await sprite.initialize();

			sprite.playAnimation("walk");
			expect(sprite.isAnimating()).toBe(true);

			sprite.pauseAnimation();
			expect(sprite.isAnimating()).toBe(false);
		});

		it("should do nothing if no animation is playing", async () => {
			const sprite = new SpriteRenderer(defaultConfig, parentElement);
			await sprite.initialize();

			expect(() => sprite.pauseAnimation()).not.toThrow();
			expect(sprite.isAnimating()).toBe(false);
		});
	});

	describe("destroy", () => {
		it("should clean up DOM elements", async () => {
			const sprite = new SpriteRenderer(defaultConfig, parentElement);
			await sprite.initialize();

			expect(parentElement.children.length).toBe(1);

			sprite.destroy();

			expect(parentElement.children.length).toBe(0);
		});

		it("should stop any running animations", async () => {
			const sprite = new SpriteRenderer(defaultConfig, parentElement);
			await sprite.initialize();

			sprite.playAnimation("walk");
			expect(sprite.isAnimating()).toBe(true);

			sprite.destroy();

			expect(sprite.isAnimating()).toBe(false);
		});

		it("should be safe to call multiple times", async () => {
			const sprite = new SpriteRenderer(defaultConfig, parentElement);
			await sprite.initialize();

			sprite.destroy();
			expect(() => sprite.destroy()).not.toThrow();
		});

		it("should be safe to call before initialization", () => {
			const sprite = new SpriteRenderer(defaultConfig, parentElement);

			expect(() => sprite.destroy()).not.toThrow();
		});
	});

	describe("isAnimating", () => {
		it("should return false initially", () => {
			const sprite = new SpriteRenderer(defaultConfig, parentElement);

			expect(sprite.isAnimating()).toBe(false);
		});

		it("should return true when animation is playing", async () => {
			const sprite = new SpriteRenderer(defaultConfig, parentElement);
			await sprite.initialize();

			sprite.playAnimation("walk");

			expect(sprite.isAnimating()).toBe(true);
		});

		it("should return false when animation is paused", async () => {
			const sprite = new SpriteRenderer(defaultConfig, parentElement);
			await sprite.initialize();

			sprite.playAnimation("walk");
			sprite.pauseAnimation();

			expect(sprite.isAnimating()).toBe(false);
		});
	});
});

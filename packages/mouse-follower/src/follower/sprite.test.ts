import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
	createSprite,
	updateSpriteDirection,
	updateSpriteFrame,
} from "./sprite";

// Mock HTML5 Canvas API
global.HTMLCanvasElement.prototype.getContext = vi.fn(() => ({
	drawImage: vi.fn(),
	clearRect: vi.fn(),
	getImageData: vi.fn(() => ({
		data: new Uint8ClampedArray([255, 0, 0, 255, 0, 255, 0, 255]),
		width: 2,
		height: 1,
	})),
	putImageData: vi.fn(),
	save: vi.fn(),
	restore: vi.fn(),
	scale: vi.fn(),
}));

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
		// Simulate async loading
		setTimeout(() => {
			if (this.onload) this.onload();
		}, 0);
	}

	set src(_: string) {
		// Trigger load after src is set
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
					// Simulate async error
					setTimeout(() => {
						if (this.onerror) this.onerror();
					}, 0);
				}

				set src(_: string) {
					// Trigger error after src is set
				}
			}

			const originalImage = global.Image;
			global.Image = FailingMockImage as typeof Image;

			const config = {
				spriteUrl: "invalid-url",
				spriteWidth: 32,
				spriteHeight: 64,
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
				context: mockContext as CanvasRenderingContext2D,
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
				context: mockContext as CanvasRenderingContext2D,
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
				context: mockContext as CanvasRenderingContext2D,
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
				context: mockContext as CanvasRenderingContext2D,
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

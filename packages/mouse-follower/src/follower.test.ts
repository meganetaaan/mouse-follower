import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { follower } from "./follower";
import { MouseTarget, OffsetTarget } from "./follower/types";

// Type augmentation for global in test environment
declare global {
	var HTMLCanvasElement: typeof globalThis.HTMLCanvasElement;
	var Image: typeof globalThis.Image;
}

// Mock HTML5 Canvas API
global.HTMLCanvasElement.prototype.getContext = vi.fn(() => ({
	drawImage: vi.fn(),
	clearRect: vi.fn(),
	save: vi.fn(),
	restore: vi.fn(),
	scale: vi.fn(),
	getImageData: vi.fn(() => ({
		data: new Uint8ClampedArray([255, 0, 0, 255, 0, 255, 0, 255]),
		width: 2,
		height: 1,
	})),
	putImageData: vi.fn(),
}));

global.HTMLCanvasElement.prototype.toDataURL = vi.fn(
	() => "data:image/png;base64,test",
);

// Mock Image loading
const mockImage = {
	onload: null as (() => void) | null,
	onerror: null as (() => void) | null,
	src: "",
	crossOrigin: "",
	width: 64,
	height: 64,
};

global.Image = vi.fn(() => mockImage) as unknown as typeof Image;

describe("follower", () => {
	beforeEach(() => {
		vi.useFakeTimers();
		// Reset image mock
		mockImage.onload = null;
		mockImage.onerror = null;
		mockImage.src = "";
	});

	afterEach(() => {
		vi.restoreAllMocks();
		// Clean up any remaining DOM elements
		document.querySelectorAll(".mouse-follower").forEach((el) => el.remove());
	});

	it("should return a follower instance", () => {
		const s = follower();
		expect(s).toBeDefined();
		expect(s.x).toBe(0);
		expect(s.y).toBe(0);
		expect(s.start).toBeInstanceOf(Function);
		expect(s.stop).toBeInstanceOf(Function);
		expect(s.setTarget).toBeInstanceOf(Function);
		expect(s.destroy).toBeInstanceOf(Function);
	});

	it("should create DOM element when started", async () => {
		const s = follower();

		// Start the follower and simulate image load
		const startPromise = s.start();
		if (mockImage.onload) {
			mockImage.onload();
		}
		await startPromise;

		const elements = document.querySelectorAll(".mouse-follower");
		expect(elements.length).toBe(1);

		s.destroy();
	});

	it("should track mouse movement", async () => {
		const mouseTarget = new MouseTarget();
		const s = follower({ target: mouseTarget });

		// Start the follower and simulate image load
		const startPromise = s.start();
		if (mockImage.onload) {
			mockImage.onload();
		}
		await startPromise;

		const event = new MouseEvent("mousemove", {
			clientX: 100,
			clientY: 200,
		});
		window.dispatchEvent(event);

		vi.advanceTimersByTime(100);

		expect(s.x).toBeGreaterThan(0);
		expect(s.y).toBeGreaterThan(0);

		s.destroy();
	});

	it("should support custom options including transparent color", () => {
		const mouseTarget = new MouseTarget();
		const s = follower({
			target: mouseTarget,
			physics: {
				velocity: 300,
				braking: {
					stopDistance: 50,
				},
			},
			sprite: {
				transparentColor: "#00FF00",
			},
		});

		expect(s).toBeDefined();
		s.destroy();
	});

	it("should handle sprite loading errors gracefully", async () => {
		const s = follower();

		// Start the follower and simulate image error
		const startPromise = s.start();
		if (mockImage.onerror) {
			mockImage.onerror();
		}

		await expect(startPromise).rejects.toThrow();
	});

	it("should apply target offset using OffsetTarget", async () => {
		const mouseTarget = new MouseTarget();
		const offsetTarget = new OffsetTarget(mouseTarget, 50, -30);
		const s = follower({ target: offsetTarget });

		const startPromise = s.start();
		if (mockImage.onload) {
			mockImage.onload();
		}
		await startPromise;

		// Simulate mouse movement
		const event = new MouseEvent("mousemove", {
			clientX: 100,
			clientY: 200,
		});
		window.dispatchEvent(event);

		vi.advanceTimersByTime(100);

		// The follower should move towards offset position (150, 170)
		expect(s.x).toBeGreaterThan(0);
		expect(s.y).toBeLessThan(0); // Y offset is negative, so follower moves upward from initial position

		s.destroy();
	});

	it("should apply target offset to position target using OffsetTarget", () => {
		const targetPosition = { x: 100, y: 100 };
		const offsetTarget = new OffsetTarget(targetPosition, 20, -10);

		expect(offsetTarget.x).toBe(120); // 100 + 20
		expect(offsetTarget.y).toBe(90); // 100 + (-10)
	});

	it("should emit start and stop events based on movement", async () => {
		const mouseTarget = new MouseTarget();
		const s = follower({ target: mouseTarget });

		const startPromise = s.start();
		if (mockImage.onload) {
			mockImage.onload();
		}
		await startPromise;

		// Test event listener registration
		let startEventFired = false;

		s.addEventListener("start", () => {
			startEventFired = true;
		});

		// Simulate mouse movement to trigger start event
		const event = new MouseEvent("mousemove", {
			clientX: 500,
			clientY: 500,
		});
		window.dispatchEvent(event);

		vi.advanceTimersByTime(100);

		expect(startEventFired).toBe(true);

		s.destroy();
	});

	it("should support playAnimation method", async () => {
		const mouseTarget = new MouseTarget();
		const s = follower({ target: mouseTarget });

		const startPromise = s.start();
		if (mockImage.onload) {
			mockImage.onload();
		}
		await startPromise;

		// Test that playAnimation method exists and can be called
		expect(s.playAnimation).toBeInstanceOf(Function);
		s.playAnimation("walk");
		s.playAnimation("action");

		s.destroy();
	});
});

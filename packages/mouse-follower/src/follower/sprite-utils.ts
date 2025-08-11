/**
 * Sprite utility functions - stateless operations for sprite handling
 */

/**
 * Load sprite image from URL
 */
export async function loadSpriteImage(url: string): Promise<HTMLImageElement> {
	return new Promise((resolve, reject) => {
		const image = new Image();
		image.crossOrigin = "anonymous";

		image.onload = () => resolve(image);
		image.onerror = () => reject(new Error(`Failed to load sprite: ${url}`));

		image.src = url;
	});
}

/**
 * Apply transparency to an image using color key
 */
export function applyTransparency(
	image: HTMLImageElement,
	transparentColor: string,
): HTMLImageElement {
	// Create temporary canvas for processing
	const canvas = document.createElement("canvas");
	const context = canvas.getContext("2d");

	if (!context) {
		return image; // Return original if processing fails
	}

	canvas.width = image.width;
	canvas.height = image.height;

	// Draw image to canvas
	context.drawImage(image, 0, 0);

	// Get image data
	const imageData = context.getImageData(0, 0, canvas.width, canvas.height);
	const data = imageData.data;

	// Parse transparent color
	const [targetR, targetG, targetB] = parseColor(transparentColor);

	// Apply transparency
	for (let i = 0; i < data.length; i += 4) {
		const r = data[i];
		const g = data[i + 1];
		const b = data[i + 2];

		// Check if pixel matches transparent color (with tolerance)
		if (
			Math.abs(r - targetR) <= 5 &&
			Math.abs(g - targetG) <= 5 &&
			Math.abs(b - targetB) <= 5
		) {
			data[i + 3] = 0; // Set alpha to 0
		}
	}

	// Put modified image data back
	context.putImageData(imageData, 0, 0);

	// Create new image from canvas
	const processedImage = new Image();
	processedImage.src = canvas.toDataURL();

	return processedImage;
}

/**
 * Parse color string to RGB values
 */
export function parseColor(colorString: string): [number, number, number] {
	// Handle rgb(r, g, b) format
	const rgbMatch = colorString.match(/rgb\((\d+),\s*(\d+),\s*(\d+)\)/);
	if (rgbMatch) {
		return [
			Number.parseInt(rgbMatch[1], 10),
			Number.parseInt(rgbMatch[2], 10),
			Number.parseInt(rgbMatch[3], 10),
		];
	}

	// Handle hex format (#RRGGBB or #RGB)
	const hexMatch = colorString.match(/^#([0-9a-fA-F]{3,6})$/);
	if (hexMatch) {
		const hex = hexMatch[1];
		if (hex.length === 3) {
			// Convert #RGB to #RRGGBB
			return [
				Number.parseInt(hex[0] + hex[0], 16),
				Number.parseInt(hex[1] + hex[1], 16),
				Number.parseInt(hex[2] + hex[2], 16),
			];
		}
		if (hex.length === 6) {
			return [
				Number.parseInt(hex.slice(0, 2), 16),
				Number.parseInt(hex.slice(2, 4), 16),
				Number.parseInt(hex.slice(4, 6), 16),
			];
		}
	}

	// Default to green if parsing fails
	console.warn(`Failed to parse color: ${colorString}, using default green`);
	return [0, 255, 0];
}

/**
 * Create wrapper element for sprite
 */
export function createWrapper(
	className: string = "mouse-follower",
): HTMLDivElement {
	const wrapper = document.createElement("div");
	wrapper.className = className;
	wrapper.style.position = "fixed";
	wrapper.style.left = "0";
	wrapper.style.top = "0";
	wrapper.style.pointerEvents = "none";
	wrapper.style.zIndex = "9999";
	return wrapper;
}

/**
 * Create sprite container element
 */
export function createSpriteContainer(
	width: number,
	height: number,
): HTMLDivElement {
	const container = document.createElement("div");
	container.style.width = `${width}px`;
	container.style.height = `${height}px`;
	container.style.position = "absolute";
	container.style.pointerEvents = "none";
	return container;
}

/**
 * Process sprite image with transparency
 */
export async function processSpriteImage(
	url: string,
	transparentColor?: string,
): Promise<HTMLImageElement> {
	const image = await loadSpriteImage(url);

	if (transparentColor) {
		// Wait for processed image to load
		return new Promise((resolve) => {
			const processed = applyTransparency(image, transparentColor);
			if (processed.complete) {
				resolve(processed);
			} else {
				processed.onload = () => resolve(processed);
			}
		});
	}

	return image;
}

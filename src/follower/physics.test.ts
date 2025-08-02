import { describe, expect, it } from "vitest";
import { calculateAcceleration, updatePhysics } from "./physics";

describe("physics", () => {
	describe("calculateAcceleration", () => {
		it("should calculate acceleration towards target", () => {
			const position = { x: 0, y: 0 };
			const target = { x: 100, y: 0 };
			const maxAccel = 50;

			const accel = calculateAcceleration(position, target, maxAccel);

			expect(accel.x).toBe(50);
			expect(accel.y).toBe(0);
		});

		it("should limit acceleration to maxAccel", () => {
			const position = { x: 0, y: 0 };
			const target = { x: 100, y: 100 };
			const maxAccel = 50;

			const accel = calculateAcceleration(position, target, maxAccel);
			const magnitude = Math.sqrt(accel.x ** 2 + accel.y ** 2);

			expect(magnitude).toBeCloseTo(50);
		});
	});

	describe("updatePhysics", () => {
		it("should update velocity based on acceleration", () => {
			const state = {
				position: { x: 0, y: 0 },
				velocity: { x: 0, y: 0 },
				target: { x: 100, y: 0 },
			};
			const config = {
				maxAccel: 100,
				maxVelocity: 200,
				stopWithin: 30,
				brakingStartDistance: 100,
				brakingStrength: 8.0,
				minStopVelocity: 10.0,
			};
			const deltaTime = 0.016; // 60fps

			const newState = updatePhysics(state, config, deltaTime);

			expect(newState.velocity.x).toBeGreaterThan(0);
			expect(newState.velocity.y).toBe(0);
		});

		it("should apply braking when within stopWithin distance", () => {
			const state = {
				position: { x: 95, y: 0 },
				velocity: { x: 50, y: 0 },
				target: { x: 100, y: 0 },
			};
			const config = {
				maxAccel: 100,
				maxVelocity: 200,
				stopWithin: 30,
				brakingStartDistance: 100,
				brakingStrength: 8.0,
				minStopVelocity: 10.0,
			};
			const deltaTime = 0.016;

			const newState = updatePhysics(state, config, deltaTime);

			// With car-like braking, velocity should be reduced due to braking force
			expect(newState.velocity.x).toBeLessThan(50);
			expect(newState.velocity.y).toBe(0);
		});

		it("should stop completely when both distance and velocity are very small", () => {
			const state = {
				position: { x: 99.5, y: 0 },
				velocity: { x: 5.0, y: 0 }, // Small velocity
				target: { x: 100, y: 0 },
			};
			const config = {
				maxAccel: 100,
				maxVelocity: 200,
				stopWithin: 30,
				brakingStartDistance: 100,
				brakingStrength: 8.0,
				minStopVelocity: 10.0,
			};
			const deltaTime = 0.016;

			const newState = updatePhysics(state, config, deltaTime);

			// Should stop completely when both distance and velocity are small
			expect(newState.velocity.x).toBe(0);
			expect(newState.velocity.y).toBe(0);
		});

		it("should not brake when beyond brakingStartDistance", () => {
			const state = {
				position: { x: 0, y: 0 },
				velocity: { x: 50, y: 0 },
				target: { x: 150, y: 0 }, // 150px away (beyond brakingStartDistance of 100)
			};
			const config = {
				maxAccel: 100,
				maxVelocity: 200,
				stopWithin: 30,
				brakingStartDistance: 100,
				brakingStrength: 8.0,
				minStopVelocity: 10.0,
			};
			const deltaTime = 0.016;

			const newState = updatePhysics(state, config, deltaTime);

			// Should accelerate without braking when far away
			expect(newState.velocity.x).toBeGreaterThan(50);
		});

		it("should start braking when within brakingStartDistance", () => {
			const state = {
				position: { x: 0, y: 0 },
				velocity: { x: 50, y: 0 },
				target: { x: 80, y: 0 }, // 80px away (within brakingStartDistance but outside stopWithin)
			};
			const config = {
				maxAccel: 100,
				maxVelocity: 200,
				stopWithin: 30,
				brakingStartDistance: 100,
				brakingStrength: 8.0,
				minStopVelocity: 10.0,
			};
			const deltaTime = 0.016;

			const newState = updatePhysics(state, config, deltaTime);

			// Should still accelerate but with braking applied
			expect(newState.velocity.x).toBeLessThan(50 + 100 * deltaTime); // Less than pure acceleration
		});
	});
});

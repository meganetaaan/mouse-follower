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

// Physics class tests
import { Physics } from "./physics";
import type { PhysicsConfig, Position } from "./types";

describe("Physics class", () => {
	const defaultConfig: PhysicsConfig = {
		maxAccel: 2000,
		maxVelocity: 400,
		stopWithin: 30,
		brakingStartDistance: 200,
		brakingStrength: 8.0,
		minStopVelocity: 50.0,
	};

	const initialPosition: Position = { x: 0, y: 0 };

	describe("constructor", () => {
		it("should initialize with given config and position", () => {
			const physics = new Physics(defaultConfig, initialPosition);

			expect(physics.getPosition()).toEqual({ x: 0, y: 0 });
			expect(physics.getVelocity()).toEqual({ x: 0, y: 0 });
		});

		it("should initialize with custom position", () => {
			const customPosition = { x: 100, y: 50 };
			const physics = new Physics(defaultConfig, customPosition);

			expect(physics.getPosition()).toEqual({ x: 100, y: 50 });
		});
	});

	describe("setTarget", () => {
		it("should update the target position", () => {
			const physics = new Physics(defaultConfig, initialPosition);
			const target = { x: 100, y: 100 };

			physics.setTarget(target);

			// Target should affect movement after update
			physics.update(0.016); // 60fps
			const position = physics.getPosition();
			expect(position.x).toBeGreaterThan(0);
			expect(position.y).toBeGreaterThan(0);
		});
	});

	describe("update", () => {
		it("should move toward target when far away", () => {
			const physics = new Physics(defaultConfig, initialPosition);
			physics.setTarget({ x: 300, y: 0 });

			physics.update(0.016); // 60fps

			const position = physics.getPosition();
			const velocity = physics.getVelocity();

			expect(position.x).toBeGreaterThan(0);
			expect(position.y).toBe(0);
			expect(velocity.x).toBeGreaterThan(0);
			expect(velocity.y).toBe(0);
		});

		it("should accelerate toward target", () => {
			const physics = new Physics(defaultConfig, initialPosition);
			physics.setTarget({ x: 500, y: 0 });

			physics.update(0.016);
			const velocity1 = physics.getVelocity();

			physics.update(0.016);
			const velocity2 = physics.getVelocity();

			// Velocity should increase when accelerating toward target
			expect(velocity2.x).toBeGreaterThan(velocity1.x);
		});

		it("should apply braking when close to target", () => {
			const physics = new Physics(defaultConfig, { x: 150, y: 0 });
			physics.setTarget({ x: 200, y: 0 }); // 50px away, within brakingStartDistance

			// Give it some initial velocity
			physics.update(0.016);
			const velocity1 = physics.getVelocity();

			// Update again - should apply braking
			physics.update(0.016);
			const velocity2 = physics.getVelocity();

			// Velocity increase should be reduced due to braking
			expect(velocity2.x - velocity1.x).toBeLessThan(velocity1.x);
		});

		it("should stop when within stopWithin distance and low velocity", () => {
			const physics = new Physics(defaultConfig, { x: 199, y: 0 });
			physics.setTarget({ x: 200, y: 0 }); // 1px away

			physics.update(0.016);

			const _position = physics.getPosition();
			const velocity = physics.getVelocity();

			expect(velocity.x).toBe(0);
			expect(velocity.y).toBe(0);
		});

		it("should respect maximum velocity", () => {
			const fastConfig: PhysicsConfig = {
				...defaultConfig,
				maxVelocity: 100,
				maxAccel: 5000,
			};

			const physics = new Physics(fastConfig, initialPosition);
			physics.setTarget({ x: 1000, y: 0 });

			// Update multiple times to build up velocity
			for (let i = 0; i < 10; i++) {
				physics.update(0.016);
			}

			const velocity = physics.getVelocity();
			const speed = Math.sqrt(
				velocity.x * velocity.x + velocity.y * velocity.y,
			);

			expect(speed).toBeLessThanOrEqual(100);
		});

		it("should handle diagonal movement correctly", () => {
			const physics = new Physics(defaultConfig, initialPosition);
			physics.setTarget({ x: 100, y: 100 });

			physics.update(0.016);

			const position = physics.getPosition();
			const velocity = physics.getVelocity();

			expect(position.x).toBeGreaterThan(0);
			expect(position.y).toBeGreaterThan(0);
			expect(velocity.x).toBeGreaterThan(0);
			expect(velocity.y).toBeGreaterThan(0);

			// Should maintain roughly equal movement in both directions
			expect(Math.abs(position.x - position.y)).toBeLessThan(1);
		});
	});

	describe("isMoving", () => {
		it("should return false when velocity is zero", () => {
			const physics = new Physics(defaultConfig, initialPosition);

			expect(physics.isMoving()).toBe(false);
		});

		it("should return true when moving above threshold", () => {
			const physics = new Physics(defaultConfig, initialPosition);
			physics.setTarget({ x: 200, y: 0 });

			physics.update(0.016);

			expect(physics.isMoving()).toBe(true);
		});

		it("should use custom threshold", () => {
			const physics = new Physics(defaultConfig, initialPosition);
			physics.setTarget({ x: 200, y: 0 });

			physics.update(0.001); // Very small time step for minimal velocity

			expect(physics.isMoving(1.0)).toBe(true);
			expect(physics.isMoving(100.0)).toBe(false);
		});

		it("should return false when stopped", () => {
			const physics = new Physics(defaultConfig, { x: 199, y: 0 });
			physics.setTarget({ x: 200, y: 0 }); // Very close

			physics.update(0.016);

			expect(physics.isMoving()).toBe(false);
		});
	});

	describe("getPosition and getVelocity", () => {
		it("should return current position and velocity", () => {
			const physics = new Physics(defaultConfig, { x: 50, y: 25 });

			expect(physics.getPosition()).toEqual({ x: 50, y: 25 });
			expect(physics.getVelocity()).toEqual({ x: 0, y: 0 });

			physics.setTarget({ x: 100, y: 75 });
			physics.update(0.016);

			const newPosition = physics.getPosition();
			const newVelocity = physics.getVelocity();

			expect(newPosition.x).toBeGreaterThan(50);
			expect(newPosition.y).toBeGreaterThan(25);
			expect(newVelocity.x).toBeGreaterThan(0);
			expect(newVelocity.y).toBeGreaterThan(0);
		});
	});
});

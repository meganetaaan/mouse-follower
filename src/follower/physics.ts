export interface Position {
	x: number;
	y: number;
}

export interface Velocity {
	x: number;
	y: number;
}

export interface PhysicsState {
	position: Position;
	velocity: Velocity;
	target: Position;
}

export interface PhysicsConfig {
	maxAccel: number;
	maxVelocity: number;
	stopWithin: number;
	brakingStartDistance: number;
	brakingStrength: number;
	minStopVelocity: number;
}

function calculateDistance(from: Position, to: Position): number {
	const dx = to.x - from.x;
	const dy = to.y - from.y;
	return Math.sqrt(dx * dx + dy * dy);
}

export function calculateAcceleration(
	position: Position,
	target: Position,
	maxAccel: number,
): Velocity {
	const dx = target.x - position.x;
	const dy = target.y - position.y;
	const distance = calculateDistance(position, target);

	if (distance === 0) {
		return { x: 0, y: 0 };
	}

	const directionX = dx / distance;
	const directionY = dy / distance;

	return {
		x: directionX * maxAccel,
		y: directionY * maxAccel,
	};
}

function calculateBrakingForce(
	distance: number,
	stopWithin: number,
	brakingStartDistance: number,
	brakingStrength: number,
): number {
	// Phase 1: No braking when far from target
	if (distance >= brakingStartDistance) {
		return 0; // Full speed ahead!
	}

	// Phase 2: Start braking when within brakingStartDistance
	if (distance > stopWithin) {
		// Gradual braking: increases from 0 to brakingStrength as we approach stopWithin
		const brakingRange = brakingStartDistance - stopWithin;
		const distanceInBrakingZone = distance - stopWithin;
		const brakingRatio = 1 - distanceInBrakingZone / brakingRange;
		return brakingStrength * brakingRatio;
	}

	// Phase 3: Maximum braking when very close to target
	return brakingStrength;
}

export function updatePhysics(
	state: PhysicsState,
	config: PhysicsConfig,
	deltaTime: number,
): PhysicsState {
	const distance = calculateDistance(state.position, state.target);
	const currentSpeed = Math.sqrt(
		state.velocity.x * state.velocity.x + state.velocity.y * state.velocity.y,
	);

	// Check for complete stop condition: both distance and speed are very small
	if (distance <= config.stopWithin && currentSpeed <= config.minStopVelocity) {
		return {
			position: state.position,
			velocity: { x: 0, y: 0 },
			target: state.target,
		};
	}

	// Always calculate acceleration toward target (driving force)
	const accel = calculateAcceleration(
		state.position,
		state.target,
		config.maxAccel,
	);

	// Calculate braking force based on distance to target
	const brakingForce = calculateBrakingForce(
		distance,
		config.stopWithin,
		config.brakingStartDistance,
		config.brakingStrength,
	);

	// Apply driving force and braking force
	// Braking force opposes current velocity (like friction)
	let newVelocityX =
		state.velocity.x +
		accel.x * deltaTime -
		state.velocity.x * brakingForce * deltaTime;
	let newVelocityY =
		state.velocity.y +
		accel.y * deltaTime -
		state.velocity.y * brakingForce * deltaTime;

	// Apply velocity limit
	const newSpeed = Math.sqrt(
		newVelocityX * newVelocityX + newVelocityY * newVelocityY,
	);

	if (newSpeed > config.maxVelocity) {
		newVelocityX = (newVelocityX / newSpeed) * config.maxVelocity;
		newVelocityY = (newVelocityY / newSpeed) * config.maxVelocity;
	}

	const newPositionX = state.position.x + newVelocityX * deltaTime;
	const newPositionY = state.position.y + newVelocityY * deltaTime;

	return {
		position: { x: newPositionX, y: newPositionY },
		velocity: { x: newVelocityX, y: newVelocityY },
		target: state.target,
	};
}

import "./style.css";
import {
	type FollowerStartEvent,
	type FollowerStopEvent,
	follower,
	mouseTarget,
	offsetTarget,
	SPRITE_PRESET_STACK_CHAN,
} from "@meganetaaan/mouse-follower";

const appElement = document.querySelector<HTMLDivElement>("#app");
if (appElement) {
	appElement.innerHTML = `
    <div style="padding: 2rem;">
      <h1>Stack-chan</h1>
			<p>Stack-chan is a palm-sized super-kawaii companion robot with M5Stack embedded. It can shake its head, watch people&apos;s faces, talk, and possess you with various face expressions.</p>
			<p>The exterior, board data, and software are fully open source. Detailed assembly instructions are available, so anyone can make one.</p>
      
      <div style="margin-top: 2rem;">
        <label for="sprite-select">Sprite: </label>
        <select id="sprite-select">
          <option value="stack-chan">Stack-chan</option>
        </select>
        <button id="add">Add</button>
        <button id="clear">Clear</button>
      </div>
      
      <div id="info" style="margin-top: 2rem;">
        <p>Active followers: 0</p>
      </div>
    </div>
  `;
}

const followers: ReturnType<typeof follower>[] = [];

document.getElementById("add")?.addEventListener("click", async (event) => {
	// Use stack-chan sprite preset
	const spritePreset = SPRITE_PRESET_STACK_CHAN;

	// First follower follows mouse, subsequent ones follow the previous follower with offset
	const target =
		followers.length === 0
			? mouseTarget()
			: offsetTarget(followers[followers.length - 1], -40, 0);

	const s = follower({ target, sprite: spritePreset });

	// Add event listeners for movement state changes
	// Option A: Play action animation when stopped
	s.addEventListener("stop", (e: FollowerStopEvent) => {
		e.detail.follower.playAnimation("action");
	});

	s.addEventListener("start", (e: FollowerStartEvent) => {
		e.detail.follower.playAnimation("walk");
	});

	// Alternative Option B: Pause animation when stopped
	// s.addEventListener('stop', (e) => {
	//   e.detail.follower.pauseAnimation();
	// });
	// s.addEventListener('start', (e) => {
	//   e.detail.follower.playAnimation('walk');
	// });

	// Set initial position
	if (followers.length === 0) {
		// First follower starts next to the Add button
		const button = event.target as HTMLButtonElement;
		const rect = button.getBoundingClientRect();
		s.x = rect.right + 20;
		s.y = rect.top + rect.height / 2;
	} else {
		// Subsequent followers start at the last follower's position + offset
		const lastFollower = followers[followers.length - 1];
		s.x = lastFollower.x - 40;
		s.y = lastFollower.y;
	}

	await s.start();
	followers.push(s);
	updateInfo();
});

document.getElementById("clear")?.addEventListener("click", () => {
	followers.forEach((s) => s.destroy());
	followers.length = 0;
	updateInfo();
});

function updateInfo() {
	const info = document.getElementById("info");
	if (info) {
		info.innerHTML = `<p>Active followers: ${followers.length}</p>`;
	}
}

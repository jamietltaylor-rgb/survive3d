# The Quiet Outside 3D

Survival horror game: scavenge in first person, dig tunnels underground, save survivors, survive 20 days.

- `index.html`: the whole game (Three.js is bundled inside).
- `functions/api/[[path]].js`: Cloudflare Pages Function for accounts and cloud saves.

## Hosting on Cloudflare Pages
1. Connect this repo to a Cloudflare Pages project (no build command, output directory `/`).
2. Create a KV namespace (e.g. `quiet-outside-saves`).
3. In the Pages project: Settings → Bindings → add a KV namespace binding with variable name **SAVES**.
4. Redeploy. Without the binding the game still works, but saves only on the player's device.

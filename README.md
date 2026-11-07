# The Quiet Outside 3D

First-person survival horror: scavenge in the dark, dig tunnels underground, save survivors, survive 20 days.

Play at https://survive3d.jamietaylor.org

- `public/index.html`: the whole game (Three.js bundled inside).
- `src/worker.js`, `src/api.js`: Cloudflare Worker serving the game plus `/api/*` for accounts and cloud saves (KV namespace `SAVES`).
- `wrangler.jsonc`: deploy config (`npx wrangler deploy`).

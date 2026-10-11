# Carom

Carom is a fast top-down paddle duel built around curving shots and clever banks. Move as you strike to put spin on the ball, thread rallies around the two center obstacles, and be the first player to reach 11 points with a two-point lead.

## Run it

Install the pinned dependencies with `npm ci`, then start the development server with `npm run dev`. Open the local URL Vite prints in a browser.

Create the self-contained static production site with `npm run build`. The output is written to `dist/` and can be served from the root of any static host. Use `npm run preview` to inspect that build locally.

## Controls

- Player one: `W` / `S`
- Player two: `↑` / `↓`
- Menus: either movement pair, then `Enter` or `Space`
- Pause or resume: `P` or `Escape`
- Mute: `M`

In Solo, either movement pair controls the left paddle and the right paddle is controlled by Carom's AI. Versus is local two-player on one keyboard. Menus also support mouse and touch.

## Quality checks

Run `npm run typecheck`, `npm run lint`, `npm run format`, and `npm test`.

# RuneDream

RuneDream is a simple endless runner prototype. Control the Wisp Dragon with keyboard controls while collecting coins and avoiding obstacles.

## Controls

- **Jump**: `Space` or `ArrowUp`
- **Dash**: `Control` or `X`

## Obstacles

Orange stars can be destroyed by dashing through them. If you are dashing when you collide with one, it will explode and disappear, awarding extra coins. Touching an orange star without dashing is fatal. Black stars are always deadly and cannot be destroyed, even when dashing.

## Upgrades

Coins collected during runs can be spent in the upgrade shop. One option is **Extra Life**. Each extra life lets the Wisp Dragon revive at the top of the screen after falling or taking lethal damage. The run only ends when all lives are used up.

## Play

Open `index.html` in a modern browser. You'll see a launch screen with a **Start Game** button. Clicking it opens the game in its own window. The game is designed with mobile in mind, so touch controls can be added later.

To avoid asset-loading issues, start a local web server in the project root:

```bash
python3 -m http.server
```

Then open <http://localhost:8000> in your browser. Opening the file directly may show only a blank canvas.

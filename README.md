# Fourier Epicycle Generator

A web app that decomposes SVG vector paths into complex Fourier series and visualizes them as animated epicycles — spinning circles and rotating vectors that trace out the shape in real time.

## New Features & Enhancements

- **Synchronized Accent Color Theme**:
  - Live color picker, hex code input, and quick palette presets (Indigo, Cyan, Emerald, Amber, Rose, Fuchsia, Blue, Platinum).
  - Changing the accent dynamically updates the **entire website** (header logo, buttons, sliders, active toggles, focus glows) and the **sketch** (epicycle circles, tip glow, trail, and radiant halos) in lockstep.
- **Moment Screenshot Capture**:
  - Capture the exact visual state of the graph at any specific moment during animation.
  - Accessible via the **Export Panel**, the **Playback Bar** camera icon, the **Header Bar**, or by pressing <kbd>S</kbd>.
  - Downloads a high-resolution PNG (`fourier-epicycles-moment-XXpct.png`) with instant visual confirmation.
- **Speed-Independent Drawing**:
  - The animation speed setting **never affects the final outcome, density, or smoothness** of the sketched path.
  - Sketched trails are drawn from a deterministic high-density buffer up to the current progress point. Running at 0.1× or 5.0× yields identical, pristine results.
- **Manual Numeric Field Entry**:
  - Direct editable inputs next to every slider (Epicycles, Animation Speed, Path Detail Samples, Trail Length).
  - Two-way sync: type values directly or drag the sliders.
- **High-Fidelity Real SVG Support**:
  - **Centered Two-Sided Fourier Spectrum** ($k \in [-K, K]$): Prevents aliasing and reverse-spin distortions, allowing sharp corners, text, and intricate SVG curves to render accurately.
  - **Full SVG Parser**: Automatically converts `<rect>`, `<circle>`, `<ellipse>`, `<polygon>`, `<polyline>`, and multi-`<path>` elements into smooth continuous contours.
  - Support for up to **50,000 epicycles** and **50,000 path samples**.
  - Built-in presets: **Batman**, **Butterfly**, **Treble Clef**, **Heart**, **Star**, and **Pi**.

## Getting Started

No build step or dependencies required. Open `index.html` in any modern web browser:

```bash
# Windows
start index.html

# macOS
open index.html

# Linux
xdg-open index.html
```

## Keyboard Shortcuts

| Key | Action |
|---|---|
| <kbd>Space</kbd> | Play / Pause animation |
| <kbd>R</kbd> | Restart animation to 0% |
| <kbd>S</kbd> | Take a screenshot of the current moment |

## License

See [LICENSE](LICENSE) for details.

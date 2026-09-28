# Axis & Sliders

A small, dependency-free widget that pairs an X/Y axis plot with two sliders.
Styled in a light pastel theme with Century Gothic.

- Drag the point on the plot, move either slider, or type a value: all three stay in sync.
- Dashed guides and axis markers show exactly where the point sits.
- Keyboard accessible (native range and number inputs), with a live readout for screen readers.
- A Reset button returns to the starting values.

## Usage

Open `index.html` in a browser, or embed it in your own page:

```html
<link rel="stylesheet" href="axis-sliders.css">
<div id="widget"></div>
<script src="axis-sliders.js"></script>
<script>
  const w = new AxisSliders(document.getElementById('widget'), {
    title: 'Adjust your values',
    xLabel: 'X', yLabel: 'Y',
    min: 0, max: 100, step: 1, ticks: 5,
    x: 40, y: 65,
    onChange: ({ x, y }) => console.log(x, y),
  });
  // w.value  -> { x, y }
  // w.set({ x: 10 })
</script>
```

## Font

Century Gothic is a system font (bundled with Windows and Microsoft Office), not a web font.
The stack falls back to AppleGothic, URW Gothic, then the default sans-serif where it isn't installed.
Colours are CSS custom properties (`--as-*`) in `axis-sliders.css` if you want to adjust the palette.

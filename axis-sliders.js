/**
 * AxisSliders — a small widget pairing an X/Y axis plot with two sliders.
 * Drag the point on the plot, move a slider, or type a number: all stay in sync.
 *
 *   const w = new AxisSliders(document.getElementById('mount'), {
 *     title: 'Adjust your values', xLabel: 'X', yLabel: 'Y',
 *     min: 0, max: 100, step: 1, x: 40, y: 60,
 *     onChange: ({ x, y }) => console.log(x, y),
 *   });
 */
(function (global) {
  'use strict';

  const SVG_NS = 'http://www.w3.org/2000/svg';
  const W = 400, H = 280;
  const PAD = { top: 16, right: 20, bottom: 40, left: 44 };
  let uid = 0;

  function svg(tag, attrs, parent) {
    const el = document.createElementNS(SVG_NS, tag);
    for (const k in attrs) el.setAttribute(k, attrs[k]);
    if (parent) parent.appendChild(el);
    return el;
  }

  function escapeHtml(s) {
    return String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  }

  class AxisSliders {
    constructor(root, opts = {}) {
      this.root = root;
      this.o = Object.assign({
        title: 'Adjust your values',
        subtitle: 'Drag the point, move a slider, or type a number.',
        xLabel: 'X', yLabel: 'Y',
        min: 0, max: 100, step: 1, ticks: 5,
        x: 50, y: 50,
        onChange: null,
      }, opts);
      this.initial = { x: this.o.x, y: this.o.y };
      this.x = this.o.x;
      this.y = this.o.y;
      this.id = 'as' + (++uid);
      this.render();
      this.bind();
      this.update();
    }

    /* ---------- geometry ---------- */
    sx(v) { const { min, max } = this.o; return PAD.left + (v - min) / (max - min) * (W - PAD.left - PAD.right); }
    sy(v) { const { min, max } = this.o; return H - PAD.bottom - (v - min) / (max - min) * (H - PAD.top - PAD.bottom); }
    clamp(v) {
      const { min, max, step } = this.o;
      const snapped = Math.round((v - min) / step) * step + min;
      return +Math.min(max, Math.max(min, snapped)).toFixed(6);
    }

    /* ---------- DOM ---------- */
    render() {
      const o = this.o, id = this.id;
      const e = escapeHtml;
      const control = (axis, label) => `
        <div class="as-control" data-axis="${axis}">
          <label for="${id}-${axis}"><span class="as-dot" aria-hidden="true"></span>${e(label)}</label>
          <input class="as-number" type="number" id="${id}-${axis}-num" aria-label="${e(label)} value"
                 min="${o.min}" max="${o.max}" step="${o.step}" inputmode="decimal">
          <input class="as-range" type="range" id="${id}-${axis}"
                 min="${o.min}" max="${o.max}" step="${o.step}">
          <div class="as-scale" aria-hidden="true"><span>${o.min}</span><span>${o.max}</span></div>
        </div>`;

      this.root.classList.add('as-widget');
      this.root.innerHTML = `
        <div class="as-header">
          <h2 class="as-title">${e(o.title)}</h2>
          <output class="as-readout" aria-live="polite"></output>
        </div>
        <p class="as-subtitle">${e(o.subtitle)}</p>
        <div class="as-plot-wrap"></div>
        <div class="as-controls">${control('x', o.xLabel)}${control('y', o.yLabel)}</div>
        <div class="as-footer">
          <span class="as-note">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
              <path d="M12 3l7 3v6c0 4.5-3 7.5-7 9-4-1.5-7-4.5-7-9V6l7-3z"/><path d="M9 12l2 2 4-4"/>
            </svg>
            You can reset to the starting values at any time.
          </span>
          <button type="button" class="as-reset">Reset</button>
        </div>`;

      this.readout = this.root.querySelector('.as-readout');
      this.xRange = this.root.querySelector(`#${id}-x`);
      this.yRange = this.root.querySelector(`#${id}-y`);
      this.xNum = this.root.querySelector(`#${id}-x-num`);
      this.yNum = this.root.querySelector(`#${id}-y-num`);
      this.resetBtn = this.root.querySelector('.as-reset');
      this.buildPlot(this.root.querySelector('.as-plot-wrap'));
    }

    buildPlot(wrap) {
      const o = this.o;
      const s = this.plot = svg('svg', {
        class: 'as-plot', viewBox: `0 0 ${W} ${H}`, role: 'img',
        'aria-label': `${o.xLabel} and ${o.yLabel} plot`,
      }, wrap);

      const grid = svg('g', { class: 'as-grid' }, s);
      const axes = svg('g', { class: 'as-axis' }, s);
      const x0 = PAD.left, x1 = W - PAD.right, y0 = H - PAD.bottom, y1 = PAD.top;

      for (let i = 0; i <= o.ticks; i++) {
        const v = o.min + (o.max - o.min) * i / o.ticks;
        const label = +v.toFixed(2);
        const px = this.sx(v), py = this.sy(v);
        if (i > 0) {
          svg('line', { x1: px, x2: px, y1, y2: y0 }, grid);
          svg('line', { x1: x0, x2: x1, y1: py, y2: py }, grid);
        }
        const tx = svg('g', { class: 'as-tick' }, axes);
        svg('line', { x1: px, x2: px, y1: y0, y2: y0 + 5 }, tx);
        svg('text', { x: px, y: y0 + 18, 'text-anchor': 'middle' }, tx).textContent = label;
        const ty = svg('g', { class: 'as-tick' }, axes);
        svg('line', { x1: x0 - 5, x2: x0, y1: py, y2: py }, ty);
        svg('text', { x: x0 - 9, y: py + 4, 'text-anchor': 'end' }, ty).textContent = label;
      }
      svg('line', { x1: x0, x2: x1, y1: y0, y2: y0 }, axes);
      svg('line', { x1: x0, x2: x0, y1, y2: y0 }, axes);
      svg('text', { class: 'as-axis-label', x: (x0 + x1) / 2, y: H - 6, 'text-anchor': 'middle' }, s).textContent = o.xLabel.toUpperCase();
      svg('text', { class: 'as-axis-label', x: 12, y: (y0 + y1) / 2, 'text-anchor': 'middle',
        transform: `rotate(-90 12 ${(y0 + y1) / 2})` }, s).textContent = o.yLabel.toUpperCase();

      this.guideX = svg('line', { class: 'as-guide-x' }, s);
      this.guideY = svg('line', { class: 'as-guide-y' }, s);
      this.markX = svg('circle', { class: 'as-marker-x', r: 4, cy: y0 }, s);
      this.markY = svg('circle', { class: 'as-marker-y', r: 4, cx: x0 }, s);
      this.halo = svg('circle', { class: 'as-halo', r: 12 }, s);
      this.point = svg('circle', { class: 'as-point', r: 7 }, s);
    }

    /* ---------- events ---------- */
    bind() {
      const onRange = axis => e => this.set({ [axis]: +e.target.value });
      const onNum = axis => e => { if (e.target.value !== '') this.set({ [axis]: +e.target.value }); };
      const onNumBlur = () => this.update();

      this.xRange.addEventListener('input', onRange('x'));
      this.yRange.addEventListener('input', onRange('y'));
      this.xNum.addEventListener('change', onNum('x'));
      this.yNum.addEventListener('change', onNum('y'));
      this.xNum.addEventListener('blur', onNumBlur);
      this.yNum.addEventListener('blur', onNumBlur);
      this.resetBtn.addEventListener('click', () => this.set(this.initial));

      const fromPointer = e => {
        const pt = this.plot.createSVGPoint();
        pt.x = e.clientX; pt.y = e.clientY;
        const p = pt.matrixTransform(this.plot.getScreenCTM().inverse());
        const { min, max } = this.o;
        const vx = min + (p.x - PAD.left) / (W - PAD.left - PAD.right) * (max - min);
        const vy = min + (H - PAD.bottom - p.y) / (H - PAD.top - PAD.bottom) * (max - min);
        this.set({ x: vx, y: vy });
      };
      this.plot.addEventListener('pointerdown', e => {
        this.plot.setPointerCapture(e.pointerId);
        this.plot.classList.add('is-dragging');
        fromPointer(e);
      });
      this.plot.addEventListener('pointermove', e => {
        if (this.plot.hasPointerCapture(e.pointerId)) fromPointer(e);
      });
      const end = e => {
        if (this.plot.hasPointerCapture(e.pointerId)) this.plot.releasePointerCapture(e.pointerId);
        this.plot.classList.remove('is-dragging');
      };
      this.plot.addEventListener('pointerup', end);
      this.plot.addEventListener('pointercancel', end);
    }

    /* ---------- state ---------- */
    set(vals) {
      const nx = 'x' in vals ? this.clamp(vals.x) : this.x;
      const ny = 'y' in vals ? this.clamp(vals.y) : this.y;
      const changed = nx !== this.x || ny !== this.y;
      this.x = nx; this.y = ny;
      this.update();
      if (changed && typeof this.o.onChange === 'function') this.o.onChange({ x: nx, y: ny });
    }

    get value() { return { x: this.x, y: this.y }; }

    update() {
      const { min, max } = this.o;
      const px = this.sx(this.x), py = this.sy(this.y);
      const x0 = PAD.left, y0 = H - PAD.bottom;

      this.point.setAttribute('cx', px); this.point.setAttribute('cy', py);
      this.halo.setAttribute('cx', px); this.halo.setAttribute('cy', py);
      this.guideX.setAttribute('x1', px); this.guideX.setAttribute('x2', px);
      this.guideX.setAttribute('y1', py); this.guideX.setAttribute('y2', y0);
      this.guideY.setAttribute('x1', x0); this.guideY.setAttribute('x2', px);
      this.guideY.setAttribute('y1', py); this.guideY.setAttribute('y2', py);
      this.markX.setAttribute('cx', px);
      this.markY.setAttribute('cy', py);

      [[this.xRange, this.xNum, this.x], [this.yRange, this.yNum, this.y]].forEach(([r, n, v]) => {
        r.value = v;
        r.style.setProperty('--fill', ((v - min) / (max - min) * 100) + '%');
        if (document.activeElement !== n) n.value = v;
      });
      this.readout.textContent = `${this.o.xLabel} ${this.x} · ${this.o.yLabel} ${this.y}`;
    }
  }

  global.AxisSliders = AxisSliders;
})(typeof window !== 'undefined' ? window : this);

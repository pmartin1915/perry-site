/*
 * viewer.js: upgrades the document in index.html into the imaging viewer.
 *
 * It never supplies words. Every sentence is read from the DOM that is already
 * there; this file only toggles classes and `hidden`, and adds short control
 * labels. With this file blocked, index.html is the complete site.
 *
 * Plain script, no imports. Depends on window.SERIES, SCHEMAS, DEPTHS and
 * DEFAULT_DEPTH from projects.js; window.SERIES_GATED (local.js) is optional.
 */
(function () {
  'use strict';

  if (!window.SERIES || !window.DEPTHS) return;

  var root = document.documentElement;
  var main = document.getElementById('content');
  var header = document.querySelector('header.identity');
  if (!main || !header) return;

  /* ---- storage: every read and write is guarded; the page works without it ---- */
  function load(key) {
    try { return window.localStorage.getItem(key); } catch (e) { return null; }
  }
  function save(key, value) {
    try { window.localStorage.setItem(key, value); } catch (e) { /* private mode */ }
  }

  /* ---- data: series that actually have a section in the page, in rail order ---- */
  var all = window.SERIES.concat(window.SERIES_GATED || []).sort(function (a, b) {
    return a.order - b.order;
  });
  var list = [];
  all.forEach(function (s) {
    var el = document.getElementById(s.id);
    if (el && el.classList.contains('series')) list.push({ data: s, el: el });
  });
  if (!list.length) return;

  /* ---- small DOM helpers (labels only; no prose) ---- */
  function make(tag, cls, text) {
    var n = document.createElement(tag);
    if (cls) n.className = cls;
    if (text) n.textContent = text;
    return n;
  }

  /* ---- theme: the manual toggle wins in both directions ---- */
  var darkQuery = window.matchMedia('(prefers-color-scheme: dark)');
  function effectiveTheme() {
    var t = root.getAttribute('data-theme');
    if (t === 'light' || t === 'dark') return t;
    return darkQuery.matches ? 'dark' : 'light';
  }
  var storedTheme = load('pm-theme');
  if (storedTheme === 'light' || storedTheme === 'dark') root.setAttribute('data-theme', storedTheme);

  /* ---- state ---- */
  var narrow = window.matchMedia('(max-width: 767px)');
  var storedView = load('pm-view');
  var mode = storedView === 'viewer' || storedView === 'document'
    ? storedView
    : (narrow.matches ? 'document' : 'viewer');

  var prefDepth = parseInt(load('pm-depth'), 10);
  if (!(prefDepth >= 1 && prefDepth <= 3)) prefDepth = window.DEFAULT_DEPTH || 1;

  var seriesIdx = 0;
  var sliceIdx = 0;

  /* ---- prepare each series: indexes and placeholder skipping ---- */
  list.forEach(function (s) {
    s.slices = Array.prototype.slice.call(s.el.querySelectorAll('article.slice'));
    s.depths = {};
    s.slices.forEach(function (sl) {
      Array.prototype.forEach.call(sl.querySelectorAll('p[data-depth]'), function (p) {
        // Unresolved placeholders are skipped entirely, never rendered.
        if (/\[FILL:/.test(p.textContent)) {
          p.setAttribute('data-skip', '');
          p.hidden = true;
          return;
        }
        s.depths[p.getAttribute('data-depth')] = true;
      });
    });
  });

  /* ---- build chrome ---- */
  var bar = make('div', 'toolbar');
  bar.setAttribute('role', 'toolbar');
  bar.setAttribute('aria-label', 'Display options');

  var viewBtn = make('button', 'btn view-toggle');
  viewBtn.type = 'button';
  var themeBtn = make('button', 'btn theme-toggle', 'Invert');
  themeBtn.type = 'button';

  var depthWrap = make('div', 'depth');
  depthWrap.setAttribute('role', 'group');
  depthWrap.setAttribute('aria-label', 'Technical depth');
  depthWrap.appendChild(make('span', 'depth-label', 'Depth'));
  var depthBtns = window.DEPTHS.map(function (d) {
    var b = make('button', 'btn depth-btn', d.label);
    b.type = 'button';
    b.setAttribute('data-value', String(d.value));
    b.title = d.hint;
    b.addEventListener('click', function () {
      prefDepth = d.value;
      save('pm-depth', String(prefDepth));   // the user's preference; clamped on read only
      render();
    });
    depthWrap.appendChild(b);
    return b;
  });

  bar.appendChild(viewBtn);
  bar.appendChild(themeBtn);
  bar.appendChild(depthWrap);
  header.appendChild(bar);

  // The viewer wrapper holds the rail, the series sections and the scrubber.
  var viewer = make('div', 'viewer');
  var rail = make('nav', 'rail');
  rail.setAttribute('aria-label', 'Series');
  var railList = make('ul');
  var railBtns = list.map(function (s, i) {
    var li = make('li');
    var b = make('button', 'rail-btn', s.data.short);
    b.type = 'button';
    b.addEventListener('click', function () { go(i, 0); });
    li.appendChild(b);
    railList.appendChild(li);
    return b;
  });
  rail.appendChild(railList);
  viewer.appendChild(rail);

  list.forEach(function (s) { viewer.appendChild(s.el); });

  var scrub = make('div', 'scrubber');
  var prev = make('button', 'btn step', 'Previous');
  prev.type = 'button';
  var next = make('button', 'btn step', 'Next');
  next.type = 'button';
  var range = make('input', 'range');
  range.type = 'range';
  range.min = '1';
  range.step = '1';
  range.setAttribute('aria-label', 'Slice');
  var count = make('span', 'count');
  count.setAttribute('aria-live', 'polite');
  scrub.appendChild(prev);
  scrub.appendChild(range);
  scrub.appendChild(next);
  scrub.appendChild(count);
  viewer.appendChild(scrub);

  main.appendChild(viewer);

  prev.addEventListener('click', function () { go(seriesIdx, sliceIdx - 1); });
  next.addEventListener('click', function () { go(seriesIdx, sliceIdx + 1); });
  range.addEventListener('input', function () { go(seriesIdx, parseInt(range.value, 10) - 1); });

  viewBtn.addEventListener('click', function () {
    mode = mode === 'viewer' ? 'document' : 'viewer';
    save('pm-view', mode);
    render();
  });
  themeBtn.addEventListener('click', function () {
    var t = effectiveTheme() === 'dark' ? 'light' : 'dark';
    root.setAttribute('data-theme', t);
    save('pm-theme', t);
    render();
  });
  darkQuery.addEventListener('change', render);

  /* ---- navigation ---- */
  function go(si, sl) {
    seriesIdx = Math.max(0, Math.min(list.length - 1, si));
    var n = list[seriesIdx].slices.length;
    sliceIdx = Math.max(0, Math.min(n - 1, sl));
    render();
  }

  document.addEventListener('keydown', function (e) {
    if (mode !== 'viewer' || e.altKey || e.ctrlKey || e.metaKey || e.shiftKey) return;
    var t = e.target;
    var tag = t && t.tagName;
    if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return;
    if (e.key === 'ArrowLeft') go(seriesIdx, sliceIdx - 1);
    else if (e.key === 'ArrowRight') go(seriesIdx, sliceIdx + 1);
    else if (e.key === 'ArrowUp') go(seriesIdx - 1, 0);
    else if (e.key === 'ArrowDown') go(seriesIdx + 1, 0);
    else return;
    e.preventDefault();
  });

  /* ---- render: one function derives the whole view from state ---- */
  function copyDepthFor(slice, want) {
    // The depth to show in one slice: the wanted one if it exists there, else 2.
    return slice.querySelector('p[data-depth="' + want + '"]:not([data-skip])') ? want : 2;
  }

  function render() {
    var viewerMode = mode === 'viewer';
    root.classList.toggle('viewer-mode', viewerMode);
    main.classList.toggle('viewer-mode', viewerMode);
    viewer.classList.toggle('viewer-mode', viewerMode);

    viewBtn.textContent = viewerMode ? 'Read as a document' : 'Open the viewer';

    var cur = list[seriesIdx];
    var avail = Object.keys(cur.depths).length > 1;

    // Clamp on read, never on write: prefDepth itself is not touched here.
    var seriesDepth = cur.depths[String(prefDepth)] ? prefDepth : 2;

    list.forEach(function (s, i) {
      var active = i === seriesIdx;
      s.el.classList.toggle('is-active', viewerMode && active);
      railBtns[i].setAttribute('aria-current', active ? 'true' : 'false');

      var d = viewerMode && active ? seriesDepth : 2;   // document view reads at depth 2
      s.slices.forEach(function (sl, k) {
        sl.classList.toggle('is-active', viewerMode && active && k === sliceIdx);
        var use = copyDepthFor(sl, d);
        Array.prototype.forEach.call(sl.querySelectorAll('p[data-depth]'), function (p) {
          if (p.hasAttribute('data-skip')) return;
          p.hidden = parseInt(p.getAttribute('data-depth'), 10) !== use;
        });
      });
    });

    // Depth control: hidden when the series has only depth 2; positions with no copy are hidden.
    depthWrap.hidden = !(viewerMode && avail);
    depthBtns.forEach(function (b) {
      var v = b.getAttribute('data-value');
      b.hidden = !cur.depths[v];
      b.setAttribute('aria-pressed', String(parseInt(v, 10) === seriesDepth));
    });

    var total = cur.slices.length;
    range.max = String(total);
    range.value = String(sliceIdx + 1);
    var h3 = cur.slices[sliceIdx] && cur.slices[sliceIdx].querySelector('h3');
    range.setAttribute('aria-valuetext', h3 ? h3.textContent : '');
    count.textContent = (sliceIdx + 1) + ' / ' + total + (h3 ? '  ' + h3.textContent : '');
    // aria-disabled, not disabled: a disabled focused button drops keyboard focus.
    prev.setAttribute('aria-disabled', String(sliceIdx === 0));
    next.setAttribute('aria-disabled', String(sliceIdx === total - 1));
  }

  root.classList.add('js');
  render();
})();

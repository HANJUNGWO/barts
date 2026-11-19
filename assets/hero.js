/* ------------------------------------------------------------------
   BARTS hero animation — night city, river, truss bridge with a
   passing train, and light-trail traffic on the riverside road.
   Pure canvas, no images. Pauses when off-screen; respects
   prefers-reduced-motion.  (보통은 이 파일을 고칠 필요가 없습니다)
------------------------------------------------------------------- */
(function () {
  const canvas = document.getElementById('hero-canvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // seeded random so the skyline looks the same on every visit
  let seed = 7;
  const rnd = () => ((seed = (seed * 16807) % 2147483647) - 1) / 2147483646;
  const rand = (a, b) => a + Math.random() * (b - a);

  let W = 0, H = 0, DPR = 1;
  let sky, city;               // offscreen layers
  let windows = [];            // lit-able windows for twinkling
  let G = {};                  // geometry
  let train = null, trainWait = 1.2, trainDir = 1;
  let cars = [];
  let last = 0, running = false, visible = true, rafId = 0;

  function layout() {
    const r = canvas.getBoundingClientRect();
    W = Math.max(320, r.width); H = Math.max(240, r.height);
    DPR = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = W * DPR; canvas.height = H * DPR;
    ctx.setTransform(DPR, 0, 0, DPR, 0, 0);

    G.horizon = H * 0.60;          // where buildings meet water
    G.deck = H * 0.735;            // bridge deck (train rail)
    G.truss = H * 0.085;           // truss height
    G.road = H * 0.865;            // top of riverside road
    G.laneFar = H * 0.905;
    G.laneNear = H * 0.955;
    G.car = Math.max(1, H / 420);  // scale

    buildSky(); buildCity();
    cars = []; for (let i = 0; i < 14; i++) spawnCar(true);
  }

  function off(w, h) {
    const c = document.createElement('canvas');
    c.width = w * DPR; c.height = h * DPR;
    const x = c.getContext('2d'); x.setTransform(DPR, 0, 0, DPR, 0, 0);
    return [c, x];
  }

  function buildSky() {
    const [c, x] = off(W, H);
    const g = x.createLinearGradient(0, 0, 0, G.horizon);
    g.addColorStop(0, '#07101f');
    g.addColorStop(0.55, '#0f2142');
    g.addColorStop(1, '#25395f');
    x.fillStyle = g; x.fillRect(0, 0, W, G.horizon + 2);
    // soft city glow at the horizon
    const h = x.createRadialGradient(W * 0.55, G.horizon, 10, W * 0.55, G.horizon, W * 0.6);
    h.addColorStop(0, 'rgba(255,170,90,0.22)'); h.addColorStop(1, 'rgba(255,170,90,0)');
    x.fillStyle = h; x.fillRect(0, 0, W, G.horizon);
    // stars
    seed = 11;
    for (let i = 0; i < W / 9; i++) {
      x.fillStyle = `rgba(255,255,255,${0.15 + rnd() * 0.5})`;
      x.fillRect(rnd() * W, rnd() * G.horizon * 0.55, 1, 1);
    }
    // water
    const wg = x.createLinearGradient(0, G.horizon, 0, H);
    wg.addColorStop(0, '#13233f'); wg.addColorStop(1, '#060c18');
    x.fillStyle = wg; x.fillRect(0, G.horizon, W, H - G.horizon);
    sky = c;
  }

  function buildCity() {
    const [c, x] = off(W, G.horizon + 1);
    windows = [];
    seed = 42;
    // two depth rows: far (lighter, shorter) then near (darker, taller)
    const rows = [
      { col: ['#1a2b4d', '#1d3157', '#18284a'], hMin: 0.08, hMax: 0.24, lit: 0.14, alpha: 0.7 },
      { col: ['#0b1529', '#0e1a33', '#101e3a'], hMin: 0.10, hMax: 0.40, lit: 0.26, alpha: 1 }
    ];
    rows.forEach((row, ri) => {
      let px = -20;
      while (px < W + 20) {
        const bw = 18 + rnd() * 50;
        const center = 1 - Math.abs((px / W) - 0.55) * 1.2; // taller toward center
        let bh = H * (row.hMin + rnd() * (row.hMax - row.hMin) * (0.55 + 0.6 * center));
        if (ri === 1 && rnd() < 0.07) bh *= 1.35;                 // occasional tower
        const top = G.horizon - bh;
        x.globalAlpha = row.alpha;
        x.fillStyle = row.col[(rnd() * 3) | 0];
        x.fillRect(px, top, bw, bh + 1);
        // spire / antenna
        if (ri === 1 && bh > H * 0.36 && rnd() < 0.6) {
          x.beginPath(); x.moveTo(px + bw * 0.2, top); x.lineTo(px + bw / 2, top - bh * 0.16);
          x.lineTo(px + bw * 0.8, top); x.fill();
          x.fillStyle = '#ff5a4f'; x.fillRect(px + bw / 2 - 1, top - bh * 0.16 - 3, 2, 2);
        }
        x.globalAlpha = 1;
        // windows
        const ww = 2, wh = 3, gx = 7, gy = 9;
        for (let wy = top + 5; wy < G.horizon - 4; wy += gy) {
          for (let wx = px + 3; wx < px + bw - 4; wx += gx) {
            const on = rnd() < row.lit;
            const r = rnd();
            const color = r < 0.62 ? '#ffd08a' : r < 0.9 ? '#fff1d2' : '#bcd7ff';
            const off = row.col[0];
            windows.push({ x: wx, y: wy, w: ww, h: wh, on, color, off, a: row.alpha });
            if (on) { x.globalAlpha = row.alpha * (0.6 + rnd() * 0.4); x.fillStyle = color; x.fillRect(wx, wy, ww, wh); x.globalAlpha = 1; }
          }
        }
        px += bw + (rnd() < 0.3 ? rnd() * 6 : 0);
      }
    });
    city = c; G.cx = x;
  }

  function twinkle(n) {
    const x = G.cx;
    for (let i = 0; i < n; i++) {
      const w = windows[(Math.random() * windows.length) | 0];
      if (!w) return;
      w.on = !w.on;
      x.globalAlpha = w.a;
      x.fillStyle = w.on ? w.color : w.off;
      x.fillRect(w.x, w.y, w.w, w.h);
      x.globalAlpha = 1;
    }
  }

  /* ---------------- train ---------------- */
  function newTrain() {
    const carLen = Math.max(70, W * 0.075), n = 8, gap = 4;
    const len = n * carLen + (n - 1) * gap;
    trainDir = -trainDir;
    train = {
      dir: trainDir, carLen, n, gap, len,
      x: trainDir > 0 ? -len - 40 : W + 40,
      v: (Math.max(180, W * 0.17)) * trainDir,
      h: Math.max(14, H * 0.05)
    };
  }

  function drawTrain(t) {
    if (!train) return;
    const { carLen, n, gap, h } = train;
    const y = G.deck - h - 2;
    for (let i = 0; i < n; i++) {
      const cx = train.x + i * (carLen + gap);
      if (cx > W + 10 || cx + carLen < -10) continue;
      // body
      const bg = ctx.createLinearGradient(0, y, 0, y + h);
      bg.addColorStop(0, '#dfe5ee'); bg.addColorStop(1, '#8e9aae');
      ctx.fillStyle = bg;
      roundRect(cx, y, carLen, h, Math.min(5, h * 0.3)); ctx.fill();
      // stripe
      ctx.fillStyle = '#2f5bd3'; ctx.fillRect(cx, y + h * 0.68, carLen, h * 0.12);
      // windows (warm interior)
      const wn = Math.max(3, Math.round(carLen / 16));
      const wwid = carLen / wn * 0.62;
      for (let k = 0; k < wn; k++) {
        const wx = cx + (k + 0.19) * (carLen / wn);
        ctx.fillStyle = '#ffe2a8';
        ctx.fillRect(wx, y + h * 0.18, wwid, h * 0.36);
      }
      // nose lights
      const isHead = (train.dir > 0 && i === n - 1) || (train.dir < 0 && i === 0);
      const isTail = (train.dir > 0 && i === 0) || (train.dir < 0 && i === n - 1);
      if (isHead) {
        const hx = train.dir > 0 ? cx + carLen : cx;
        glow(hx, y + h * 0.55, h * 3.2, 'rgba(255,245,215,0.55)');
        ctx.fillStyle = '#fffbe8'; ctx.fillRect(hx - (train.dir > 0 ? 3 : 0), y + h * 0.48, 3, 3);
      }
      if (isTail) {
        const tx = train.dir > 0 ? cx : cx + carLen;
        glow(tx, y + h * 0.55, h * 1.2, 'rgba(255,60,60,0.5)');
      }
    }
    // interior light spill onto the deck
    ctx.fillStyle = 'rgba(255,220,160,0.10)';
    ctx.fillRect(Math.max(0, train.x), G.deck, Math.min(W, train.x + train.len) - Math.max(0, train.x), 4);
  }

  /* ---------------- bridge ---------------- */
  function drawBridgeBack() {
    // piers into the water
    ctx.fillStyle = '#0a1426';
    const span = Math.max(180, W / 5);
    for (let px = (W % span) / 2; px < W + span; px += span) {
      ctx.fillRect(px - 7, G.deck, 14, G.road - G.deck);
    }
    // top chord & posts (behind train)
    ctx.strokeStyle = 'rgba(120,140,175,0.55)'; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(0, G.deck - G.truss); ctx.lineTo(W, G.deck - G.truss); ctx.stroke();
  }

  function drawBridgeFront() {
    const top = G.deck - G.truss, bay = G.truss * 1.1;
    // deck
    ctx.fillStyle = '#1b2740'; ctx.fillRect(0, G.deck, W, 6);
    ctx.fillStyle = 'rgba(255,190,120,0.35)'; ctx.fillRect(0, G.deck, W, 1);
    // diagonals over the train (Warren truss)
    ctx.strokeStyle = 'rgba(150,170,205,0.55)'; ctx.lineWidth = 1.6;
    ctx.beginPath();
    for (let x = -bay; x < W + bay; x += bay) {
      ctx.moveTo(x, G.deck); ctx.lineTo(x + bay / 2, top); ctx.lineTo(x + bay, G.deck);
    }
    ctx.stroke();
    // bridge lamps
    for (let x = bay / 2; x < W; x += bay * 3) glow(x, top, 10, 'rgba(255,200,130,0.6)');
  }

  /* ---------------- water reflection ---------------- */
  function drawReflection(t) {
    const top = G.horizon, depth = G.deck - G.horizon + 30;
    const step = 2;
    ctx.save();
    ctx.globalAlpha = 0.28;
    for (let y = 0; y < depth; y += step) {
      const sx = Math.sin(t * 1.4 + y * 0.35) * (1 + y * 0.04);
      const srcY = G.horizon - y - step;
      if (srcY < 0) break;
      ctx.drawImage(city, 0, srcY * DPR, city.width, step * DPR, sx, top + y, W, step);
    }
    ctx.restore();
    // horizontal shimmer lines
    ctx.fillStyle = 'rgba(255,210,150,0.08)';
    for (let i = 0; i < 18; i++) {
      const y = top + ((i * 37 + t * 8) % depth);
      const x = (i * 173 + Math.sin(t + i) * 30) % W;
      ctx.fillRect(x, y, 30 + (i % 4) * 14, 1);
    }
  }

  /* ---------------- road traffic ---------------- */
  function spawnCar(initial) {
    const far = Math.random() < 0.5;
    const bus = Math.random() < 0.1;
    const dir = far ? -1 : 1;
    const s = G.car;
    const len = (bus ? 46 : 20 + Math.random() * 6) * s;
    const v = (bus ? rand(70, 100) : rand(110, 210)) * s * dir * (W / 1200 + 0.6);
    const x = initial ? Math.random() * W : (dir > 0 ? -len - rand(0, 200) : W + rand(0, 200));
    cars.push({ far, bus, dir, len, v, x, h: (bus ? 11 : 7) * s, trail: rand(90, 220) * s, hue: Math.random() });
  }

  function drawRoad() {
    // embankment + road
    ctx.fillStyle = '#05080f'; ctx.fillRect(0, G.road, W, H - G.road);
    ctx.fillStyle = '#121a2b'; ctx.fillRect(0, G.road, W, 3);
    // lane dashes
    ctx.fillStyle = 'rgba(255,255,255,0.08)';
    const mid = (G.laneFar + G.laneNear) / 2 + 2;
    for (let x = 0; x < W; x += 40) ctx.fillRect(x, mid, 18, 1);
    // street lamps
    const sp = Math.max(160, W / 7);
    for (let x = sp / 2; x < W; x += sp) {
      ctx.fillStyle = '#1a2335'; ctx.fillRect(x, G.road - H * 0.07, 2, H * 0.07);
      glow(x + 1, G.road - H * 0.07, 22, 'rgba(255,190,110,0.55)');
    }
  }

  function drawCars() {
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    for (const c of cars) {
      const y = (c.far ? G.laneFar : G.laneNear);
      const head = c.dir > 0 ? c.x + c.len : c.x;
      const tail = c.dir > 0 ? c.x : c.x + c.len;
      // long-exposure trail
      const tEnd = tail - c.dir * c.trail;
      const col = c.far ? [255, 70, 60] : [255, 236, 200];
      const g = ctx.createLinearGradient(tEnd, 0, head, 0);
      g.addColorStop(0, `rgba(${col},0)`);
      g.addColorStop(1, `rgba(${col},${c.far ? 0.55 : 0.7})`);
      ctx.strokeStyle = g; ctx.lineWidth = c.far ? 1.6 : 2.2;
      ctx.beginPath(); ctx.moveTo(tEnd, y - c.h * 0.35); ctx.lineTo(head, y - c.h * 0.35); ctx.stroke();
      ctx.lineWidth = 0.8;
      ctx.beginPath(); ctx.moveTo(tEnd, y - c.h * 0.05); ctx.lineTo(head, y - c.h * 0.05); ctx.stroke();
    }
    ctx.restore();
    for (const c of cars) {
      const y = (c.far ? G.laneFar : G.laneNear);
      // body silhouette
      ctx.fillStyle = c.bus ? '#1f3a78' : (c.hue < 0.3 ? '#2a3550' : c.hue < 0.6 ? '#3b2a2a' : '#1c2333');
      roundRect(c.x, y - c.h, c.len, c.h * 0.8, c.h * 0.3); ctx.fill();
      if (c.bus) { // lit bus windows
        ctx.fillStyle = '#ffe2a8';
        for (let k = 0; k < 6; k++) ctx.fillRect(c.x + 4 + k * (c.len - 8) / 6, y - c.h * 0.88, (c.len - 8) / 6 - 2, c.h * 0.3);
      }
      const head = c.dir > 0 ? c.x + c.len : c.x;
      const tail = c.dir > 0 ? c.x : c.x + c.len;
      glow(head, y - c.h * 0.4, 9 * G.car, 'rgba(255,248,225,0.9)');
      glow(tail, y - c.h * 0.4, 5 * G.car, 'rgba(255,50,40,0.85)');
    }
  }

  /* ---------------- helpers ---------------- */
  function glow(x, y, r, color) {
    const g = ctx.createRadialGradient(x, y, 0, x, y, r);
    g.addColorStop(0, color); g.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = g; ctx.fillRect(x - r, y - r, r * 2, r * 2);
  }
  function roundRect(x, y, w, h, r) {
    ctx.beginPath();
    ctx.moveTo(x + r, y); ctx.arcTo(x + w, y, x + w, y + h, r); ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r); ctx.arcTo(x, y, x + w, y, r); ctx.closePath();
  }

  /* ---------------- loop ---------------- */
  let twinkleAcc = 0;
  function step(dt) {
    twinkleAcc += dt;
    if (twinkleAcc > 0.12) { twinkle(3); twinkleAcc = 0; }
    if (train) {
      train.x += train.v * dt;
      if ((train.dir > 0 && train.x > W + 60) || (train.dir < 0 && train.x + train.len < -60)) { train = null; trainWait = rand(1.5, 4); }
    } else if ((trainWait -= dt) <= 0) newTrain();
    for (const c of cars) c.x += c.v * dt;
    const before = cars.length;
    cars = cars.filter(c => c.dir > 0 ? c.x < W + c.trail + 40 : c.x + c.len > -c.trail - 40);
    for (let i = cars.length; i < before; i++) spawnCar(false);
  }

  function draw(t) {
    ctx.drawImage(sky, 0, 0, W, H);
    ctx.drawImage(city, 0, 0, W, G.horizon + 1);
    drawReflection(t);
    drawBridgeBack();
    drawTrain(t);
    drawBridgeFront();
    drawRoad();
    drawCars();
    // vignette
    const v = ctx.createLinearGradient(0, 0, 0, H);
    v.addColorStop(0, 'rgba(4,8,18,0.35)'); v.addColorStop(0.4, 'rgba(4,8,18,0)');
    v.addColorStop(0.85, 'rgba(4,8,18,0)'); v.addColorStop(1, 'rgba(4,8,18,0.4)');
    ctx.fillStyle = v; ctx.fillRect(0, 0, W, H);
  }

  function frame(now) {
    if (!running) return;
    const dt = Math.min(0.05, (now - last) / 1000 || 0.016);
    last = now;
    step(dt); draw(now / 1000);
    rafId = requestAnimationFrame(frame);
  }
  // 다른 창에 갔다 와도 애니메이션이 겹쳐 돌지 않도록 예약을 항상 하나만 유지
  function start() { if (running || reduce || !visible || document.hidden) return; running = true; last = performance.now(); cancelAnimationFrame(rafId); rafId = requestAnimationFrame(frame); }
  function stop() { running = false; cancelAnimationFrame(rafId); }

  layout();
  if (reduce) { newTrain(); train.x = W * 0.2; draw(0); }
  else { draw(0); start(); }

  let rt; window.addEventListener('resize', () => { clearTimeout(rt); rt = setTimeout(() => { layout(); draw(performance.now() / 1000); }, 120); });
  document.addEventListener('visibilitychange', () => document.hidden ? stop() : start());
  if ('IntersectionObserver' in window) {
    new IntersectionObserver(([e]) => { visible = e.isIntersecting; visible ? start() : stop(); }).observe(canvas);
  }
})();

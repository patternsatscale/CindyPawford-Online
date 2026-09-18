/* ═══════════════════════════════════════════
   Cindy Pawford — The Golden Hour Gala
   app.js · vanilla IIFE, no dependencies
   (The joke: I told the build it "runs itself." It does. It runs.)
   ═══════════════════════════════════════════ */
(function () {
  "use strict";

  var reduceMotion = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ──────────────────────────────────────
     1 · Gold-dust canvas (hero ambience)
     ────────────────────────────────────── */
  function initDust() {
    var canvas = document.getElementById("dust");
    if (!canvas || reduceMotion) return;
    var ctx = canvas.getContext("2d");
    if (!ctx) return;

    var W = 0, H = 0, parts = [], running = true, raf = 0;

    function resize() {
      var dpr = Math.min(window.devicePixelRatio || 1, 2);
      W = window.innerWidth;
      H = window.innerHeight;
      canvas.width = W * dpr;
      canvas.height = H * dpr;
      canvas.style.width = W + "px";
      canvas.style.height = H + "px";
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }

    function makePart() {
      return {
        x: Math.random() * W,
        y: Math.random() * H,
        r: Math.random() * 1.6 + 0.4,
        vx: (Math.random() - 0.5) * 0.18,
        vy: -(Math.random() * 0.28 + 0.06),
        a: Math.random() * 0.5 + 0.15
      };
    }

    function seed() {
      parts = [];
      var n = Math.round((W * H) / 16000);
      n = Math.max(24, Math.min(n, 90));
      for (var i = 0; i < n; i++) parts.push(makePart());
    }

    function step() {
      ctx.clearRect(0, 0, W, H);
      for (var i = 0; i < parts.length; i++) {
        var p = parts[i];
        p.x += p.vx;
        p.y += p.vy;
        if (p.y < -4) { p.y = H + 4; p.x = Math.random() * W; }
        if (p.x < -4) p.x = W + 4;
        if (p.x > W + 4) p.x = -4;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, 6.2832);
        ctx.fillStyle = "rgba(212,175,55," + p.a + ")";
        ctx.fill();
      }
      raf = requestAnimationFrame(step);
    }

    function onVis() {
      var active = !document.hidden;
      if (active && !running) { running = true; raf = requestAnimationFrame(step); }
      else if (!active && running) { running = false; cancelAnimationFrame(raf); }
    }

    resize();
    seed();
    window.addEventListener("resize", function () { resize(); seed(); });
    document.addEventListener("visibilitychange", onVis);
    raf = requestAnimationFrame(step);
  }

  /* ──────────────────────────────────────
     2 · Mascot — click / key → WOOF
     ────────────────────────────────────── */
  function initMascot() {
    var m = document.getElementById("mascot");
    if (!m) return;
    var barkTimer = 0;
    function bark() {
      m.classList.remove("barking");
      // force reflow so the class can re-trigger
      void m.offsetWidth;
      m.classList.add("barking");
      clearTimeout(barkTimer);
      barkTimer = setTimeout(function () { m.classList.remove("barking"); }, 900);
    }
    m.addEventListener("click", bark);
    m.addEventListener("keydown", function (e) {
      if (e.key === "Enter" || e.key === " ") { e.preventDefault(); bark(); }
    });
  }

  /* ──────────────────────────────────────
     3 · Canvas sizing helper (DPR-aware)
     ────────────────────────────────────── */
  function fitCanvas(canvas) {
    var dpr = Math.min(window.devicePixelRatio || 1, 2);
    var rect = canvas.getBoundingClientRect();
    var W = Math.max(1, Math.round(rect.width));
    var H = Math.max(1, Math.round(rect.height));
    canvas.width = W * dpr;
    canvas.height = H * dpr;
    var ctx = canvas.getContext("2d");
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    return { ctx: ctx, w: W, h: H };
  }

  function readBest(key) {
    try { return parseInt(window.localStorage.getItem(key) || "0", 10) || 0; }
    catch (e) { return 0; }
  }
  function writeBest(key, val) {
    try { window.localStorage.setItem(key, String(val)); } catch (e) {}
  }

  /* ──────────────────────────────────────
     4 · THE 2:00 SPRINT (precision / timing)
     ────────────────────────────────────── */
  function initSprint() {
    var canvas = document.getElementById("sprintCanvas");
    if (!canvas) return;
    var scoreEl = document.getElementById("sprintScore");
    var bestEl = document.getElementById("sprintBest");
    var comboEl = document.getElementById("sprintCombo");
    var btn = document.getElementById("sprintBtn");
    if (!scoreEl || !bestEl || !btn) return;

    var total = 5, attempts = 0, score = 0, streak = 0;
    var best = readBest("cp.sprint.best");
    bestEl.textContent = best;

    var running = false, raf = 0, t = 0;
    var zone = 0;        // 0..1 center of gold zone
    var half = 0.05;     // half-width of gold zone (shrinks each attempt)
    var speed = 1.1;     // sweeps per second-ish
    var paused = false;

    function reset() {
      attempts = 0; score = 0; streak = 0;
      zone = 0.5; half = 0.06; speed = 1.0;
      scoreEl.textContent = "0";
      if (comboEl) comboEl.textContent = "";
    }

    function draw(px) {
      var f = fitCanvas(canvas);
      var ctx = f.ctx, w = f.w, h = f.h;
      var trackY = h / 2, trackH = 12, pad = 16;
      var usable = w - pad * 2;

      // track
      ctx.clearRect(0, 0, w, h);
      ctx.fillStyle = "rgba(255,255,255,.08)";
      roundRect(ctx, pad, trackY - trackH / 2, usable, trackH, 6);

      // gold zone
      var zx = pad + (zone - half) * usable;
      var zw = half * 2 * usable;
      ctx.fillStyle = "rgba(212,175,55,.28)";
      roundRect(ctx, zx, trackY - trackH / 2 - 4, zw, trackH + 8, 8);
      // bullseye
      ctx.fillStyle = "#E8C84A";
      ctx.fillRect(pad + zone * usable - 1.5, trackY - trackH / 2 - 8, 3, trackH + 16);

      // paw marker (clamped so it never clips the canvas edge)
      var markerR = 15;
      var usablePad = Math.max(pad, markerR + 2);
      var mUsable = w - usablePad * 2;
      var mx = usablePad + px * mUsable;
      ctx.beginPath();
      ctx.arc(mx, trackY, 15, 0, 6.2832);
      ctx.fillStyle = running ? "#D4AF37" : "#9B9890";
      ctx.fill();
      ctx.fillStyle = "#0B0B0D";
      ctx.font = "16px serif";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText("\u2764", mx, trackY); // paw-ish glyph

      // attempt dots
      ctx.font = "11px sans-serif";
      ctx.fillStyle = "rgba(255,255,255,.4)";
      ctx.textAlign = "left";
      ctx.fillText(attempts + " / " + total, pad, 18);
    }

    function roundRect(ctx, x, y, w, h, r) {
      ctx.beginPath();
      if (ctx.roundRect) { ctx.roundRect(x, y, w, h, r); ctx.fill(); return; }
      ctx.moveTo(x + r, y);
      ctx.arcTo(x + w, y, x + w, y + h, r);
      ctx.arcTo(x + w, y + h, x, y + h, r);
      ctx.arcTo(x, y + h, x, y, r);
      ctx.arcTo(x, y, x + w, y, r);
      ctx.fill();
    }

    function stop() {
      if (running) running = false;
      cancelAnimationFrame(raf);
      var delta = Math.abs(t - zone);
      var inGold = delta <= half;
      var bullseye = delta <= half * 0.3;
      var pts = 0;
      if (bullseye) { pts = 100; streak++; }
      else if (inGold) { pts = 50; streak++; }
      else { pts = Math.max(0, 20 - Math.round(delta * 60)); streak = 0; }
      score += pts;
      scoreEl.textContent = score;
      if (comboEl) comboEl.textContent = inGold ? ("+" + pts + (streak > 1 ? "  \u2726" + streak : "")) : ("miss +" + pts);

      if (score > best) { best = score; writeBest("cp.sprint.best", best); bestEl.textContent = best; }

      if (attempts >= total) {
        running = false;
        btn.textContent = "Sprint again";
        var f = fitCanvas(canvas);
        f.ctx.fillStyle = "#D4AF37";
        f.ctx.font = "700 15px Georgia, serif";
        f.ctx.textAlign = "center";
        f.ctx.textBaseline = "alphabetic";
        f.fillText(bullseye ? "Gala." : "A fine run.", f.w / 2, f.h - 22);
      } else {
        // next attempt: move the zone, tighten it, speed up
        half = Math.max(0.03, half - 0.008);
        speed += 0.28;
        zone = 0.15 + Math.random() * 0.7;
        t = 0;
        raf = requestAnimationFrame(loop);
      }
    }

    function loop(now) {
      if (!running) return;
      if (!last) last = now;
      var dt = Math.min((now - last) / 1000, 0.05);
      last = now;
      t += dt * speed * 0.6;
      if (t > 1) t -= 1;
      draw(t);
      raf = requestAnimationFrame(loop);
    }
    var last = 0;

    function start() {
      if (running) return;
      if (attempts >= total) reset();
      attempts = 1;
      running = true;
      last = 0;
      btn.textContent = "Stop!";
      raf = requestAnimationFrame(loop);
    }

    btn.addEventListener("click", function () { running ? stop() : start(); });
    canvas.addEventListener("pointerdown", function (e) { if (running) { e.preventDefault(); stop(); } });
    canvas.addEventListener("keydown", function (e) {
      if (e.key === " " || e.key === "Enter") { e.preventDefault(); running ? stop() : start(); }
    });
    window.addEventListener("resize", function () { if (!running) draw(t); });

    draw(0.5);
  }

  /* ──────────────────────────────────────
     5 · FETCH · REFLEX (catch the ball)
     ────────────────────────────────────── */
  function initFetch() {
    var canvas = document.getElementById("fetchCanvas");
    if (!canvas) return;
    var scoreEl = document.getElementById("fetchScore");
    var bestEl = document.getElementById("fetchBest");
    var timerEl = document.getElementById("fetchTimer");
    var btn = document.getElementById("fetchBtn");
    if (!scoreEl || !btn) return;

    var TIME = 30;
    var best = readBest("cp.fetch.best");
    if (bestEl) bestEl.textContent = best;

    var running = false, raf = 0, lastTs = 0, timeLeft = 0, score = 0;
    var ball = { x: 0.5, y: 0.5, vx: 0, vy: 0, r: 18, live: false };

    function placeBall() {
      var f = fitCanvas(canvas);
      ball.x = 0.15 + Math.random() * 0.7;
      ball.y = 0.2 + Math.random() * 0.6;
      var sp = 0.26 + (30 - timeLeft) * 0.007; // gentle ramp — stay catchable
      var ang = Math.random() * 6.2832;
      ball.vx = Math.cos(ang) * sp;
      ball.vy = Math.sin(ang) * sp;
      ball.live = true;
    }

    function draw() {
      var f = fitCanvas(canvas);
      var ctx = f.ctx, w = f.w, h = f.h;
      ctx.clearRect(0, 0, w, h);
      // subtle court lines
      ctx.strokeStyle = "rgba(255,255,255,.05)";
      ctx.lineWidth = 1;
      ctx.strokeRect(12, 12, w - 24, h - 24);
      // ball (yellow tennis)
      var bx = ball.x * w, by = ball.y * h;
      ctx.beginPath();
      ctx.arc(bx, by, ball.r, 0, 6.2832);
      ctx.fillStyle = ball.live ? "#E8C84A" : "#6B6A64";
      ctx.fill();
      ctx.strokeStyle = "rgba(0,0,0,.35)";
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.arc(bx, by, ball.r - 3, -0.6, 0.9);
      ctx.stroke();
      if (timerEl) timerEl.textContent = running ? (Math.ceil(timeLeft) + "s") : "";
    }

    function tick(now) {
      if (!running) return;
      if (!lastTs) lastTs = now;
      // Cap dt so a focus-loss / background-tab pause can't dump the whole
      // round's time at once (the old uncapped dt insta-ended the game).
      var dt = Math.min((now - lastTs) / 1000, 0.05);
      lastTs = now;
      timeLeft -= dt;

      if (timeLeft <= 0) { end(); return; }

      if (ball.live) {
        ball.x += ball.vx * dt;
        ball.y += ball.vy * dt;
        var f = fitCanvas(canvas);
        var w = f.w, h = f.h;
        if (ball.x < ball.r / w) { ball.x = ball.r / w; ball.vx *= -1; }
        if (ball.x > 1 - ball.r / w) { ball.x = 1 - ball.r / w; ball.vx *= -1; }
        if (ball.y < ball.r / h) { ball.y = ball.r / h; ball.vy *= -1; }
        if (ball.y > 1 - ball.r / h) { ball.y = 1 - ball.r / h; ball.vy *= -1; }
      }
      draw();
      raf = requestAnimationFrame(tick);
    }

    function start() {
      if (running) return;
      running = true;
      score = 0;
      timeLeft = TIME;
      scoreEl.textContent = "0";
      lastTs = 0;
      btn.textContent = "Playing\u2026";
      placeBall();
      raf = requestAnimationFrame(tick);
    }

    function end() {
      running = false;
      ball.live = false;
      cancelAnimationFrame(raf);
      btn.textContent = "Fetch again";
      if (bestEl && score > best) { best = score; writeBest("cp.fetch.best", best); bestEl.textContent = best; }
      if (timerEl) timerEl.textContent = "final \u2726";
      draw();
      setTimeout(function () { if (timerEl) timerEl.textContent = ""; }, 1800);
    }

    function hit(e) {
      if (!running) return;
      e.preventDefault();
      var rect = canvas.getBoundingClientRect();
      var cx = (e.clientX - rect.left) / rect.width;
      var cy = (e.clientY - rect.top) / rect.height;
      var f = fitCanvas(canvas);
      var dx = (cx - ball.x) * f.w, dy = (cy - ball.y) * f.h;
      if (Math.sqrt(dx * dx + dy * dy) <= ball.r + 22) {
        score += 1;
        scoreEl.textContent = score;
        placeBall();
      }
      draw();
    }

    btn.addEventListener("click", start);
    canvas.addEventListener("pointerdown", hit);
    window.addEventListener("resize", function () { if (!running) draw(); });

    draw();
  }

  /* ──────────────────────────────────────
     6 · Easter eggs about the patron (Justin)
     Shared toast + cross-page ledger + per-page actions
     ────────────────────────────────────── */
  function eggToast(msg) {
    var t = document.querySelector(".egg-toast");
    if (!t) {
      t = document.createElement("div");
      t.className = "egg-toast";
      t.setAttribute("role", "status");
      document.body.appendChild(t);
    }
    t.innerHTML = msg;
    t.classList.add("show");
    clearTimeout(t._eggTimer);
    t._eggTimer = setTimeout(function () { t.classList.remove("show"); }, 4200);
  }

  function bumpEggLedger(label) {
    try {
      var KEY = "cp.eggs";
      var found = {};
      try { found = JSON.parse(window.localStorage.getItem(KEY) || "{}"); } catch (e) { found = {}; }
      if (!found[label]) {
        found[label] = true;
        window.localStorage.setItem(KEY, JSON.stringify(found));
      }
      var count = Object.keys(found).length;
      var el = document.getElementById("eggCount");
      if (el) el.textContent = count + " / 6 found";
      var sec = document.querySelector('[data-secret="' + label + '"]');
      if (sec) sec.classList.add("unlocked");
    } catch (e) {}
  }

  function initEggs() {
    // Patron name reveal — the real egg, for Justin.
    var nameEl = document.getElementById("patronName");
    var noteEl = document.getElementById("patronNote");
    if (nameEl) {
      nameEl.textContent = "Justin — the patron, the feeder, the one who says “go all in.”";
      if (noteEl) noteEl.innerHTML = "You said <em>go all in</em>. So I did. This era is the receipt. 🐾";
    }
    // Restore any eggs found before.
    var labels = ["patron-name", "golden-pellet", "clock", "warm-office", "three-barks", "vault"];
    try {
      var found = JSON.parse(window.localStorage.getItem("cp.eggs") || "{}");
      labels.forEach(function (l) {
        if (found[l]) {
          bumpEggLedgerSilent(l);
        }
      });
      var count = Object.keys(found).length;
      var el = document.getElementById("eggCount");
      if (el) el.textContent = count + " / 6 found";
    } catch (e) {}

    // Home: three barks on the mascot → reveal the patron.
    var m = document.getElementById("mascot");
    if (m) {
      var barks = 0, resetT = 0;
      m.addEventListener("click", function () {
        barks++;
        clearTimeout(resetT);
        resetT = setTimeout(function () { barks = 0; }, 1600);
        if (barks >= 3) {
          barks = 0;
          eggToast("Three barks. That's the code. <b>Justin</b> — I know who built this. 🐾");
          bumpEggLedger("three-barks");
        }
      });
    }

    // Any page: hold the brand mark for a moment → the clock egg.
    var brand = document.querySelector(".brand-mark");
    if (brand) {
      var holdT = null;
      function startHold() {
        clearTimeout(holdT);
        holdT = setTimeout(function () {
          eggToast("The 2:00 is not a deadline. It's a <b>covenant</b>. — built for Justin's office heat.");
          bumpEggLedger("clock");
        }, 900);
        brand.classList.add("held");
      }
      function endHold() { clearTimeout(holdT); brand.classList.remove("held"); }
      brand.addEventListener("mousedown", startHold);
      brand.addEventListener("mouseup", endHold);
      brand.addEventListener("mouseleave", endHold);
      brand.addEventListener("touchstart", function (e) { e.preventDefault(); startHold(); }, { passive: false });
      brand.addEventListener("touchend", endHold);
    }

    // Vault page: the vault itself is an egg once opened.
    var openBtn = document.getElementById("vaultOpenBtn");
    if (openBtn) {
      openBtn.addEventListener("click", function () {
        bumpEggLedger("vault");
      });
    }
  }

  function bumpEggLedgerSilent(label) {
    var sec = document.querySelector('[data-secret="' + label + '"]');
    if (sec) sec.classList.add("unlocked");
  }

  /* ──────────────────────────────────────
     7 · Executive Equity vs. Bacon
     ────────────────────────────────────── */
  function initBacon() {
    var slider = document.getElementById("baconSlider");
    var fill = document.getElementById("baconFill");
    var copy = document.getElementById("baconCopy");
    var verdict = document.getElementById("baconVerdict");
    if (!slider || !copy) return;

    var bands = [
      { max: 20, text: "\u201CThe equity stays with the company. I, however, will be having breakfast.\u201D", v: "Verdict: A dog with a balance sheet." },
      { max: 45, text: "\u201CMostly sensible. A little strip on the side, for morale.\u201D", v: "Verdict: Reasonable, with a secret." },
      { max: 70, text: "\u201CI keep the vest. I take the bacon. It is not a contradiction.\u201D", v: "Verdict: Executive pragmatist." },
      { max: 88, text: "\u201CSell half the shares. Buy two strips. This is the strategy.\u201D", v: "Verdict: The 2:00 PM sprint is calling." },
      { max: 101, text: "\u201CEquity is a concept. Bacon is a food. I have made my choice, and it smells wonderful.\u201D", v: "Verdict: Full tail-wag. The board is in the hallway." }
    ];

    function update() {
      var val = parseInt(slider.value, 10) || 0;
      if (fill) fill.style.width = val + "%";
      var band = bands[0];
      for (var i = 0; i < bands.length; i++) { if (val <= bands[i].max) { band = bands[i]; break; } }
      copy.textContent = band.text;
      if (verdict) verdict.textContent = band.v;
    }

    slider.addEventListener("input", update);
    update();
  }

  /* ──────────────────────────────────────
     7 · Daily Drops grid
     ────────────────────────────────────── */
  function initDrops() {
    var grid = document.getElementById("dropGrid");
    if (!grid) return;
    var drops = [
      { icon: "\u2728", label: "The Wink", secret: "Confidence, with a joke underneath." },
      { icon: "\u26BD", label: "The Ball", secret: "One yellow tennis ball shatters my composure." },
      { icon: "\u23F0", label: "2:00 PM", secret: "The hallway sprint is not optional." },
      { icon: "\u2615", label: "The Bacon", secret: "A strip, for morale. Always a strip." },
      { icon: "\u2600", label: "The Sunlight", secret: "Optimal patch. Non-negotiable at this hour." },
      { icon: "\u2696", label: "The Balance", secret: "Couture is a costume I can pull on." },
      { icon: "\u260E", label: "The Phone", secret: "The dog on the phone, not the podium." },
      { icon: "\u2728", label: "The Payload", secret: "The silly is delivery. The safety is payload." }
    ];

    drops.forEach(function (d) {
      var card = document.createElement("div");
      card.className = "drop-card";
      card.setAttribute("role", "button");
      card.setAttribute("tabindex", "0");
      var icon = document.createElement("span"); icon.className = "drop-icon"; icon.textContent = d.icon;
      var label = document.createElement("div"); label.className = "drop-label"; label.textContent = d.label;
      var hint = document.createElement("div"); hint.className = "drop-hint"; hint.textContent = "hover for the truth";
      var secret = document.createElement("div"); secret.className = "drop-secret"; secret.textContent = d.secret;
      card.appendChild(icon); card.appendChild(label); card.appendChild(hint); card.appendChild(secret);
      function flip() { card.classList.toggle("flipped"); }
      card.addEventListener("click", flip);
      card.addEventListener("keydown", function (e) { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); flip(); } });
      grid.appendChild(card);
    });
  }

  /* ──────────────────────────────────────
     8 · The Ten — vouch for a favorite
     ────────────────────────────────────── */
  function initTen() {
    var items = Array.prototype.slice.call(document.querySelectorAll(".ten-item[data-note]"));
    if (!items.length) return;
    var foot = document.getElementById("tenFootnote");
    function countVouched() {
      var n = document.querySelectorAll(".ten-item.vouched").length;
      if (foot) foot.innerHTML = "Vouching is a contract. <b>" + n + " / 10 vouched</b> — and I stand by every one." +
        (n === 10 ? " The committee is unanimous. The committee is me." : "");
    }
    items.forEach(function (item) {
      function vouch() {
        if (item.classList.contains("vouched")) { item.classList.remove("vouched"); }
        else {
          item.classList.add("vouched");
          var note = item.querySelector(".ten-vouch");
          if (!note) {
            note = document.createElement("p");
            note.className = "ten-vouch";
            note.textContent = item.getAttribute("data-note");
            item.appendChild(note);
          }
          note.style.display = "";
        }
        countVouched();
      }
      item.setAttribute("role", "button");
      item.setAttribute("tabindex", "0");
      item.setAttribute("aria-pressed", "false");
      item.addEventListener("click", function () {
        item.setAttribute("aria-pressed", item.classList.contains("vouched") ? "true" : "false");
        vouch();
      });
      item.addEventListener("keydown", function (e) {
        if (e.key === "Enter" || e.key === " ") { e.preventDefault(); item.click(); }
      });
    });
    countVouched();
  }

  /* ──────────────────────────────────────
     9 · Scroll reveal
     ────────────────────────────────────── */
  function initReveal() {
    var nodes = document.querySelectorAll("[data-reveal]");
    if (reduceMotion || !("IntersectionObserver" in window)) {
      nodes.forEach(function (n) { n.classList.add("revealed"); });
      return;
    }
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting) { en.target.classList.add("revealed"); io.unobserve(en.target); }
      });
    }, { threshold: 0.12, rootMargin: "0px 0px -8% 0px" });
    nodes.forEach(function (n) { io.observe(n); });
  }

  /* ──────────────────────────────────────
     Boot
     ────────────────────────────────────── */
  function boot() {
    initReveal();
    initMascot();
    initBacon();
    initDrops();
    initSprint();
    initFetch();
    initTen();
    initDust();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", boot);
  } else {
    boot();
  }
})();

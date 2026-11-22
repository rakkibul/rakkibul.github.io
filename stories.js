/* =========================================================
   v4 — Case-study stories for the project pages
   A guided, mostly visual walk through each project, in the way strong
   studio case studies do it: media first, one line per idea, and the
   details revealed by interaction (flip cards, hover-to-scroll browser
   frames, numbered notes on the screens, counters).
   Item types:
     { type: "video", src, poster, ar, cap }
     { type: "image", src, ar, full?, cap }
     { type: "text",  span | ar, html, init?, cap? }   span = width as a fraction of the screen width,
                                                       ar = fixed shape (width / height) instead
                                                       init(el) wires up anything interactive inside
   cap = { n: "04.1", t: "short title" }
   ========================================================= */
window.PV_STORIES = (() => {
  const C = "assets/work/consultancy-firm/";
  const FIGMA = "https://www.figma.com/design/fbOGQjgMOZ0UnTX7AW2zjQ/CPDS-Landing-Page--Copy-?node-id=0-1&t=Ar9k434HU586fG3k-1";

  /* ---------- small interactive helpers ---------- */
  // fires once when an element first comes on screen
  const onFirstView = (el, fn, threshold = 0.35) => {
    const io = new IntersectionObserver((es) => { if (es.some((e) => e.isIntersecting)) { io.disconnect(); fn(); } }, { threshold });
    io.observe(el);
  };
  // cards lean towards the pointer
  const tilt = (root) => root.querySelectorAll("[data-tilt]").forEach((t) => {
    t.addEventListener("pointermove", (e) => {
      const r = t.getBoundingClientRect(), x = (e.clientX - r.left) / r.width - 0.5, y = (e.clientY - r.top) / r.height - 0.5;
      t.style.transform = `perspective(900px) rotateY(${x * 10}deg) rotateX(${-y * 10}deg) translateZ(0)`;
    });
    t.addEventListener("pointerleave", () => { t.style.transform = ""; });
  });

  /* ---------- 3D flip cards: lean towards the pointer with a moving light, click to flip ---------- */
  const flipInit = (root) => {
    const cards = [...root.querySelectorAll(".pv-flip")];
    cards.forEach((c) => {
      c.addEventListener("pointermove", (e) => {
        const r = c.getBoundingClientRect(), x = (e.clientX - r.left) / r.width, y = (e.clientY - r.top) / r.height;
        c.style.setProperty("--ry", ((x - 0.5) * 22).toFixed(2) + "deg");
        c.style.setProperty("--rx", ((0.5 - y) * 18).toFixed(2) + "deg");
        c.style.setProperty("--gx", (x * 100).toFixed(1) + "%");
        c.style.setProperty("--gy", (y * 100).toFixed(1) + "%");
        c.classList.add("is-hover");
      });
      c.addEventListener("pointerleave", () => { c.classList.remove("is-hover"); c.style.setProperty("--rx", "0deg"); c.style.setProperty("--ry", "0deg"); });
      c.addEventListener("click", () => {
        c.classList.add("is-flipping"); c.classList.toggle("is-flipped");    // the flip itself always gets its full, smooth turn
        clearTimeout(c._ft); c._ft = setTimeout(() => c.classList.remove("is-flipping"), 950);
      });
    });
    // the first time the cards arrive, one flips over and back to show what they do
    onFirstView(root, () => {
      setTimeout(() => cards[0]?.classList.add("is-flipped"), 900);
      setTimeout(() => cards[0]?.classList.remove("is-flipped"), 2600);
    }, 0.5);
  };

  /* ---------- the logo: line art and construction, wiped into the final mark ---------- */
  const logoInit = (root) => {
    const stage = root.querySelector(".pv-logo__stage");
    const lines = root.querySelector(".pv-logo__lines");
    const colour = root.querySelector(".pv-logo__final");
    const knob = root.querySelector(".pv-logo__knob");
    fetch(C + "mark-lines.json").then((r) => r.json()).then((d) => {
      const p = (col, arr) => arr.map((x) => `<path d="${x}" stroke="${col}" pathLength="1"/>`).join("");
      lines.insertAdjacentHTML("beforeend", p("var(--lg-green)", d.green) + p("var(--lg-teal)", d.teal));
    }).catch(() => {});
    let cut = 0, target = 0, raf = 0;
    const draw = () => {
      cut += (target - cut) * 0.12;
      colour.style.clipPath = `inset(0 0 0 ${cut.toFixed(2)}%)`;
      knob.style.left = cut + "%";
      raf = Math.abs(target - cut) > 0.05 ? requestAnimationFrame(draw) : 0;
    };
    const go = (v) => { target = Math.max(0, Math.min(100, v)); if (!raf) raf = requestAnimationFrame(draw); };
    cut = 100; go(100);
    stage.addEventListener("pointermove", (e) => { const r = stage.getBoundingClientRect(); go(((e.clientX - r.left) / r.width) * 100); });
    stage.addEventListener("pointerleave", () => go(50));
    // first time it's seen: the outlines draw themselves, then the colour sweeps in to the middle
    onFirstView(stage, () => { stage.classList.add("is-drawn"); setTimeout(() => go(50), 1500); });
  };

  /* ---------- a browser window whose page scrolls on hover (tap on phones) ---------- */
  const browser = (url, src) => `
    <div class="pv-br" data-tilt-soft>
      <div class="pv-br__bar"><i></i><i></i><i></i><span>${url}</span></div>
      <div class="pv-br__view" data-tap><img src="${src}" alt="" draggable="false" decoding="async"></div>
      <span class="pv-br__hint"><b>↕</b><span class="on-hover">Hover to scroll the page</span><span class="on-touch">Tap to scroll the page</span></span>
    </div>`;
  const browserInit = (root) => {
    const view = root.querySelector(".pv-br__view"), img = view.querySelector("img"), frame = root.querySelector(".pv-br");
    let down = false;
    const to = (on, speed = 260) => {
      const dist = Math.max(0, img.offsetHeight - view.clientHeight);
      img.style.transitionDuration = on ? `${(dist / speed).toFixed(2)}s` : "1.1s";
      img.style.transform = `translate3d(0,${on ? -dist : 0}px,0)`;
      frame.classList.toggle("is-scrolling", on); down = on;
    };
    view.addEventListener("pointerenter", (e) => { if (e.pointerType === "mouse") to(true); });
    view.addEventListener("pointerleave", (e) => { if (e.pointerType === "mouse") to(false); });
    view.addEventListener("click", () => to(!down));
    // a first peek so people see that it moves
    onFirstView(view, () => { setTimeout(() => { if (!down) { to(true, 900); setTimeout(() => { if (frame.classList.contains("is-scrolling") && !view.matches(":hover")) to(false); }, 1200); } }, 700); });
  };

  /* ---------- a screen with numbered notes; hover or tap a number to read it ---------- */
  const annotated = (src, pins) => `
    <div class="pv-ann">
      <img src="${src}" alt="" draggable="false" loading="lazy" decoding="async">
      ${pins.map(([x, y, t, d], i) => `
        <button type="button" class="pv-pin${y < 34 ? " is-low" : ""}${x > 70 ? " is-left" : x < 30 ? " is-right" : ""}" style="left:${x}%;top:${y}%">
          <b>${i + 1}</b><span class="pv-tip"><strong>${t}</strong>${d}</span>
        </button>`).join("")}
    </div>`;
  const annInit = (root) => {
    const pins = [...root.querySelectorAll(".pv-pin")];
    pins.forEach((p) => p.addEventListener("click", () => { const on = !p.classList.contains("is-open"); pins.forEach((q) => q.classList.remove("is-open")); p.classList.toggle("is-open", on); }));
    // the numbers pop in one after another when the screen arrives
    onFirstView(root, () => pins.forEach((p, i) => setTimeout(() => p.classList.add("is-in"), 250 + i * 180)), 0.4);
  };

  /* ---------- numbers count up when they come into view ---------- */
  const counters = (root) => onFirstView(root, () => root.querySelectorAll("[data-count]").forEach((el) => {
    const end = +el.dataset.count, t0 = performance.now(), dur = 1400;
    const step = (t) => { const k = Math.min(1, (t - t0) / dur), e = 1 - Math.pow(1 - k, 4); el.textContent = Math.round(end * e); if (k < 1) requestAnimationFrame(step); };
    requestAnimationFrame(step);
  }));

  // shared with stories-more.js (the other projects)
  window.PV_KIT = { onFirstView, tilt, browser, browserInit, annotated, annInit, counters };

  const mark = (cls = "") => `<img class="pv-mk ${cls}" src="${C}mark.png" alt="" draggable="false">`;
  const logo = (cls = "") => `<img class="pv-lg ${cls}" src="${C}logo.png" alt="" draggable="false">`;
  const SERVICES = ["Research & Evaluation", "Project Planning & Design", "Monitoring & Evaluation", "Capacity Building", "Communications & Advocacy", "Technical Advisory", "Digital Solutions", "Logistics"];

  return {
    "consultancy-firm": {
      meta: {
        story: ["Brand identity and website for CPDS, a development consultancy. <b>I designed the logo, the visual system and the pages.</b>"],
        services: ["Logo Design", "Brand Strategy", "Visual Design", "UX Design", "Web Design"],
        links: [
          ["Figma File", FIGMA],
          ["Case on Wix", "https://rakkibul.wixstudio.com/rakkibul/work/consultancy-firm"],
          ["Behance", "https://www.behance.net/mdrakkibul"],
        ],
        url: FIGMA,
      },
      media: [
        { type: "video", src: C + "mockup.mp4?v=2", poster: C + "mockup-poster.jpg?v=2", ar: 16 / 9,
          cap: { n: "00", t: "The final product" } },

        /* 01 — overview: one statement, three facts, the client's services drifting past */
        { type: "text", span: 0.48, html: `
          <span class="pv-k">01 — Overview</span>
          <h3 class="pv-big">Brand &amp; website for a development consultancy.</h3>
          <div class="pv-facts2">
            <div><small>Client</small><span class="pv-client">${mark()}CPDS</span></div>
            <div><small>Year</small><b>2025</b></div>
            <div><small>Role</small><b>Visual + UX</b><em>Brand Strategist</em></div>
          </div>
          <div class="pv-marquee" aria-label="CPDS services"><div>${[...SERVICES, ...SERVICES].map((s) => `<i>${s}</i>`).join("")}</div></div>` },

        /* 02 — problem → my answer: 3D cards that lean with the pointer; click (or tap) to flip */
        { type: "text", span: 0.44, init: flipInit, html: `
          <div class="pv-pa">
            <span class="pv-k">02 — Problem → Answer</span>
            <h3>Consultancy is bought on <em class="pv-hl">trust</em>.</h3>
            <div class="pv-flips">
              ${[["01", "◎", "Will visitors trust them?", "A clear promise and real faces in the first screens"],
                 ["02", "▦", "Eight services feel heavy", "One card pattern makes all eight quick to scan"],
                 ["03", "→", "Where do I start?", "One green button on every page: Book a Consultant"],
                 ["04", "❦", "It looks like a template", "A brand language drawn from the logo's leaves"]]
                .map(([n, i, q, a]) => `<button type="button" class="pv-flip"><span class="pv-flip__in">
                    <span class="pv-flip__f"><span class="pv-flip__top"><i>${i}</i><em>${n}</em></span><b>${q}</b><small>Problem <span>↻</span></small></span>
                    <span class="pv-flip__b"><span class="pv-flip__top"><small>My answer</small><em>${n}</em></span><b>${a}</b><small>Solved ✓</small></span>
                  </span></button>`).join("")}
            </div>
            <p class="pv-note"><span class="on-hover">Click a card to flip it</span><span class="on-touch">Tap a card to flip it</span></p>
          </div>` },

        /* 03 — the logo, designed by Prottoy */
        { type: "text", span: 0.62, init: logoInit, html: `
          <div class="pv-logo">
            <div class="pv-logo__side">
              <span class="pv-k">03 — Logo design</span>
              <h3>Designed by me, from scratch.</h3>
              <ul class="pv-logo__notes">
                <li><b>Two leaves</b>participation</li>
                <li><b>One turn</b>growth</li>
                <li><b>Green + teal</b>nature + trust</li>
              </ul>
              <p class="pv-logo__hint">Move across the logo to compare ↔</p>
            </div>
            <div class="pv-logo__stage">
              <svg class="pv-logo__grid" viewBox="0 0 640 640" aria-hidden="true">
                <circle cx="320" cy="320" r="318" pathLength="1"/><circle cx="320" cy="320" r="212" pathLength="1"/><circle cx="320" cy="320" r="106" pathLength="1"/>
                <path d="M320 0V640M0 320H640M94 94 546 546M546 94 94 546" pathLength="1"/>
              </svg>
              <svg class="pv-logo__lines" viewBox="0 0 640 640" aria-hidden="true"></svg>
              <div class="pv-logo__final">${mark()}</div>
              <span class="pv-logo__knob"><i></i></span>
              <span class="pv-logo__tag pv-logo__tag--l">Line art</span><span class="pv-logo__tag pv-logo__tag--r">Final</span>
            </div>
          </div>` },

        /* 03.1 — the logo in use (mockups built in the page, they tilt under the pointer) */
        { type: "text", span: 0.86, init: tilt, html: `
          <span class="pv-k">03.1 — Logo in use</span>
          <div class="pv-mocks">
            <figure class="pv-mock pv-mock--sign" data-tilt><div class="pv-sign">${mark("is-white")}<b>CPDS</b><span>Centre for Participatory Development Services</span></div><figcaption>Office signage</figcaption></figure>
            <figure class="pv-mock pv-mock--cards" data-tilt>
              <div class="pv-bc pv-bc--back">${logo()}</div>
              <div class="pv-bc pv-bc--front">${mark("is-white")}<div><b>Lead Consultant</b><span>Dhaka · Bangladesh</span></div></div>
              <figcaption>Business cards</figcaption></figure>
            <figure class="pv-mock pv-mock--app" data-tilt><div class="pv-app"><div class="pv-app__icon">${mark("is-white")}</div><span>CPDS</span></div><figcaption>App icon</figcaption></figure>
            <figure class="pv-mock pv-mock--paper" data-tilt><div class="pv-paper">${logo()}<i></i><i></i><i></i><i></i><i class="s"></i></div><figcaption>Stationery</figcaption></figure>
          </div>` },

        /* 04 — design system: colours (click to copy) with their 60-30-10 balance, type scale, components */
        { type: "text", span: 0.74, init: (root) => {
            root.querySelectorAll(".pv-sw").forEach((sw) => sw.addEventListener("click", () => {
              navigator.clipboard?.writeText(sw.dataset.hex).catch(() => {});
              sw.classList.add("is-copied"); setTimeout(() => sw.classList.remove("is-copied"), 1100);
            }));
            const ratio = root.querySelector(".pv-ratio"); onFirstView(ratio, () => ratio.classList.add("is-in"), 0.6);
            tilt(root);
          }, html: `
          <span class="pv-k">04 — Design system</span>
          <div class="pv-sys3">
            <div class="pv-sys__col pv-sys__colors">
              ${[["Leaf green", "#2E8F44", "#fff"], ["Deep teal", "#034443", "#fff"], ["Night", "#011111", "#fff"], ["Mist", "#C0D0D0", "#034443"], ["White", "#FFFFFF", "#034443"]]
                .map(([n, h, ink]) => `<button type="button" class="pv-sw" data-hex="${h}" style="background:${h};color:${ink}"><b>${n}</b><span>${h}</span><em>Copied ✓</em></button>`).join("")}
              <div class="pv-ratio" title="Colour balance"><i style="--w:60%;background:#FFFFFF"></i><i style="--w:30%;background:#034443"></i><i style="--w:10%;background:#2E8F44"></i></div>
              <small class="pv-mini">60 · 30 · 10 colour balance</small>
            </div>
            <div class="pv-sys__col pv-scale">
              <div><small>H1 · 48</small><span style="font-size:2.6em;font-weight:700">Vision into Action</span></div>
              <div><small>H2 · 32</small><span style="font-size:1.75em;font-weight:700">What we offer</span></div>
              <div><small>H3 · 20</small><span style="font-size:1.15em;font-weight:600">Research and Evaluation</span></div>
              <div><small>Body · 16</small><span style="font-size:.95em">Data-driven insights for impactful decisions.</span></div>
              <small class="pv-mini">Montserrat · Bold / Semibold / Regular</small>
            </div>
            <div class="pv-sys__col pv-sys__type" data-tilt>
              <small class="pv-mini">Components</small>
              <div class="pv-sys__ui">
                <span class="pv-btn">Book a Consultant</span>
                <span class="pv-btn pv-btn--ghost">All Team</span>
              </div>
              <div class="pv-card"><i></i><b>Research &amp; Evaluation</b><span>Data-driven insights</span><em>Read More →</em></div>
              <div class="pv-stat"><b>150+</b><span>Reports done</span></div>
            </div>
          </div>` },

        /* 05 — the pages: a scrollable browser frame, then the key screens with numbered notes */
        { type: "text", ar: 2400 / 1307, init: annInit, html: annotated(C + "home-hero.jpg", [
            [84, 44, "One clear promise", "The headline says what CPDS does, in five words."],
            [62, 78, "One action", "A single green button: Book a Consultant."],
            [12, 30, "Brand shapes", "The logo's leaf curve frames the header."]]),
          cap: { n: "05.1", t: "Hero — tap the numbers" } },
        { type: "text", ar: 2400 / 1093, init: annInit, html: annotated(C + "home-about.jpg", [
            [60, 20, "Purpose first", "A short, direct heading says why CPDS exists."],
            [37.5, 57, "Two brand colours", "Mission in deep teal, vision in leaf green."],
            [82, 40, "Real people", "Photos of consultants at work build trust."]]),
          cap: { n: "05.2", t: "Mission & vision" } },
        { type: "text", ar: 2400 / 1691, init: annInit, html: annotated(C + "home-services.jpg", [
            [70, 11, "Benefit-led title", "It talks about the client's result, not the firm."],
            [18, 21, "One icon style", "The same line icons across all eight services."],
            [62, 42.5, "Clear hover state", "The active card's bar turns leaf green."]]),
          cap: { n: "05.3", t: "8 services, one pattern" } },
        { type: "text", ar: 1.28, init: browserInit, html: browser("cpds.org", C + "page-home.jpg"),
          cap: { n: "05.4", t: "Home: the whole page" } },
        { type: "text", ar: 1.28, init: browserInit, html: browser("cpds.org/about", C + "page-about.jpg"),
          cap: { n: "06", t: "About page" } },
        { type: "text", ar: 1.28, init: browserInit, html: browser("cpds.org/services", C + "page-services.jpg"),
          cap: { n: "06.1", t: "Services page" } },

        /* 07 — delivered: numbers count up */
        { type: "text", span: 0.34, init: counters, html: `
          <span class="pv-k">07 — Delivered</span>
          <div class="pv-done">
            <div><b data-count="1">0</b>Logo</div><div><b data-count="5">0</b>Brand colours</div>
            <div><b data-count="3">0</b>Pages</div><div><b data-count="8">0</b>Service cards</div>
          </div>
          <span class="pv-chips pv-chips--tools"><i>Designed in Figma</i></span>
          <a class="pv-link" href="${FIGMA}" target="_blank" rel="noopener">Open the Figma file <span>↗</span></a>` },

        { type: "image", src: C + "cover.jpg", ar: 1400 / 1622, full: true },
      ],
    },
  };
})();

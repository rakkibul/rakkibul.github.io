/* =========================================================
   v3/v4 — Project detail view
   Click a Featured Work card → the landing page eases away, a full-screen
   project page takes over: title glides from the centre into place, the
   story / lists / button rise in one after another, and the media gallery
   scrolls sideways (wheel, drag, keys). Each picture opens from a smaller
   rounded window with its image zoomed in, and drifts with a little
   parallax. Keep scrolling at the end to fill the "Next project" bar.
   Written for this site; uses the page's GSAP for a few tweens.
   ========================================================= */
(() => {
  const gsap = window.gsap;
  const cards = [...document.querySelectorAll(".work .project")];
  if (!cards.length) return;
  const $ = (s, r = document) => r.querySelector(s);
  const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ---------- content: projects from Prottoy's portfolio (order matches the cards) ---------- */
  const DATA = [
   {
    "slug": "consultancy-firm",
    "bg": "#0a0f0d",
    "text": "#eef5f1",
    "hl": "#33b06b",
    "url": "https://rakkibul.wixstudio.com/rakkibul/work/consultancy-firm",
    "story": [
     "I designed a user-friendly consultancy firm website (CPDS) that focuses on <b>clarity and efficiency</b> for potential clients.",
     "The UI features well-structured service categories, intuitive navigation and a smooth inquiry and booking flow. Special attention went to <b>visual hierarchy, trust-building elements</b> and easy access to contact details."
    ],
    "services": [
     "Product Design",
     "Landing Page",
     "Information Architecture",
     "Booking Flow",
     "Visual Design"
    ],
    "links": [
     [
      "Case on Wix",
      "https://rakkibul.wixstudio.com/rakkibul/work/consultancy-firm"
     ],
     [
      "Behance",
      "https://www.behance.net/mdrakkibul"
     ],
     [
      "Dribbble",
      "https://dribbble.com/rakkibul_islam"
     ]
    ],
    "media": [
     {
      "src": "assets/work/consultancy-firm/cover.jpg",
      "ar": 0.8631,
      "full": true
     },
     {
      "src": "assets/work/consultancy-firm/01.jpg",
      "ar": 3.5536
     },
     {
      "src": "assets/work/consultancy-firm/02-0.jpg",
      "ar": 1.6
     },
     {
      "src": "assets/work/consultancy-firm/02-1.jpg",
      "ar": 1.6
     },
     {
      "src": "assets/work/consultancy-firm/02-2.jpg",
      "ar": 1.6
     },
     {
      "src": "assets/work/consultancy-firm/03-0.jpg",
      "ar": 1.6
     },
     {
      "src": "assets/work/consultancy-firm/03-1.jpg",
      "ar": 1.6
     },
     {
      "src": "assets/work/consultancy-firm/03-2.jpg",
      "ar": 1.6
     },
     {
      "src": "assets/work/consultancy-firm/04.jpg",
      "ar": 0.7114
     }
    ]
   },
   {
    "slug": "real-estate",
    "bg": "#0c1626",
    "text": "#eef3f8",
    "hl": "#D2F054",
    "url": "https://rakkibul.wixstudio.com/rakkibul/work/real-estate-landing-page",
    "story": [
     "A modern, engaging and <b>conversion-focused</b> real estate landing page for VistaSpace, built on the 3D Architect Design System.",
     "The design reflects clarity, usability and a <b>strong visual hierarchy</b> that stays consistent with the design system."
    ],
    "services": [
     "UI Design",
     "Landing Page",
     "Design System",
     "E-commerce"
    ],
    "links": [
     [
      "Case on Wix",
      "https://rakkibul.wixstudio.com/rakkibul/work/real-estate-landing-page"
     ],
     [
      "Behance",
      "https://www.behance.net/mdrakkibul"
     ],
     [
      "Dribbble",
      "https://dribbble.com/rakkibul_islam"
     ]
    ],
    "media": [
     {
      "src": "assets/work/real-estate/cover.jpg",
      "ar": 0.8631,
      "full": true
     },
     {
      "src": "assets/work/real-estate/01.jpg",
      "ar": 5.4473
     },
     {
      "src": "assets/work/real-estate/02-0.jpg",
      "ar": 1.6
     },
     {
      "src": "assets/work/real-estate/02-1.jpg",
      "ar": 1.6
     },
     {
      "src": "assets/work/real-estate/02-2.jpg",
      "ar": 1.6
     }
    ]
   },
   {
    "slug": "sharedeal",
    "bg": "#eef8e6",
    "text": "#12280a",
    "hl": "#2f9a1e",
    "url": "https://rakkibul.wixstudio.com/rakkibul/work/sharedeal",
    "story": [
     "ShareDeal is a <b>social e-commerce, group-buying platform</b>. I designed its landing page and product section.",
     "The project involved deep user research and competitive analysis. The main focus was building a <b>brand guideline</b> that future ShareDeal products can grow from."
    ],
    "services": [
     "Product Design",
     "User Research",
     "Competitive Analysis",
     "Brand Guideline",
     "Landing Page"
    ],
    "links": [
     [
      "Case on Wix",
      "https://rakkibul.wixstudio.com/rakkibul/work/sharedeal"
     ],
     [
      "Behance",
      "https://www.behance.net/mdrakkibul"
     ],
     [
      "Dribbble",
      "https://dribbble.com/rakkibul_islam"
     ]
    ],
    "media": [
     {
      "src": "assets/work/sharedeal/cover.jpg",
      "ar": 0.8631,
      "full": true
     },
     {
      "src": "assets/work/sharedeal/01.jpg",
      "ar": 5.4473
     },
     {
      "src": "assets/work/sharedeal/02.jpg",
      "ar": 2.095
     },
     {
      "src": "assets/work/sharedeal/03.jpg",
      "ar": 1.7779
     },
     {
      "src": "assets/work/sharedeal/04-0.jpg",
      "ar": 1.6
     },
     {
      "src": "assets/work/sharedeal/04-1.jpg",
      "ar": 1.6
     },
     {
      "src": "assets/work/sharedeal/04-2.jpg",
      "ar": 1.6
     }
    ]
   },
   {
    "slug": "bebshapati",
    "bg": "#e9f0ff",
    "text": "#0b1f4d",
    "hl": "#185EE0",
    "url": "https://rakkibul.wixstudio.com/rakkibul/work/bebshapati",
    "story": [
     "Bebshapati is an <b>inventory management mobile app</b> for small businesses to manage stock, sales and purchases on the go.",
     "The key challenge was turning complex inventory functions into a <b>clean, intuitive mobile interface</b>, with smooth navigation and real-time data that never overwhelms the user."
    ],
    "services": [
     "UI UX Design",
     "Mobile App",
     "Finance",
     "Interaction Design"
    ],
    "links": [
     [
      "Case on Wix",
      "https://rakkibul.wixstudio.com/rakkibul/work/bebshapati"
     ],
     [
      "Behance",
      "https://www.behance.net/mdrakkibul"
     ],
     [
      "Dribbble",
      "https://dribbble.com/rakkibul_islam"
     ]
    ],
    "media": [
     {
      "src": "assets/work/bebshapati/cover.jpg",
      "ar": 0.8631,
      "full": true
     },
     {
      "src": "assets/work/bebshapati/01.jpg",
      "ar": 1.8964
     },
     {
      "src": "assets/work/bebshapati/02.jpg",
      "ar": 2.6391
     }
    ]
   },
   {
    "slug": "vida-ev",
    "bg": "#0e0d12",
    "text": "#f4f1ee",
    "hl": "#FA6300",
    "url": "https://rakkibul.wixstudio.com/rakkibul/work/vida-ev",
    "story": [
     "A complete <b>UI/UX case study</b> for a platform that represents Vida EV electric scooters.",
     "This conceptual project shows <b>how a case study is conducted</b>, from research and problem framing to the final app screens."
    ],
    "services": [
     "Case Study",
     "UX Research",
     "Mobile App",
     "E-commerce",
     "UI Design"
    ],
    "links": [
     [
      "Case on Wix",
      "https://rakkibul.wixstudio.com/rakkibul/work/vida-ev"
     ],
     [
      "Behance",
      "https://www.behance.net/mdrakkibul"
     ],
     [
      "Dribbble",
      "https://dribbble.com/rakkibul_islam"
     ]
    ],
    "media": [
     {
      "src": "assets/work/vida-ev/cover.jpg",
      "ar": 0.8631,
      "full": true
     },
     {
      "src": "assets/work/vida-ev/01.jpg",
      "ar": 1.6
     },
     {
      "src": "assets/work/vida-ev/02.jpg",
      "ar": 1.6
     },
     {
      "src": "assets/work/vida-ev/03.jpg",
      "ar": 1.6
     },
     {
      "src": "assets/work/vida-ev/04.jpg",
      "ar": 2.1686
     },
     {
      "src": "assets/work/vida-ev/05.jpg",
      "ar": 1.54
     },
     {
      "src": "assets/work/vida-ev/06.jpg",
      "ar": 1.2629
     },
     {
      "src": "assets/work/vida-ev/07.jpg",
      "ar": 0.7529
     },
     {
      "src": "assets/work/vida-ev/08.jpg",
      "ar": 0.9464
     },
     {
      "src": "assets/work/vida-ev/09.jpg",
      "ar": 0.9464
     },
     {
      "src": "assets/work/vida-ev/10.jpg",
      "ar": 0.7193
     },
     {
      "src": "assets/work/vida-ev/11.jpg",
      "ar": 0.7193
     },
     {
      "src": "assets/work/vida-ev/12.jpg",
      "ar": 1.0586
     },
     {
      "src": "assets/work/vida-ev/13.jpg",
      "ar": 3.5845
     }
    ]
   },
   {
    "slug": "travella",
    "bg": "#110c1f",
    "text": "#f1ecfb",
    "hl": "#b48cff",
    "url": "https://rakkibul.wixstudio.com/rakkibul/work/travella",
    "story": [
     "Travella is a <b>travel booking website</b> that lets people easily search and book travel tickets.",
     "To make browsing more engaging I used a <b>parallax scrolling effect</b> that adds depth and a dynamic feel to the experience."
    ],
    "services": [
     "UI Design",
     "Web Design",
     "Lifestyle",
     "Motion"
    ],
    "links": [
     [
      "Case on Wix",
      "https://rakkibul.wixstudio.com/rakkibul/work/travella"
     ],
     [
      "Behance",
      "https://www.behance.net/mdrakkibul"
     ],
     [
      "Dribbble",
      "https://dribbble.com/rakkibul_islam"
     ]
    ],
    "media": [
     {
      "src": "assets/work/travella/cover.jpg",
      "ar": 0.8631,
      "full": true
     },
     {
      "src": "assets/work/travella/01.jpg",
      "ar": 1.2
     },
     {
      "src": "assets/work/travella/02.jpg",
      "ar": 1.3893
     }
    ]
   },
   {
    "slug": "portfolio-website",
    "bg": "#f4f0ed",
    "text": "#232323",
    "hl": "#e2560a",
    "url": "https://rakkibul.wixstudio.com/rakkibul/work/portfolio-website",
    "story": [
     "A sleek, UI-focused <b>portfolio website</b> for a UI/UX designer to showcase their work and skills.",
     "The layout leans on clean typography, visual hierarchy and interactive elements, so every section reflects <b>creativity and design thinking</b> and makes a strong first impression."
    ],
    "services": [
     "UI UX",
     "Web Design",
     "Typography",
     "Portfolio"
    ],
    "links": [
     [
      "Case on Wix",
      "https://rakkibul.wixstudio.com/rakkibul/work/portfolio-website"
     ],
     [
      "Behance",
      "https://www.behance.net/mdrakkibul"
     ],
     [
      "Dribbble",
      "https://dribbble.com/rakkibul_islam"
     ]
    ],
    "media": [
     {
      "src": "assets/work/portfolio-website/cover.jpg",
      "ar": 0.8631,
      "full": true
     },
     {
      "src": "assets/work/portfolio-website/01.jpg",
      "ar": 1.6864
     },
     {
      "src": "assets/work/portfolio-website/02.jpg",
      "ar": 1.5
     }
    ]
   }
  ];
  const P = cards.map((card, i) => {
    const d = DATA[i % DATA.length];
    const media = card.querySelector(".project__media");
    const title = card.querySelector(".project__title").textContent.replace("→", "").trim();
    const story = (window.PV_STORIES || {})[d.slug];          // a written case study, when there is one
    return { ...d, ...(story ? story.meta : {}), media: story ? story.media : d.media, i, card, title,
      c1: media.style.getPropertyValue("--c1").trim() || "#0016ec",
      c2: media.style.getPropertyValue("--c2").trim() || "#9fb4ff",
    };
  });

  /* ---------- helpers ---------- */
  const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
  const expoOut = (t) => (t >= 1 ? 1 : 1 - Math.pow(2, -10 * t));
  const expoInOut = (t) => (t <= 0 ? 0 : t >= 1 ? 1 : t < 0.5 ? Math.pow(2, 20 * t - 10) / 2 : (2 - Math.pow(2, -20 * t + 10)) / 2);
  const quintInOut = (t) => (t < 0.5 ? 16 * t ** 5 : 1 - Math.pow(-2 * t + 2, 5) / 2);
  const fit = (v, a, b, c, d, e) => { let t = clamp((v - a) / (b - a)); if (e) t = e(t); return c + (d - c) * t; };
  const hex = (h) => { h = h.replace("#", ""); if (h.length === 3) h = [...h].map((c) => c + c).join(""); const n = parseInt(h, 16); return [(n >> 16) & 255, (n >> 8) & 255, n & 255]; };
  const mixHex = (a, b, t) => { const A = hex(a), B = hex(b); return `rgb(${A.map((v, i) => Math.round(v + (B[i] - v) * t)).join(",")})`; };
  const lum = (h) => { const [r, g, b] = hex(h); return (0.299 * r + 0.587 * g + 0.114 * b) / 255; };

  /* =========================================================
     DOM
     ========================================================= */
  const ARROW = '<svg viewBox="0 0 16 16" fill="none"><path d="M2 8h12m0 0-5.9 6M14 8 8.1 2" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>';
  const pv = document.createElement("section");
  pv.className = "pv"; pv.id = "pv"; pv.setAttribute("aria-hidden", "true");
  pv.innerHTML = `
    <div class="pv__bg"></div>
    <div class="pv__wrap"><div class="pv__track"></div></div>
    <div class="pv__meta">
      <h2 class="pv__title"></h2>
      <div class="pv__body">
        <div class="pv__story"><div class="pv__desc"></div>
          <a href="#" class="pv__cta"><span class="pv__cta-dot"></span><span>LAUNCH PROJECT</span></a></div>
        <div class="pv__sides">
          <div class="pv__side pv__side--services"><h4>Services</h4><ul></ul></div>
          <div class="pv__side pv__side--links"><h4>Links</h4><ul></ul></div>
        </div>
      </div>
    </div>
    <div class="pv__fade" aria-hidden="true"></div>
    <div class="pv__hint">SCROLL TO EXPLORE&nbsp;&nbsp;››</div>
    <div class="pv__preview"><div class="pv__preview-inner">
      <h2 class="pv__preview-title"></h2>
      <div class="pv__preview-foot"><span>NEXT PROJECT</span><i class="pv__bar"><b></b></i>${ARROW}</div>
    </div></div>
    <div class="pv__prev"><div class="pv__preview-inner"><h2 class="pv__preview-title pv__prev-title"></h2></div></div>
    <button type="button" class="pv__prevbtn" aria-label="Previous project">${ARROW}<i class="pv__bar"><b></b></i><span>PREVIOUS PROJECT</span><em></em></button>
    <svg width="0" height="0" style="position:absolute" aria-hidden="true"><filter id="pvBlur" x="-5%" y="0" width="110%" height="100%"><feGaussianBlur stdDeviation="0 0"/></filter></svg>`;
  document.body.appendChild(pv);
  const el = {
    bg: $(".pv__bg", pv), track: $(".pv__track", pv), meta: $(".pv__meta", pv), title: $(".pv__title", pv),
    desc: $(".pv__desc", pv), cta: $(".pv__cta", pv), services: $(".pv__side--services", pv), links: $(".pv__side--links", pv),
    hint: $(".pv__hint", pv), preview: $(".pv__preview", pv), previewInner: $(".pv__preview-inner", pv),
    previewTitle: $(".pv__preview-title", pv), foot: $(".pv__preview-foot", pv), bar: $(".pv__preview .pv__bar b", pv),
    prev: $(".pv__prev", pv), prevTitle: $(".pv__prev-title", pv), prevBtn: $(".pv__prevbtn", pv),
    prevBar: $(".pv__prevbtn .pv__bar b", pv), prevName: $(".pv__prevbtn em", pv),
    blur: $("#pvBlur feGaussianBlur", pv),
  };
  const back = document.createElement("a");
  back.href = "#"; back.className = "pv-back"; back.setAttribute("aria-label", "Back to projects");
  back.innerHTML = '<svg viewBox="0 0 16 16"><path d="M13.5 8h-11m0 0 4.8-4.8M2.5 8l4.8 4.8"/></svg><span>BACK</span>';
  $("#header").appendChild(back);
  const work = $("#work");
  // BACK sits just left of the header buttons, so it never lands on top of them at any screen width
  const placeBack = () => {
    const actions = $(".header__actions"), header = $("#header");
    if (!actions) return;
    const right = header.getBoundingClientRect().right - actions.getBoundingClientRect().left + 12;
    Object.assign(back.style, { left: "auto", right: right + "px", marginLeft: "0" });
  };

  /* =========================================================
     State
     ========================================================= */
  const S = {
    open: false, cur: 0, vertical: false,
    bg: 0, show: 0, hide: 0, content: 0, next: 0, over: 0,   // animation ratios 0..1
    scroll: 0, target: 0, max: 0, vel: 0, contentEnd: 0,
    vw: innerWidth, vh: innerHeight, centerOffset: 0, hintHidden: false,
    fwdHold: 0, backHold: 0, goingNext: false, prev: 0, hoverN: 0, hoverP: 0,
  };
  let items = [], tl = null, raf = 0, last = 0, pushed = false;

  function setProject(i) {
    const p = P[i], n = P[(i + 1) % P.length];
    S.cur = i;
    pv.style.setProperty("--pv-bg", p.bg); pv.style.setProperty("--pv-text", p.text); pv.style.setProperty("--pv-hl", p.hl);
    pv.style.setProperty("--pv-next-bg", n.bg); pv.style.setProperty("--pv-next-text", n.text);
    const light = lum(p.bg) > 0.5;                       // on a light page the launch button turns dark so it still stands out
    document.body.classList.toggle("pv-dark", lum(p.bg) < 0.4);
    pv.style.setProperty("--pv-cta-bg", light ? p.text : "#fff"); pv.style.setProperty("--pv-cta-ink", light ? "#fff" : "#192743");
    document.documentElement.style.setProperty("--pv-hl-now", p.hl);
    document.documentElement.style.setProperty("--pv-bg-now", p.bg);
    el.title.textContent = p.title;
    el.desc.innerHTML = p.story.map((s) => `<p>${s}</p>`).join("");
    $("ul", el.services).innerHTML = p.services.map((s) => `<li>${s}</li>`).join("");
    $("ul", el.links).innerHTML = p.links.map(([t, u]) => `<li><a href="${u}" target="_blank" rel="noopener">${t}</a></li>`).join("");
    el.cta.href = p.url; el.cta.target = "_blank"; el.cta.rel = "noopener";
    el.previewTitle.textContent = n.title;
    const b = P[(i - 1 + P.length) % P.length];
    pv.style.setProperty("--pv-prev-bg", b.bg); pv.style.setProperty("--pv-prev-text", b.text); pv.style.setProperty("--pv-prev-hl", b.hl);
    el.prevTitle.textContent = b.title; el.prevName.textContent = b.title;
    el.previewTitle.style.color = "#c2c3c7";
    // media
    items.forEach((it) => { it.tw?.kill(); it.video?.pause(); });
    el.track.textContent = "";
    items = p.media.map((s, k) => {
      const kind = s.type || "image";
      const box = document.createElement("div"); box.className = "pv__item pv__item--" + kind;
      const inner = document.createElement("div"); inner.className = "pv__inner";
      let video = null;
      if (kind === "text") {
        inner.innerHTML = s.html;
        inner.querySelectorAll("img").forEach((im) => { im.decoding = "async"; });
      } else if (kind === "video") {
        video = document.createElement("video");
        Object.assign(video, { muted: true, loop: true, playsInline: true, preload: "metadata", poster: s.poster || "" });
        video.setAttribute("muted", ""); video.setAttribute("playsinline", "");
        video.src = s.src; video.className = "is-loaded";
        inner.appendChild(video);
      } else {
        const img = new Image(); img.decoding = "async"; img.alt = s.cap ? s.cap.t : `${p.title} — image ${k + 1}`; img.draggable = false;
        img.onload = () => img.classList.add("is-loaded"); img.src = s.src;
        if (img.complete) img.classList.add("is-loaded");
        inner.appendChild(img);
      }
      box.appendChild(inner); el.track.appendChild(box);
      let cap = null;
      if (s.cap) {                                   // the caption under a picture explains what it shows and why
        cap = document.createElement("div"); cap.className = "pv__cap";
        cap.innerHTML = `<span>${s.cap.n || ""}</span><div><b>${s.cap.t}</b><p>${s.cap.d || ""}</p></div>`;
        el.track.appendChild(cap);
      }
      if (typeof s.init === "function") { try { s.init(inner); } catch (e) { /* a story extra must never break the page */ } }
      const it = { ...s, kind, box, inner, cap, video, a: 0, on: false, x: 0, y: 0, w: 0, h: 0, pr: kind === "text" ? 1 : s.cap ? 0.97 : s.full ? 0.9 : 0.86, _clip: "", _tf: "", _op: "" };
      it.tw = gsap ? gsap.to(it, { a: 1, duration: 1.3, ease: "expo.out", paused: true }) : null;
      return it;
    });
  }

  function layout() {
    S.vw = innerWidth; S.vh = innerHeight;
    S.vertical = S.vw < 1000;
    pv.classList.toggle("is-vertical", S.vertical);
    const { vw, vh } = S;
    if (!S.vertical) {
      el.prevBtn.style.top = "";
      const gap = vw * 0.0555;
      let xPos = vw * 0.5333;
      items.forEach((it) => {
        it.h = it.full ? vh + 2 : vh * 0.709;
        it.w = it.kind === "text" && it.span ? vw * it.span : it.h * it.ar; it.x = xPos; it.y = it.full ? -1 : vh * 0.161;
        xPos += it.w + gap;
      });
      S.contentEnd = xPos;
      S.max = Math.max(0, xPos + vw * 0.25 - vw);
      const mh = el.meta.offsetHeight, th = el.title.offsetHeight;
      S.centerOffset = mh / 2 - th / 2;
    } else {
      const pad = parseFloat(getComputedStyle(document.documentElement).getPropertyValue("--pad")) || 16;
      const gap = 16;
      el.prevBtn.style.top = el.meta.offsetTop + el.meta.offsetHeight + 28 + "px";
      let yPos = el.meta.offsetTop + el.meta.offsetHeight + 100;
      items.forEach((it) => {
        it.w = it.full ? vw : vw - pad * 2; it.x = it.full ? 0 : pad; it.y = yPos;
        if (it.kind === "text" && !it.span && it.ar) it.h = it.w / it.ar;   // framed screens keep their shape
        else if (it.kind === "text") {               // text chapters take the height their words need
          Object.assign(it.inner.style, { width: it.w + "px", height: "auto", left: "0px", top: "0px" });
          it.h = it.inner.offsetHeight + 24;
        } else it.h = it.w / it.ar;
        yPos += it.h + gap;
        if (it.cap) { it.cap.style.width = it.w + "px"; yPos += it.cap.offsetHeight + 12; }
      });
      S.contentEnd = yPos + 32;
      S.max = Math.max(0, S.contentEnd + vh * 0.25 - vh);
      S.centerOffset = 0;
    }
    const r = S.vertical ? 0 : Math.min(16, Math.max(10, vw * 0.011));
    items.forEach((it) => {
      it.r = it.full && !S.vertical ? 0 : r;
      Object.assign(it.box.style, { left: it.x + "px", top: it.y + "px", width: it.w + "px", height: it.h + "px" });
      // the picture is a touch larger than its window on both sides, so it can drift without stretching or showing an edge
      const iw = it.w / it.pr, ih = it.h / it.pr;
      Object.assign(it.inner.style, { width: iw + "px", height: ih + "px", left: (it.w - iw) / 2 + "px", top: (it.h - ih) / 2 + "px" });
      if (it.cap) Object.assign(it.cap.style, { left: it.x + "px", top: it.y + it.h + (S.vertical ? 12 : 16) + "px", width: it.w + "px" });
      it._clip = "";
    });
    if (!S.vertical) fitChapters();
    S.target = clamp(S.target, 0, S.max); S.scroll = clamp(S.scroll, 0, S.max);
  }

  // Text chapters must never be cut: on short screens a chapter first grows taller (staying clear of the
  // header and the bottom line), and if it still doesn't fit, its contents shrink just enough to fit.
  function fitChapters() {
    const { vh } = S;
    const top = (parseFloat(getComputedStyle(document.documentElement).getPropertyValue("--header-h")) || 84) + 10;
    const room = vh - top - 64;
    items.forEach((it) => {
      if (it.kind !== "text" || !it.span) return;
      it.inner.style.zoom = "";
      const kids = [...it.inner.children];
      if (!kids.length) return;
      const tf = it.inner.style.transform; it.inner.style.transform = "none";
      let t = Infinity, b = -Infinity;
      kids.forEach((k) => { const r = k.getBoundingClientRect(); t = Math.min(t, r.top); b = Math.max(b, r.bottom); });
      it.inner.style.transform = tf;
      const need = b - t + 6;
      if (need <= it.h) return;
      const h = Math.min(need, room);
      it.h = h; it.y = top + (room - h) / 2;
      Object.assign(it.box.style, { top: it.y + "px", height: h + "px" });
      Object.assign(it.inner.style, { top: "0px", height: h + "px" });
      if (need > room) {                            // zoom also shrinks the box itself, so size it up to match
        const z = room / need;
        Object.assign(it.inner.style, { zoom: z.toFixed(3), height: h / z + "px" });
      }
    });
  }

  /* =========================================================
     Per-frame: everything is driven by a few ratios (like a timeline you can scrub)
     ========================================================= */
  const set = (o, k, v) => { if (o["_" + k] !== v) { o["_" + k] = v; return true; } return false; };
  function render(dt) {
    const { vw, vh, vertical } = S;
    // smooth scroll (frame-rate independent)
    if (S.content <= 0.75) S.target = 0;           // the gallery stays put until the page has settled in
    const k = 1 - Math.pow(1 - 0.075, dt * 60);
    const prev = S.scroll;
    S.scroll += (S.target - S.scroll) * k;
    if (Math.abs(S.target - S.scroll) < 0.05) S.scroll = S.target;
    S.vel = (S.scroll - prev) / Math.max(dt * 60, 0.001);

    // pull at the very end fills the "next project" bar
    S.fwdHold = Math.max(0, S.fwdHold - dt); S.backHold = Math.max(0, S.backHold - dt);
    if (!S.goingNext && S.next === 0 && S.content >= 1) {
      const atEnd = S.target >= S.max - 1;
      S.over = clamp(S.over + dt * (atEnd && S.fwdHold > 0 ? 0 : S.backHold > 0 ? -5 : -0.35));   // the wheel fills it (see nudge); left alone it drains
      if (S.over >= 1) goNext();
    }

    const c = fit(S.show * (1 - S.hide), 0.5, 1, 0, 1);
    const nr = Math.max(S.next, S.prev);   // leaving towards the next or the previous project
    const g = c * fit(nr, 0, 0.5, 1, 0) * fit(S.content, 0.5, 1, 0, 1);   // media + footer opacity
    let v = 1;
    if (!vertical) { v = fit(S.scroll, 0, vw * 0.25, 1, 0); }
    v = Math.min(1 - nr, v, c) * fit(nr, 0, 0.3, 1, 0);

    el.bg.style.opacity = S.bg;

    // gallery
    const off = -S.scroll;
    el.track.style.transform = vertical ? `translate3d(0,${off}px,0)` : `translate3d(${off}px,0,0)`;
    const blur = reduce || vertical ? 0 : Math.min(Math.abs(S.vel) * 0.22, 9);
    const b = blur < 0.4 ? 0 : Math.round(blur * 2) / 2;
    if (set(S, "blur", b)) { el.blur.setAttribute("stdDeviation", `${b} 0`); el.track.style.filter = b ? "url(#pvBlur)" : "none"; }
    const op = g.toFixed(3);
    for (const it of items) {
      const s0 = (vertical ? it.y : it.x) - S.scroll, size = vertical ? it.h : it.w, vs = vertical ? vh : vw;
      const inView = s0 < vs && s0 + size > 0;
      // reveal when it comes in, rewind when it goes back out the way it came
      if (S.content > 0.5 && s0 < vs * 0.92 && s0 + size > 0 && !it.on) { it.on = true; it.box.classList.add("is-on"); it.tw ? it.tw.play() : (it.a = 1); }
      else if (s0 > vs && it.on) { it.on = false; it.box.classList.remove("is-on"); it.tw ? it.tw.reverse() : (it.a = 0); }
      if (it.video) {                                // the film only plays while it is on screen
        const play = inView && g > 0.05;
        if (set(it, "play", play)) play ? it.video.play().catch(() => {}) : it.video.pause();
      }
      if (!inView && !it.tw?.isActive()) {
        if (set(it, "op", "0")) { it.box.style.opacity = 0; if (it.cap) it.cap.style.opacity = 0; }
        continue;
      }
      if (set(it, "op", op)) it.box.style.opacity = op;
      const a = it.a;
      if (it.cap) {
        const co = (g * a).toFixed(3), ct = `translate3d(0,${((1 - a) * 18).toFixed(1)}px,0)`;
        if (set(it, "co", co)) it.cap.style.opacity = co;
        if (set(it, "ct", ct)) it.cap.style.transform = ct;
      }
      if (it.kind === "text") {                      // chapters rise and fade in instead of opening like a window
        const tf = `translate3d(0,${((1 - a) * 48).toFixed(1)}px,0)`;
        if (set(it, "tf", tf)) { it.inner.style.transform = tf; it.inner.style.opacity = a.toFixed(3); }
        continue;
      }
      const inset = it.full && !vertical ? 0 : (1 - a) * 20;
      const clip = `inset(${inset.toFixed(2)}% round ${it.r}px)`;
      if (set(it, "clip", clip)) it.box.style.clipPath = clip;
      const sc = 1 / (0.6 + 0.4 * a);
      const p = clamp((s0 + size) / (vs + size)) - 0.5;           // 0.5 entering … -0.5 leaving
      const drift = p * size * (1 / it.pr - 1);
      const tf = vertical ? `translate3d(0,${drift.toFixed(1)}px,0) scale(${sc.toFixed(4)})` : `translate3d(${drift.toFixed(1)}px,0,0) scale(${sc.toFixed(4)})`;
      if (set(it, "tf", tf)) it.inner.style.transform = tf;
    }

    // next-project panel
    const view = vertical ? vh : vw;
    let f = Math.min(S.contentEnd - S.scroll, view);
    f = f + (0 - f) * quintInOut(S.next);
    el.preview.style.transform = vertical ? `translate3d(0,${f}px,0)` : `translate3d(${f}px,0,0)`;
    // hovering a panel/button fills its bar, so it reads as clickable
    const hk = 1 - Math.pow(1 - 0.12, dt * 60);
    S.hoverN += ((pv.classList.contains("hover-next") ? 1 : 0) - S.hoverN) * hk;
    S.hoverP += ((pv.classList.contains("hover-prev") ? 1 : 0) - S.hoverP) * hk;
    el.bar.style.transform = `scaleX(${Math.max(S.over, S.hoverN, S.next)})`;
    el.foot.style.opacity = Math.max(expoInOut(g), fit(S.next, 0, 0.2, 1, 0) * (S.next > 0 ? 1 : 0));
    const nx = P[(S.cur + 1) % P.length], pr = P[(S.cur - 1 + P.length) % P.length];
    // the next title is shown in that project's highlight colour, then settles to its text colour as it takes over
    el.previewTitle.style.color = mixHex(nx.hl, nx.text, fit(S.next, 0.75, 1, 0, 1));
    // previous-project panel: comes in from the opposite side with the same motion
    const fp = -view * (1 - quintInOut(S.prev));
    el.prev.style.transform = vertical ? `translate3d(0,${fp}px,0)` : `translate3d(${fp}px,0,0)`;
    el.prev.style.visibility = S.prev > 0 ? "visible" : "hidden";
    el.prevTitle.style.color = mixHex(pr.hl, pr.text, fit(S.prev, 0.75, 1, 0, 1));

    // left column: title glides from the centre, the rest rises in one by one; all drift slower than the gallery
    const x = vertical ? 0 : -S.scroll;
    el.meta.style.transform = vertical ? `translate3d(0,${-S.scroll}px,0)` : "translate3d(0,-50%,0)";
    el.title.style.transform = `translate3d(${x / 2}px,${fit(S.content, 0, 0.65, S.centerOffset, 0, expoInOut)}px,0)`;
    el.title.style.opacity = v;
    let T = fit(S.content, 0.4, 0.85, 0, 1, expoOut);
    el.desc.style.transform = `translate3d(${x / 3}px,${(1 - T) * 30}px,0)`; el.desc.style.opacity = Math.min(v, T);
    T = fit(S.content, 0.45, 0.9, 0, 1, expoOut);
    el.cta.style.transform = `translate3d(${x / 3}px,${(1 - T) * 30}px,0)`; el.cta.style.opacity = Math.min(v, T);
    T = fit(S.content, 0.5, 0.95, 0, 1, expoOut);
    el.services.style.transform = `translate3d(${x / 5}px,${(1 - T) * 30}px,0)`; el.services.style.opacity = Math.min(v, T);
    T = fit(S.content, 0.55, 1, 0, 1, expoOut);
    el.links.style.transform = `translate3d(${x / 4}px,${(1 - T) * 30}px,0)`; el.links.style.opacity = Math.min(v, T);
    el.meta.style.pointerEvents = v > 0.5 ? "auto" : "none";
    S.hintA = clamp(S.hintA + (S.hintHidden ? -dt * 2 : dt * 2));
    el.hint.style.opacity = P[S.cur].media.some((m) => m.cap) ? 0 : Math.min(T, S.hintA) * c;   // story pages have captions there
    const pb = Math.min(v, T);
    el.prevBtn.style.opacity = pb;
    el.prevBtn.style.pointerEvents = pb > 0.5 ? "auto" : "none";
    el.prevBtn.style.transform = vertical ? `translate3d(0,${-S.scroll + (1 - T) * 30}px,0)` : `translate3d(${x / 3}px,${(1 - T) * 30}px,0)`;
    el.prevBar.style.transform = `scaleX(${Math.max(S.hoverP, S.prev)})`;

    // header BACK button
    const u = fit(c, 0, 0.5, 0, 1, expoOut);
    back.style.transform = `translate3d(0,${1 - u}em,0)`; back.style.opacity = u;
    back.style.pointerEvents = u > 0.5 ? "auto" : "none";
  }
  S.hintA = 1;

  const loop = (t) => {
    const dt = Math.min((t - (last || t)) / 1000, 1 / 20); last = t;
    render(dt);
    raf = S.open ? requestAnimationFrame(loop) : 0;
  };
  const startLoop = () => { if (!raf) { last = 0; raf = requestAnimationFrame(loop); } };

  /* =========================================================
     Open / close / next
     ========================================================= */
  function open(i, { instant = false, fromPop = false } = {}) {
    if (S.open) return;
    tl?.kill();
    S.open = true; S.hide = 0; S.next = 0; S.prev = 0; S.over = 0; S.scroll = S.target = 0; S.hintHidden = false; S.hintA = 1; S.goingNext = false;
    setProject(i);
    document.body.classList.add("is-project");
    placeBack();
    pv.classList.add("is-open"); pv.setAttribute("aria-hidden", "false");
    layout();
    if (!fromPop) { history.pushState({ pv: P[i].slug }, "", `?p=${P[i].slug}`); pushed = true; }
    startLoop();
    if (instant || reduce || !gsap) { S.bg = 1; S.show = 1; S.content = 1; return; }
    S.bg = 0; S.show = 0; S.content = 0;
    const r = work.getBoundingClientRect();
    gsap.set(work, { transformOrigin: `50% ${innerHeight / 2 - r.top}px` });
    tl = gsap.timeline();
    tl.to(work, { scale: 1.06, opacity: 0, duration: 0.75, ease: "power2.in" }, 0)
      .to(S, { bg: 1, duration: 0.75, ease: "power2.inOut" }, 0)
      .to(S, { show: 1, content: 1, duration: 1.6, ease: "none" }, 0.4);
  }

  function close({ instant = false, fromPop = false } = {}) {
    if (!S.open) return;
    tl?.kill();
    if (!fromPop && pushed) { pushed = false; history.back(); return; }   // popstate calls close again
    if (!fromPop) history.replaceState(null, "", location.pathname);
    pushed = false;
    const done = () => {
      S.open = false; S.bg = 0; S.show = 0; S.content = 0; S.hide = 0;
      document.body.classList.remove("is-project");
      pv.classList.remove("is-open"); pv.setAttribute("aria-hidden", "true");
      items.forEach((it) => { it.tw?.pause(0); it.on = false; it.a = 0; it.video?.pause(); it._play = false; it.box.classList.remove("is-on"); });
    };
    if (instant || reduce || !gsap) { gsap?.set(work, { clearProps: "transform,opacity" }); done(); return; }
    tl = gsap.timeline({ onComplete: done });
    tl.to(S, { hide: 1, duration: 0.6, ease: "none" }, 0)
      .to(S, { bg: 0, duration: 0.6, ease: "power2.inOut" }, 0.35)
      .fromTo(work, { scale: 1.06, opacity: 0 }, { scale: 1, opacity: 1, duration: 0.8, ease: "power3.out", clearProps: "transform,opacity" }, 0.4);
  }

  function goNext() {
    if (S.goingNext || !gsap || S.content < 1) return;
    S.goingNext = true; S.over = 1;
    tl?.kill();
    tl = gsap.timeline();
    tl.to(S, { next: 1, duration: 1, ease: "none" })
      .add(() => {
        const n = (S.cur + 1) % P.length;
        S.scroll = S.target = 0; S.next = 0; S.over = 0; S.content = 0; S.hintHidden = false;
        setProject(n); layout();
        history.replaceState({ pv: P[n].slug }, "", `?p=${P[n].slug}`);
        S.goingNext = false;
      })
      .to(S, { content: 1, duration: 1.5, ease: "none" });
  }

  function goPrev() {
    if (S.goingNext || !gsap || S.content < 1) return;
    S.goingNext = true;
    tl?.kill();
    tl = gsap.timeline();
    tl.to(S, { prev: 1, duration: 1, ease: "none" })
      .add(() => {
        const n = (S.cur - 1 + P.length) % P.length;
        S.scroll = S.target = 0; S.prev = 0; S.over = 0; S.content = 0; S.hintHidden = false;
        setProject(n); layout();
        history.replaceState({ pv: P[n].slug }, "", `?p=${P[n].slug}`);
        S.goingNext = false;
      })
      .to(S, { content: 1, duration: 1.5, ease: "none" });
  }

  /* =========================================================
     Input: wheel, drag, keys — kept inside the project layer
     ========================================================= */
  const nudge = (d) => {
    if (S.content <= 0.75 || S.next > 0 || S.prev > 0 || S.goingNext) return;
    if (d > 0 && S.target >= S.max - 1) {           // at the end, a little more scrolling fills the bar: about three wheel ticks
      S.fwdHold = 0.14;
      S.over = clamp(S.over + Math.min(Math.abs(d), 150) / 250);
      if (S.over >= 1) { goNext(); return; }
    }
    if (d < 0) S.backHold = 0.14;
    S.target = clamp(S.target + d, 0, S.max);
    if (Math.abs(d) > 2) S.hintHidden = true;
  };
  pv.addEventListener("wheel", (e) => {
    e.preventDefault(); e.stopPropagation();
    const d = Math.abs(e.deltaX) > Math.abs(e.deltaY) ? e.deltaX : e.deltaY;
    nudge(d * (e.deltaMode === 1 ? 40 : 1));
  }, { passive: false });
  ["touchstart", "touchmove"].forEach((t) => pv.addEventListener(t, (e) => e.stopPropagation(), { passive: true }));
  let drag = null;
  pv.addEventListener("pointerdown", (e) => {
    if (e.button !== 0 || e.target.closest("a, button, input, [data-nodrag]")) return;
    drag = { x: e.clientX, y: e.clientY, moved: 0, id: e.pointerId, onPreview: el.preview.contains(e.target), tap: e.target.closest("[data-tap]") };
    pv.setPointerCapture(e.pointerId);
  });
  pv.addEventListener("pointermove", (e) => {
    if (!drag) return;
    const dx = drag.x - e.clientX, dy = drag.y - e.clientY;
    drag.x = e.clientX; drag.y = e.clientY;
    const d = S.vertical ? dy : (Math.abs(dx) > Math.abs(dy) ? dx : dy);
    drag.moved += Math.abs(d);
    if (drag.moved > 4) pv.classList.add("is-dragging");
    nudge(d * (e.pointerType === "mouse" ? 1.4 : 1.8));
  });
  const endDrag = (e) => {
    if (!drag) return;
    const wasClick = drag.moved < 6, endedOnPreview = drag.onPreview, tapEl = drag.tap;
    pv.classList.remove("is-dragging"); drag = null;
    if (wasClick && endedOnPreview && S.content >= 1) goNext();
    if (wasClick && tapEl) tapEl.click();          // story pieces that react to a tap (the drag layer would swallow it)
  };
  pv.addEventListener("pointerup", endDrag);
  pv.addEventListener("pointercancel", () => { drag = null; pv.classList.remove("is-dragging"); });
  addEventListener("keydown", (e) => {
    if (!S.open) return;
    const step = (S.vertical ? S.vh : S.vw) * 0.45;
    const keys = { ArrowRight: step, ArrowDown: step, PageDown: step, " ": step, ArrowLeft: -step, ArrowUp: -step, PageUp: -step, Home: -1e6, End: 1e6 };
    if (e.key === "Escape") { close(); return; }
    if (e.key in keys && !e.target.closest?.("input, textarea")) { e.preventDefault(); nudge(keys[e.key]); }
  });

  /* ---------- wiring ---------- */
  cards.forEach((card, i) => card.addEventListener("click", (e) => { e.preventDefault(); open(i); }));
  el.prevBtn.addEventListener("click", (e) => { e.preventDefault(); goPrev(); });
  el.prevBtn.addEventListener("pointerenter", () => pv.classList.add("hover-prev"));
  el.prevBtn.addEventListener("pointerleave", () => pv.classList.remove("hover-prev"));
  el.preview.addEventListener("pointerenter", () => pv.classList.add("hover-next"));
  el.preview.addEventListener("pointerleave", () => pv.classList.remove("hover-next"));
  back.addEventListener("click", (e) => { e.preventDefault(); close(); });
  // header links (menu, LET'S TALK, logo) leave the project straight away so the page can scroll to them
  $("#header").addEventListener("click", (e) => {
    const a = e.target.closest('a[href^="#"]');
    if (!a || a === back || !S.open) return;
    if (pushed) { pushed = false; history.replaceState(null, "", location.pathname); }
    tl?.kill(); gsap?.set(work, { clearProps: "transform,opacity" });
    close({ instant: true, fromPop: true });
  }, true);
  addEventListener("popstate", () => {
    const slug = new URLSearchParams(location.search).get("p");
    const idx = P.findIndex((p) => p.slug === slug);
    if (idx < 0 && S.open) close({ fromPop: true });
    else if (idx >= 0 && !S.open) open(idx, { fromPop: true });
  });
  let rz = 0;
  addEventListener("resize", () => { if (!S.open) return; cancelAnimationFrame(rz); rz = requestAnimationFrame(() => { layout(); placeBack(); }); });

  // a shared link (?p=slug) opens that project straight away
  const startSlug = new URLSearchParams(location.search).get("p");
  const startIdx = P.findIndex((p) => p.slug === startSlug);
  if (startIdx >= 0) {
    const go = () => open(startIdx, { instant: true, fromPop: true });
    document.fonts?.ready ? document.fonts.ready.then(go) : go();
  }
  // draw the first project's shots early (after fonts) so the first click is instant
  // warm up the first project's pictures so the first click feels instant
  addEventListener("load", () => setTimeout(() => P[0].media.filter((m) => (m.type || "image") === "image").slice(0, 3).forEach((m) => { new Image().src = m.src; }), 2500));

  if (location.search.includes("debug")) window.__pv = { S, open, close, goNext, P, render };
})();

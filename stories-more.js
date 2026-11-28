/* =========================================================
   v4 — Case-study stories for the other six projects.
   Same language as the Consultancy Firm story (media first, one line per
   idea, details revealed by interaction), but each project gets its own
   tone and its own signature interaction so no two feel the same:
     Real Estate  · premium / architectural  · live search demo + variant switcher
     ShareDeal    · community / energetic    · group-buying price simulator
     Bebshapati   · friendly / Bangla-first  · phone fan + OTP flow player
     Vida EV      · research-driven UX       · design-process tabs + wireframe ↔ final wipe
     Travella     · cinematic                · mouse parallax scene
     Portfolio    · editorial                · shuffle deck of pages
   ========================================================= */
(() => {
  const K = window.PV_KIT;
  if (!K || !window.PV_STORIES) return;
  const { onFirstView, tilt, browser, browserInit, annotated, annInit, counters } = K;
  const A = (slug) => `assets/work/${slug}/`;

  /* ---------- shared bits ---------- */
  const facts = (rows) => `<div class="pv-facts2">${rows.map(([k, v, e]) => `<div><small>${k}</small><b>${v}</b>${e ? `<em>${e}</em>` : ""}</div>`).join("")}</div>`;
  const chips = (list, cls = "") => `<span class="pv-chips ${cls}">${list.map((c) => `<i>${c}</i>`).join("")}</span>`;
  const head = (k, h, cls = "") => `<span class="pv-k">${k}</span><h3 class="${cls}">${h}</h3>`;

  // keep doing something only while an element is on screen
  const whileVisible = (el, on, off) => {
    const io = new IntersectionObserver((es) => es.forEach((e) => (e.isIntersecting ? on() : off())), { threshold: 0.3 });
    io.observe(el);
  };

  // generic before ↔ after wipe (move across it, or it sweeps by itself the first time)
  const compare = (a, b, la, lb) => `
    <div class="pv-cmp">
      <img src="${a}" alt="" draggable="false" decoding="async">
      <div class="pv-cmp__top"><img src="${b}" alt="" draggable="false" decoding="async"></div>
      <span class="pv-cmp__knob"><i></i></span>
      <span class="pv-logo__tag pv-logo__tag--l">${la}</span><span class="pv-logo__tag pv-logo__tag--r">${lb}</span>
    </div>`;
  const compareInit = (root) => {
    const box = root.querySelector(".pv-cmp"), top = box.querySelector(".pv-cmp__top"), knob = box.querySelector(".pv-cmp__knob");
    let cut = 100, target = 100, raf = 0;
    const draw = () => { cut += (target - cut) * 0.12; top.style.clipPath = `inset(0 0 0 ${cut.toFixed(2)}%)`; knob.style.left = cut + "%"; raf = Math.abs(target - cut) > 0.05 ? requestAnimationFrame(draw) : 0; };
    const go = (v) => { target = Math.max(0, Math.min(100, v)); if (!raf) raf = requestAnimationFrame(draw); };
    go(100);
    box.addEventListener("pointermove", (e) => { const r = box.getBoundingClientRect(); go(((e.clientX - r.left) / r.width) * 100); });
    box.addEventListener("pointerleave", () => go(50));
    onFirstView(box, () => { go(8); setTimeout(() => go(50), 1300); });
  };

  /* =========================================================
     REAL ESTATE — VistaSpace
     ========================================================= */
  const RE = A("real-estate");
  // the six homes from the design; photos are cut live from the properties screen
  const HOMES = [
    ["Lunara Retreat", 360, "Cisarua", "House", 0, 0],
    ["Lunara Retreat", 340, "Drimaga", "Apartment", 1, 0],
    ["Nordwyn Residence", 790, "Cisarua", "Residential", 2, 0],
    ["Eirwood House", 360, "Cisarua", "House", 0, 1],
    ["Thalora Homes", 285, "Drimaga", "House", 1, 1],
    ["Virella Haven", 410, "Megamendung", "House", 2, 1],
  ];
  const photo = (col, row) => {
    const x = [3.6, 35.6, 67.7][col], y = [26.5, 64.7][row], w = 28.7, h = 23.6;   // % of the properties screen
    return `background-image:url(${RE}props.jpg);background-size:${(10000 / w).toFixed(1)}% ${(10000 / h).toFixed(1)}%;background-position:${(x / (100 - w) * 100).toFixed(1)}% ${(y / (100 - h) * 100).toFixed(1)}%`;
  };
  const searchHTML = `
    ${head("02 — Search first", "Find a home in three choices.")}
    <div class="pv-search">
      <div class="pv-search__row" data-k="type"><small>Type</small>${["All", "House", "Apartment", "Residential"].map((v, i) => `<button type="button" class="${i ? "" : "is-on"}" data-v="${v}">${v}</button>`).join("")}</div>
      <div class="pv-search__row" data-k="price"><small>Price</small>${["Any", "Under $400k"].map((v, i) => `<button type="button" class="${i ? "" : "is-on"}" data-v="${v}">${v}</button>`).join("")}</div>
      <div class="pv-search__row" data-k="loc"><small>Location</small>${["Any", "Cisarua", "Drimaga"].map((v, i) => `<button type="button" class="${i ? "" : "is-on"}" data-v="${v}">${v}</button>`).join("")}</div>
      <div class="pv-search__out"><b class="pv-search__n">6</b><span>homes match</span></div>
      <div class="pv-search__grid">${HOMES.map(([n, p, l], i) => `<div class="pv-home" data-i="${i}"><i style="${photo(HOMES[i][4], HOMES[i][5])}"></i><b>${n}</b><span>$${p}k · ${l}</span></div>`).join("")}</div>
    </div>
    <p class="pv-note">Try the filters — this is the search pattern from the hero</p>`;
  const searchInit = (root) => {
    const sel = { type: "All", price: "Any", loc: "Any" }, n = root.querySelector(".pv-search__n"), cards = [...root.querySelectorAll(".pv-home")];
    const run = () => {
      let c = 0;
      cards.forEach((el, i) => {
        const [, p, l, t] = HOMES[i];
        const ok = (sel.type === "All" || sel.type === t) && (sel.price === "Any" || p < 400) && (sel.loc === "Any" || sel.loc === l);
        el.classList.toggle("is-out", !ok); c += ok;
      });
      n.textContent = c; n.classList.remove("is-pop"); void n.offsetWidth; n.classList.add("is-pop");
    };
    root.querySelectorAll(".pv-search__row").forEach((row) => row.addEventListener("click", (e) => {
      const b = e.target.closest("button"); if (!b) return;
      row.querySelectorAll("button").forEach((x) => x.classList.toggle("is-on", x === b));
      sel[row.dataset.k] = b.dataset.v; run();
    }));
  };
  const variantsHTML = `
    ${head("05 — Design system", "One card, every state.")}
    <div class="pv-var">
      <div class="pv-seg" role="tablist">${["Default", "Hover", "Featured", "Sold"].map((v, i) => `<button type="button" class="${i ? "" : "is-on"}" data-v="${v.toLowerCase()}">${v}</button>`).join("")}</div>
      <div class="pv-var__stage">
        <div class="pv-pcard is-default">
          <i style="${photo(2, 0)}"><em>$790,000</em><span class="pv-pcard__badge"></span></i>
          <div class="pv-pcard__row"><b>Nordwyn Residence</b><span class="pv-pcard__btn">View Details</span></div>
          <small>Cisarua, Bogor</small>
          <div class="pv-pcard__facts"><span>5 Bedrooms</span><span>2 Bathroom</span></div>
        </div>
        <div class="pv-var__side">
          <small class="pv-mini">Buttons</small>
          <span class="pv-rbtn">Search</span><span class="pv-rbtn pv-rbtn--o">Sign Up</span><span class="pv-rbtn pv-rbtn--g">View All</span>
          <small class="pv-mini">Colours</small>
          <div class="pv-dots"><i style="background:#D2F054"></i><i style="background:#284871"></i><i style="background:#1E1E1E"></i><i style="background:#F4F4F4"></i></div>
          <small class="pv-mini">Built on the 3D Architect design system</small>
        </div>
      </div>
    </div>`;
  const variantsInit = (root) => {
    const card = root.querySelector(".pv-pcard"), seg = root.querySelector(".pv-seg");
    const set = (v) => { card.className = "pv-pcard is-" + v; seg.querySelectorAll("button").forEach((b) => b.classList.toggle("is-on", b.dataset.v === v)); };
    seg.addEventListener("click", (e) => { const b = e.target.closest("button"); if (b) { set(b.dataset.v); clearInterval(t); } });
    // cycles through the states by itself until someone picks one
    const order = ["default", "hover", "featured", "sold"]; let k = 0, t = 0;
    whileVisible(card, () => { clearInterval(t); t = setInterval(() => set(order[++k % order.length]), 1800); }, () => clearInterval(t));
  };

  const realEstate = {
    meta: {
      story: ["A landing page for <b>VistaSpace</b>, a premium real-estate brand. <b>Search comes first</b>, so finding a home takes three choices."],
      services: ["Visual Design", "UX Design", "Design System", "Variants", "Landing Page"],
      links: [["Figma File", "https://www.figma.com/design/UQQ0xSI5j4UDedarRxVdVA/VistaSpace--Real-Estate-Landing-Page?node-id=6018-8030&t=Ejslk200j5YDQKJv-1"],
              ["Case on Wix", "https://rakkibul.wixstudio.com/rakkibul/work/real-estate-landing-page"], ["Behance", "https://www.behance.net/mdrakkibul"]],
      url: "https://www.figma.com/design/UQQ0xSI5j4UDedarRxVdVA/VistaSpace--Real-Estate-Landing-Page?node-id=6018-8030&t=Ejslk200j5YDQKJv-1",
    },
    media: [
      { type: "image", src: RE + "cover.jpg", ar: 1399 / 1622, full: true },
      { type: "text", span: 0.5, html: `
        <div class="pv-blueprint">
          ${head("01 — Brief", "A calmer way to find a dream home.", "pv-big")}
          ${facts([["Brand", "VistaSpace"], ["Date", "May 2025"], ["Role", "Visual + UX", "Designer"]])}
          ${chips(["3D Architect design system", "Variants", "Responsive grid"], "pv-chips--line")}
        </div>` },
      { type: "text", span: 0.6, init: searchInit, html: searchHTML },
      { type: "text", ar: 2400 / 1680, init: annInit, html: annotated(RE + "hero.jpg", [
          [57, 25, "A word in lime", "The promise lands on “Dream Home”."],
          [34, 19, "Quick filters", "House, Apartment, Residential in one tap."],
          [93, 80, "Search in the hero", "Location, type, price and rooms where you land."],
          [80, 38, "Architecture as hero", "A bold building sets the premium tone."]]),
        cap: { n: "03", t: "Hero — tap the numbers" } },
      { type: "text", ar: 2400 / 2030, init: annInit, html: annotated(RE + "props.jpg", [
          [62, 12.5, "Filter pills", "Every category one tap away, View All on the right."],
          [11, 43, "Price on the photo", "The first thing buyers look for, on the picture."],
          [27, 54, "Clear next step", "View Details on every card."],
          [12, 60, "Quick facts", "Bedrooms and bathrooms as small icons."]]),
        cap: { n: "04", t: "Properties grid" } },
      { type: "text", span: 0.52, init: variantsInit, html: variantsHTML },
      { type: "image", src: RE + "reviews.jpg", ar: 2400 / 1611, cap: { n: "06", t: "Real voices, in a carousel" } },
      { type: "image", src: RE + "contact.jpg", ar: 2400 / 960, cap: { n: "07", t: "Contact in three fields" } },
      { type: "text", ar: 1.28, init: browserInit, html: browser("vistaspace.com", RE + "page-full.jpg"), cap: { n: "08", t: "The whole page" } },
      { type: "text", span: 0.32, html: `
        ${head("09 — Delivered", "A premium landing page, built on a system.")}
        ${chips(["Landing page", "Component variants", "Responsive", "Figma"])}
        <a class="pv-link" href="https://www.figma.com/design/UQQ0xSI5j4UDedarRxVdVA/VistaSpace--Real-Estate-Landing-Page?node-id=6018-8030&t=Ejslk200j5YDQKJv-1" target="_blank" rel="noopener">Open the Figma file <span>↗</span></a>` },
    ],
  };

  /* =========================================================
     SHAREDEAL — group-buying grocery platform
     ========================================================= */
  const SD = A("sharedeal");
  const SD_FIGMA = "https://www.figma.com/design/tIfwlx72NxHs2QSKHkYYsi/ShareDeal-Landing-Page--Copy-?node-id=1-4&t=gsPlfFQ4HQ0bCngh-1";
  const SD_GUIDE = "https://www.figma.com/design/Tp49cfTlZL0XVXucmGzjrL/ShareDeal-Design-Guideline--Copy-?node-id=4-3&t=bFuWKNJpW3GpkwXR-1";
  const groupHTML = `
    ${head("02 — The idea", "More people, <em class=\"pv-hl\">lower price</em>.")}
    <div class="pv-group" data-nodrag>
      <div class="pv-group__deal">
        <i class="pv-group__img" style="background-image:url(${SD}deals.jpg)"></i>
        <div><b>Fresh Potato</b><span>25 kg pack</span></div>
        <div class="pv-group__price"><s>Tk 500</s><b class="pv-group__now">Tk 500</b></div>
      </div>
      <div class="pv-group__people"></div>
      <input type="range" min="1" max="10" value="1" class="pv-group__range" aria-label="People in the group">
      <div class="pv-group__meta"><span><b class="pv-group__n">1</b> joined</span><span class="pv-group__save">Drag to add people</span></div>
    </div>
    <p class="pv-note">Drag the slider — this is how a ShareDeal group works</p>`;
  const groupInit = (root) => {
    const r = root.querySelector(".pv-group__range"), now = root.querySelector(".pv-group__now"), n = root.querySelector(".pv-group__n");
    const save = root.querySelector(".pv-group__save"), ppl = root.querySelector(".pv-group__people");
    ppl.innerHTML = "RNAMJSTKFH".split("").map((c, i) => `<i style="--d:${i * 40}ms;--h:${(i * 47) % 360}">${c}</i>`).join("");
    const kids = [...ppl.children];
    const set = (v) => {
      const price = Math.round(500 - (v - 1) * (70 / 9));
      now.textContent = "Tk " + price; n.textContent = v;
      save.textContent = v > 1 ? `Everyone saves Tk ${500 - price} (${Math.round((500 - price) / 5)}%)` : "Drag to add people";
      kids.forEach((k, i) => k.classList.toggle("is-in", i < v));
      r.style.setProperty("--p", ((v - 1) / 9) * 100 + "%");
    };
    r.addEventListener("input", () => set(+r.value));
    set(1);
    // first view: a small group forms by itself
    onFirstView(root, () => { let v = 1; const t = setInterval(() => { v++; r.value = v; set(v); if (v >= 6) clearInterval(t); }, 260); });
  };
  const sharedeal = {
    meta: {
      story: ["<b>ShareDeal</b> is Bangladesh's first group-buying grocery platform. I designed the landing page, the product section and <b>the brand guideline</b> future products grow from."],
      services: ["Brand Strategy", "Design Guideline", "Visual Design", "UX Research", "Landing Page"],
      links: [["Landing page (Figma)", SD_FIGMA], ["Design guideline (Figma)", SD_GUIDE], ["Case on Wix", "https://rakkibul.wixstudio.com/rakkibul/work/sharedeal"]],
      url: SD_FIGMA,
    },
    media: [
      { type: "image", src: SD + "cover.jpg", ar: 1399 / 1622, full: true },
      { type: "text", span: 0.46, html: `
        ${head("01 — Brief", "One deal, one community, big savings.", "pv-big")}
        ${facts([["Date", "Feb 2025"], ["Role", "Visual + UX", "Brand Strategy"], ["Focus", "Guideline"]])}
        <div class="pv-marquee"><div>${["Join deals", "Share the deal", "Get discount", "Farmers first", "Fresh groceries", "Less waste", "Join deals", "Share the deal", "Get discount", "Farmers first", "Fresh groceries", "Less waste"].map((s) => `<i>${s}</i>`).join("")}</div></div>` },
      { type: "text", span: 0.4, init: groupInit, html: groupHTML },
      { type: "text", ar: 2385 / 1660, init: annInit, html: annotated(SD + "hero.jpg", [
          [45, 24, "The promise in three verbs", "Join deals, share the deal, get discount."],
          [56, 40, "Headline with a gradient", "Green to blue: fresh food meets technology."],
          [51, 88, "Trust in numbers", "Groups, deals and farmers up front."],
          [82, 46, "Product in hand", "The app on phones, wrapped in motion."]]),
        cap: { n: "03", t: "Hero — tap the numbers" } },
      { type: "text", ar: 2385 / 720, init: annInit, html: annotated(SD + "deals.jpg", [
          [28, 31, "A ticking clock", "Every deal shows time left, in red."],
          [32, 76, "Group progress", "How full the group is, at a glance."],
          [62, 88, "Old price, new price", "The saving is the loudest number."]]),
        cap: { n: "04", t: "Deal cards" } },
      { type: "image", src: SD + "steps.jpg", ar: 2385 / 1168, cap: { n: "05", t: "Three steps to save money" } },
      { type: "text", span: 0.56, init: (root) => {
          root.querySelectorAll(".pv-sw").forEach((sw) => sw.addEventListener("click", () => { navigator.clipboard?.writeText(sw.dataset.hex).catch(() => {}); sw.classList.add("is-copied"); setTimeout(() => sw.classList.remove("is-copied"), 1100); }));
          tilt(root);
        }, html: `
        ${head("06 — Brand guideline", "A system future products can grow from.")}
        <div class="pv-guide">
          <a class="pv-guide__card" href="${SD_GUIDE}" target="_blank" rel="noopener" data-tilt><img src="${SD}guideline.jpg" alt="ShareDeal design guideline" draggable="false"><span>Open the guideline ↗</span></a>
          <div class="pv-guide__sw">${[["Leaf", "#3FA535", "#fff"], ["Forest", "#178700", "#fff"], ["Lime", "#73C30A", "#10240a"], ["Ink", "#1E1E1E", "#fff"], ["Paper", "#FFFFFF", "#1E3A14"]]
            .map(([n, h, ink]) => `<button type="button" class="pv-sw" data-hex="${h}" style="background:${h};color:${ink}"><b>${n}</b><span>${h}</span><em>Copied ✓</em></button>`).join("")}</div>
        </div>` },
      { type: "image", src: SD + "mobile.jpg", ar: 2400 / 1146, cap: { n: "07", t: "Mobile, just as complete" } },
      { type: "image", src: SD + "sdg.jpg", ar: 2385 / 1740, cap: { n: "08", t: "A mission beyond profit" } },
      { type: "text", ar: 1.28, init: browserInit, html: browser("sharedeal.com.bd", SD + "page-full.jpg"), cap: { n: "09", t: "The whole page" } },
      { type: "text", span: 0.3, html: `
        ${head("10 — Delivered", "A landing page and a brand to build on.")}
        ${chips(["Landing page", "Product section", "Brand guideline", "Mobile"])}
        <a class="pv-link" href="${SD_FIGMA}" target="_blank" rel="noopener">Open the Figma file <span>↗</span></a>` },
    ],
  };

  /* =========================================================
     BEBSHAPATI — Bangla inventory app
     ========================================================= */
  const BB = A("bebshapati");
  const fanHTML = `
    ${head("০২ — The app", "Sell, scan, track. All in one hand.")}
    <div class="pv-fan">${[["app0", "Dashboard"], ["app1", "Sell"], ["app2", "Add customer"], ["app3", "Discount"], ["app4", "Product detail"]]
      .map(([f, t], i) => `<figure class="pv-fan__p" style="--i:${i - 2};--a:${Math.abs(i - 2)}"><img src="${BB}${f}.jpg" alt="${t}" draggable="false" decoding="async"><figcaption>${t}</figcaption></figure>`).join("")}</div>
    <p class="pv-note">Hover a screen to pick it up</p>`;
  const OTP = ["Phone number", "Enter the code", "Verified", "Select shop", "Owner or employee", "Create account", "Add a shop"];
  const flowHTML = `
    ${head("০৩ — Sign in", "No passwords. Just a phone number.")}
    <div class="pv-flow">
      <ol class="pv-flow__steps">${OTP.map((t, i) => `<li><button type="button" data-i="${i}"><em>${String(i + 1).padStart(2, "0")}</em>${t}</button></li>`).join("")}</ol>
      <div class="pv-flow__phone"><div class="pv-flow__screens">${OTP.map((t, i) => `<img src="${BB}otp${i}.jpg" alt="${t}" draggable="false" decoding="async">`).join("")}</div></div>
    </div>`;
  const flowInit = (root) => {
    const btns = [...root.querySelectorAll(".pv-flow__steps button")], imgs = [...root.querySelectorAll(".pv-flow__screens img")];
    let i = 0, t = 0, user = false;
    const go = (k) => { i = (k + OTP.length) % OTP.length; btns.forEach((b, j) => b.classList.toggle("is-on", j === i)); imgs.forEach((im, j) => { im.classList.toggle("is-on", j === i); im.classList.toggle("is-past", j < i); }); };
    btns.forEach((b) => b.addEventListener("click", () => { user = true; clearInterval(t); go(+b.dataset.i); }));
    go(0);
    whileVisible(root.querySelector(".pv-flow"), () => { if (!user) { clearInterval(t); t = setInterval(() => go(i + 1), 1700); } }, () => clearInterval(t));
  };
  const bebshapati = {
    meta: {
      story: ["<b>বেবসাপাতি (Bebshapati)</b> is an inventory app for small shops in Bangladesh. <b>Bangla-first</b>, so stock, sales and purchases feel familiar on day one."],
      services: ["UI Design", "UX Design", "Mobile App", "Bangla UI", "Onboarding"],
      links: [["Case on Wix", "https://rakkibul.wixstudio.com/rakkibul/work/bebshapati"], ["Behance", "https://www.behance.net/mdrakkibul"], ["Dribbble", "https://dribbble.com/rakkibul_islam"]],
      url: "https://rakkibul.wixstudio.com/rakkibul/work/bebshapati",
    },
    media: [
      { type: "image", src: BB + "cover.jpg", ar: 1399 / 1622, full: true },
      { type: "text", span: 0.42, html: `
        ${head("০১ — Brief", "Shop inventory, in the shop's own language.", "pv-big")}
        ${facts([["Year", "2025"], ["Role", "UI UX", "Designer"], ["Field", "Finance"]])}
        ${chips(["বাংলা UI", "Barcode scan", "OTP login", "Discounts", "Reports"], "pv-chips--line")}` },
      { type: "text", span: 0.62, init: tilt, html: fanHTML },
      { type: "text", span: 0.56, init: flowInit, html: flowHTML },
      { type: "image", src: BB + "01.jpg", ar: 2655 / 1399, cap: { n: "০৪", t: "The full interface" } },
      { type: "image", src: BB + "02.jpg", ar: 2902 / 1100, cap: { n: "০৫", t: "Onboarding, end to end" } },
      { type: "text", span: 0.32, init: counters, html: `
        ${head("০৬ — Delivered", "Two flows, one simple app.")}
        <div class="pv-done">
          <div><b data-count="12">0</b>Screens</div><div><b data-count="2">0</b>Core flows</div>
          <div><b data-count="1">0</b>Bangla-first UI</div><div><b data-count="0">0</b>Passwords</div>
        </div>` },
    ],
  };

  /* =========================================================
     VIDA EV — UX case study
     ========================================================= */
  const VE = A("vida-ev");
  const STAGES = [["Research", "05", "Surveys, interviews and usability tests with EV owners."], ["Competitors", "06", "ElectricPe, Charging Zone and Statiq, side by side."],
                  ["Persona", "07", "Mansi, 28: busy, eco-minded, anxious about range."], ["Empathy", "08", "What she says, thinks, does and feels."], ["Structure", "09", "Sign-up, home, vehicle, stations, settings."]];
  const stagesHTML = `
    ${head("03 — Process", "Empathize → Define → Ideate → Design.")}
    <div class="pv-tabs">
      <div class="pv-tabs__list">${STAGES.map(([t, , d], i) => `<button type="button" data-i="${i}"><em>${String(i + 1).padStart(2, "0")}</em><b>${t}</b><span>${d}</span><i class="pv-tabs__bar"></i></button>`).join("")}</div>
      <div class="pv-tabs__view">${STAGES.map(([t, f]) => `<img src="${VE}${f}.jpg" alt="${t}" draggable="false" decoding="async">`).join("")}</div>
    </div>`;
  const stagesInit = (root) => {
    const btns = [...root.querySelectorAll(".pv-tabs__list button")], imgs = [...root.querySelectorAll(".pv-tabs__view img")];
    let i = 0, t = 0, user = false;
    const go = (k) => { i = k % STAGES.length; btns.forEach((b, j) => b.classList.toggle("is-on", j === i)); imgs.forEach((im, j) => im.classList.toggle("is-on", j === i)); };
    btns.forEach((b) => b.addEventListener("click", () => { user = true; clearInterval(t); root.classList.add("is-user"); go(+b.dataset.i); }));
    go(0);
    whileVisible(root.querySelector(".pv-tabs"), () => { if (!user) { clearInterval(t); t = setInterval(() => go(i + 1), 3200); } }, () => clearInterval(t));
  };
  const vida = {
    meta: {
      story: ["A UX case study for <b>Vida EV</b>: one app to find charging, watch battery health and plan rides. <b>Four weeks, from research to final screens.</b>"],
      services: ["UX Research", "Persona", "Information Architecture", "Wireframes", "UI Design"],
      links: [["Case on Wix", "https://rakkibul.wixstudio.com/rakkibul/work/vida-ev"], ["Behance", "https://www.behance.net/mdrakkibul"], ["Dribbble", "https://dribbble.com/rakkibul_islam"]],
      url: "https://rakkibul.wixstudio.com/rakkibul/work/vida-ev",
    },
    media: [
      { type: "image", src: VE + "01.jpg", ar: 2240 / 1400, cap: { n: "00", t: "Vida EV — the app" } },
      { type: "text", span: 0.42, html: `
        ${head("01 — Overview", "Making EV ownership less stressful.", "pv-big")}
        ${facts([["Duration", "4 weeks"], ["Role", "UX + UI", "Designer"], ["Year", "2025"]])}
        ${chips(["Figma", "FigJam", "Google Forms", "Photoshop", "Illustrator"], "pv-chips--line")}` },
      { type: "text", span: 0.4, html: `
        ${head("02 — The problem", "Two worries every EV owner has.")}
        <div class="pv-probs">
          <div><i>⚡</i><b>“Where can I charge?”</b><span>Stations are hard to find, and range anxiety follows.</span></div>
          <div><i>🔋</i><b>“Is my battery okay?”</b><span>Health, degradation and charging habits feel complex.</span></div>
        </div>` },
      { type: "text", span: 0.74, init: stagesInit, html: stagesHTML },
      { type: "text", ar: 1006 / 1400, init: compareInit, html: compare(VE + "10.jpg", VE + "11.jpg", "Wireframe", "Final"),
        cap: { n: "04", t: "From wireframe to final" } },
      { type: "image", src: VE + "12.jpg", ar: 1481 / 1399, cap: { n: "05", t: "Type and colour" } },
      { type: "text", span: 0.32, init: counters, html: `
        ${head("06 — In numbers", "A complete UX process.")}
        <div class="pv-done">
          <div><b data-count="4">0</b>Weeks</div><div><b data-count="5">0</b>Design stages</div>
          <div><b data-count="3">0</b>Competitors studied</div><div><b data-count="1">0</b>Persona</div>
        </div>` },
    ],
  };

  /* =========================================================
     TRAVELLA — immersive parallax website
     ========================================================= */
  const TR = A("travella");
  const parallaxHTML = `
    <div class="pv-plx" data-nodrag>
      <div class="pv-plx__bg" style="background-image:url(${TR}scene.jpg)"></div>
      <div class="pv-plx__fog"></div>
      <div class="pv-plx__dots">${Array.from({ length: 18 }, (_, i) => `<i style="left:${(i * 37) % 100}%;top:${(i * 53) % 90 + 5}%;--s:${0.5 + (i % 4) * 0.35}"></i>`).join("")}</div>
      <div class="pv-plx__txt"><small>Keep scrolling</small><b>Let’s explore<br>the Mountains</b></div>
      <span class="pv-plx__hint">Move your mouse ↔</span>
    </div>`;
  const parallaxInit = (root) => {
    const box = root.querySelector(".pv-plx"), bg = box.querySelector(".pv-plx__bg"), txt = box.querySelector(".pv-plx__txt"), dots = box.querySelector(".pv-plx__dots");
    let tx = 0, ty = 0, x = 0, y = 0, raf = 0, user = false, t0 = performance.now();
    const loop = (t) => {
      if (!user) { tx = Math.sin((t - t0) / 2200) * 0.5; ty = Math.cos((t - t0) / 3100) * 0.3; }   // slow drift until the mouse takes over
      x += (tx - x) * 0.08; y += (ty - y) * 0.08;
      bg.style.transform = `scale(1.14) translate3d(${(-x * 24).toFixed(1)}px,${(-y * 14).toFixed(1)}px,0)`;
      dots.style.transform = `translate3d(${(x * 46).toFixed(1)}px,${(y * 26).toFixed(1)}px,0)`;
      txt.style.transform = `translate3d(${(x * 70).toFixed(1)}px,${(y * 36).toFixed(1)}px,0)`;
      raf = requestAnimationFrame(loop);
    };
    box.addEventListener("pointermove", (e) => { const r = box.getBoundingClientRect(); tx = ((e.clientX - r.left) / r.width - 0.5) * 2; ty = ((e.clientY - r.top) / r.height - 0.5) * 2; user = true; box.classList.add("is-user"); });
    box.addEventListener("pointerleave", () => { user = false; t0 = performance.now(); });
    whileVisible(box, () => { if (!raf) raf = requestAnimationFrame(loop); }, () => { cancelAnimationFrame(raf); raf = 0; });
  };
  const travella = {
    meta: {
      story: ["<b>Travella</b> is a travel booking website. Search and book trips in one place, with an <b>immersive parallax</b> that makes browsing feel like the journey."],
      services: ["UI Design", "Web Design", "Parallax", "Lifestyle"],
      links: [["Case on Wix", "https://rakkibul.wixstudio.com/rakkibul/work/travella"], ["Behance", "https://www.behance.net/mdrakkibul"], ["Dribbble", "https://dribbble.com/rakkibul_islam"]],
      url: "https://rakkibul.wixstudio.com/rakkibul/work/travella",
    },
    // the story reads like the trip itself: see it move, why it exists, the idea, the walk through it,
    // how the depth works, the screens, and what was delivered
    media: [
      { type: "video", src: TR + "film.mp4", poster: TR + "poster.jpg", ar: 16 / 9,
        cap: { n: "00", t: "The whole site in 17 seconds", d: "Press “Start here” and the page walks you into the forest." } },
      { type: "text", span: 0.4, html: `
        ${head("01 — The problem", "Booking a trip feels like paperwork.", "pv-big")}
        <div class="pv-probs">
          <div><i>🧾</i><b>Forms, tables, filters</b><span>Most booking sites look like a spreadsheet of tickets.</span></div>
          <div><i>😶</i><b>The excitement is gone</b><span>The trip should start the moment you start planning it.</span></div>
        </div>
        ${facts([["Year", "2024"], ["Role", "UI Designer"], ["Field", "Lifestyle"]])}` },
      { type: "text", span: 0.36, html: `
        ${head("02 — The idea", "Make booking the first step of the journey.")}
        <p class="pv-lead">Every scroll takes you one step deeper into the place you are about to visit. The search and the ticket are still one click away, but the page makes you want to go.</p>
        ${chips(["Search trips", "Book tickets", "Feel the place"], "pv-chips--line")}` },
      { type: "text", ar: 16 / 9, init: parallaxInit, html: parallaxHTML, cap: { n: "03", t: "How the depth works — move your mouse", d: "Each layer moves at its own speed: sky slowest, headline fastest." } },
      { type: "text", span: 0.32, html: `
        ${head("04 — Layers", "Depth that pulls you in.")}
        <div class="pv-layers">
          <div style="--z:0"><b>Sky</b><span>moves slowest</span></div>
          <div style="--z:1"><b>Mountains</b><span>drift behind</span></div>
          <div style="--z:2"><b>Forest</b><span>passes by</span></div>
          <div style="--z:3"><b>Headline</b><span>moves fastest</span></div>
        </div>` },
      { type: "image", src: TR + "01.jpg", ar: 1680 / 1400, cap: { n: "05", t: "On desktop" } },
      { type: "text", span: 0.3, html: `
        ${head("06 — Delivered", "A booking site with a sense of place.")}
        ${chips(["Landing page", "Parallax motion", "Booking entry", "Get Your Ticket CTA"])}` },
    ],
  };

  /* =========================================================
     PORTFOLIO WEBSITE — editorial CV site
     ========================================================= */
  const PO = A("portfolio-website");
  const PAGES = [["page0", "Cover"], ["page1", "Inspiration App"], ["page2", "V-Care"], ["page3", "Redesign Goodread"], ["page4", "Projects & Photographer"], ["page5", "Thank you"]];
  const deckHTML = `
    ${head("02 — Pages", "Shuffle through the portfolio.")}
    <div class="pv-deck">
      <div class="pv-deck__stack">${PAGES.map(([f, t], i) => `<button type="button" class="pv-deck__c" style="--k:${i}"><img src="${PO}${f}.jpg" alt="${t}" draggable="false" decoding="async"></button>`).join("")}</div>
      <div class="pv-deck__meta"><b class="pv-deck__t">${PAGES[0][1]}</b><span class="pv-deck__n">01 / ${String(PAGES.length).padStart(2, "0")}</span></div>
    </div>
    <p class="pv-note">Click the top page to send it to the back</p>`;
  const deckInit = (root) => {
    const cards = [...root.querySelectorAll(".pv-deck__c")], title = root.querySelector(".pv-deck__t"), num = root.querySelector(".pv-deck__n");
    let order = cards.map((_, i) => i);
    const paint = () => {
      order.forEach((ci, pos) => { const c = cards[ci]; c.style.setProperty("--k", pos); c.style.zIndex = cards.length - pos; c.classList.toggle("is-top", pos === 0); });
      title.textContent = PAGES[order[0]][1]; num.textContent = `${String(order[0] + 1).padStart(2, "0")} / ${String(PAGES.length).padStart(2, "0")}`;
    };
    cards.forEach((c, ci) => c.addEventListener("click", () => {
      if (order[0] !== ci) return;
      c.classList.add("is-out");
      setTimeout(() => { c.classList.remove("is-out"); order = [...order.slice(1), order[0]]; paint(); }, 420);
    }));
    paint();
  };
  const portfolio = {
    meta: {
      story: ["A UI-focused <b>portfolio website</b> for a UI/UX designer. Clean type, a strict grid and <b>dark and light pages</b> that keep the rhythm."],
      services: ["UI UX", "Web Design", "Typography", "Layout"],
      links: [["Case on Wix", "https://rakkibul.wixstudio.com/rakkibul/work/portfolio-website"], ["Behance", "https://www.behance.net/mdrakkibul"], ["Dribbble", "https://dribbble.com/rakkibul_islam"]],
      url: "https://rakkibul.wixstudio.com/rakkibul/work/portfolio-website",
    },
    media: [
      { type: "image", src: PO + "cover.jpg", ar: 1399 / 1622, full: true },
      { type: "text", span: 0.4, html: `
        ${head("01 — Brief", "A portfolio that reads like a well-made CV.", "pv-big")}
        ${facts([["Year", "2025"], ["Role", "UI UX", "Designer"], ["Type", "Portfolio"]])}
        <div class="pv-rhythm"><i></i><i></i><i></i><i></i><i></i><i></i><span>Dark · Light · Dark — the page rhythm</span></div>` },
      { type: "text", span: 0.5, init: deckInit, html: deckHTML },
      { type: "image", src: PO + "01.jpg", ar: 2360 / 1400, cap: { n: "03", t: "The full set of pages" } },
      { type: "image", src: PO + "02.jpg", ar: 2099 / 1400, cap: { n: "04", t: "Laid out in perspective" } },
      { type: "text", span: 0.3, html: `
        ${head("05 — Delivered", "A clear story of a designer.")}
        ${chips(["Cover", "About & education", "Projects", "Skills", "Contact"])}` },
    ],
  };

  Object.assign(window.PV_STORIES, {
    "real-estate": realEstate, sharedeal, bebshapati, "vida-ev": vida, travella, "portfolio-website": portfolio,
  });
})();

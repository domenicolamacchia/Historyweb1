const $ = s => document.querySelector(s);
const $$ = s => [...document.querySelectorAll(s)];
const params = new URLSearchParams(location.search);
const initials = n => n.split(" ").filter(w => /^[A-ZÀ-Þ]/.test(w)).slice(0, 2).map(w => w[0]).join("");
const med = (n, style = "") => `<div class="med" data-n="${n}" style="${style}">${initials(n)}</div>`;
const LABELS = ["Strongly disagree", "Disagree", "Neutral", "Agree", "Strongly agree"];
const logo = '<a class="logo" href="index.html">Echoes of History</a>';
// 12 questions = one per axis, alternating direction. 24 = all of them.
const questionsFor = n => (n === 12 ? QS.filter((q, k) => k % 2 === q[0] % 2) : QS);

// Smooth page transitions: fade (and slide, on the quiz) out, then load the next page
function go(url, dir = 1) {
  sessionStorage.setItem("dir", dir);
  const q = $(".q");
  if (q) q.style.setProperty("--ox", -dir * 48 + "px");
  document.body.classList.add("out");
  setTimeout(() => { location.href = url; }, 270);
}
document.addEventListener("click", e => {
  const a = e.target.closest("a[href]");
  if (!a || e.defaultPrevented || e.metaKey || e.ctrlKey || e.shiftKey || a.target || a.getAttribute("href").startsWith("#")) return;
  if (new URL(a.href, location.href).origin !== location.origin) return;
  e.preventDefault();
  go(a.href, a.classList.contains("back") ? -1 : 1);
});
addEventListener("pageshow", e => { if (e.persisted) document.body.classList.remove("out"); });

// Plain-English personality text, generated from each figure's trait scores (so editing a score updates it)
const ADJ = [["cautious","daring"],["reserved","outgoing"],["practical","imaginative"],["logical","emotional"],["spontaneous","disciplined"],["humble","ambitious"],["competitive","cooperative"],["rebellious","dutiful"],["gentle","forceful"],["present-focused","far-sighted"],["serious","playful"],["pessimistic","hopeful"]];
const PH = [
  ["weigh risks carefully and rarely gamble", "take bold risks and leap into the unknown"],
  ["think best alone and keep a low profile", "thrive in company and love an audience"],
  ["prefer solving real problems to chasing wild ideas", "are full of original ideas and see what others miss"],
  ["decide with evidence and a cool head", "lead with feeling, passion and compassion"],
  ["work in bursts of inspiration rather than by schedule", "build strong habits and rarely break a routine"],
  ["do good without needing the credit", "are driven to achieve what no one has before"],
  ["love to win and test themselves against rivals", "bring people together and build trust"],
  ["bend or break rules they think are wrong", "value order, duty and tradition"],
  ["persuade softly instead of pushing", "push hard until things happen"],
  ["live for the moment", "build for what will last long after them"],
  ["take life and responsibility seriously", "use humour and charm to get through anything"],
  ["expect the worst and prepare for it", "keep hoping, even in dark times"]
];
const side = (v, a) => (v[a] >= 50 ? 1 : 0);
const strongest = v => v.map((x, a) => [Math.abs(x - 50), a]).sort((p, q) => q[0] - p[0]).map(p => p[1]);
const list = xs => (xs.length > 1 ? xs.slice(0, -1).join(", ") + " and " + xs[xs.length - 1] : xs[0] || "");
const tags = f => { const t = strongest(f.v).slice(0, 3).map(a => ADJ[a][side(f.v, a)]).join(", "); return t[0].toUpperCase() + t.slice(1); };
const about = f => {
  const t = strongest(f.v).slice(0, 3);
  return `<p class="about">${f.n} is ${list(t.map(a => ADJ[a][side(f.v, a)]))}.</p><ul class="traits">${t.map(a => `<li>They ${PH[a][side(f.v, a)]}.</li>`).join("")}</ul>`;
};
// Traits you and the figure both lean strongly toward
const shared = (u, f) => {
  const s = AXES.map((_, a) => a).filter(a => (u[a] - 50) * (f.v[a] - 50) > 0 && Math.abs(u[a] - 50) >= 10 && Math.abs(f.v[a] - 50) >= 20)
    .sort((a, b) => Math.abs(f.v[b] - 50) - Math.abs(f.v[a] - 50)).slice(0, 3);
  return s.length ? `<p class="share">You both lean ${list(s.map(a => ADJ[a][side(f.v, a)]))}.</p>` : "";
};

// Strength and weakness for each end of each trait: [[left pole], [right pole]], each [strength, weakness]
const SW = [
  [["Careful planner who avoids needless disasters", "Can miss opportunities by playing it too safe"], ["Fearless when others hesitate", "Can take reckless gambles"]],
  [["Deep, focused thinker", "Can seem distant or hard to know"], ["Magnetic and persuasive in any room", "Can crave attention too much"]],
  [["Gets real things done", "Can be slow to see new possibilities"], ["Original ideas and creative vision", "Can lose touch with practical details"]],
  [["Clear-headed under pressure", "Can come across as cold"], ["Passionate and deeply empathetic", "Can let feelings override judgment"]],
  [["Adaptable and quick to seize inspiration", "Can be unreliable or disorganised"], ["Relentless focus and consistency", "Can be rigid or work themselves too hard"]],
  [["Modest and easy to trust", "Can undersell themselves"], ["Driven to achieve big things", "Can chase success at any cost"]],
  [["Thrives on challenge and raises the bar", "Can turn rivalry into conflict"], ["Brings people together", "Can avoid conflict when it is needed"]],
  [["Challenges unfair rules and pioneers change", "Can clash with authority and invite trouble"], ["Reliable, principled and steady", "Can resist necessary change"]],
  [["Persuades without force and earns loyalty", "Can be too soft when firmness is needed"], ["Commanding and gets results", "Can steamroll other people"]],
  [["Lives fully and adapts to what is in front of them", "Can neglect the long term"], ["Thinks decades ahead", "Can sacrifice the present for the future"]],
  [["Dependable and takes duty to heart", "Can be stern or struggle to relax"], ["Charm and humour win people over", "Can be seen as not serious enough"]],
  [["Realistic and well prepared for setbacks", "Can spread gloom or give up early"], ["Inspires others to keep going", "Can underestimate real dangers"]]
];
// The closing "closer look" section for your top match
const closer = (f, pct, u) => {
  const t = strongest(f.v).slice(0, 4);
  const gaps = AXES.map((_, a) => a).filter(a => Math.abs(u[a] - f.v[a]) >= 35).sort((a, b) => Math.abs(u[b] - f.v[b]) - Math.abs(u[a] - f.v[a])).slice(0, 2);
  return `<p class="deep">${f.b}. ${f.n} (${f.y}) had a personality that was ${list(t.map(a => ADJ[a][side(f.v, a)]))}, and it shaped everything they did. In practice, they ${t.map(a => PH[a][side(f.v, a)]).join("; they ")}.</p>
    <p class="deep">You matched ${pct}% with ${f.n}, so there is a good chance you will recognise some of this in yourself.${gaps.length ? ` Where you differ most: you are more ${list(gaps.map(a => ADJ[a][u[a] > f.v[a] ? 1 : 0]))} than they are.` : ""}</p>
    <div class="sw"><div class="s"><h3>Strengths</h3><ul>${t.map(a => `<li>${SW[a][side(f.v, a)][0]}</li>`).join("")}</ul></div>
    <div class="w"><h3>Weaknesses</h3><ul>${t.map(a => `<li>${SW[a][side(f.v, a)][1]}</li>`).join("")}</ul></div></div>`;
};

// 0-100 position on each axis
function score(Q, ans) {
  const sum = Array(AXES.length).fill(0), max = Array(AXES.length).fill(0);
  Q.forEach(([a, dir], n) => { sum[a] += dir * (ans[n] || 0); max[a] += 2; });
  return sum.map((s, a) => 50 + (50 * s) / max[a]);
}

function rank(u) {
  return FIGS.map(f => {
    const d = Math.sqrt(f.v.reduce((t, x, a) => t + (x - u[a]) ** 2, 0) / u.length);
    return { f, pct: Math.max(0, Math.round(100 - d * 1.5)) };
  }).sort((a, b) => b.pct - a.pct);
}

function countUp(el, to) {
  const t0 = performance.now();
  const tick = t => {
    const k = Math.min(1, (t - t0) / 1100);
    el.textContent = Math.round(to * (1 - (1 - k) ** 3));
    if (k < 1) requestAnimationFrame(tick);
  };
  requestAnimationFrame(tick);
}

// Fade sections in as they scroll into view; result markers slide to their spot at the same time
function reveal() {
  const io = new IntersectionObserver(es => es.forEach(e => {
    if (!e.isIntersecting) return;
    e.target.classList.add("in");
    e.target.querySelectorAll("[data-l]").forEach(i => { i.style.left = i.dataset.l + "%"; });
    io.unobserve(e.target);
  }), { threshold: 0.1, rootMargin: "0px 0px -6% 0px" });
  $$(".wrap h2, .steps li, .len, .faces, .sw, .ax, .match, .note, .key").forEach((el, k) => {
    el.classList.add("reveal");
    el.style.transitionDelay = (k % 4) * 70 + "ms";
    io.observe(el);
  });
}

// Portraits come from the Wikipedia API (one request per 40 figures) and are cached in the browser.
// If a portrait is missing or offline, the initials stay in the medal.
let PICS = {};
try { PICS = JSON.parse(localStorage.getItem("ea_pics") || "{}"); } catch (e) {}
async function loadPics(figs) {
  const need = figs.filter(f => !(f.n in PICS));
  for (let k = 0; k < need.length; k += 40) {
    const batch = need.slice(k, k + 40);
    try {
      const url = "https://en.wikipedia.org/w/api.php?action=query&format=json&formatversion=2&origin=*&redirects=1&prop=pageimages&piprop=thumbnail&pithumbsize=320&pilimit=50&titles=" + encodeURIComponent(batch.map(f => f.w).join("|"));
      const d = (await (await fetch(url)).json()).query;
      const hop = {}, src = {};
      [...(d.normalized || []), ...(d.redirects || [])].forEach(r => { hop[r.from] = r.to; });
      d.pages.forEach(p => { if (p.thumbnail) src[p.title] = p.thumbnail.source; });
      batch.forEach(f => {
        let t = f.w;
        for (let h = 0; h < 2; h++) t = hop[t] || t;
        PICS[f.n] = src[t] || "";
      });
      localStorage.setItem("ea_pics", JSON.stringify(PICS));
    } catch (e) {}
  }
}
async function paint() {
  const els = $$(".med[data-n]");
  await loadPics([...new Set(els.map(e => e.dataset.n))].map(n => FIGS.find(f => f.n === n)));
  els.forEach(el => {
    if (!PICS[el.dataset.n]) return;
    const img = new Image();
    img.alt = "";
    img.onload = () => el.append(img);
    img.src = PICS[el.dataset.n];
  });
}

function home() {
  const show = [["Leonardo da Vinci", "--s:230px;top:0;left:6%"], ["Cleopatra", "--s:170px;top:190px;left:52%"], ["Albert Einstein", "--s:130px;top:270px;left:8%"]];
  $("#stack").innerHTML = show.map(([n, s]) => med(n, s)).join("");
}

// One question per page: quiz.html?q=3. Answers are kept in sessionStorage between pages.
function quiz() {
  let st = JSON.parse(sessionStorage.getItem("ha") || "null"), q = +params.get("q");
  if (!q || !st) {
    st = { n: params.get("n") === "12" ? 12 : 24, ans: [] };
    q = 1;
    sessionStorage.setItem("ha", JSON.stringify(st));
  }
  const Q = questionsFor(st.n);
  q = Math.max(1, Math.min(q, Q.length));
  const [, , place, text] = Q[q - 1];
  const kinds = ["dis s2", "dis s1", "mid s0", "agr s1", "agr s2"];
  let dir = +sessionStorage.getItem("dir") || 1;
  const nav = performance.getEntriesByType("navigation")[0];
  if (nav && nav.type === "back_forward") dir = -1;
  sessionStorage.removeItem("dir");

  $("#app").innerHTML = `
  <header class="top">${logo}<a href="index.html">Quit</a></header>
  <main class="q">
    <div class="meter"><i style="width:${(Math.max(q - 2, 0) / Q.length) * 100}%"></i></div>
    <p class="count">Question ${q} of ${Q.length}</p>
    <p class="place">${place}</p>
    <h1>${text}</h1>
    <div class="scale">${kinds.map((k, n) => `<button class="pt ${k}${st.ans[q - 1] === n - 2 ? " on" : ""}" data-v="${n - 2}" aria-label="${LABELS[n]}" title="${LABELS[n]}"></button>`).join("")}</div>
    <div class="ends"><span>Disagree</span><span>Neutral</span><span>Agree</span></div>
    <a class="back" href="${q > 1 ? "quiz.html?q=" + (q - 1) : "index.html"}">Back</a>
    <p class="hint">Tip: press 1 to 5 on your keyboard to answer.</p>
  </main>`;
  $(".q").style.setProperty("--dx", dir * 48 + "px");
  const bar = $(".meter i");
  requestAnimationFrame(() => requestAnimationFrame(() => { bar.style.width = ((q - 1) / Q.length) * 100 + "%"; }));

  $$(".pt").forEach(b => b.onclick = () => {
    if (document.body.classList.contains("out")) return;
    st.ans[q - 1] = +b.dataset.v;
    sessionStorage.setItem("ha", JSON.stringify(st));
    b.classList.add("on");
    setTimeout(() => go(q < Q.length ? "quiz.html?q=" + (q + 1) : "results.html?a=" + score(Q, st.ans).map(x => x.toFixed(1)).join(",")), 160);
  });
  addEventListener("keydown", e => {
    if (e.metaKey || e.ctrlKey) return;
    const b = $$(".pt")[+e.key - 1];
    if (b) b.click();
    if (e.key === "ArrowLeft" && q > 1) $(".back").click();
  });
}

function results() {
  const p = params.get("a"), u = p && p.split(",").map(Number);
  if (!u || u.length !== 12 || !u.every(x => x >= 0 && x <= 100)) return location.replace("index.html");
  const m = rank(u), top = m[0];
  $("#app").innerHTML = `
  <div class="blue rhero">
    <header class="top">${logo}<a href="index.html">Retake the quiz</a></header>
    ${med(top.f.n)}
    <h1>${top.f.n}</h1>
    <p>${top.f.y}, ${top.f.b}.</p>
    <p class="pct"><span id="n">0</span>% match</p>
  </div>
  <section class="wrap">
    <h2>What ${top.f.n} was like</h2>
    ${about(top.f)}
    ${shared(u, top.f)}
  </section>
  <section class="wrap" style="padding-top:0">
    <h2>Your 12 traits</h2>
    <p class="key">The dark dot is you. The gold dot is ${top.f.n}.</p>
    ${AXES.map(([l, r], a) => `<div class="ax"><div class="lab"><span>${l}</span><span>${r}</span></div>
      <div class="track"><i class="f" style="left:50%" data-l="${top.f.v[a]}"></i><i style="left:50%" data-l="${u[a].toFixed(1)}"></i></div></div>`).join("")}
  </section>
  <section class="wrap" style="padding-top:0">
    <h2>You're also a lot like</h2>
    ${m.slice(1, 6).map(({ f, pct }) => `<div class="match">${med(f.n)}<div><b>${f.n}</b><small>${f.y}, ${f.b}</small><small>${tags(f)}</small></div><strong>${pct}%</strong></div>`).join("")}
  </section>
  <section class="wrap" style="padding-top:0">
    <h2>A closer look at ${top.f.n}</h2>
    ${closer(top.f, top.pct, u)}
  </section>
  <section class="wrap" style="padding-top:0">
    <h2>Share your result</h2>
    <p class="key">Your scores are saved in this page's link. Send it to a friend and compare.</p>
    <div class="acts"><button class="btn" id="copy">Copy result link</button><a class="btn line" style="color:var(--ink)!important" href="index.html">Retake the quiz</a></div>
    <p class="note">Each figure's traits are rough estimates based on what history records about them, so treat your match as a bit of fun, not science. Portraits from Wikipedia and Wikimedia Commons.</p>
  </section>`;
  $("#copy").onclick = e => navigator.clipboard.writeText(location.href).then(() => { e.target.textContent = "Link copied"; });
  countUp($("#n"), top.pct);
}

({ home, quiz, results })[document.body.dataset.page]();
$$(".hero > div:first-child > *, .rhero > :not(.top)").forEach((el, k) => { el.classList.add("rise"); el.style.setProperty("--i", k); });
reveal();
paint();

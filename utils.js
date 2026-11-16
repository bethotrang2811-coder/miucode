/* ============ MiuCode utils: storage, sound, toast, confetti, highlight, mascot ============ */
"use strict";
window.MiuData = window.MiuData || { chapters: {} };

/* ---------- storage ---------- */
const STORE_KEY = "miucode_v1";
const Store = {
  data: null,
  defaults() {
    return {
      lessons: {},            // "1-1": true
      quizzes: {},            // chapterId: {best, attempts, last}
      flash: {},              // "1:0": 1 remembered | 0 not yet
      games: {},              // gameId: best score
      gamesPlayed: {},        // gameId: true
      exam: { best: 0, attempts: 0, history: [] },
      timeSec: 0,
      lastLocation: "#/",
      badges: {},
      sound: true,
      visited: {}
    };
  },
  load() {
    try {
      const raw = localStorage.getItem(STORE_KEY);
      this.data = raw ? Object.assign(this.defaults(), JSON.parse(raw)) : this.defaults();
    } catch (e) { this.data = this.defaults(); }
    return this.data;
  },
  save() {
    try { localStorage.setItem(STORE_KEY, JSON.stringify(this.data)); } catch (e) {}
  },
  reset() { this.data = this.defaults(); this.save(); }
};
Store.load();

/* ---------- tiny helpers ---------- */
const $ = (sel, root) => (root || document).querySelector(sel);
const $$ = (sel, root) => Array.from((root || document).querySelectorAll(sel));
function esc(s) {
  return String(s == null ? "" : s).replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
}
function shuffle(arr) {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; }
  return a;
}
function fmtTime(sec) {
  sec = Math.max(0, Math.round(sec));
  const h = Math.floor(sec / 3600), m = Math.floor((sec % 3600) / 60), s = sec % 60;
  if (h > 0) return h + "g " + m + "ph";
  if (m > 0) return m + "ph " + (s < 10 ? "0" : "") + s + "s";
  return s + "s";
}
function norm(s) {
  return String(s || "").trim().toLowerCase().replace(/\s+/g, " ").replace(/[“”"']/g, "");
}
function chapterIds() { return Object.keys(MiuData.chapters).map(Number).sort((a, b) => a - b); }
function getCh(id) { return MiuData.chapters[id] || null; }
function totalLessons() { return chapterIds().reduce((n, id) => n + (getCh(id).lessons || []).length, 0); }
function doneLessons() { return Object.keys(Store.data.lessons).filter(k => Store.data.lessons[k]).length; }
function chapterLessonPct(id) {
  const ch = getCh(id); if (!ch || !ch.lessons.length) return 0;
  const done = ch.lessons.filter(l => Store.data.lessons[l.id]).length;
  return Math.round(done / ch.lessons.length * 100);
}
function chapterDone(id) { const q = Store.data.quizzes[id]; return !!(q && q.best >= 70); }
function doneChapters() { return chapterIds().filter(chapterDone).length; }
function overallPct() {
  const tl = totalLessons(), nc = chapterIds().length;
  if (!tl || !nc) return 0;
  const lessonPart = doneLessons() / tl * 60;
  const quizPart = doneChapters() / nc * 40;
  return Math.round(lessonPart + quizPart);
}
function nextStudyLocation() {
  for (const id of chapterIds()) {
    const ch = getCh(id);
    for (const l of ch.lessons) if (!Store.data.lessons[l.id]) return "#/hoc/" + id + "/" + l.id;
    if (!chapterDone(id) && ch.quiz && ch.quiz.length) return "#/kiem-tra/" + id;
  }
  return "#/thi-cuoi-khoa";
}
function lastLessonLocation() {
  const loc = Store.data.lastLocation || "";
  if (/^#\/hoc\//.test(loc)) return loc;
  return nextStudyLocation();
}

/* ---------- sound (WebAudio, tiny synth) ---------- */
const Sound = {
  ctx: null,
  ensure() {
    if (!this.ctx) {
      try { this.ctx = new (window.AudioContext || window.webkitAudioContext)(); } catch (e) { this.ctx = null; }
    }
    if (this.ctx && this.ctx.state === "suspended") this.ctx.resume();
    return this.ctx;
  },
  tone(freq, t0, dur, type, gain) {
    const ctx = this.ctx; if (!ctx) return;
    const o = ctx.createOscillator(), g = ctx.createGain();
    o.type = type || "sine"; o.frequency.value = freq;
    g.gain.setValueAtTime(0.0001, ctx.currentTime + t0);
    g.gain.exponentialRampToValueAtTime(gain || 0.12, ctx.currentTime + t0 + 0.015);
    g.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + t0 + dur);
    o.connect(g); g.connect(ctx.destination);
    o.start(ctx.currentTime + t0); o.stop(ctx.currentTime + t0 + dur + 0.05);
  },
  play(name) {
    if (!Store.data.sound) return;
    if (!this.ensure()) return;
    switch (name) {
      case "ok": this.tone(660, 0, .12, "sine", .1); this.tone(880, .09, .18, "sine", .1); break;
      case "no": this.tone(220, 0, .2, "triangle", .09); this.tone(180, .12, .22, "triangle", .08); break;
      case "flip": this.tone(520, 0, .06, "sine", .05); break;
      case "click": this.tone(700, 0, .045, "sine", .045); break;
      case "win": [523, 659, 784, 1047].forEach((f, i) => this.tone(f, i * .11, .22, "sine", .1)); break;
      case "badge": [784, 988, 1175, 1568].forEach((f, i) => this.tone(f, i * .09, .25, "triangle", .08)); break;
      case "tick": this.tone(950, 0, .04, "square", .03); break;
    }
  }
};

/* ---------- toast ---------- */
function toast(msg, kind, ico) {
  const wrap = $("#toastWrap"); if (!wrap) return;
  const el = document.createElement("div");
  el.className = "toast " + (kind || "");
  el.innerHTML = '<span class="t-ico">' + (ico || (kind === "ok" ? "✅" : kind === "warn" ? "💡" : kind === "badge" ? "🏅" : "🐱")) + "</span><span>" + msg + "</span>";
  wrap.appendChild(el);
  setTimeout(() => { el.classList.add("out"); setTimeout(() => el.remove(), 320); }, 3600);
  while (wrap.children.length > 4) wrap.firstChild.remove();
}

/* ---------- confetti ---------- */
const Confetti = {
  parts: [], raf: null,
  burst(n) {
    const cv = $("#confettiCanvas"); if (!cv) return;
    const ctx = cv.getContext("2d");
    cv.width = innerWidth; cv.height = innerHeight;
    const colors = ["#ff9e5e", "#f97b3d", "#ffc9a3", "#5cbf95", "#5b9dff", "#f5b83d", "#ff7e67", "#b78cf0"];
    for (let i = 0; i < (n || 90); i++) {
      this.parts.push({
        x: innerWidth / 2 + (Math.random() - .5) * innerWidth * .5,
        y: innerHeight * .3 + (Math.random() - .5) * 80,
        vx: (Math.random() - .5) * 9, vy: -Math.random() * 9 - 3,
        w: 6 + Math.random() * 7, h: 4 + Math.random() * 6,
        rot: Math.random() * Math.PI, vr: (Math.random() - .5) * .3,
        c: colors[i % colors.length], life: 110 + Math.random() * 50
      });
    }
    if (!this.raf) this.loop(ctx, cv);
  },
  loop(ctx, cv) {
    const step = () => {
      ctx.clearRect(0, 0, cv.width, cv.height);
      this.parts = this.parts.filter(p => p.life > 0 && p.y < cv.height + 30);
      for (const p of this.parts) {
        p.x += p.vx; p.y += p.vy; p.vy += .22; p.vx *= .99; p.rot += p.vr; p.life--;
        ctx.save(); ctx.translate(p.x, p.y); ctx.rotate(p.rot);
        ctx.globalAlpha = Math.min(1, p.life / 40);
        ctx.fillStyle = p.c; ctx.fillRect(-p.w / 2, -p.h / 2, p.w, p.h);
        ctx.restore();
      }
      if (this.parts.length) this.raf = requestAnimationFrame(step);
      else { this.raf = null; ctx.clearRect(0, 0, cv.width, cv.height); }
    };
    this.raf = requestAnimationFrame(step);
  }
};

/* ---------- syntax highlighter (html / css / js) ---------- */
function highlight(code, lang) {
  const src = String(code == null ? "" : code);
  let out = "", i = 0;
  const push = (cls, text) => { out += cls ? '<span class="' + cls + '">' + esc(text) + "</span>" : esc(text); };
  if (lang === "html" || lang === "xml") {
    const re = /(<!--[\s\S]*?-->)|(<!DOCTYPE[^>]*>)|(<\/?)([a-zA-Z][\w-]*)((?:[^>"']|"[^"]*"|'[^']*')*?)(\/?>)|("[^"]*")|('[^']*')/gi;
    let m, last = 0;
    while ((m = re.exec(src))) {
      push(null, src.slice(last, m.index)); last = re.lastIndex;
      if (m[1]) push("tok-com", m[1]);
      else if (m[2]) push("tok-kw", m[2]);
      else if (m[3]) {
        push("tok-punc", m[3]); push("tok-tag", m[4]);
        // attrs inside m[5]
        const attrRe = /([\w-]+)(\s*=\s*)("[^"]*"|'[^']*')|([\w-]+)/g;
        let a, al = 0, s = m[5];
        while ((a = attrRe.exec(s))) {
          push(null, s.slice(al, a.index)); al = attrRe.lastIndex;
          if (a[1]) { push("tok-attr", a[1]); push("tok-punc", a[2]); push("tok-str", a[3]); }
          else push("tok-attr", a[4]);
        }
        push(null, s.slice(al));
        push("tok-punc", m[6]);
      }
      else push("tok-str", m[0]);
    }
    push(null, src.slice(last));
    return out;
  }
  if (lang === "css") {
    const re = /(\/\*[\s\S]*?\*\/)|(@[\w-]+)|("[^"]*"|'[^']*')|([\w-]+)(\s*:\s*)([^;{}]+)(;?)|([.#]?[\w-]+(?:\s*[>+~ ,]\s*[\w.#:-]+)*)?(\s*\{)|(\})|(#[0-9a-fA-F]{3,8}\b)|(\b\d+(?:\.\d+)?(?:px|em|rem|%|vh|vw|s|ms|fr|deg)?\b)/g;
    let m, last = 0;
    while ((m = re.exec(src))) {
      push(null, src.slice(last, m.index)); last = re.lastIndex;
      if (m[1]) push("tok-com", m[1]);
      else if (m[2]) push("tok-at", m[2]);
      else if (m[3]) push("tok-str", m[3]);
      else if (m[4] && m[5]) { push("tok-prop", m[4]); push("tok-punc", m[5]); push("tok-val", m[6]); push("tok-punc", m[7] || ""); }
      else if (m[9]) { push("tok-sel", m[8] || ""); push("tok-punc", m[9]); }
      else if (m[10]) push("tok-punc", m[10]);
      else if (m[11]) push("tok-num", m[11]);
      else if (m[12]) push("tok-num", m[12]);
      else push(null, m[0]);
    }
    push(null, src.slice(last));
    return out;
  }
  // js / json / default
  const re = /(\/\/[^\n]*|\/\*[\s\S]*?\*\/)|("(?:[^"\\\n]|\\.)*"|'(?:[^'\\\n]|\\.)*')|\b(const|let|var|function|return|if|else|for|while|do|switch|case|break|continue|new|typeof|instanceof|class|extends|this|null|undefined|true|false|async|await|try|catch|finally|throw|of|in|import|export|default|delete|void|yield|static|get|set)\b|(\b\d+(?:\.\d+)?\b)|([A-Za-z_$][\w$]*)(?=\s*\()|(\b(?:document|window|console|Math|JSON|Array|Object|String|Number|Boolean|Promise|fetch|setTimeout|setInterval|localStorage|alert)\b)/g;
  let m, last = 0;
  while ((m = re.exec(src))) {
    push(null, src.slice(last, m.index)); last = re.lastIndex;
    if (m[1]) push("tok-com", m[1]);
    else if (m[2]) push("tok-str", m[2]);
    else if (m[3]) push("tok-kw", m[3]);
    else if (m[4]) push("tok-num", m[4]);
    else if (m[5]) push("tok-fn", m[5]);
    else if (m[6]) push("tok-fn", m[6]);
    else push(null, m[0]);
  }
  push(null, src.slice(last));
  return out;
}

/* ---------- mascot: mèo Miu ---------- */
function mascotSVG(mood, cls) {
  // mood: happy | think | sad | party | wave (default happy)
  mood = mood || "happy";
  const eyes = mood === "sad"
    ? '<path d="M38 52 q5 -5 10 0" stroke="#4a3728" stroke-width="3" fill="none" stroke-linecap="round"/><path d="M72 52 q5 -5 10 0" stroke="#4a3728" stroke-width="3" fill="none" stroke-linecap="round"/>'
    : mood === "party"
      ? '<path d="M36 50 l12 0 M42 44 l0 12" stroke="#4a3728" stroke-width="3" stroke-linecap="round" transform="rotate(45 42 50)"/><path d="M70 50 l12 0 M76 44 l0 12" stroke="#4a3728" stroke-width="3" stroke-linecap="round" transform="rotate(45 76 50)"/>'
      : '<g class="m-eye" style="transform-origin:42px 50px"><ellipse cx="42" cy="50" rx="4.6" ry="6" fill="#4a3728"/><circle cx="43.6" cy="47.6" r="1.6" fill="#fff"/></g><g class="m-eye" style="transform-origin:78px 50px"><ellipse cx="78" cy="50" rx="4.6" ry="6" fill="#4a3728"/><circle cx="79.6" cy="47.6" r="1.6" fill="#fff"/></g>';
  const mouth = mood === "sad"
    ? '<path d="M54 66 q6 -5 12 0" stroke="#4a3728" stroke-width="2.6" fill="none" stroke-linecap="round"/>'
    : '<path d="M54 62 q3 5 6 0 q3 5 6 0" stroke="#4a3728" stroke-width="2.6" fill="none" stroke-linecap="round"/>';
  const extra = mood === "party"
    ? '<text x="94" y="26" font-size="16">🎉</text><text x="8" y="30" font-size="14">✨</text>'
    : mood === "think"
      ? '<text x="92" y="28" font-size="16">💭</text>'
      : mood === "wave"
        ? '<g class="m-paw-wave"><ellipse cx="98" cy="72" rx="9" ry="7" fill="#ffb27d" stroke="#e8935a" stroke-width="2"/></g>'
        : '<text x="94" y="28" font-size="13">🍊</text>';
  return '<svg class="mascot-svg ' + (cls || "") + '" viewBox="0 0 120 110" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Mèo Miu">' +
    '<path class="m-tail" d="M96 88 q18 -4 14 -22" stroke="#f2a065" stroke-width="8" fill="none" stroke-linecap="round"/>' +
    '<ellipse cx="60" cy="92" rx="30" ry="16" fill="#ffb27d"/>' +
    '<ellipse cx="60" cy="95" rx="17" ry="10" fill="#ffe3cd"/>' +
    '<path d="M28 34 L24 12 L44 24 Z" fill="#f9a869"/><path d="M92 34 L96 12 L76 24 Z" fill="#f9a869"/>' +
    '<path d="M30 30 L28 18 L40 25 Z" fill="#ffd9b8"/><path d="M90 30 L92 18 L80 25 Z" fill="#ffd9b8"/>' +
    '<ellipse cx="60" cy="52" rx="36" ry="31" fill="#ffb27d"/>' +
    '<path d="M48 24 q4 6 0 10 M60 22 q3 6 0 11 M72 24 q-4 6 0 10" stroke="#f28c48" stroke-width="3" fill="none" stroke-linecap="round"/>' +
    '<ellipse cx="34" cy="62" rx="6.5" ry="4" fill="#ff9d9d" opacity=".55"/><ellipse cx="86" cy="62" rx="6.5" ry="4" fill="#ff9d9d" opacity=".55"/>' +
    eyes +
    '<path d="M57 57 L63 57 L60 61 Z" fill="#e2704f"/>' + mouth +
    '<path d="M20 54 L4 50 M20 59 L5 61 M100 54 L116 50 M100 59 L115 61" stroke="#e8935a" stroke-width="2" stroke-linecap="round"/>' +
    '<ellipse cx="44" cy="98" rx="8" ry="5.5" fill="#ffb27d" stroke="#e8935a" stroke-width="1.6"/><ellipse cx="76" cy="98" rx="8" ry="5.5" fill="#ffb27d" stroke="#e8935a" stroke-width="1.6"/>' +
    extra + "</svg>";
}

/* ---------- cute SVG figures (built-in illustrations) ---------- */
const FIGURES = {
  "client-server": {
    caption: "Client gửi request – Server trả response",
    svg: '<svg viewBox="0 0 560 200" xmlns="http://www.w3.org/2000/svg"><rect x="20" y="55" width="150" height="95" rx="18" fill="#ffe3cd" stroke="#f9a869" stroke-width="2.5"/><text x="95" y="95" text-anchor="middle" font-size="30">💻</text><text x="95" y="128" text-anchor="middle" font-size="14" font-weight="700" fill="#4a3728">Browser (Client)</text><rect x="390" y="55" width="150" height="95" rx="18" fill="#e6f0ff" stroke="#5b9dff" stroke-width="2.5"/><text x="465" y="95" text-anchor="middle" font-size="30">🗄️</text><text x="465" y="128" text-anchor="middle" font-size="14" font-weight="700" fill="#4a3728">Server</text><path d="M175 85 H385" stroke="#f97b3d" stroke-width="3.5" marker-end="url(#arrO)"/><text x="280" y="74" text-anchor="middle" font-size="13" font-weight="700" fill="#c2571f">HTTP Request (GET /index.html)</text><path d="M385 122 H175" stroke="#5cbf95" stroke-width="3.5" marker-end="url(#arrG)"/><text x="280" y="145" text-anchor="middle" font-size="13" font-weight="700" fill="#2e8b66">Response 200 + HTML/CSS/JS</text><defs><marker id="arrO" markerWidth="9" markerHeight="9" refX="7" refY="4.5" orient="auto"><path d="M0 0 L9 4.5 L0 9 Z" fill="#f97b3d"/></marker><marker id="arrG" markerWidth="9" markerHeight="9" refX="7" refY="4.5" orient="auto"><path d="M0 0 L9 4.5 L0 9 Z" fill="#5cbf95"/></marker></defs></svg>'
  },
  "http": {
    caption: "Một lượt HTTP request – response",
    svg: '<svg viewBox="0 0 560 210" xmlns="http://www.w3.org/2000/svg"><rect x="30" y="20" width="230" height="170" rx="16" fill="#fff6ec" stroke="#ffc9a3" stroke-width="2"/><text x="145" y="46" text-anchor="middle" font-size="14" font-weight="800" fill="#c2571f">📤 REQUEST</text><text x="48" y="76" font-size="12.5" font-family="monospace" fill="#4a3728">GET /trang-chu HTTP/1.1</text><text x="48" y="100" font-size="12.5" font-family="monospace" fill="#4a3728">Host: vi-du.vn</text><text x="48" y="124" font-size="12.5" font-family="monospace" fill="#4a3728">Accept: text/html</text><text x="48" y="148" font-size="12.5" font-family="monospace" fill="#8a6d5c">User-Agent: Chrome…</text><rect x="300" y="20" width="230" height="170" rx="16" fill="#e2f6ec" stroke="#5cbf95" stroke-width="2"/><text x="415" y="46" text-anchor="middle" font-size="14" font-weight="800" fill="#2e8b66">📥 RESPONSE</text><text x="318" y="76" font-size="12.5" font-family="monospace" fill="#4a3728">HTTP/1.1 200 OK</text><text x="318" y="100" font-size="12.5" font-family="monospace" fill="#4a3728">Content-Type: text/html</text><text x="318" y="124" font-size="12.5" font-family="monospace" fill="#4a3728">Content-Length: 1256</text><text x="318" y="148" font-size="12.5" font-family="monospace" fill="#8a6d5c">&lt;!DOCTYPE html&gt; …</text><path d="M262 105 H296" stroke="#f97b3d" stroke-width="3.5" marker-end="url(#arrH)"/><defs><marker id="arrH" markerWidth="9" markerHeight="9" refX="7" refY="4.5" orient="auto"><path d="M0 0 L9 4.5 L0 9 Z" fill="#f97b3d"/></marker></defs></svg>'
  },
  "html-structure": {
    caption: "Cấu trúc cây của một tài liệu HTML",
    svg: '<svg viewBox="0 0 560 230" xmlns="http://www.w3.org/2000/svg"><g font-family="monospace" font-size="13" font-weight="700"><rect x="225" y="12" width="110" height="32" rx="10" fill="#f97b3d"/><text x="280" y="33" text-anchor="middle" fill="#fff">&lt;html&gt;</text><rect x="105" y="72" width="110" height="32" rx="10" fill="#ffc9a3"/><text x="160" y="93" text-anchor="middle" fill="#4a3728">&lt;head&gt;</text><rect x="345" y="72" width="110" height="32" rx="10" fill="#ffc9a3"/><text x="400" y="93" text-anchor="middle" fill="#4a3728">&lt;body&gt;</text><rect x="60" y="140" width="90" height="30" rx="9" fill="#fff3d6" stroke="#f5b83d"/><text x="105" y="160" text-anchor="middle" fill="#a97b12">&lt;title&gt;</text><rect x="165" y="140" width="90" height="30" rx="9" fill="#fff3d6" stroke="#f5b83d"/><text x="210" y="160" text-anchor="middle" fill="#a97b12">&lt;meta&gt;</text><rect x="300" y="140" width="80" height="30" rx="9" fill="#e2f6ec" stroke="#5cbf95"/><text x="340" y="160" text-anchor="middle" fill="#2e8b66">&lt;h1&gt;</text><rect x="395" y="140" width="80" height="30" rx="9" fill="#e2f6ec" stroke="#5cbf95"/><text x="435" y="160" text-anchor="middle" fill="#2e8b66">&lt;p&gt;</text><rect x="300" y="188" width="175" height="30" rx="9" fill="#e6f0ff" stroke="#5b9dff"/><text x="387" y="208" text-anchor="middle" fill="#3a6fc4">&lt;img&gt; …</text></g><g stroke="#e8935a" stroke-width="2.5" fill="none"><path d="M255 44 L160 72 M305 44 L400 72 M140 104 L105 140 M180 104 L210 140 M380 104 L340 140 M420 104 L435 140 M400 104 L387 188"/></g></svg>'
  },
  "box-model": {
    caption: "Box Model: content → padding → border → margin",
    svg: '<svg viewBox="0 0 560 240" xmlns="http://www.w3.org/2000/svg"><rect x="80" y="15" width="400" height="210" rx="14" fill="#ffe7e7" stroke="#f26d6d" stroke-width="2" stroke-dasharray="7 5"/><text x="100" y="38" font-size="13" font-weight="800" fill="#c94f4f">margin</text><rect x="125" y="48" width="310" height="145" rx="10" fill="#fff3d6" stroke="#f5b83d" stroke-width="4"/><text x="143" y="70" font-size="13" font-weight="800" fill="#a97b12">border</text><rect x="165" y="80" width="230" height="82" rx="8" fill="#e2f6ec" stroke="#5cbf95" stroke-width="2"/><text x="182" y="100" font-size="13" font-weight="800" fill="#2e8b66">padding</text><rect x="205" y="106" width="150" height="40" rx="6" fill="#e6f0ff" stroke="#5b9dff" stroke-width="2"/><text x="280" y="131" text-anchor="middle" font-size="13" font-weight="800" fill="#3a6fc4">content</text></svg>'
  },
  "flex": {
    caption: "Flexbox: các item xếp trên trục chính (main axis)",
    svg: '<svg viewBox="0 0 560 200" xmlns="http://www.w3.org/2000/svg"><rect x="30" y="40" width="500" height="110" rx="14" fill="#fff6ec" stroke="#f9a869" stroke-width="2.5"/><text x="46" y="64" font-size="12" font-weight="800" fill="#c2571f">display: flex →</text><g font-weight="800" font-size="15" text-anchor="middle"><rect x="60" y="78" width="100" height="56" rx="10" fill="#ffc9a3"/><text x="110" y="112" fill="#4a3728">item 1</text><rect x="180" y="78" width="100" height="56" rx="10" fill="#ffd166"/><text x="230" y="112" fill="#4a3728">item 2</text><rect x="300" y="78" width="100" height="56" rx="10" fill="#9adbbd"/><text x="350" y="112" fill="#4a3728">item 3</text></g><path d="M60 172 H470" stroke="#f97b3d" stroke-width="3" marker-end="url(#arrF)"/><text x="265" y="192" text-anchor="middle" font-size="12" font-weight="700" fill="#c2571f">main axis (justify-content)</text><path d="M545 55 V140" stroke="#5b9dff" stroke-width="3" marker-end="url(#arrB)"/><defs><marker id="arrF" markerWidth="9" markerHeight="9" refX="7" refY="4.5" orient="auto"><path d="M0 0 L9 4.5 L0 9 Z" fill="#f97b3d"/></marker><marker id="arrB" markerWidth="9" markerHeight="9" refX="7" refY="4.5" orient="auto"><path d="M0 0 L9 4.5 L0 9 Z" fill="#5b9dff"/></marker></defs></svg>'
  },
  "grid": {
    caption: "CSS Grid: hàng (row) × cột (column)",
    svg: '<svg viewBox="0 0 560 210" xmlns="http://www.w3.org/2000/svg"><g font-weight="800" font-size="14" text-anchor="middle"><rect x="60" y="30" width="140" height="70" rx="10" fill="#ffc9a3"/><text x="130" y="70" fill="#4a3728">1</text><rect x="212" y="30" width="140" height="70" rx="10" fill="#ffd166"/><text x="282" y="70" fill="#4a3728">2</text><rect x="364" y="30" width="140" height="70" rx="10" fill="#9adbbd"/><text x="434" y="70" fill="#4a3728">3</text><rect x="60" y="112" width="292" height="70" rx="10" fill="#a8c8ff"/><text x="206" y="152" fill="#2c4a7c">4 (span 2 cột)</text><rect x="364" y="112" width="140" height="70" rx="10" fill="#d9bdf7"/><text x="434" y="152" fill="#5c3a8e">5</text></g><text x="280" y="203" text-anchor="middle" font-size="12" font-weight="700" fill="#8a6d5c">grid-template-columns: 1fr 1fr 1fr; gap: 12px</text></svg>'
  },
  "dom-tree": {
    caption: "DOM – trình duyệt biểu diễn HTML thành cây đối tượng",
    svg: '<svg viewBox="0 0 560 220" xmlns="http://www.w3.org/2000/svg"><g font-family="monospace" font-size="13" font-weight="700" text-anchor="middle"><rect x="220" y="12" width="120" height="32" rx="10" fill="#f97b3d"/><text x="280" y="33" fill="#fff">document</text><rect x="225" y="72" width="110" height="30" rx="9" fill="#ffc9a3"/><text x="280" y="92" fill="#4a3728">&lt;body&gt;</text><rect x="80" y="136" width="120" height="30" rx="9" fill="#e2f6ec" stroke="#5cbf95"/><text x="140" y="156" fill="#2e8b66">&lt;h1&gt;</text><rect x="230" y="136" width="120" height="30" rx="9" fill="#e2f6ec" stroke="#5cbf95"/><text x="290" y="156" fill="#2e8b66">&lt;p id="demo"&gt;</text><rect x="380" y="136" width="120" height="30" rx="9" fill="#e2f6ec" stroke="#5cbf95"/><text x="440" y="156" fill="#2e8b66">&lt;button&gt;</text><rect x="215" y="184" width="150" height="28" rx="9" fill="#fff3d6" stroke="#f5b83d"/><text x="290" y="203" fill="#a97b12">"Xin chào!" (text)</text></g><g stroke="#e8935a" stroke-width="2.5" fill="none"><path d="M280 44 V72 M255 102 L140 136 M280 102 V136 M305 102 L440 136 M290 166 V184"/></g></svg>'
  },
  "responsive": {
    caption: "Responsive: cùng một nội dung trên 3 kích thước màn hình",
    svg: '<svg viewBox="0 0 560 200" xmlns="http://www.w3.org/2000/svg"><rect x="20" y="30" width="240" height="140" rx="12" fill="#fff" stroke="#8a6d5c" stroke-width="3"/><rect x="34" y="44" width="212" height="20" rx="5" fill="#ffc9a3"/><rect x="34" y="72" width="66" height="84" rx="6" fill="#ffe3cd"/><rect x="107" y="72" width="66" height="84" rx="6" fill="#ffe3cd"/><rect x="180" y="72" width="66" height="84" rx="6" fill="#ffe3cd"/><text x="140" y="190" text-anchor="middle" font-size="12" font-weight="700" fill="#8a6d5c">Desktop: 3 cột</text><rect x="300" y="40" width="130" height="130" rx="12" fill="#fff" stroke="#8a6d5c" stroke-width="3"/><rect x="312" y="52" width="106" height="16" rx="5" fill="#ffc9a3"/><rect x="312" y="76" width="50" height="80" rx="6" fill="#ffe3cd"/><rect x="368" y="76" width="50" height="80" rx="6" fill="#ffe3cd"/><text x="365" y="190" text-anchor="middle" font-size="12" font-weight="700" fill="#8a6d5c">Tablet: 2 cột</text><rect x="470" y="45" width="70" height="125" rx="12" fill="#fff" stroke="#8a6d5c" stroke-width="3"/><rect x="479" y="56" width="52" height="12" rx="4" fill="#ffc9a3"/><rect x="479" y="74" width="52" height="26" rx="5" fill="#ffe3cd"/><rect x="479" y="105" width="52" height="26" rx="5" fill="#ffe3cd"/><rect x="479" y="136" width="52" height="26" rx="5" fill="#ffe3cd"/><text x="505" y="190" text-anchor="middle" font-size="12" font-weight="700" fill="#8a6d5c">Mobile: 1 cột</text></svg>'
  },
  "specificity": {
    caption: "Độ ưu tiên selector: inline > id > class > thẻ",
    svg: '<svg viewBox="0 0 560 190" xmlns="http://www.w3.org/2000/svg"><g font-size="13" font-weight="800"><rect x="30" y="120" width="115" height="46" rx="10" fill="#e6f0ff" stroke="#5b9dff" stroke-width="2"/><text x="87" y="140" text-anchor="middle" fill="#3a6fc4">Thẻ (p)</text><text x="87" y="158" text-anchor="middle" fill="#8a6d5c" font-size="11">0-0-1</text><rect x="165" y="88" width="115" height="78" rx="10" fill="#e2f6ec" stroke="#5cbf95" stroke-width="2"/><text x="222" y="112" text-anchor="middle" fill="#2e8b66">Class (.btn)</text><text x="222" y="130" text-anchor="middle" fill="#8a6d5c" font-size="11">0-1-0</text><rect x="300" y="56" width="115" height="110" rx="10" fill="#fff3d6" stroke="#f5b83d" stroke-width="2"/><text x="357" y="82" text-anchor="middle" fill="#a97b12">ID (#main)</text><text x="357" y="100" text-anchor="middle" fill="#8a6d5c" font-size="11">1-0-0</text><rect x="435" y="24" width="105" height="142" rx="10" fill="#ffe3cd" stroke="#f97b3d" stroke-width="2.5"/><text x="487" y="52" text-anchor="middle" fill="#c2571f">Inline style</text><text x="487" y="70" text-anchor="middle" fill="#8a6d5c" font-size="11">1-0-0-0</text><text x="487" y="150" text-anchor="middle" font-size="20">👑</text></g><path d="M40 105 L520 12" stroke="#f9a869" stroke-width="2.5" stroke-dasharray="6 5"/></svg>'
  },
  "js-event": {
    caption: "Vòng lặp sự kiện: click → handler → cập nhật DOM",
    svg: '<svg viewBox="0 0 560 170" xmlns="http://www.w3.org/2000/svg"><g text-anchor="middle" font-weight="800" font-size="13"><rect x="20" y="50" width="140" height="70" rx="14" fill="#ffe3cd" stroke="#f9a869" stroke-width="2.5"/><text x="90" y="80" font-size="24">👆</text><text x="90" y="106" fill="#4a3728">User click</text><rect x="210" y="50" width="150" height="70" rx="14" fill="#fff3d6" stroke="#f5b83d" stroke-width="2.5"/><text x="285" y="80" font-size="24">⚡</text><text x="285" y="106" fill="#4a3728">Event handler (JS)</text><rect x="410" y="50" width="130" height="70" rx="14" fill="#e2f6ec" stroke="#5cbf95" stroke-width="2.5"/><text x="475" y="80" font-size="24">🖼️</text><text x="475" y="106" fill="#4a3728">DOM cập nhật</text></g><path d="M162 85 H206" stroke="#f97b3d" stroke-width="3.5" marker-end="url(#arrE)"/><path d="M362 85 H406" stroke="#f97b3d" stroke-width="3.5" marker-end="url(#arrE)"/><path d="M475 124 q0 34 -190 34 q-190 0 -195 -32" stroke="#5b9dff" stroke-width="2.5" fill="none" stroke-dasharray="6 5" marker-end="url(#arrE2)"/><text x="285" y="152" text-anchor="middle" font-size="11.5" font-weight="700" fill="#3a6fc4">người dùng thấy thay đổi → tương tác tiếp</text><defs><marker id="arrE" markerWidth="9" markerHeight="9" refX="7" refY="4.5" orient="auto"><path d="M0 0 L9 4.5 L0 9 Z" fill="#f97b3d"/></marker><marker id="arrE2" markerWidth="9" markerHeight="9" refX="7" refY="4.5" orient="auto"><path d="M0 0 L9 4.5 L0 9 Z" fill="#5b9dff"/></marker></defs></svg>'
  },
  "bootstrap-grid": {
    caption: "Bootstrap grid: hàng .row chia 12 cột",
    svg: '<svg viewBox="0 0 560 170" xmlns="http://www.w3.org/2000/svg"><g>' + Array.from({ length: 12 }, (_, i) => '<rect x="' + (24 + i * 43) + '" y="30" width="38" height="34" rx="6" fill="#ffe3cd" stroke="#ffc9a3"/><text x="' + (43 + i * 43) + '" y="52" text-anchor="middle" font-size="11" font-weight="700" fill="#c2571f">' + (i + 1) + "</text>").join("") + '</g><rect x="24" y="82" width="339" height="42" rx="8" fill="#d9bdf7" stroke="#b78cf0" stroke-width="2"/><text x="193" y="108" text-anchor="middle" font-size="13" font-weight="800" fill="#5c3a8e">.col-md-8</text><rect x="368" y="82" width="167" height="42" rx="8" fill="#9adbbd" stroke="#5cbf95" stroke-width="2"/><text x="451" y="108" text-anchor="middle" font-size="13" font-weight="800" fill="#22684c">.col-md-4</text><text x="280" y="152" text-anchor="middle" font-size="12" font-weight="700" fill="#8a6d5c">8 + 4 = 12 cột → một hàng .row</text></svg>'
  },
  "async": {
    caption: "Fetch API: bất đồng bộ với Promise / async-await",
    svg: '<svg viewBox="0 0 560 180" xmlns="http://www.w3.org/2000/svg"><g text-anchor="middle" font-weight="800" font-size="12.5"><rect x="20" y="55" width="120" height="64" rx="12" fill="#ffe3cd" stroke="#f9a869" stroke-width="2.5"/><text x="80" y="82" font-size="20">📜</text><text x="80" y="106" fill="#4a3728">JS gọi fetch()</text><rect x="190" y="55" width="130" height="64" rx="12" fill="#fff3d6" stroke="#f5b83d" stroke-width="2.5"/><text x="255" y="82" font-size="20">⏳</text><text x="255" y="106" fill="#4a3728">Promise (chờ…)</text><rect x="370" y="20" width="170" height="56" rx="12" fill="#e2f6ec" stroke="#5cbf95" stroke-width="2.5"/><text x="455" y="44" font-size="18">✅</text><text x="455" y="66" fill="#2e8b66">.then → response.json()</text><rect x="370" y="100" width="170" height="56" rx="12" fill="#ffe7e7" stroke="#f26d6d" stroke-width="2.5"/><text x="455" y="124" font-size="18">⚠️</text><text x="455" y="146" fill="#c94f4f">.catch → xử lý lỗi</text></g><path d="M142 87 H186" stroke="#f97b3d" stroke-width="3.5" marker-end="url(#arrA)"/><path d="M322 75 L366 50" stroke="#5cbf95" stroke-width="3" marker-end="url(#arrA2)"/><path d="M322 100 L366 126" stroke="#f26d6d" stroke-width="3" marker-end="url(#arrA3)"/><defs><marker id="arrA" markerWidth="9" markerHeight="9" refX="7" refY="4.5" orient="auto"><path d="M0 0 L9 4.5 L0 9 Z" fill="#f97b3d"/></marker><marker id="arrA2" markerWidth="9" markerHeight="9" refX="7" refY="4.5" orient="auto"><path d="M0 0 L9 4.5 L0 9 Z" fill="#5cbf95"/></marker><marker id="arrA3" markerWidth="9" markerHeight="9" refX="7" refY="4.5" orient="auto"><path d="M0 0 L9 4.5 L0 9 Z" fill="#f26d6d"/></marker></defs></svg>'
  }
};
function figureSVG(kind) {
  const f = FIGURES[kind];
  if (!f) return "";
  return '<figure class="figure">' + f.svg + "<figcaption>🖼️ " + esc(f.caption) + "</figcaption></figure>";
}

/* ---------- badges ---------- */
const BADGES = [
  { id: "first-lesson", ico: "🐣", name: "Bước đầu tiên", desc: "Hoàn thành bài học đầu tiên", test: d => doneLessons() >= 1 },
  { id: "five-lessons", ico: "📚", name: "Chăm chỉ", desc: "Hoàn thành 5 bài học", test: d => doneLessons() >= 5 },
  { id: "half-lessons", ico: "🌟", name: "Nửa chặng đường", desc: "Hoàn thành 50% số bài học", test: d => totalLessons() > 0 && doneLessons() >= totalLessons() / 2 },
  { id: "all-lessons", ico: "🎓", name: "Học bá", desc: "Hoàn thành toàn bộ bài học", test: d => totalLessons() > 0 && doneLessons() >= totalLessons() },
  { id: "first-chapter", ico: "🥉", name: "Khởi động", desc: "Qua kiểm tra chương đầu tiên", test: d => doneChapters() >= 1 },
  { id: "five-chapters", ico: "🥈", name: "Tăng tốc", desc: "Hoàn thành 5 chương", test: d => doneChapters() >= 5 },
  { id: "all-chapters", ico: "🥇", name: "Chinh phục CSE122", desc: "Hoàn thành cả 9 chương", test: d => chapterIds().length > 0 && doneChapters() >= chapterIds().length },
  { id: "perfect-quiz", ico: "💯", name: "Tuyệt đối", desc: "Đạt 100% một bài kiểm tra chương", test: d => Object.values(d.quizzes).some(q => q.best >= 100) },
  { id: "flash-30", ico: "🃏", name: "Trí nhớ tốt", desc: "Ghi nhớ 30 flashcard", test: d => Object.values(d.flash).filter(v => v === 1).length >= 30 },
  { id: "flash-80", ico: "🧠", name: "Siêu trí nhớ", desc: "Ghi nhớ 80 flashcard", test: d => Object.values(d.flash).filter(v => v === 1).length >= 80 },
  { id: "gamer", ico: "🎮", name: "Vừa học vừa chơi", desc: "Chơi cả 6 mini game", test: d => Object.keys(d.gamesPlayed).length >= 6 },
  { id: "exam-pass", ico: "🏆", name: "Tốt nghiệp MiuCode", desc: "Đạt bài thi cuối khóa (≥50%)", test: d => d.exam.best >= 50 },
  { id: "exam-excellent", ico: "👑", name: "Xuất sắc", desc: "Đạt ≥90% bài thi cuối khóa", test: d => d.exam.best >= 90 },
  { id: "time-60", ico: "⏰", name: "Bền bỉ", desc: "Học tổng cộng 60 phút", test: d => d.timeSec >= 3600 }
];
function checkBadges() {
  let newly = [];
  for (const b of BADGES) {
    if (!Store.data.badges[b.id] && b.test(Store.data)) {
      Store.data.badges[b.id] = Date.now();
      newly.push(b);
    }
  }
  if (newly.length) {
    Store.save();
    newly.forEach((b, i) => setTimeout(() => {
      toast("Huy hiệu mới: <b>" + b.name + "</b> " + b.ico + " — " + b.desc, "badge", b.ico);
      Sound.play("badge"); Confetti.burst(60);
    }, 600 + i * 1400));
  }
}

/* ---------- confirm modal ---------- */
function confirmModal(title, msg, okLabel, onOk) {
  const scrim = document.createElement("div");
  scrim.className = "modal-scrim";
  scrim.innerHTML = '<div class="modal"><div style="font-size:2.4rem">🐱</div><h3>' + esc(title) + '</h3><p class="muted small">' + msg + '</p><div class="flex"><button class="btn btn-ghost" data-x="no">Huỷ</button><button class="btn btn-primary" data-x="ok">' + esc(okLabel || "Đồng ý") + "</button></div></div>";
  document.body.appendChild(scrim);
  const close = () => scrim.remove();
  scrim.addEventListener("click", e => {
    if (e.target === scrim || e.target.dataset.x === "no") close();
    if (e.target.dataset.x === "ok") { close(); onOk && onOk(); }
  });
}
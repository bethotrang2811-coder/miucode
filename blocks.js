/* ============ MiuCode lesson block renderer ============ */
"use strict";
const Blocks = {
  reg: {}, uid: 0,
  reset() { this.reg = {}; this.uid = 0; },
  key() { return "b" + (++this.uid); },

  previewDoc(code, lang, base) {
    const capture =
      '<script>(function(){var out=document.createElement("pre");out.id="miu-out";' +
      'out.style.cssText="background:#2d2318;color:#9adbbd;font:12px/1.6 monospace;padding:8px 12px;border-radius:8px;margin:8px 0;white-space:pre-wrap;display:none";' +
      'function app(s){out.style.display="block";out.textContent+=s+"\\n";document.body.appendChild(out);}' +
      'var lg=console.log,er=console.error;' +
      'console.log=function(){app(Array.prototype.map.call(arguments,function(a){try{return typeof a==="object"?JSON.stringify(a):String(a)}catch(e){return String(a)}}).join(" "));lg.apply(console,arguments)};' +
      'console.error=function(){app("❌ "+Array.prototype.join.call(arguments," "));er.apply(console,arguments)};' +
      'window.onerror=function(m){app("❌ Lỗi: "+m);return false};' +
      'window.alert=function(m){app("🔔 alert: "+m)};' +
      'window.prompt=function(m){app("🔔 prompt: "+m);return "Miu"};' +
      "})();<\/script>";
    const baseStyle = '<style>body{font-family:system-ui,sans-serif;padding:12px;color:#333;font-size:14px}</style>';
    code = String(code || "");
    if (lang === "css") {
      const html = base || '<h2>Tiêu đề ví dụ</h2><p class="intro">Đoạn văn bản mẫu để xem CSS tác động.</p><button class="btn">Nút bấm</button><ul><li>Mục một</li><li>Mục hai</li></ul>';
      return "<!DOCTYPE html><html><head><meta charset='utf-8'>" + baseStyle + "<style>" + code + "</style></head><body>" + html + "</body></html>";
    }
    if (lang === "js" || lang === "javascript") {
      const html = base || '<h3 id="demo">Kết quả sẽ hiện ở đây</h3><button id="btn">Bấm thử</button><p>Xem cả phần console bên dưới 👇</p>';
      return "<!DOCTYPE html><html><head><meta charset='utf-8'>" + baseStyle + "</head><body>" + html + capture + "<script>try{" + code + "}catch(e){console.error(e.message)}<\/script></body></html>";
    }
    // html
    if (/<html[\s>]/i.test(code)) return code.replace(/<\/body>/i, capture + "</body>");
    return "<!DOCTYPE html><html><head><meta charset='utf-8'>" + baseStyle + "</head><body>" + code + capture + "</body></html>";
  },

  render(blocks) {
    return (blocks || []).map(b => this.renderOne(b)).join("");
  },

  renderOne(b) {
    switch (b.t) {
      case "text":
        return '<div class="block block-text">' + b.html + "</div>";
      case "callout": {
        const icos = { tip: "💡", warn: "⚠️", note: "📌", remember: "🧠" };
        return '<div class="block callout ' + esc(b.kind || "note") + '"><span class="co-ico">' + (icos[b.kind] || "📌") + '</span><div><b class="co-title">' + esc(b.title || "") + "</b>" + (b.html || "") + "</div></div>";
      }
      case "terms":
        return '<div class="block terms">' + (b.items || []).map(it => '<div class="term"><b>' + esc(it.term) + "</b><span>" + it.def + "</span></div>").join("") + "</div>";
      case "figure":
        return '<div class="block">' + figureSVG(b.kind) + (b.caption ? '<p class="small muted center">' + esc(b.caption) + "</p>" : "") + "</div>";
      case "code": return this.renderCode(b);
      case "practice": return this.renderPractice(b);
      case "exercise": return this.renderExercise(b);
      default: return "";
    }
  },

  renderCode(b) {
    const k = this.key();
    this.reg[k] = { code: b.code, lang: b.lang, base: b.base || null };
    const lang = (b.lang || "html").toLowerCase();
    const runnable = b.run !== false;
    let html = '<div class="block code-card" data-block="' + k + '">' +
      '<div class="code-head"><span class="code-dots"><i></i><i></i><i></i></span>' +
      '<span class="code-title">' + esc(b.title || "Ví dụ code") + '</span><span class="code-lang">' + esc(lang) + "</span>" +
      '<span class="code-actions">' +
      '<button class="code-btn" data-act="copy">📋 Copy</button>' +
      (runnable ? '<button class="code-btn" data-act="edit">✏️ Sửa</button><button class="code-btn" data-act="run">▶ Chạy lại</button>' : "") +
      "</span></div>" +
      '<div class="code-body"><pre>' + highlight(b.code, lang) + "</pre></div>";
    if (b.explain) html += '<div class="code-explain">🔎 ' + b.explain + "</div>";
    if (runnable) {
      html += '<div class="preview-wrap"><div class="preview-label">🖥️ Kết quả chạy trực tiếp (Preview)</div>' +
        '<iframe class="preview-frame" sandbox="allow-scripts" title="Kết quả ví dụ" loading="lazy"></iframe></div>';
    }
    html += "</div>";
    return html;
  },

  renderPractice(b) {
    const k = this.key();
    this.reg[k] = { a: b.a, explain: b.explain || "", options: b.options || [] };
    return '<div class="block practice" data-practice="' + k + '">' +
      '<div class="pr-label">✏️ Luyện tập nhanh</div><div class="pr-q">' + b.q + "</div>" +
      '<div class="opt-list">' + (b.options || []).map((o, i) =>
        '<button class="opt-btn" data-i="' + i + '"><span class="opt-key">' + "ABCD"[i] + "</span><span>" + o + "</span></button>").join("") +
      '</div><div class="feedback"></div></div>';
  },

  renderExercise(b) {
    const k = this.key();
    this.reg[k] = { lang: b.lang || "html", starter: b.starter || "", solution: b.solution || "", hint: b.hint || "", base: b.base || null };
    return '<div class="block exercise" data-exercise="' + k + '">' +
      '<div class="ex-label">🛠️ Bài tập thực hành</div><b>' + esc(b.title || "Thực hành") + "</b>" +
      '<div class="small">' + (b.task || "") + "</div>" +
      '<textarea spellcheck="false">' + esc(b.starter || "") + "</textarea>" +
      '<div class="ex-actions">' +
      '<button class="btn btn-primary btn-sm" data-act="run">▶ Chạy thử</button>' +
      '<button class="btn btn-soft btn-sm" data-act="hint">💡 Gợi ý</button>' +
      '<button class="btn btn-ghost btn-sm" data-act="sol">🔑 Xem đáp án</button>' +
      '<button class="btn btn-ghost btn-sm" data-act="reset">↺ Làm lại từ đầu</button>' +
      "</div>" +
      '<div class="ex-reveal" data-rev="hint"><div class="callout note"><span class="co-ico">💡</span><div>' + (b.hint || "Đọc lại lý thuyết phía trên nhé!") + "</div></div></div>" +
      '<div class="ex-reveal" data-rev="sol"><div class="code-card"><div class="code-head"><span class="code-title">Đáp án tham khảo</span><button class="code-btn" data-act="usesol">⬇ Nạp vào ô code</button></div><div class="code-body"><pre>' + highlight(b.solution || "", b.lang || "html") + "</pre></div></div></div>" +
      '<div class="preview-wrap" style="display:none;border:1.5px solid var(--line);border-radius:12px;margin-top:12px;overflow:hidden"><div class="preview-label">🖥️ Kết quả bài làm của bạn</div><iframe class="preview-frame" sandbox="allow-scripts" title="Kết quả bài tập"></iframe></div>' +
      "</div>";
  },

  /* bind all blocks inside root */
  bind(root) {
    // code cards
    $$(".code-card[data-block]", root).forEach(card => {
      const k = card.dataset.block, info = this.reg[k];
      if (!info) return;
      const frame = $(".preview-frame", card);
      const body = $(".code-body", card);
      const run = code => { if (frame) frame.srcdoc = this.previewDoc(code, info.lang, info.base); };
      let current = info.code, editing = false, ta = null;
      if (frame) {
        // run immediately; IntersectionObserver only as a re-run safeguard
        run(current);
        if ("IntersectionObserver" in window) {
          const io = new IntersectionObserver(entries => {
            if (entries[0].isIntersecting && !frame.srcdoc) { run(current); io.disconnect(); }
          }, { rootMargin: "300px" });
          io.observe(card);
        }
      }
      card.addEventListener("click", e => {
        const btn = e.target.closest("[data-act]"); if (!btn) return;
        const act = btn.dataset.act;
        if (act === "copy") {
          const txt = editing && ta ? ta.value : current;
          const done = () => { btn.classList.add("copied"); btn.textContent = "✓ Đã copy"; setTimeout(() => { btn.classList.remove("copied"); btn.textContent = "📋 Copy"; }, 1600); };
          if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(txt).then(done).catch(() => { fallbackCopy(txt); done(); });
          else { fallbackCopy(txt); done(); }
          Sound.play("click");
        }
        if (act === "run") { if (editing && ta) current = ta.value; run(current); Sound.play("click"); }
        if (act === "edit") {
          editing = !editing;
          if (editing) {
            body.innerHTML = ""; ta = document.createElement("textarea"); ta.spellcheck = false; ta.value = current;
            body.appendChild(ta); btn.textContent = "👁 Xem code";
          } else {
            current = ta.value; body.innerHTML = "<pre>" + highlight(current, info.lang) + "</pre>"; ta = null; btn.textContent = "✏️ Sửa";
            run(current);
          }
        }
      });
    });
    // practice
    $$("[data-practice]", root).forEach(box => {
      const k = box.dataset.practice, info = this.reg[k];
      const fb = $(".feedback", box);
      box.addEventListener("click", e => {
        const btn = e.target.closest(".opt-btn"); if (!btn || btn.disabled) return;
        const i = +btn.dataset.i, ok = i === info.a;
        $$(".opt-btn", box).forEach((b, j) => {
          b.disabled = true;
          if (j === info.a) b.classList.add("correct");
          else if (j === i) b.classList.add("wrong");
          else b.classList.add("dim");
        });
        fb.className = "feedback show " + (ok ? "ok" : "no");
        fb.innerHTML = (ok ? "🎉 <b>Chính xác!</b> " : "😿 <b>Chưa đúng.</b> Đáp án: <b>" + "ABCD"[info.a] + "</b>. ") + info.explain +
          ' <button class="btn btn-ghost btn-sm" style="margin-top:8px" data-retry>↺ Thử lại</button>';
        Sound.play(ok ? "ok" : "no");
        if (ok) Confetti.burst(35);
      });
      fb.addEventListener("click", e => {
        if (e.target.closest("[data-retry]")) {
          $$(".opt-btn", box).forEach(b => { b.disabled = false; b.className = "opt-btn"; });
          fb.className = "feedback";
        }
      });
    });
    // exercises
    $$("[data-exercise]", root).forEach(box => {
      const k = box.dataset.exercise, info = this.reg[k];
      const ta = $("textarea", box), frame = $(".preview-frame", box), wrap = $(".preview-wrap", box);
      box.addEventListener("click", e => {
        const btn = e.target.closest("[data-act]"); if (!btn) return;
        const act = btn.dataset.act;
        if (act === "run") {
          wrap.style.display = "block";
          frame.srcdoc = Blocks.previewDoc(ta.value, info.lang, info.base);
          Sound.play("click"); toast("Đã chạy bài làm của bạn! Xem kết quả bên dưới 👇", "ok", "▶️");
        }
        if (act === "hint") { $('[data-rev="hint"]', box).classList.toggle("show"); }
        if (act === "sol") { $('[data-rev="sol"]', box).classList.toggle("show"); }
        if (act === "usesol") { ta.value = info.solution; toast("Đã nạp đáp án vào ô code — hãy chạy thử và đọc hiểu từng dòng nhé!", "ok", "🔑"); }
        if (act === "reset") { ta.value = info.starter; wrap.style.display = "none"; }
      });
    });
  }
};
function fallbackCopy(txt) {
  const ta = document.createElement("textarea");
  ta.value = txt; ta.style.position = "fixed"; ta.style.opacity = "0";
  document.body.appendChild(ta); ta.select();
  try { document.execCommand("copy"); } catch (e) {}
  ta.remove();
}
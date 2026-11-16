/* ============ MiuCode mini games ============ */
"use strict";
const Games = {
  list: [
    { id: "match", ico: "🧩", name: "Ghép thẻ HTML", desc: "Ghép mỗi thẻ HTML với công dụng của nó. Trí nhớ + kiến thức!", best: "điểm" },
    { id: "predict", ico: "🔮", name: "Đoán kết quả", desc: "Nhìn đoạn code HTML/CSS/JS và dự đoán kết quả hiển thị.", best: "điểm" },
    { id: "bug", ico: "🐛", name: "Tìm lỗi sai", desc: "Soi từng dòng code và bấm vào dòng có lỗi. Thợ săn bug chính hiệu!", best: "điểm" },
    { id: "fill", ico: "✍️", name: "Điền code", desc: "Hoàn thành chỗ trống ___ trong đoạn code còn thiếu.", best: "điểm" },
    { id: "speed", ico: "⚡", name: "Thử thách tốc độ", desc: "60 giây — trả lời càng nhiều câu đúng càng tốt!", best: "điểm" },
    { id: "sort", ico: "🧱", name: "Sắp xếp cú pháp", desc: "Kéo thả (hoặc bấm) các mảnh code thành đoạn cú pháp đúng thứ tự.", best: "điểm" }
  ],
  meta(id) { return this.list.find(g => g.id === id); },

  mount(id, root) {
    const meta = this.meta(id);
    if (!meta) { root.innerHTML = '<div class="empty-state">' + mascotSVG("think") + "<h2>Không tìm thấy trò chơi 😿</h2><a class='btn btn-primary' href='#/mini-game'>Về sảnh game</a></div>"; return; }
    const best = Store.data.games[id] || 0;
    const instructions = {
      match: ["Bấm 1 thẻ tên HTML rồi bấm thẻ công dụng tương ứng.", "Ghép đúng: +10 điểm. Ghép sai: −2 điểm.", "Ghép hết 6 cặp để hoàn thành!"],
      predict: ["Đọc đoạn code và chọn kết quả đúng trong 4 đáp án.", "Trả lời đúng: +10 điểm. Có giải thích sau mỗi câu.", "8 vòng — bình tĩnh đọc kỹ từng ký tự nhé!"],
      bug: ["Mỗi đoạn code có đúng 1 dòng bị lỗi.", "Bấm trực tiếp vào dòng bạn cho là sai: đúng +10 điểm.", "Sau mỗi vòng có giải thích lỗi để nhớ đời 😼"],
      fill: ["Chọn mảnh code đúng điền vào chỗ ___ .", "Đúng: +10 điểm, sai vẫn được xem đáp án + giải thích.", "8 vòng từ HTML, CSS đến JavaScript."],
      speed: ["Bạn có 60 giây. Câu hỏi hiện liên tục!", "Đúng: +5 điểm, sai: 0 điểm và chuyển câu ngay.", "Chuỗi đúng liên tiếp được thưởng thêm điểm streak 🔥"],
      sort: ["Kéo thả hoặc bấm các mảnh code để xếp vào ô trống theo thứ tự đúng.", "Bấm mảnh đã xếp để trả về khay.", "Bấm Kiểm tra: đúng lần đầu +15, đúng sau khi thử sai +8."]
    }[id];
    root.innerHTML =
      '<div class="game-shell"><div class="crumb mb"><a href="#/mini-game">🎮 Mini Game</a> <span>›</span> <span>' + esc(meta.name) + "</span></div>" +
      '<div class="game-area"><div class="game-instruct">' +
      '<div class="gi-ico">' + meta.ico + "</div><h2>" + esc(meta.name) + "</h2>" +
      '<p class="muted">' + esc(meta.desc) + "</p>" +
      "<ul>" + instructions.map(s => "<li>" + s + "</li>").join("") + "</ul>" +
      (best ? '<p class="chip hot">🏅 Kỷ lục của bạn: ' + best + " điểm</p>" : "") +
      '<div class="mt"><button class="btn btn-primary btn-lg" id="gameStart">▶ Bắt đầu chơi</button></div>' +
      "</div></div></div>";
    $("#gameStart", root).addEventListener("click", () => {
      Store.data.gamesPlayed[id] = true; Store.save(); checkBadges();
      this.play(id, root);
    });
  },

  play(id, root) {
    const meta = this.meta(id);
    let score = 0;
    root.innerHTML =
      '<div class="game-shell"><div class="crumb mb"><a href="#/mini-game">🎮 Mini Game</a> <span>›</span> <span>' + esc(meta.name) + "</span></div>" +
      '<div class="game-hud">' +
      '<span class="hud-pill">⭐ <span id="gScore">0</span> điểm</span>' +
      '<span class="hud-pill" id="gInfo">—</span>' +
      '<span class="hud-pill" id="gTime" style="display:none">⏱ <span>0</span></span>' +
      '<button class="btn btn-ghost btn-sm" id="gQuit" style="margin-left:auto">✖ Thoát</button>' +
      "</div><div class='game-area' id='gArea'></div></div>";
    const area = $("#gArea", root);
    const ctx = {
      area,
      score: () => score,
      add(n) { score = Math.max(0, score + n); $("#gScore", root).textContent = score; },
      info(t) { $("#gInfo", root).textContent = t; },
      timePill: $("#gTime", root),
      end: (msg) => this.finish(id, root, score, msg)
    };
    $("#gQuit", root).addEventListener("click", () => { location.hash = "#/mini-game"; });
    this["play_" + id](ctx);
  },

  finish(id, root, score, msg) {
    const meta = this.meta(id);
    const prev = Store.data.games[id] || 0;
    const isRecord = score > prev;
    if (isRecord) { Store.data.games[id] = score; Store.save(); }
    checkBadges();
    const area = $("#gArea", root);
    $("#gInfo", root).textContent = "Hoàn thành!";
    area.innerHTML =
      '<div class="game-instruct"><div class="result-mascot">' + mascotSVG(score > 0 ? "party" : "think") + "</div>" +
      "<h2>" + (msg || "Kết thúc!") + "</h2>" +
      '<p style="font-size:2rem;font-family:var(--font-head);font-weight:800;color:var(--orange-deep)">' + score + " điểm</p>" +
      (isRecord && score > 0 ? '<p class="chip hot">🎉 Kỷ lục mới! (cũ: ' + prev + ")</p>" : '<p class="chip">🏅 Kỷ lục: ' + Math.max(prev, score) + " điểm</p>") +
      '<div class="flex mt" style="justify-content:center"><button class="btn btn-primary" id="gReplay">↺ Chơi lại</button><a class="btn btn-soft" href="#/mini-game">🎮 Game khác</a></div></div>';
    if (score > 0) { Sound.play("win"); Confetti.burst(isRecord ? 130 : 70); }
    if (isRecord && score > 0) toast("Kỷ lục mới ở " + meta.name + ": <b>" + score + " điểm</b>! 🎉", "ok", "🏆");
    $("#gReplay", root).addEventListener("click", () => this.play(id, root));
  },

  /* helper: câu hỏi trắc nghiệm trong game (predict / speed / fill) */
  askMCQ(area, qHtml, options, a, explain, onDone, instant) {
    area.innerHTML = qHtml + '<div class="opt-list">' + options.map((o, i) =>
      '<button class="opt-btn" data-i="' + i + '"><span class="opt-key">' + "ABCD"[i] + "</span><span>" + esc(o) + "</span></button>").join("") +
      '</div><div class="feedback"></div>';
    const fb = $(".feedback", area);
    area.addEventListener("click", function h(e) {
      const btn = e.target.closest(".opt-btn"); if (!btn || btn.disabled) return;
      const i = +btn.dataset.i, ok = i === a;
      $$(".opt-btn", area).forEach((b, j) => {
        b.disabled = true;
        if (j === a) b.classList.add("correct");
        else if (j === i) b.classList.add("wrong");
        else b.classList.add("dim");
      });
      Sound.play(ok ? "ok" : "no");
      if (instant) { area.removeEventListener("click", h); setTimeout(() => onDone(ok), 450); return; }
      fb.className = "feedback show " + (ok ? "ok" : "no");
      fb.innerHTML = (ok ? "🎉 <b>Chính xác! +10 điểm</b> " : "😿 <b>Chưa đúng.</b> ") + esc(explain || "") +
        '<div class="mt"><button class="btn btn-primary btn-sm" data-next>Câu tiếp theo →</button></div>';
      if (ok) Confetti.burst(25);
      area.addEventListener("click", function n(ev) {
        if (ev.target.closest("[data-next]")) { area.removeEventListener("click", n); area.removeEventListener("click", h); onDone(ok); }
      });
    });
  },

  /* ---------- 1. Ghép thẻ ---------- */
  play_match(ctx) {
    const pairs = shuffle(GameData.matchPairs).slice(0, 6).map((p, i) => ({ ...p, pid: i }));
    const cells = shuffle(pairs.flatMap(p => [
      { pid: p.pid, type: "tag", html: "<code>" + esc(p.tag) + "</code>" },
      { pid: p.pid, type: "use", html: esc(p.use) }
    ]));
    let sel = null, matched = 0, t0 = Date.now();
    ctx.info("0/6 cặp");
    ctx.timePill.style.display = "";
    const tick = setInterval(() => { $("span", ctx.timePill).textContent = fmtTime((Date.now() - t0) / 1000); }, 1000);
    onViewCleanup(() => clearInterval(tick));
    ctx.area.innerHTML = '<p class="muted small mb">Bấm một <b>thẻ HTML</b> rồi bấm <b>công dụng</b> của nó 👇</p><div class="match-grid">' +
      cells.map((c, i) => '<button class="match-cell" data-i="' + i + '" data-pid="' + c.pid + '" data-type="' + c.type + '">' + c.html + "</button>").join("") + "</div>";
    ctx.area.addEventListener("click", e => {
      const cell = e.target.closest(".match-cell"); if (!cell || cell.classList.contains("matched")) return;
      Sound.play("click");
      if (!sel) { sel = cell; cell.classList.add("sel"); return; }
      if (sel === cell) { cell.classList.remove("sel"); sel = null; return; }
      const ok = sel.dataset.pid === cell.dataset.pid && sel.dataset.type !== cell.dataset.type;
      if (ok) {
        sel.classList.remove("sel"); sel.classList.add("matched"); cell.classList.add("matched");
        ctx.add(10); matched++; ctx.info(matched + "/6 cặp"); Sound.play("ok");
        sel = null;
        if (matched === 6) {
          clearInterval(tick);
          const secs = Math.round((Date.now() - t0) / 1000);
          const bonus = Math.max(0, 30 - Math.floor(secs / 5));
          ctx.add(bonus);
          setTimeout(() => ctx.end("Ghép xong trong " + fmtTime(secs) + "! Thưởng tốc độ +" + bonus), 600);
        }
      } else {
        const a = sel; sel = null;
        a.classList.add("miss"); cell.classList.add("miss"); a.classList.remove("sel");
        ctx.add(-2); Sound.play("no");
        setTimeout(() => { a.classList.remove("miss"); cell.classList.remove("miss"); }, 450);
      }
    });
  },

  /* ---------- 2. Đoán kết quả ---------- */
  play_predict(ctx) {
    const rounds = shuffle(GameData.predictRounds);
    let i = 0;
    const next = () => {
      if (i >= rounds.length) return ctx.end("Hoàn thành 8 vòng đoán kết quả!");
      const r = rounds[i];
      ctx.info("Vòng " + (i + 1) + "/" + rounds.length);
      const qHtml = '<p class="q-text">🔮 ' + esc(r.q) + '</p><div class="code-card q-code"><div class="code-head"><span class="code-lang">' + r.lang + '</span></div><div class="code-body"><pre>' + highlight(r.code, r.lang) + "</pre></div></div>";
      this.askMCQ(ctx.area, qHtml, r.options, r.a, r.explain, ok => { if (ok) ctx.add(10); i++; next(); });
    };
    next();
  },

  /* ---------- 3. Tìm lỗi sai ---------- */
  play_bug(ctx) {
    const rounds = shuffle(GameData.bugRounds);
    let i = 0;
    const next = () => {
      if (i >= rounds.length) return ctx.end("Săn xong 8 con bug! 🐛");
      const r = rounds[i];
      ctx.info("Vòng " + (i + 1) + "/" + rounds.length);
      ctx.area.innerHTML = '<p class="q-text">🐛 Đoạn code ' + r.lang.toUpperCase() + ' này có 1 dòng bị lỗi — bấm vào dòng đó!</p>' +
        '<div class="bug-code">' + r.lines.map((l, j) => '<div class="bug-line" data-j="' + j + '"><span class="ln">' + (j + 1) + "</span><span>" + highlight(l, r.lang) + "</span></div>").join("") + "</div>" +
        '<div class="feedback"></div>';
      const fb = $(".feedback", ctx.area);
      ctx.area.addEventListener("click", function h(e) {
        const line = e.target.closest(".bug-line"); if (!line) return;
        ctx.area.removeEventListener("click", h);
        const j = +line.dataset.j, ok = j === r.bug;
        $$(".bug-line", ctx.area).forEach(l => { l.style.pointerEvents = "none"; });
        line.classList.add(ok ? "hit-good" : "hit-bad");
        if (!ok) $$(".bug-line", ctx.area)[r.bug].classList.add("hit-good");
        ctx.add(ok ? 10 : 0); Sound.play(ok ? "ok" : "no");
        if (ok) Confetti.burst(25);
        fb.className = "feedback show " + (ok ? "ok" : "no");
        fb.innerHTML = (ok ? "🎯 <b>Bắt đúng bug! +10 điểm.</b> " : "😿 <b>Chưa phải dòng đó.</b> Dòng lỗi đã được tô xanh. ") + esc(r.explain) +
          '<div class="mt"><button class="btn btn-primary btn-sm" data-next>Vòng tiếp →</button></div>';
        ctx.area.addEventListener("click", function n(ev) {
          if (ev.target.closest("[data-next]")) { ctx.area.removeEventListener("click", n); i++; next(); }
        });
      });
    };
    next();
  },

  /* ---------- 4. Điền code ---------- */
  play_fill(ctx) {
    const rounds = shuffle(GameData.fillRounds);
    let i = 0;
    const next = () => {
      if (i >= rounds.length) return ctx.end("Điền kín 8 chỗ trống! ✍️");
      const r = rounds[i];
      ctx.info("Vòng " + (i + 1) + "/" + rounds.length);
      const codeHtml = esc(r.code).replace("___", '<span class="blank-slot">___</span>');
      const qHtml = '<p class="q-text">✍️ Chọn mảnh code đúng cho chỗ trống:</p><div class="fill-code-view">' + codeHtml + "</div><div style='height:14px'></div>";
      // custom bind to also fill the slot visually
      ctx.area.innerHTML = qHtml + '<div class="opt-list">' + r.options.map((o, j) =>
        '<button class="opt-btn" data-i="' + j + '"><span class="opt-key">' + "ABCD"[j] + "</span><span><code>" + esc(o) + "</code></span></button>").join("") +
        '</div><div class="feedback"></div>';
      const fb = $(".feedback", ctx.area), slot = $(".blank-slot", ctx.area);
      ctx.area.addEventListener("click", function h(e) {
        const btn = e.target.closest(".opt-btn"); if (!btn || btn.disabled) return;
        ctx.area.removeEventListener("click", h);
        const j = +btn.dataset.i, ok = j === r.a;
        slot.textContent = r.options[j];
        slot.classList.add(ok ? "filled-ok" : "filled-no");
        $$(".opt-btn", ctx.area).forEach((b, k) => {
          b.disabled = true;
          if (k === r.a) b.classList.add("correct");
          else if (k === j) b.classList.add("wrong");
          else b.classList.add("dim");
        });
        ctx.add(ok ? 10 : 0); Sound.play(ok ? "ok" : "no");
        if (ok) Confetti.burst(25);
        fb.className = "feedback show " + (ok ? "ok" : "no");
        fb.innerHTML = (ok ? "🎉 <b>Chuẩn luôn! +10 điểm.</b> " : "😿 <b>Chưa đúng.</b> Đáp án: <code>" + esc(r.options[r.a]) + "</code>. ") + esc(r.explain) +
          '<div class="mt"><button class="btn btn-primary btn-sm" data-next>Vòng tiếp →</button></div>';
        ctx.area.addEventListener("click", function n(ev) {
          if (ev.target.closest("[data-next]")) { ctx.area.removeEventListener("click", n); i++; next(); }
        });
      });
    };
    next();
  },

  /* ---------- 5. Thử thách tốc độ ---------- */
  play_speed(ctx) {
    const qs = shuffle(GameData.speedQuestions);
    let i = 0, streak = 0, correct = 0, left = 60, alive = true;
    ctx.timePill.style.display = "";
    ctx.timePill.classList.add("time-low");
    $("span", ctx.timePill).textContent = "60s";
    ctx.info("Đúng: 0");
    ctx.area.innerHTML = '<div class="timer-bar"><div id="speedBar" style="width:100%"></div></div><div id="speedZone"></div>';
    const zone = $("#speedZone", ctx.area), bar = $("#speedBar", ctx.area);
    const tick = setInterval(() => {
      left--;
      $("span", ctx.timePill).textContent = left + "s";
      bar.style.width = (left / 60 * 100) + "%";
      if (left <= 10 && left > 0) Sound.play("tick");
      if (left <= 0) {
        alive = false; clearInterval(tick);
        ctx.end("Hết giờ! Đúng " + correct + "/" + (i) + " câu 🔥");
      }
    }, 1000);
    onViewCleanup(() => { alive = false; clearInterval(tick); });
    const next = () => {
      if (!alive) return;
      if (i >= qs.length) { alive = false; clearInterval(tick); return ctx.end("Trả lời hết bộ câu hỏi! Đúng " + correct + " câu 🤯"); }
      const q = qs[i];
      ctx.info("Đúng: " + correct + (streak >= 3 ? " · 🔥x" + streak : ""));
      this.askMCQ(zone, '<p class="speed-q">' + esc(q.q) + "</p>", q.options, q.a, "", ok => {
        if (!alive) return;
        if (ok) { correct++; streak++; ctx.add(5 + (streak >= 3 ? 2 : 0)); }
        else streak = 0;
        i++; next();
      }, true);
    };
    next();
  },

  /* ---------- 6. Sắp xếp cú pháp ---------- */
  play_sort(ctx) {
    const rounds = shuffle(GameData.sortRounds);
    let i = 0;
    const next = () => {
      if (i >= rounds.length) return ctx.end("Xếp chuẩn cả 6 đoạn cú pháp! 🧱");
      const r = rounds[i];
      let attempts = 0;
      ctx.info("Vòng " + (i + 1) + "/" + rounds.length);
      const tray = shuffle(r.tokens.map((t, idx) => ({ t, idx })));
      ctx.area.innerHTML = '<p class="q-text">🧱 Sắp xếp thành: <b>' + esc(r.title) + "</b></p>" +
        '<p class="muted small">Kéo thả hoặc bấm mảnh code để xếp vào ô dưới; bấm mảnh đã xếp để trả lại.</p>' +
        '<div class="sort-tray" id="sortTray">' + tray.map(x => '<button class="sort-token" draggable="true" data-idx="' + x.idx + '">' + esc(x.t) + "</button>").join("") + "</div>" +
        '<div class="sort-target" id="sortTarget"><span class="muted small" id="sortHint">Thả code vào đây…</span></div>' +
        '<div class="flex mt"><button class="btn btn-primary btn-sm" id="sortCheck">✓ Kiểm tra</button><button class="btn btn-ghost btn-sm" id="sortClear">↺ Xếp lại</button></div>' +
        '<div class="feedback"></div>';
      const trayEl = $("#sortTray", ctx.area), target = $("#sortTarget", ctx.area), fb = $(".feedback", ctx.area);
      const hint = $("#sortHint", ctx.area);
      const syncHint = () => { hint.style.display = target.querySelector(".sort-placed") ? "none" : ""; };
      const place = token => {
        token.classList.add("used");
        const p = document.createElement("button");
        p.className = "sort-placed"; p.textContent = token.textContent; p.dataset.idx = token.dataset.idx;
        p.addEventListener("click", () => { p.remove(); token.classList.remove("used"); syncHint(); Sound.play("click"); });
        target.appendChild(p); syncHint(); Sound.play("click");
      };
      trayEl.addEventListener("click", e => {
        const t = e.target.closest(".sort-token"); if (t && !t.classList.contains("used")) place(t);
      });
      // drag & drop
      trayEl.addEventListener("dragstart", e => {
        const t = e.target.closest(".sort-token"); if (!t) return;
        e.dataTransfer.setData("text/plain", t.dataset.idx);
      });
      target.addEventListener("dragover", e => { e.preventDefault(); target.classList.add("dragover"); });
      target.addEventListener("dragleave", () => target.classList.remove("dragover"));
      target.addEventListener("drop", e => {
        e.preventDefault(); target.classList.remove("dragover");
        const idx = e.dataTransfer.getData("text/plain");
        const t = trayEl.querySelector('.sort-token[data-idx="' + idx + '"]');
        if (t && !t.classList.contains("used")) place(t);
      });
      $("#sortClear", ctx.area).addEventListener("click", () => {
        $$(".sort-placed", target).forEach(p => p.remove());
        $$(".sort-token", trayEl).forEach(t => t.classList.remove("used"));
        target.classList.remove("wrong", "right"); syncHint();
      });
      $("#sortCheck", ctx.area).addEventListener("click", () => {
        const placed = $$(".sort-placed", target).map(p => +p.dataset.idx);
        if (placed.length !== r.tokens.length) {
          target.classList.add("wrong"); setTimeout(() => target.classList.remove("wrong"), 450);
          toast("Còn mảnh code chưa được xếp kìa!", "warn", "🧩"); return;
        }
        const ok = placed.every((v, j) => v === j);
        if (ok) {
          target.classList.add("right");
          const pts = attempts === 0 ? 15 : 8;
          ctx.add(pts); Sound.play("ok"); Confetti.burst(30);
          fb.className = "feedback show ok";
          fb.innerHTML = "🎉 <b>Chuẩn cú pháp! +" + pts + " điểm.</b> " + esc(r.explain) +
            '<div class="mt"><button class="btn btn-primary btn-sm" id="sortNext">Vòng tiếp →</button></div>';
          $("#sortCheck", ctx.area).disabled = true;
          $("#sortNext", ctx.area).addEventListener("click", () => { i++; next(); });
        } else {
          attempts++;
          target.classList.add("wrong"); setTimeout(() => target.classList.remove("wrong"), 450);
          Sound.play("no");
          fb.className = "feedback show no";
          fb.innerHTML = "😿 Thứ tự chưa đúng — để ý thẻ mở/đóng và dấu ngoặc nhé. Bấm mảnh đã xếp để trả về rồi thử lại!";
        }
      });
    };
    next();
  }
};
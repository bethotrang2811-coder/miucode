/* ============ MiuCode views ============ */
"use strict";
const Views = {};
const APP = () => $("#app");

/* ---------- shared pieces ---------- */
function chapterCard(id) {
  const ch = getCh(id);
  const pct = chapterLessonPct(id), done = chapterDone(id);
  const q = Store.data.quizzes[id];
  const status = done ? '<span class="chip ok">✓ Hoàn thành</span>' : pct > 0 || (q && q.attempts) ? '<span class="chip warn">Đang học</span>' : '<span class="chip">Chưa học</span>';
  return '<a class="ch-card" href="#/chuong/' + id + '" style="--ch-color:' + ch.color + '">' +
    (done ? '<span class="ch-done-badge">🏅</span>' : "") +
    '<div class="ch-top"><span class="ch-emoji">' + ch.emoji + '</span><div><div class="ch-num">Chương ' + id + "</div><h3>" + esc(ch.title) + "</h3></div></div>" +
    "<p>" + esc(ch.tagline || "") + "</p>" +
    '<div class="pbar" style="height:8px"><div style="width:' + pct + '%"></div></div>' +
    '<div class="ch-foot"><span class="small muted">' + ch.lessons.length + " bài · " + pct + "% bài học</span>" + status + "</div></a>";
}
function chapterGrid() {
  const ids = chapterIds();
  if (!ids.length) return '<div class="card center"><p>📦 Nội dung chương đang được cập nhật, quay lại sau nhé!</p></div>';
  return '<div class="chapter-grid">' + ids.map(chapterCard).join("") + "</div>";
}
function qTypeChip(q) {
  const map = { mcq: ["qt-mcq", "Trắc nghiệm"], tf: ["qt-tf", "Đúng / Sai"], fill: ["qt-fill", "Điền từ"], scenario: ["qt-scenario", "Tình huống"], code: ["qt-code", q.mode === "bug" ? "Tìm lỗi code" : "Đọc code"] };
  const m = map[q.type] || map.mcq;
  return '<span class="q-type-chip ' + m[0] + '">' + m[1] + "</span>";
}
function qBodyHtml(q, prefix) {
  let h = '<div class="q-text">' + esc(q.q) + "</div>";
  if (q.type === "code") {
    h += '<div class="code-card q-code"><div class="code-head"><span class="code-dots"><i></i><i></i><i></i></span><span class="code-lang">' + esc(q.lang || "js") + '</span></div><div class="code-body"><pre>' + highlight(q.code, q.lang || "js") + "</pre></div></div>";
  }
  if (q.type === "tf") {
    h += '<div class="tf-row"><button class="opt-btn" data-v="true"><span class="opt-key">✓</span> Đúng</button><button class="opt-btn" data-v="false"><span class="opt-key">✗</span> Sai</button></div>';
  } else if (q.type === "fill") {
    h += '<div class="flex"><input class="fill-input" id="' + prefix + 'Fill" placeholder="Gõ đáp án rồi Enter…" autocomplete="off"><button class="btn btn-primary" id="' + prefix + 'FillBtn">Trả lời</button></div>';
  } else {
    h += '<div class="opt-list">' + q.options.map((o, i) =>
      '<button class="opt-btn" data-v="' + i + '"><span class="opt-key">' + "ABCD"[i] + "</span><span>" + esc(o) + "</span></button>").join("") + "</div>";
  }
  return h;
}
function isCorrect(q, given) {
  if (given == null || given === "") return false;
  if (q.type === "fill") {
    const accepts = [q.a].concat(q.accept || []).map(norm);
    return accepts.includes(norm(given));
  }
  if (q.type === "tf") return given === q.a;
  return given === q.a;
}
function answerText(q, given) {
  if (given == null || given === "") return "<i>(bỏ trống)</i>";
  if (q.type === "fill") return esc(given);
  if (q.type === "tf") return given ? "Đúng" : "Sai";
  return "ABCD"[given] + ". " + esc(q.options[given]);
}
function correctText(q) {
  if (q.type === "fill") return esc(q.a);
  if (q.type === "tf") return q.a ? "Đúng" : "Sai";
  return "ABCD"[q.a] + ". " + esc(q.options[q.a]);
}
function scoreRing(pct, color) {
  const r = 62, c = 2 * Math.PI * r;
  return '<div class="score-ring"><svg width="150" height="150"><circle cx="75" cy="75" r="' + r + '" fill="none" stroke="#ffefe0" stroke-width="13"/>' +
    '<circle cx="75" cy="75" r="' + r + '" fill="none" stroke="' + (color || "var(--orange-deep)") + '" stroke-width="13" stroke-linecap="round" stroke-dasharray="' + c + '" stroke-dashoffset="' + (c * (1 - pct / 100)) + '" style="transition:stroke-dashoffset 1s ease"/></svg>' +
    '<div class="sr-txt" style="color:' + (color || "var(--orange-deep)") + '">' + pct + "%</div></div>";
}
function updateTopProgress() {
  const bar = $("#topProgressBar"); if (bar) bar.style.width = overallPct() + "%";
}

/* ---------- A. Trang chủ ---------- */
Views.home = function () {
  const ids = chapterIds();
  const flashMem = Object.values(Store.data.flash).filter(v => v === 1).length;
  const cont = lastLessonLocation();
  APP().innerHTML = '<div class="view">' +
    '<section class="hero"><div class="hero-copy">' +
    '<span class="chip hot">🎓 CSE122 · Phát triển ứng dụng Web cơ bản · K67</span>' +
    "<h1>Học làm Web từ số 0,<br>cùng mèo <em>Miu</em> 🐱</h1>" +
    "<p>Lộ trình 9 chương bám sát giáo trình CSE122 – Đại học Thủy Lợi: HTML, CSS, Bootstrap, JavaScript & Fetch API. Lý thuyết dễ hiểu, code chạy trực tiếp, flashcard, mini game và bài thi cuối khóa — tất cả trong một trang.</p>" +
    '<div class="hero-cta"><a class="btn btn-primary btn-lg" href="' + cont + '">🚀 Tiếp tục học</a><a class="btn btn-soft btn-lg" href="#/lo-trinh">🗺️ Xem lộ trình</a></div>' +
    '</div><div class="hero-mascot">' + mascotSVG("wave") +
    '<span class="hero-sticker hs-1">&lt;/&gt; HTML</span><span class="hero-sticker hs-2">✓ CSS mastered!</span><span class="hero-sticker hs-3">console.log("Hi!")</span>' +
    "</div></section>" +

    '<div class="stats-strip">' +
    '<div class="stat-card"><span class="stat-ico" style="background:var(--orange-pale)">📚</span><div><b>' + doneChapters() + "/" + (ids.length || 9) + "</b><span>Chương hoàn thành</span></div></div>" +
    '<div class="stat-card"><span class="stat-ico" style="background:var(--mint-pale)">📖</span><div><b>' + doneLessons() + "/" + totalLessons() + "</b><span>Bài đã học</span></div></div>" +
    '<div class="stat-card"><span class="stat-ico" style="background:var(--sky-pale)">🃏</span><div><b>' + flashMem + "</b><span>Flashcard đã nhớ</span></div></div>" +
    '<div class="stat-card"><span class="stat-ico" style="background:var(--amber-pale)">⏰</span><div><b>' + fmtTime(Store.data.timeSec) + "</b><span>Thời gian học</span></div></div>" +
    "</div>" +

    '<div class="card mt"><div class="spread"><h3>🌱 Tiến độ học tập tổng thể</h3><b style="font-family:var(--font-head);font-size:1.3rem;color:var(--orange-deep)">' + overallPct() + '%</b></div>' +
    '<div class="pbar mt" style="height:14px"><div style="width:' + overallPct() + '%"></div></div>' +
    '<p class="small muted mt">60% từ bài học đã hoàn thành + 40% từ chương đã qua kiểm tra (≥70%). Miu tin bạn làm được! 💪</p></div>' +

    '<h2 class="section-title"><span class="sticker">🍊</span> 9 chương học</h2>' + chapterGrid() +

    '<h2 class="section-title"><span class="sticker">🎯</span> Mục tiêu & lời nhắn của Miu</h2>' +
    '<div class="goals-wrap"><div class="card"><h3 class="mb">Sau khoá học bạn sẽ:</h3><ul class="goal-list">' +
    ["🌐 Hiểu cách Web vận hành: client–server, HTTP, trình duyệt và môi trường dev.",
     "📄 Tự viết trang HTML chuẩn cấu trúc, semantic, có bảng, form và đa phương tiện.",
     "🎨 Tạo giao diện đẹp với CSS: Box Model, Flexbox, Grid, responsive và animation.",
     "🧩 Dùng Bootstrap dựng giao diện chuyên nghiệp nhanh chóng.",
     "⚡ Lập trình JavaScript: DOM, sự kiện, Fetch API và lưu dữ liệu với localStorage.",
     "🚀 Hoàn thành dự án web nhỏ đầu tay và tự tin học tiếp backend."].map(g => "<li>" + g + "</li>").join("") +
    '</ul></div><div class="card encourage">' + mascotSVG("happy") +
    '<div><div class="encourage-quote">“Mỗi dòng code hôm nay là một viên gạch xây nên website đầu tay của bạn. Đừng sợ sai — bug chính là bài học miễn phí đó!”</div><p class="small muted mt">— Miu, mèo đồng hành của bạn 🐾</p>' +
    '<a class="btn btn-soft btn-sm mt" href="#/ca-nhan">🏅 Xem huy hiệu của bạn</a></div></div></div>' +
    "</div>";
};

/* ---------- Lộ trình ---------- */
Views.roadmap = function () {
  const ids = chapterIds();
  let currentFound = false;
  const items = ids.map(id => {
    const ch = getCh(id), done = chapterDone(id), pct = chapterLessonPct(id);
    const q = Store.data.quizzes[id];
    const current = !done && !currentFound; if (current) currentFound = true;
    const mins = ch.lessons.reduce((s, l) => s + (l.minutes || 10), 0);
    return '<div class="rm-item ' + (done ? "done" : current ? "current" : "") + '">' +
      '<span class="rm-dot">' + (done ? "✓" : id) + "</span>" +
      '<div class="card rm-card"><span class="ch-emoji">' + ch.emoji + '</span><div class="grow"><div class="ch-num">Chương ' + id + "</div><h3>" + esc(ch.title) + "</h3>" +
      '<div class="rm-meta"><span class="chip">📖 ' + ch.lessons.length + " bài</span><span class=\"chip\">⏱ ~" + mins + " phút</span>" +
      (q && q.attempts ? '<span class="chip ' + (q.best >= 70 ? "ok" : "warn") + '">📝 Kiểm tra: ' + q.best + "%</span>" : '<span class="chip">📝 Chưa kiểm tra</span>') +
      (done ? '<span class="chip ok">🏅 Đã hoàn thành</span>' : current ? '<span class="chip hot">👉 Đang học</span>' : "") + "</div></div>" +
      '<div class="flex"><a class="btn btn-soft btn-sm" href="#/chuong/' + id + '">Xem chương</a><a class="btn btn-primary btn-sm" href="' + (pct < 100 ? "#/hoc/" + id + "/" + (ch.lessons.find(l => !Store.data.lessons[l.id]) || ch.lessons[0]).id : "#/kiem-tra/" + id) + '">' + (pct < 100 ? "Học tiếp" : "Làm kiểm tra") + "</a></div></div></div>";
  }).join("");
  APP().innerHTML = '<div class="view"><div class="card mb" style="background:linear-gradient(135deg,#fff,var(--cream-2))">' +
    '<div class="spread"><div><h1>🗺️ Lộ trình học CSE122</h1><p class="muted">Đi lần lượt từng chương: học bài → làm kiểm tra đạt <b>≥70%</b> để mở huy hiệu chương → cuối cùng chinh phục bài thi cuối khóa 40 câu.</p></div>' +
    '<div class="center">' + scoreRing(overallPct()) + '<p class="small muted">Tổng tiến độ</p></div></div></div>' +
    (ids.length ? '<div class="roadmap">' + items + "</div>" : '<div class="card center">📦 Nội dung đang cập nhật…</div>') +
    '<div class="card center mt"><h3>🏁 Đích đến: Bài thi cuối khóa</h3><p class="muted small">40 câu · 45 phút · phân loại Chưa đạt / Khá / Giỏi / Xuất sắc</p><a class="btn btn-primary mt" href="#/thi-cuoi-khoa">Tới phòng thi →</a></div></div>';
};

/* ---------- Danh sách bài học ---------- */
Views.lessons = function () {
  APP().innerHTML = '<div class="view"><h1 class="mb">📚 Bài học theo chương</h1><p class="muted mb">Chọn một chương để xem mục tiêu, danh sách bài và bài kiểm tra. Sidebar trong mỗi bài giúp chuyển nhanh giữa các bài.</p>' + chapterGrid() + "</div>";
};

/* ---------- Chi tiết chương ---------- */
Views.chapter = function (id) {
  const ch = getCh(id);
  if (!ch) return Views.notFound();
  const q = Store.data.quizzes[id];
  const ids = chapterIds(), ix = ids.indexOf(id);
  APP().innerHTML = '<div class="view">' +
    '<div class="crumb mb"><a href="#/bai-hoc">Bài học</a> <span>›</span> <span>Chương ' + id + "</span></div>" +
    '<div class="card mb" style="border-top:6px solid ' + ch.color + '"><div class="spread"><div>' +
    '<div class="ch-num">Chương ' + id + '</div><h1>' + ch.emoji + " " + esc(ch.title) + "</h1><p class=\"muted\">" + esc(ch.tagline || "") + "</p></div>" +
    '<div class="center">' + scoreRing(chapterLessonPct(id)) + '<p class="small muted">Bài học đã xong</p></div></div>' +
    '<div class="divider"></div><h3 class="mb">🎯 Mục tiêu chương</h3><ul class="goal-list">' + ch.goals.map(g => "<li>✦ " + esc(g) + "</li>").join("") + "</ul>" +
    '<p class="small muted mt">📖 Nguồn giáo trình: <a href="' + ch.source + '" target="_blank" rel="noopener">Ebook CSE122 – Chương ' + id + " ↗</a></p></div>" +

    '<h2 class="section-title"><span class="sticker">📖</span> Danh sách bài học</h2>' +
    '<div class="card" style="padding:10px">' + ch.lessons.map((l, i) => {
      const done = !!Store.data.lessons[l.id];
      return '<a class="side-link" style="padding:13px 14px;font-size:.95rem" href="#/hoc/' + id + "/" + l.id + '">' +
        '<span class="opt-key" style="background:' + (done ? "var(--mint)" : "var(--cream-2)") + ';color:' + (done ? "#fff" : "var(--brown)") + '">' + (done ? "✓" : i + 1) + "</span>" +
        "<span><b>" + esc(l.title) + '</b><br><span class="small muted">⏱ ' + (l.minutes || 10) + " phút</span></span>" +
        '<span class="tick">' + (done ? "Đã học" : "→") + "</span></a>";
    }).join("") + "</div>" +

    '<h2 class="section-title"><span class="sticker">📝</span> Kiểm tra cuối chương</h2>' +
    '<div class="card"><div class="spread"><div><h3>' + (ch.quiz ? ch.quiz.length : 0) + ' câu hỏi · nhiều dạng</h3>' +
    '<p class="small muted">Trắc nghiệm, Đúng/Sai, điền từ, đọc code, tìm lỗi, tình huống. Đạt <b>≥70%</b> để hoàn thành chương.</p>' +
    (q && q.attempts ? '<p class="mt"><span class="chip ' + (q.best >= 70 ? "ok" : "warn") + '">Điểm tốt nhất: ' + q.best + "%</span> <span class=\"chip\">Đã làm " + q.attempts + " lần</span></p>" : "") + "</div>" +
    '<div class="flex"><a class="btn btn-primary" href="#/kiem-tra/' + id + '">' + (q && q.attempts ? "↺ Làm lại" : "✏️ Làm kiểm tra") + '</a><a class="btn btn-soft" href="#/flashcard?ch=' + id + '">🃏 Flashcard chương này</a></div></div></div>' +

    '<div class="lesson-foot">' +
    (ix > 0 ? '<a class="btn btn-ghost" href="#/chuong/' + ids[ix - 1] + '">← Chương ' + ids[ix - 1] + "</a>" : "<span></span>") +
    (ix < ids.length - 1 ? '<a class="btn btn-soft" href="#/chuong/' + ids[ix + 1] + '">Chương ' + ids[ix + 1] + " →</a>" : '<a class="btn btn-soft" href="#/thi-cuoi-khoa">🏁 Thi cuối khóa →</a>') +
    "</div></div>";
};

/* ---------- Sidebar bài học ---------- */
function lessonSidebar(currentCh, currentLesson) {
  return '<aside class="side-nav" id="sideNav"><h4>📚 Mục lục khoá học</h4>' +
    chapterIds().map(id => {
      const ch = getCh(id), open = id === currentCh;
      return '<div class="side-ch ' + (open ? "open" : "") + '" data-ch="' + id + '">' +
        '<button class="side-ch-head" data-toggle="' + id + '">' + ch.emoji + " Chương " + id + ": " + esc(ch.short || ch.title) +
        (chapterDone(id) ? " 🏅" : "") + '<span class="arr">▶</span></button>' +
        '<div class="side-links">' + ch.lessons.map(l =>
          '<a class="side-link ' + (l.id === currentLesson ? "active" : "") + '" href="#/hoc/' + id + "/" + l.id + '">' + esc(l.title) +
          (Store.data.lessons[l.id] ? '<span class="tick">✓</span>' : "") + "</a>").join("") +
        '<a class="side-link quiz-link" href="#/kiem-tra/' + id + '">📝 Kiểm tra chương' + (chapterDone(id) ? '<span class="tick">✓</span>' : "") + "</a>" +
        "</div></div>";
    }).join("") +
    '<div class="side-mascot">' + mascotSVG("think") + "<p>Miu đang đọc cùng bạn đó. Có chỗ nào khó, đọc lại phần Ghi nhớ nhé! 🐾</p></div></aside>";
}

/* ---------- Bài học ---------- */
Views.lesson = function (chId, lessonId) {
  const ch = getCh(chId);
  if (!ch) return Views.notFound();
  const ix = ch.lessons.findIndex(l => l.id === lessonId);
  const lesson = ch.lessons[ix];
  if (!lesson) return Views.notFound();
  Store.data.lastLocation = "#/hoc/" + chId + "/" + lessonId; Store.save();
  Blocks.reset();
  const prev = ix > 0 ? ch.lessons[ix - 1] : null;
  const next = ix < ch.lessons.length - 1 ? ch.lessons[ix + 1] : null;
  const done = !!Store.data.lessons[lesson.id];

  APP().innerHTML = '<div class="view">' +
    '<button class="btn btn-soft btn-sm side-toggle" id="sideToggle">📚 Mục lục bài học</button>' +
    '<div class="lesson-layout">' + lessonSidebar(chId, lessonId) +
    '<div><div class="lesson-head">' +
    '<div class="crumb"><a href="#/bai-hoc">Bài học</a> <span>›</span> <a href="#/chuong/' + chId + '">Chương ' + chId + "</a> <span>›</span> <span>Bài " + (ix + 1) + "</span></div>" +
    "<h1>" + esc(lesson.title) + "</h1>" +
    '<div class="lesson-meta"><span class="chip hot">' + ch.emoji + " Chương " + chId + '</span><span class="chip">⏱ ' + (lesson.minutes || 10) + ' phút</span><span class="chip info">Bài ' + (ix + 1) + "/" + ch.lessons.length + "</span>" +
    (done ? '<span class="chip ok">✓ Đã hoàn thành</span>' : "") + "</div></div>" +
    Blocks.render(lesson.blocks) +
    '<div class="lesson-foot">' +
    (prev ? '<a class="btn btn-ghost" href="#/hoc/' + chId + "/" + prev.id + '">← Bài trước</a>' : '<a class="btn btn-ghost" href="#/chuong/' + chId + '">← Về chương</a>') +
    '<button class="btn btn-primary complete-btn ' + (done ? "done" : "") + '" id="completeBtn">' + (done ? "✓ Đã hoàn thành bài này" : "✅ Đánh dấu hoàn thành") + "</button>" +
    (next ? '<a class="btn btn-soft" href="#/hoc/' + chId + "/" + next.id + '">Bài tiếp theo →</a>' : '<a class="btn btn-soft" href="#/kiem-tra/' + chId + '">📝 Kiểm tra chương →</a>') +
    "</div></div></div></div>";

  Blocks.bind(APP());
  $("#sideToggle").addEventListener("click", () => $("#sideNav").classList.toggle("open"));
  $$(".side-ch-head", APP()).forEach(btn => btn.addEventListener("click", () => btn.parentElement.classList.toggle("open")));
  const cbtn = $("#completeBtn");
  cbtn.addEventListener("click", () => {
    if (Store.data.lessons[lesson.id]) { toast("Bài này bạn đã hoàn thành rồi nè 😸", "ok"); return; }
    Store.data.lessons[lesson.id] = true; Store.save();
    cbtn.classList.add("done"); cbtn.textContent = "✓ Đã hoàn thành bài này";
    Sound.play("win"); Confetti.burst(80);
    toast("Hoàn thành bài <b>" + esc(lesson.title) + "</b>! 🎉", "ok", "🎉");
    checkBadges(); updateTopProgress();
    const link = $('.side-link.active .tick', APP());
    const active = $(".side-link.active", APP());
    if (active && !$(".tick", active)) active.insertAdjacentHTML("beforeend", '<span class="tick">✓</span>');
    const allDone = ch.lessons.every(l => Store.data.lessons[l.id]);
    if (allDone && !chapterDone(chId)) setTimeout(() => toast("Bạn đã học hết chương " + chId + "! Làm kiểm tra để chinh phục chương nhé 💪", "warn", "📝"), 1500);
  });
};

/* ---------- Kiểm tra chương ---------- */
Views.quiz = function (chId) {
  const ch = getCh(chId);
  if (!ch || !ch.quiz || !ch.quiz.length) return Views.notFound();
  const qs = ch.quiz;
  const rec = Store.data.quizzes[chId] || { best: 0, attempts: 0 };
  APP().innerHTML = '<div class="view quiz-shell">' +
    '<div class="crumb mb"><a href="#/chuong/' + chId + '">Chương ' + chId + "</a> <span>›</span> <span>Kiểm tra</span></div>" +
    '<div class="card result-card"><div class="result-mascot">' + mascotSVG("think") + "</div>" +
    "<h1>📝 Kiểm tra Chương " + chId + "</h1><p class=\"muted\">" + esc(ch.title) + "</p>" +
    '<div class="flex mt" style="justify-content:center"><span class="chip">❓ ' + qs.length + ' câu</span><span class="chip">🎯 Đạt ≥70% để hoàn thành chương</span><span class="chip">💬 Giải thích ngay từng câu</span></div>' +
    (rec.attempts ? '<p class="mt"><span class="chip ' + (rec.best >= 70 ? "ok" : "warn") + '">Điểm tốt nhất: ' + rec.best + "%</span> <span class=\"chip\">Đã làm " + rec.attempts + " lần</span></p>" : "") +
    '<div class="mt"><button class="btn btn-primary btn-lg" id="quizStart">✏️ Bắt đầu làm bài</button></div></div></div>';
  $("#quizStart").addEventListener("click", () => runQuiz(chId, qs));
};

function runQuiz(chId, qs) {
  let i = 0, correct = 0;
  const answers = [];
  const shell = () => APP();
  const renderQ = () => {
    const q = qs[i];
    shell().innerHTML = '<div class="view quiz-shell">' +
      '<div class="quiz-top"><span class="quiz-count">Câu ' + (i + 1) + "/" + qs.length + "</span>" + qTypeChip(q) +
      '<span class="chip ok" style="margin-left:auto">✓ Đúng: ' + correct + "</span></div>" +
      '<div class="pbar mb"><div style="width:' + (i / qs.length * 100) + '%"></div></div>' +
      '<div class="card q-card" id="qCard">' + qBodyHtml(q, "qz") + '<div class="feedback" id="qFb"></div></div>' +
      '<div class="quiz-nav"><a class="btn btn-ghost btn-sm" href="#/chuong/' + chId + '">← Thoát</a><button class="btn btn-primary" id="qNext" style="visibility:hidden">Câu tiếp theo →</button></div></div>';
    const card = $("#qCard"), fb = $("#qFb"), nextBtn = $("#qNext");
    const answer = given => {
      const ok = isCorrect(q, given);
      answers[i] = { given, ok };
      if (ok) correct++;
      // mark options
      if (q.type === "tf" || q.type !== "fill") {
        $$(".opt-btn", card).forEach(b => {
          b.disabled = true;
          const v = q.type === "tf" ? b.dataset.v === "true" : +b.dataset.v;
          const isAns = q.type === "tf" ? v === q.a : v === q.a;
          const isGiven = q.type === "tf" ? v === given : v === given;
          if (isAns) b.classList.add("correct");
          else if (isGiven) b.classList.add("wrong");
          else b.classList.add("dim");
        });
      } else {
        const inp = $("#qzFill", card); if (inp) { inp.disabled = true; inp.style.borderColor = ok ? "var(--mint)" : "var(--danger)"; }
        const b = $("#qzFillBtn", card); if (b) b.disabled = true;
      }
      fb.className = "feedback show " + (ok ? "ok" : "no");
      fb.innerHTML = (ok ? "🎉 <b>Chính xác!</b> " : "😿 <b>Chưa đúng.</b> Đáp án: <b>" + correctText(q) + "</b>. ") + esc(q.explain || "");
      Sound.play(ok ? "ok" : "no");
      if (ok) Confetti.burst(30);
      nextBtn.style.visibility = "visible";
      nextBtn.textContent = i === qs.length - 1 ? "🏁 Xem kết quả" : "Câu tiếp theo →";
    };
    card.addEventListener("click", e => {
      const btn = e.target.closest(".opt-btn");
      if (btn && !btn.disabled) {
        answer(q.type === "tf" ? btn.dataset.v === "true" : +btn.dataset.v);
        return;
      }
      if (e.target.closest("#qzFillBtn")) {
        const v = $("#qzFill", card).value.trim();
        if (!v) { toast("Bạn chưa gõ đáp án kìa!", "warn", "✍️"); return; }
        answer(v);
      }
    });
    const inp = $("#qzFill", card);
    if (inp) { inp.focus(); inp.addEventListener("keydown", e => { if (e.key === "Enter" && !inp.disabled) { const v = inp.value.trim(); if (v) answer(v); } }); }
    nextBtn.addEventListener("click", () => { i++; if (i < qs.length) renderQ(); else finish(); });
  };
  const finish = () => {
    const pct = Math.round(correct / qs.length * 100);
    const passed = pct >= 70;
    const rec = Store.data.quizzes[chId] || { best: 0, attempts: 0, last: 0 };
    rec.attempts++; rec.last = pct; rec.best = Math.max(rec.best, pct);
    Store.data.quizzes[chId] = rec; Store.save();
    checkBadges(); updateTopProgress();
    const review = qs.map((q, j) => {
      const a = answers[j] || { given: null, ok: false };
      return '<div class="review-item ' + (a.ok ? "ok" : "no") + '"><div class="ri-q">' + (a.ok ? "✅" : "❌") + " Câu " + (j + 1) + ": " + esc(q.q) + "</div>" +
        (q.type === "code" ? '<div class="code-card q-code" style="margin:8px 0"><div class="code-body"><pre>' + highlight(q.code, q.lang) + "</pre></div></div>" : "") +
        '<div class="ri-a">Bạn chọn: <b>' + answerText(q, a.given) + "</b>" + (a.ok ? "" : ' · Đáp án đúng: <b style="color:#2e8b66">' + correctText(q) + "</b>") + "</div>" +
        '<div class="ri-e">💡 ' + esc(q.explain || "") + "</div></div>";
    }).join("");
    shell().innerHTML = '<div class="view quiz-shell"><div class="card result-card">' +
      '<div class="result-mascot">' + mascotSVG(passed ? "party" : "sad") + "</div>" +
      scoreRing(pct, passed ? "var(--mint)" : "var(--danger)") +
      "<h2>" + (passed ? "🎉 Đạt! Chương " + chId + " đã hoàn thành!" : "😿 Chưa đạt — cần ≥70%") + "</h2>" +
      '<p class="muted">Đúng <b>' + correct + "/" + qs.length + "</b> câu" + (passed ? " — Miu tự hào về bạn! 🐾" : " — đọc giải thích bên dưới rồi thử lại nhé, Miu tin bạn!") + "</p>" +
      '<div class="flex mt" style="justify-content:center"><button class="btn btn-primary" id="quizRetry">↺ Làm lại</button>' +
      '<a class="btn btn-soft" href="#/chuong/' + chId + '">📖 Ôn lại chương</a>' +
      (passed ? '<a class="btn btn-mint" href="#/chuong/' + (chId + 1 <= 9 && getCh(chId + 1) ? chId + 1 : chId) + '">Chương tiếp →</a>' : "") + "</div></div>" +
      '<h2 class="section-title"><span class="sticker">🔍</span> Xem lại từng câu</h2>' + review + "</div>";
    if (passed) { Sound.play("win"); Confetti.burst(140); toast("Chương " + chId + " hoàn thành với <b>" + pct + "%</b>! 🏅", "ok", "🏅"); }
    else Sound.play("no");
    $("#quizRetry").addEventListener("click", () => runQuiz(chId, qs));
    window.scrollTo({ top: 0 });
  };
  renderQ();
}

/* ---------- Flashcard ---------- */
Views.flashcard = function (params) {
  const ids = chapterIds();
  if (!ids.length) { APP().innerHTML = '<div class="view"><div class="card center">📦 Flashcard đang cập nhật…</div></div>'; return; }
  let chSel = params && params.get("ch") ? +params.get("ch") : 0;
  let shuffleOn = true, deck = [], idx = 0, flipped = false, finished = false;

  const buildDeck = () => {
    let cards = [];
    (chSel ? [chSel] : ids).forEach(id => {
      const ch = getCh(id);
      (ch.flashcards || []).forEach((f, j) => cards.push({ key: id + ":" + j, ch: id, front: f.front, back: f.back }));
    });
    if (shuffleOn) cards = shuffle(cards);
    deck = cards; idx = 0; flipped = false; finished = false;
  };
  const stats = () => {
    let mem = 0, notyet = 0, fresh = 0;
    deck.forEach(c => { const v = Store.data.flash[c.key]; if (v === 1) mem++; else if (v === 0) notyet++; else fresh++; });
    return { mem, notyet, fresh };
  };
  const render = () => {
    const s = stats();
    if (finished || !deck.length) {
      APP().innerHTML = '<div class="view quiz-shell"><div class="card result-card"><div class="result-mascot">' + mascotSVG("party") + "</div>" +
        "<h2>🃏 Học xong bộ thẻ!</h2><p class='muted'>Đã nhớ <b>" + s.mem + "</b> · Chưa nhớ <b>" + s.notyet + "</b> · Chưa chạm <b>" + s.fresh + "</b> / " + deck.length + " thẻ</p>" +
        '<div class="flex mt" style="justify-content:center"><button class="btn btn-primary" id="fcAgain">↺ Học lại bộ này</button><button class="btn btn-soft" id="fcWeak">😿 Ôn thẻ chưa nhớ</button></div></div></div>';
      $("#fcAgain").addEventListener("click", () => { buildDeck(); render(); });
      $("#fcWeak").addEventListener("click", () => {
        const weak = deck.filter(c => Store.data.flash[c.key] !== 1);
        if (!weak.length) { toast("Bạn nhớ hết cả bộ rồi, giỏi quá! 🎉", "ok", "🧠"); return; }
        deck = shuffle(weak); idx = 0; flipped = false; finished = false; render();
      });
      return;
    }
    const c = deck[idx];
    const v = Store.data.flash[c.key];
    APP().innerHTML = '<div class="view"><h1 class="mb">🃏 Flashcard ghi nhớ</h1>' +
      '<div class="fc-controls">' +
      '<select class="select" id="fcCh"><option value="0">🌈 Tất cả chương</option>' + ids.map(id => '<option value="' + id + '"' + (id === chSel ? " selected" : "") + ">Chương " + id + ": " + esc(getCh(id).short || getCh(id).title) + "</option>").join("") + "</select>" +
      '<label class="toggle"><input type="checkbox" id="fcShuffle"' + (shuffleOn ? " checked" : "") + '><span class="tg"></span>🔀 Xáo trộn</label>' +
      '<span class="chip" style="margin-left:auto">Thẻ ' + (idx + 1) + "/" + deck.length + "</span></div>" +
      '<div class="pbar mb"><div style="width:' + ((idx) / deck.length * 100) + '%"></div></div>' +
      '<div class="fc-stage"><div class="fc-card' + (flipped ? " flipped" : "") + '" id="fcCard" role="button" tabindex="0" aria-label="Lật thẻ">' +
      '<div class="fc-face fc-front"><span class="fc-tag">Chương ' + c.ch + " · Mặt câu hỏi" + (v === 1 ? " · 🧠 đã nhớ" : v === 0 ? " · 😿 chưa nhớ" : "") + '</span><div class="fc-q">' + esc(c.front) + '</div><span class="fc-hint">👆 Bấm để lật xem đáp án</span></div>' +
      '<div class="fc-face fc-back"><span class="fc-tag">Đáp án</span><div class="fc-a">' + esc(c.back) + '</div><span class="fc-hint">Bạn nhớ được chứ? Chọn bên dưới 👇</span></div>' +
      '<div class="fc-sizer"><div class="fc-q">' + esc(c.front) + '</div><div class="fc-a">' + esc(c.back) + "</div></div>" +
      "</div></div>" +
      '<div class="fc-actions">' +
      '<button class="btn btn-danger" id="fcNo">😿 Chưa nhớ</button>' +
      '<button class="btn btn-soft" id="fcFlip">🔄 Lật thẻ</button>' +
      '<button class="btn btn-mint" id="fcYes">🧠 Đã nhớ</button></div>' +
      '<div class="fc-nav"><button class="btn btn-ghost btn-sm" id="fcPrev">← Thẻ trước</button><button class="btn btn-ghost btn-sm" id="fcNext">Thẻ sau →</button></div>' +
      '<div class="fc-stats"><span class="chip ok">🧠 Đã nhớ: ' + s.mem + '</span><span class="chip" style="background:var(--danger-pale);color:#c94f4f">😿 Chưa nhớ: ' + s.notyet + '</span><span class="chip">✨ Chưa học: ' + s.fresh + "</span></div></div>";

    const flip = () => { flipped = !flipped; $("#fcCard").classList.toggle("flipped", flipped); Sound.play("flip"); };
    $("#fcCard").addEventListener("click", flip);
    $("#fcCard").addEventListener("keydown", e => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); flip(); } });
    $("#fcFlip").addEventListener("click", flip);
    const mark = val => {
      Store.data.flash[c.key] = val; Store.save();
      Sound.play(val === 1 ? "ok" : "click");
      if (val === 1) Confetti.burst(18);
      checkBadges();
      if (idx < deck.length - 1) { idx++; flipped = false; render(); }
      else { finished = true; render(); }
    };
    $("#fcYes").addEventListener("click", () => mark(1));
    $("#fcNo").addEventListener("click", () => mark(0));
    $("#fcPrev").addEventListener("click", () => { if (idx > 0) { idx--; flipped = false; render(); } });
    $("#fcNext").addEventListener("click", () => { if (idx < deck.length - 1) { idx++; flipped = false; render(); } else { finished = true; render(); } });
    $("#fcCh").addEventListener("change", e => { chSel = +e.target.value; buildDeck(); render(); });
    $("#fcShuffle").addEventListener("change", e => { shuffleOn = e.target.checked; buildDeck(); render(); });
  };
  buildDeck(); render();
};

/* ---------- Mini game hub ---------- */
Views.gamesHub = function () {
  APP().innerHTML = '<div class="view"><h1 class="mb">🎮 Sảnh Mini Game</h1><p class="muted mb">Học mà chơi — chơi mà học! Mỗi game rèn một kỹ năng khác nhau. Kỷ lục được lưu lại trên máy bạn.</p>' +
    '<div class="game-grid">' + Games.list.map(g =>
      '<a class="game-card" href="#/game/' + g.id + '"><span class="game-ico">' + g.ico + "</span><h3>" + g.name + "</h3><p>" + g.desc + "</p>" +
      '<div class="ch-foot">' + (Store.data.games[g.id] ? '<span class="chip hot">🏅 Kỷ lục: ' + Store.data.games[g.id] + " điểm</span>" : '<span class="chip">Chưa chơi</span>') +
      '<span class="btn btn-soft btn-sm">Chơi →</span></div></a>').join("") + "</div>" +
    '<div class="card encourage mt">' + mascotSVG("party") + '<div><div class="encourage-quote">Chơi cả 6 game để mở huy hiệu “Vừa học vừa chơi” 🎮</div><p class="small muted mt">Đã chơi: ' + Object.keys(Store.data.gamesPlayed).length + "/6 game</p></div></div></div>";
};
Views.game = function (id) {
  APP().innerHTML = '<div class="view" id="gameRoot"></div>';
  Games.mount(id, $("#gameRoot"));
};

/* ---------- Kiểm tra (hub) + Thi cuối khóa ---------- */
Views.exam = function () {
  const ex = Store.data.exam;
  const ids = chapterIds();
  APP().innerHTML = '<div class="view"><h1 class="mb">🏁 Phòng kiểm tra</h1>' +
    '<div class="card mb" style="background:linear-gradient(135deg,#fff,var(--orange-pale))"><div class="spread"><div>' +
    '<span class="chip hot">BÀI THI CUỐI KHÓA</span><h2 class="mt" style="font-size:1.5rem">Thi tổng hợp CSE122</h2>' +
    '<p class="muted">40 câu hỏi phủ đều 9 chương · ⏱ 45 phút đếm ngược · lý thuyết, đọc code, tìm lỗi, tình huống.<br>Đáp án chỉ hiện sau khi nộp bài. Phân loại: <b>Chưa đạt</b> &lt;50% · <b>Khá</b> 50–74% · <b>Giỏi</b> 75–89% · <b>Xuất sắc</b> ≥90%.</p>' +
    (ex.attempts ? '<p class="mt"><span class="chip ' + (ex.best >= 50 ? "ok" : "warn") + '">🏅 Điểm tốt nhất: ' + ex.best + '%</span> <span class="chip">Đã thi ' + ex.attempts + " lần</span></p>" : "") +
    '<div class="mt"><button class="btn btn-primary btn-lg" id="examStart">📝 Vào phòng thi</button></div></div>' +
    '<div class="center">' + mascotSVG("think") + "</div></div></div>" +
    '<h2 class="section-title"><span class="sticker">📝</span> Kiểm tra từng chương</h2>' +
    '<div class="card" style="padding:10px">' + ids.map(id => {
      const ch = getCh(id), q = Store.data.quizzes[id];
      return '<a class="side-link" style="padding:12px 14px" href="#/kiem-tra/' + id + '"><span class="opt-key">' + ch.emoji + "</span><span><b>Chương " + id + ": " + esc(ch.title) + '</b><br><span class="small muted">' + (ch.quiz ? ch.quiz.length : 0) + " câu · đạt ≥70% để hoàn thành chương</span></span>" +
        '<span class="tick">' + (q && q.attempts ? '<span class="chip ' + (q.best >= 70 ? "ok" : "warn") + '">' + q.best + "%</span>" : '<span class="chip">Chưa làm</span>') + "</span></a>";
    }).join("") + "</div>" +
    (ex.history && ex.history.length ? '<h2 class="section-title"><span class="sticker">📜</span> Lịch sử thi</h2><div class="card">' + ex.history.slice(-6).reverse().map(h => '<div class="kv"><span>' + esc(h.date) + "</span><b>" + h.pct + "% · " + examGrade(h.pct).label + "</b></div>").join("") + "</div>" : "") +
    "</div>";
  $("#examStart").addEventListener("click", runExam);
};
function examGrade(pct) {
  if (pct >= 90) return { label: "Xuất sắc 👑", color: "var(--grape)", bg: "#f0e6ff" };
  if (pct >= 75) return { label: "Giỏi 🌟", color: "var(--mint)", bg: "var(--mint-pale)" };
  if (pct >= 50) return { label: "Khá 👍", color: "var(--amber)", bg: "var(--amber-pale)" };
  return { label: "Chưa đạt 😿", color: "var(--danger)", bg: "var(--danger-pale)" };
}

function runExam() {
  const qs = ExamData.questions;
  const N = qs.length;
  let i = 0, left = ExamData.minutes * 60, submitted = false;
  const answers = new Array(N).fill(null);
  const flags = new Set();
  const beforeUnload = e => { if (!submitted) { e.preventDefault(); e.returnValue = ""; } };
  window.addEventListener("beforeunload", beforeUnload);
  onViewCleanup(() => { clearInterval(timer); window.removeEventListener("beforeunload", beforeUnload); });

  const render = () => {
    const q = qs[i];
    const answered = answers.filter(a => a != null && a !== "").length;
    APP().innerHTML = '<div class="view"><div class="exam-layout"><div>' +
      '<div class="quiz-top"><span class="quiz-count">Câu ' + (i + 1) + "/" + N + "</span>" + qTypeChip(q) + '<span class="chip">Chương ' + q.ch + "</span>" +
      '<button class="btn btn-ghost btn-sm" id="exFlag" style="margin-left:auto">' + (flags.has(i) ? "🚩 Đã đánh dấu" : "🏳️ Đánh dấu xem lại") + "</button></div>" +
      '<div class="card q-card" id="exCard">' + qBodyHtml(q, "ex") + "</div>" +
      '<div class="quiz-nav"><button class="btn btn-ghost" id="exPrev"' + (i === 0 ? " disabled" : "") + '>← Câu trước</button>' +
      '<button class="btn btn-primary" id="exNext">' + (i === N - 1 ? "Về câu đầu ↺" : "Câu sau →") + "</button></div>" +
      '</div><aside class="exam-palette">' +
      '<div class="exam-clock" id="exClock">⏱ <span></span></div>' +
      '<p class="small muted">Đã trả lời: <b id="exCount">' + answered + "</b>/" + N + "</p>" +
      '<div class="palette-grid">' + qs.map((_, j) => '<button class="pal-btn' + (answers[j] != null && answers[j] !== "" ? " answered" : "") + (j === i ? " current" : "") + (flags.has(j) ? " flagged" : "") + '" data-j="' + j + '">' + (j + 1) + "</button>").join("") + "</div>" +
      '<button class="btn btn-primary mt" id="exSubmit" style="width:100%">📤 Nộp bài</button>' +
      '<p class="small muted mt">Không hiện đáp án trong khi làm bài. Hết giờ hệ thống tự nộp.</p>' +
      "</aside></div></div>";
    const card = $("#exCard");
    // restore previous answer
    const given = answers[i];
    if (q.type === "fill") {
      const inp = $("#exFill", card);
      if (given) inp.value = given;
      inp.addEventListener("input", () => { answers[i] = inp.value.trim(); syncPalette(); });
      $("#exFillBtn", card).textContent = "Lưu đáp án ✓";
      $("#exFillBtn", card).addEventListener("click", () => { answers[i] = inp.value.trim(); syncPalette(); toast("Đã lưu đáp án câu " + (i + 1), "ok", "💾"); });
    } else {
      $$(".opt-btn", card).forEach(b => {
        const v = q.type === "tf" ? b.dataset.v === "true" : +b.dataset.v;
        if (given != null && v === given) { b.classList.add("correct"); b.style.borderColor = "var(--orange)"; b.style.background = "var(--orange-pale)"; b.classList.remove("correct"); }
        b.addEventListener("click", () => {
          answers[i] = v;
          $$(".opt-btn", card).forEach(x => { x.style.borderColor = ""; x.style.background = ""; });
          b.style.borderColor = "var(--orange)"; b.style.background = "var(--orange-pale)";
          Sound.play("click"); syncPalette();
        });
      });
    }
    const syncPalette = () => {
      const cnt = answers.filter(a => a != null && a !== "").length;
      $("#exCount").textContent = cnt;
      $$(".pal-btn").forEach((p, j) => p.classList.toggle("answered", answers[j] != null && answers[j] !== ""));
    };
    $$(".pal-btn").forEach(p => p.addEventListener("click", () => { i = +p.dataset.j; render(); }));
    $("#exPrev").addEventListener("click", () => { if (i > 0) { i--; render(); } });
    $("#exNext").addEventListener("click", () => { i = (i + 1) % N; render(); });
    $("#exFlag").addEventListener("click", () => { flags.has(i) ? flags.delete(i) : flags.add(i); render(); });
    $("#exSubmit").addEventListener("click", () => {
      const blank = answers.filter(a => a == null || a === "").length;
      confirmModal("Nộp bài thi?", "Bạn đã trả lời <b>" + (N - blank) + "/" + N + "</b> câu." + (blank ? " Còn <b>" + blank + " câu bỏ trống</b> — câu trống tính là sai đó nha!" : " Tuyệt vời, không còn câu trống!") + "<br>Sau khi nộp sẽ hiện điểm và giải thích từng câu.", "📤 Nộp bài", grade);
    });
    tickClock();
  };
  const tickClock = () => {
    const el = $("#exClock"); if (!el) return;
    const m = Math.floor(left / 60), s = left % 60;
    $("span", el).textContent = m + ":" + (s < 10 ? "0" : "") + s;
    el.classList.toggle("low", left <= 300);
  };
  const timer = setInterval(() => {
    if (submitted) return;
    left--; tickClock();
    if (left === 300) toast("Còn 5 phút! Kiểm tra lại các câu đánh dấu 🚩", "warn", "⏰");
    if (left <= 0) { toast("Hết giờ — hệ thống tự nộp bài!", "warn", "⏰"); grade(); }
  }, 1000);

  const grade = () => {
    if (submitted) return;
    submitted = true; clearInterval(timer);
    window.removeEventListener("beforeunload", beforeUnload);
    let ok = 0, wrong = 0, blank = 0;
    const detail = qs.map((q, j) => {
      const given = answers[j];
      if (given == null || given === "") { blank++; return { q, given, ok: false, blank: true }; }
      const good = isCorrect(q, given);
      good ? ok++ : wrong++;
      return { q, given, ok: good, blank: false };
    });
    const pct = Math.round(ok / N * 100);
    const g = examGrade(pct);
    const ex = Store.data.exam;
    ex.attempts++; ex.best = Math.max(ex.best, pct);
    ex.history = (ex.history || []).concat([{ date: new Date().toLocaleString("vi-VN"), pct }]).slice(-20);
    Store.save(); checkBadges(); updateTopProgress();
    APP().innerHTML = '<div class="view quiz-shell">' +
      '<div class="grade-banner" style="background:' + g.bg + ';color:' + g.color + '">🎓 Kết quả: ' + g.label + "</div>" +
      '<div class="card result-card"><div class="result-mascot">' + mascotSVG(pct >= 50 ? "party" : "sad") + "</div>" +
      scoreRing(pct, g.color) +
      "<h2>Điểm của bạn: " + ok + "/" + N + " câu đúng</h2>" +
      '<div class="exam-stats"><div class="exam-stat es-ok"><b>' + ok + '</b>Câu đúng</div><div class="exam-stat es-no"><b>' + wrong + '</b>Câu sai</div><div class="exam-stat es-skip"><b>' + blank + "</b>Bỏ trống</div></div>" +
      '<p class="small muted">Xếp loại: Chưa đạt &lt;50% · Khá 50–74% · Giỏi 75–89% · Xuất sắc ≥90%</p>' +
      '<div class="flex mt" style="justify-content:center"><button class="btn btn-primary" id="exRetry">↺ Thi lại</button><a class="btn btn-soft" href="#/ca-nhan">🏅 Trang cá nhân</a><a class="btn btn-ghost" href="#/">🏠 Trang chủ</a></div></div>' +
      '<h2 class="section-title"><span class="sticker">🔍</span> Giải thích từng câu</h2>' +
      detail.map((d, j) => '<div class="review-item ' + (d.ok ? "ok" : "no") + '"><div class="ri-q">' + (d.ok ? "✅" : d.blank ? "⬜" : "❌") + " Câu " + (j + 1) + " (Chương " + d.q.ch + "): " + esc(d.q.q) + "</div>" +
        (d.q.type === "code" ? '<div class="code-card q-code" style="margin:8px 0"><div class="code-body"><pre>' + highlight(d.q.code, d.q.lang) + "</pre></div></div>" : "") +
        '<div class="ri-a">Bạn chọn: <b>' + answerText(d.q, d.given) + "</b>" + (d.ok ? "" : ' · Đáp án đúng: <b style="color:#2e8b66">' + correctText(d.q) + "</b>") + "</div>" +
        '<div class="ri-e">💡 ' + esc(d.q.explain || "") + "</div></div>").join("") + "</div>";
    if (pct >= 50) { Sound.play("win"); Confetti.burst(160); } else Sound.play("no");
    $("#exRetry").addEventListener("click", runExam);
    window.scrollTo({ top: 0 });
  };
  render();
}

/* ---------- Tài liệu / phụ lục ---------- */
Views.docs = function () {
  const secs = window.AppendixData || [];
  APP().innerHTML = '<div class="view"><h1 class="mb">📂 Tài liệu & Phụ lục</h1>' +
    '<p class="muted mb">Tra cứu nhanh mọi thứ trong khoá học. Mỗi bảng có ô <b>tìm kiếm riêng</b> — gõ từ khoá là lọc ngay!</p>' +
    '<div class="docs-layout"><nav class="docs-nav">' + secs.map(s => '<a href="#/tai-lieu" data-goto="' + s.id + '">' + s.ico + " " + esc(s.title.replace("Bảng tổng hợp ", "").replace("Bảng ", "")) + "</a>").join("") +
    '<div class="divider"></div><a href="https://hieutachi.github.io/cse122-k67/ebook/index.html" target="_blank" rel="noopener">📖 Ebook gốc ↗</a><a href="https://hieutachi.github.io/cse122-k67/slides/index.html" target="_blank" rel="noopener">🖼️ Slide gốc ↗</a></nav>' +
    "<div>" + secs.map(s =>
      '<section class="doc-section card" id="doc-' + s.id + '"><div class="doc-head"><h2>' + s.ico + " " + esc(s.title) + '</h2><input class="doc-search" data-sec="' + s.id + '" placeholder="🔍 Tìm trong bảng này…"></div>' +
      '<div class="doc-table-wrap"><table class="doc-table"><thead><tr>' + s.cols.map(c => "<th>" + esc(c) + "</th>").join("") + "</tr></thead><tbody>" +
      s.rows.map(r => "<tr>" + r.map(c => "<td>" + c + "</td>").join("") + "</tr>").join("") +
      '</tbody></table><div class="doc-empty">😿 Không tìm thấy mục nào khớp — thử từ khoá khác nhé!</div></div>' +
      '<p class="small muted mt">' + s.rows.length + " mục</p></section>").join("") + "</div></div></div>";
  $$(".doc-search").forEach(inp => {
    inp.addEventListener("input", () => {
      const sec = $("#doc-" + inp.dataset.sec);
      const q = norm(inp.value);
      let shown = 0;
      $$("tbody tr", sec).forEach(tr => {
        const hit = !q || norm(tr.textContent).includes(q);
        tr.style.display = hit ? "" : "none";
        if (hit) shown++;
      });
      $(".doc-empty", sec).style.display = shown ? "none" : "block";
    });
  });
  $$(".docs-nav [data-goto]").forEach(a => a.addEventListener("click", e => {
    e.preventDefault();
    const el = $("#doc-" + a.dataset.goto);
    if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
  }));
};

/* ---------- Cá nhân ---------- */
Views.profile = function () {
  const ids = chapterIds();
  const flashMem = Object.values(Store.data.flash).filter(v => v === 1).length;
  const flashTotal = ids.reduce((n, id) => n + (getCh(id).flashcards || []).length, 0);
  const earned = BADGES.filter(b => Store.data.badges[b.id]).length;
  const maxQuiz = 100;
  APP().innerHTML = '<div class="view">' +
    '<div class="card mb" style="background:linear-gradient(135deg,#fff,var(--cream-2))"><div class="spread"><div class="flex" style="gap:18px">' +
    '<div style="width:96px">' + mascotSVG("happy") + "</div><div><h1>Hồ sơ học tập 🐾</h1>" +
    '<p class="muted">Tiến độ lưu tự động trên trình duyệt này (LocalStorage).</p>' +
    '<div class="flex mt"><a class="btn btn-primary" href="' + lastLessonLocation() + '">🚀 Tiếp tục học</a><button class="btn btn-danger btn-sm" id="resetBtn">🗑 Xoá toàn bộ tiến độ</button></div></div></div>' +
    '<div class="center">' + scoreRing(overallPct()) + '<p class="small muted">Tổng tiến độ</p></div></div></div>' +

    '<div class="stats-strip">' +
    '<div class="stat-card"><span class="stat-ico" style="background:var(--amber-pale)">⏰</span><div><b>' + fmtTime(Store.data.timeSec) + "</b><span>Tổng thời gian học</span></div></div>" +
    '<div class="stat-card"><span class="stat-ico" style="background:var(--mint-pale)">📖</span><div><b>' + doneLessons() + "/" + totalLessons() + "</b><span>Bài đã hoàn thành</span></div></div>" +
    '<div class="stat-card"><span class="stat-ico" style="background:var(--orange-pale)">🏅</span><div><b>' + doneChapters() + "/" + (ids.length || 9) + "</b><span>Chương đã qua (≥70%)</span></div></div>" +
    '<div class="stat-card"><span class="stat-ico" style="background:var(--sky-pale)">🃏</span><div><b>' + flashMem + "/" + flashTotal + "</b><span>Flashcard đã nhớ</span></div></div>" +
    "</div>" +

    '<div class="profile-grid mt">' +
    '<div class="card"><h3 class="mb">📊 Điểm kiểm tra theo chương</h3>' +
    (ids.length ? '<div class="chart-bars">' + ids.map(id => {
      const q = Store.data.quizzes[id];
      const v = q ? q.best : 0;
      return '<div class="chart-col"><div class="chart-bar" style="height:' + Math.max(3, v) + '%;' + (v >= 70 ? "" : "background:linear-gradient(180deg,var(--orange-pale),var(--orange-soft))") + '"><span>' + (q && q.attempts ? v + "%" : "–") + "</span></div><small>C" + id + "</small></div>";
    }).join("") + "</div>" + '<p class="small muted mt">Cột đậm = đã đạt ≥70%. Bấm vào chương ở trang Bài học để thi lại.</p>' : "<p class='muted'>Chưa có dữ liệu.</p>") + "</div>" +
    '<div class="card"><h3 class="mb">🧾 Thành tích khác</h3>' +
    '<div class="kv"><span>🏁 Thi cuối khóa (tốt nhất)</span><b>' + (Store.data.exam.attempts ? Store.data.exam.best + "% · " + examGrade(Store.data.exam.best).label : "Chưa thi") + "</b></div>" +
    '<div class="kv"><span>📝 Số lần thi cuối khóa</span><b>' + Store.data.exam.attempts + "</b></div>" +
    '<div class="kv"><span>🎮 Mini game đã chơi</span><b>' + Object.keys(Store.data.gamesPlayed).length + "/6</b></div>" +
    '<div class="kv"><span>🏆 Tổng điểm game (kỷ lục)</span><b>' + Object.values(Store.data.games).reduce((a, b) => a + b, 0) + "</b></div>" +
    '<div class="kv"><span>🧠 Flashcard chưa nhớ</span><b>' + Object.values(Store.data.flash).filter(v => v === 0).length + "</b></div>" +
    '<div class="kv"><span>🔊 Âm thanh</span><b>' + (Store.data.sound ? "Đang bật" : "Đang tắt") + "</b></div>" +
    '<div class="kv"><span>📍 Học gần nhất</span><b><a href="' + lastLessonLocation() + '">Tiếp tục →</a></b></div>' +
    "</div></div>" +

    '<h2 class="section-title"><span class="sticker">🏅</span> Bộ sưu tập huy hiệu (' + earned + "/" + BADGES.length + ")</h2>" +
    '<div class="badge-grid">' + BADGES.map(b =>
      '<div class="badge ' + (Store.data.badges[b.id] ? "earned" : "") + '" title="' + esc(b.desc) + '"><span class="b-ico">' + b.ico + "</span><b>" + esc(b.name) + "</b><span>" + esc(b.desc) + "</span></div>").join("") + "</div>" +
    '<div class="card encourage mt">' + mascotSVG(earned >= 5 ? "party" : "wave") + '<div><div class="encourage-quote">' +
    (earned === 0 ? "Huy hiệu đầu tiên đang chờ bạn — hoàn thành 1 bài học là có ngay! 🐣" : earned < 6 ? "Bộ sưu tập đang lớn dần đó, tiếp tục nào! 🌱" : "Wow, hơn nửa bộ huy hiệu rồi — bạn đúng là chiến binh code! ⚔️") +
    "</div></div></div></div>";
  $("#resetBtn").addEventListener("click", () => {
    confirmModal("Xoá toàn bộ tiến độ?", "Toàn bộ bài học, điểm kiểm tra, flashcard, huy hiệu và thời gian học sẽ bị xoá vĩnh viễn khỏi trình duyệt này.", "🗑 Xoá hết", () => {
      Store.reset(); updateTopProgress(); toast("Đã xoá tiến độ. Bắt đầu lại từ đầu nào! 🐣", "warn", "🗑"); Views.profile();
    });
  });
};

/* ---------- 404 ---------- */
Views.notFound = function () {
  APP().innerHTML = '<div class="view"><div class="empty-state">' + mascotSVG("sad") +
    "<h2>Ơ, trang này không tồn tại 😿</h2><p class='muted mb'>Có thể nội dung đang được cập nhật. Quay về trang chủ nhé!</p>" +
    '<a class="btn btn-primary" href="#/">🏠 Về trang chủ</a></div></div>';
};
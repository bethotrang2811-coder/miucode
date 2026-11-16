/* ============ MiuCode app: router, nav, study timer ============ */
"use strict";
const ViewCleanups = [];
function onViewCleanup(fn) { ViewCleanups.push(fn); }
function runCleanups() {
  while (ViewCleanups.length) {
    const fn = ViewCleanups.pop();
    try { fn(); } catch (e) {}
  }
}

const NAV_MAP = {
  "": "home", "lo-trinh": "lo-trinh", "bai-hoc": "bai-hoc", "chuong": "bai-hoc", "hoc": "bai-hoc",
  "flashcard": "flashcard", "mini-game": "mini-game", "game": "mini-game",
  "kiem-tra": "thi-cuoi-khoa", "thi-cuoi-khoa": "thi-cuoi-khoa", "tai-lieu": "tai-lieu", "ca-nhan": "ca-nhan"
};

function route() {
  runCleanups();
  const raw = (location.hash || "#/").slice(1);
  const [pathPart, queryPart] = raw.split("?");
  const parts = pathPart.split("/").filter(Boolean);
  const params = new URLSearchParams(queryPart || "");
  const head = parts[0] || "";
  $("#mainnav").classList.remove("open");
  try {
    switch (head) {
      case "": Views.home(); break;
      case "lo-trinh": Views.roadmap(); break;
      case "bai-hoc": Views.lessons(); break;
      case "chuong": Views.chapter(+parts[1]); break;
      case "hoc": Views.lesson(+parts[1], parts[2]); break;
      case "kiem-tra": Views.quiz(+parts[1]); break;
      case "flashcard": Views.flashcard(params); break;
      case "mini-game": Views.gamesHub(); break;
      case "game": Views.game(parts[1]); break;
      case "thi-cuoi-khoa": Views.exam(); break;
      case "tai-lieu": Views.docs(); break;
      case "ca-nhan": Views.profile(); break;
      default: Views.notFound();
    }
  } catch (err) {
    console.error(err);
    APP().innerHTML = '<div class="view"><div class="empty-state">' + mascotSVG("sad") +
      "<h2>Ối, có lỗi xảy ra 😿</h2><p class='muted mb'>" + esc(err.message) + "</p>" +
      '<a class="btn btn-primary" href="#/">🏠 Về trang chủ</a></div></div>';
  }
  // nav active state
  const navKey = NAV_MAP[head] || "";
  $$("#mainnav a").forEach(a => a.classList.toggle("active", a.dataset.nav === navKey));
  updateTopProgress();
  window.scrollTo({ top: 0 });
}

/* ---------- sound toggle ---------- */
function renderSoundBtn() {
  const btn = $("#soundBtn");
  btn.textContent = Store.data.sound ? "🔊" : "🔇";
  btn.title = Store.data.sound ? "Âm thanh đang BẬT — bấm để tắt" : "Âm thanh đang TẮT — bấm để bật";
}

/* ---------- init ---------- */
function initApp() {
  $("#brandCat").innerHTML = mascotSVG("happy");
  $("#footerCat").innerHTML = mascotSVG("wave");
  renderSoundBtn();
  $("#soundBtn").addEventListener("click", () => {
    Store.data.sound = !Store.data.sound; Store.save();
    renderSoundBtn();
    if (Store.data.sound) Sound.play("ok");
    toast(Store.data.sound ? "Đã bật âm thanh 🔊" : "Đã tắt âm thanh 🔇", "ok", Store.data.sound ? "🔊" : "🔇");
  });
  $("#burgerBtn").addEventListener("click", () => $("#mainnav").classList.toggle("open"));
  document.addEventListener("keydown", e => { if (e.key === "Escape") $("#mainnav").classList.remove("open"); });
  document.addEventListener("click", e => {
    if (!e.target.closest(".topbar")) $("#mainnav").classList.remove("open");
  });

  // study-time tracking: count while tab visible
  let tickCount = 0;
  setInterval(() => {
    if (document.visibilityState !== "visible") return;
    Store.data.timeSec += 5; tickCount++;
    if (tickCount % 6 === 0) { Store.save(); checkBadges(); }
  }, 5000);
  window.addEventListener("beforeunload", () => Store.save());

  window.addEventListener("hashchange", route);
  route();
}
document.addEventListener("DOMContentLoaded", initApp);
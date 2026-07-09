(function () {
  "use strict";

  var LOCAL_URL_KEY = "nmha_apps_script_url";
  var LOCAL_EVENTS_KEY = "nmha_local_events";

  function getAppsScriptUrl() {
    var override = window.localStorage.getItem(LOCAL_URL_KEY);
    if (override) return override.trim();
    if (window.NMHA_CONFIG && window.NMHA_CONFIG.APPS_SCRIPT_URL) {
      return window.NMHA_CONFIG.APPS_SCRIPT_URL.trim();
    }
    return "";
  }

  function getSource() {
    var params = new URLSearchParams(window.location.search);
    return params.get("utm_source") || params.get("ref") || "direct";
  }

  function saveLocalEvent(payload) {
    try {
      var raw = window.localStorage.getItem(LOCAL_EVENTS_KEY);
      var events = raw ? JSON.parse(raw) : [];
      events.push(payload);
      // Giữ tối đa 500 sự kiện gần nhất để tránh phình localStorage
      if (events.length > 500) events = events.slice(events.length - 500);
      window.localStorage.setItem(LOCAL_EVENTS_KEY, JSON.stringify(events));
    } catch (e) {
      /* localStorage có thể bị chặn (chế độ ẩn danh) — bỏ qua an toàn */
    }
  }

  function logEvent(data) {
    var payload = Object.assign(
      {
        timestamp: new Date().toISOString(),
        source: getSource(),
        page: window.location.pathname
      },
      data
    );

    // Luôn lưu bản sao cục bộ để trang quản trị có dữ liệu demo khi chưa kết nối Sheet
    saveLocalEvent(payload);

    var url = getAppsScriptUrl();
    if (!url) return;

    // Dùng no-cors + text/plain để tránh preflight CORS mà Apps Script không hỗ trợ
    fetch(url, {
      method: "POST",
      mode: "no-cors",
      headers: { "Content-Type": "text/plain;charset=utf-8" },
      body: JSON.stringify(payload)
    }).catch(function () {
      /* Gửi thất bại (mất mạng...) — dữ liệu vẫn còn bản sao cục bộ */
    });
  }

  function initPageviewLog() {
    logEvent({ type: "pageview" });
  }

  function initMobileNav() {
    var toggle = document.getElementById("navToggle");
    var nav = document.getElementById("mainNav");
    if (!toggle || !nav) return;
    toggle.addEventListener("click", function () {
      nav.classList.toggle("is-open");
    });
    nav.querySelectorAll("a").forEach(function (link) {
      link.addEventListener("click", function () {
        nav.classList.remove("is-open");
      });
    });
  }

  function initFaqAccordion() {
    var items = document.querySelectorAll(".faq-item");
    items.forEach(function (item) {
      var btn = item.querySelector(".faq-q");
      btn.addEventListener("click", function () {
        item.classList.toggle("is-open");
      });
    });
  }

  function initTemplateTabs() {
    var tabs = document.querySelectorAll(".template-tab");
    var cards = document.querySelectorAll(".template-card");
    tabs.forEach(function (tab) {
      tab.addEventListener("click", function () {
        tabs.forEach(function (t) { t.classList.remove("is-active"); });
        tab.classList.add("is-active");
        var filter = tab.getAttribute("data-filter");
        cards.forEach(function (card) {
          var show = filter === "all" || card.getAttribute("data-type") === filter;
          card.style.display = show ? "" : "none";
        });
      });
    });
  }

  function isValidPhone(value) {
    return /^[0-9+\s]{9,12}$/.test(value.trim());
  }

  function initLeadForm() {
    var form = document.getElementById("leadForm");
    if (!form) return;
    var status = document.getElementById("formStatus");
    var submitBtn = document.getElementById("leadSubmitBtn");

    form.addEventListener("submit", function (e) {
      e.preventDefault();

      var name = form.name.value.trim();
      var phone = form.phone.value.trim();
      var email = form.email.value.trim();

      status.className = "form-status show";

      if (!name || !phone) {
        status.classList.add("err");
        status.textContent = "Vui lòng nhập đầy đủ họ tên và số điện thoại.";
        return;
      }
      if (!isValidPhone(phone)) {
        status.classList.add("err");
        status.textContent = "Số điện thoại không hợp lệ, vui lòng kiểm tra lại.";
        return;
      }

      submitBtn.disabled = true;
      submitBtn.textContent = "Đang gửi...";

      logEvent({ type: "lead", name: name, phone: phone, email: email });

      setTimeout(function () {
        status.classList.remove("err");
        status.classList.add("ok");
        status.textContent = "Cảm ơn " + name + "! Template sẽ được gửi tới bạn trong ít phút.";
        form.reset();
        submitBtn.disabled = false;
        submitBtn.textContent = "🎁 Nhận bộ template miễn phí ngay";
      }, 500);
    });
  }

  function initFooterYear() {
    var el = document.getElementById("year");
    if (el) el.textContent = new Date().getFullYear();
  }

  document.addEventListener("DOMContentLoaded", function () {
    initPageviewLog();
    initMobileNav();
    initFaqAccordion();
    initTemplateTabs();
    initLeadForm();
    initFooterYear();
  });
})();

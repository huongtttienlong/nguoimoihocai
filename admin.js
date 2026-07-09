(function () {
  "use strict";

  var LOCAL_URL_KEY = "nmha_apps_script_url";
  var LOCAL_EVENTS_KEY = "nmha_local_events";

  var state = {
    events: [],
    leads: [],
    search: ""
  };

  var els = {};

  function $(id) { return document.getElementById(id); }

  function getSavedUrl() {
    return (window.localStorage.getItem(LOCAL_URL_KEY) || "").trim();
  }

  function getLocalEvents() {
    try {
      var raw = window.localStorage.getItem(LOCAL_EVENTS_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch (e) {
      return [];
    }
  }

  function fetchJSONP(baseUrl) {
    return new Promise(function (resolve, reject) {
      var cbName = "nmha_cb_" + Date.now() + "_" + Math.floor(Math.random() * 1e6);
      var script = document.createElement("script");
      var settled = false;

      var timeout = setTimeout(function () {
        if (settled) return;
        settled = true;
        cleanup();
        reject(new Error("timeout"));
      }, 12000);

      function cleanup() {
        clearTimeout(timeout);
        delete window[cbName];
        if (script.parentNode) script.parentNode.removeChild(script);
      }

      window[cbName] = function (data) {
        if (settled) return;
        settled = true;
        cleanup();
        resolve(data);
      };

      var sep = baseUrl.indexOf("?") === -1 ? "?" : "&";
      script.src = baseUrl + sep + "callback=" + cbName + "&_=" + Date.now();
      script.onerror = function () {
        if (settled) return;
        settled = true;
        cleanup();
        reject(new Error("network error"));
      };
      document.body.appendChild(script);
    });
  }

  function setStatus(kind, text) {
    els.statusPill.className = "status-pill " + kind;
    els.statusPill.textContent = text;
  }

  function loadData() {
    var url = getSavedUrl();
    els.sheetUrl.value = url;

    if (!url) {
      state.events = getLocalEvents();
      setStatus("demo", "Chưa kết nối Google Sheets · đang xem dữ liệu demo trong trình duyệt này");
      render();
      return;
    }

    setStatus("demo", "Đang tải dữ liệu từ Google Sheets...");
    fetchJSONP(url)
      .then(function (data) {
        state.events = Array.isArray(data) ? data : [];
        setStatus("connected", "Đã kết nối Google Sheets · " + state.events.length + " bản ghi");
        render();
      })
      .catch(function () {
        state.events = getLocalEvents();
        setStatus("error", "Không kết nối được URL này · đang tạm hiển thị dữ liệu demo cục bộ");
        render();
      });
  }

  function isSameDay(isoString, dateObj) {
    if (!isoString) return false;
    return isoString.slice(0, 10) === dateObj.toISOString().slice(0, 10);
  }

  function render() {
    var events = state.events || [];
    var pageviews = events.filter(function (e) { return e.type === "pageview"; });
    var leads = events.filter(function (e) { return e.type === "lead"; });

    var today = new Date();
    var visitsToday = pageviews.filter(function (e) { return isSameDay(e.timestamp, today); }).length;
    var leadsToday = leads.filter(function (e) { return isSameDay(e.timestamp, today); }).length;
    var rate = pageviews.length ? ((leads.length / pageviews.length) * 100).toFixed(1) : "0.0";

    els.kpiVisits.textContent = pageviews.length;
    els.kpiVisitsToday.textContent = "Hôm nay: " + visitsToday;
    els.kpiLeads.textContent = leads.length;
    els.kpiLeadsToday.textContent = "Hôm nay: " + leadsToday;
    els.kpiRate.textContent = rate + "%";
    els.kpiUpdated.textContent = today.toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" });

    renderChart(pageviews);

    state.leads = leads.slice().sort(function (a, b) {
      return new Date(b.timestamp) - new Date(a.timestamp);
    });
    renderLeadsTable();
  }

  function renderChart(pageviews) {
    var days = [];
    for (var i = 13; i >= 0; i--) {
      var d = new Date();
      d.setDate(d.getDate() - i);
      days.push(d);
    }

    var counts = days.map(function (d) {
      return pageviews.filter(function (e) { return isSameDay(e.timestamp, d); }).length;
    });
    var max = Math.max.apply(null, counts.concat([1]));

    els.chartBars.innerHTML = "";
    days.forEach(function (d, idx) {
      var count = counts[idx];
      var col = document.createElement("div");
      col.className = "chart-col";

      var val = document.createElement("div");
      val.className = "bar-val";
      val.textContent = count > 0 ? count : "";

      var bar = document.createElement("div");
      bar.className = "bar";
      bar.style.height = Math.max(2, Math.round((count / max) * 150)) + "px";

      var label = document.createElement("div");
      label.className = "bar-label";
      label.textContent = (d.getMonth() + 1) + "/" + d.getDate();

      col.appendChild(val);
      col.appendChild(bar);
      col.appendChild(label);
      els.chartBars.appendChild(col);
    });
  }

  function formatTimestamp(iso) {
    if (!iso) return "--";
    var d = new Date(iso);
    if (isNaN(d.getTime())) return String(iso);
    return d.toLocaleString("vi-VN", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" });
  }

  function escapeHtml(str) {
    return String(str || "").replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  }

  function getFilteredLeads() {
    var q = state.search.trim().toLowerCase();
    if (!q) return state.leads;
    return state.leads.filter(function (l) {
      return (
        (l.name || "").toLowerCase().indexOf(q) !== -1 ||
        (l.phone || "").toLowerCase().indexOf(q) !== -1 ||
        (l.email || "").toLowerCase().indexOf(q) !== -1
      );
    });
  }

  function renderLeadsTable() {
    var filtered = getFilteredLeads();
    els.leadsTableBody.innerHTML = "";

    if (!filtered.length) {
      els.emptyState.style.display = "block";
      return;
    }
    els.emptyState.style.display = "none";

    filtered.forEach(function (l) {
      var tr = document.createElement("tr");
      tr.innerHTML =
        "<td>" + formatTimestamp(l.timestamp) + "</td>" +
        "<td>" + escapeHtml(l.name) + "</td>" +
        "<td>" + escapeHtml(l.phone) + "</td>" +
        "<td>" + escapeHtml(l.email) + "</td>" +
        "<td>" + escapeHtml(l.source) + "</td>";
      els.leadsTableBody.appendChild(tr);
    });
  }

  function exportCsv() {
    var rows = getFilteredLeads();
    var header = ["Thời gian", "Họ tên", "Điện thoại", "Email", "Nguồn"];
    var lines = [header.join(",")];
    rows.forEach(function (l) {
      var line = [formatTimestamp(l.timestamp), l.name, l.phone, l.email, l.source]
        .map(function (v) { return '"' + String(v || "").replace(/"/g, '""') + '"'; })
        .join(",");
      lines.push(line);
    });
    var csv = "﻿" + lines.join("\r\n");
    var blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    var url = URL.createObjectURL(blob);
    var a = document.createElement("a");
    a.href = url;
    a.download = "khach-hang-nguoi-moi-hoc-ai-" + new Date().toISOString().slice(0, 10) + ".csv";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  document.addEventListener("DOMContentLoaded", function () {
    els.sheetUrl = $("sheetUrl");
    els.connectBtn = $("connectBtn");
    els.statusPill = $("statusPill");
    els.refreshBtn = $("refreshBtn");
    els.searchInput = $("searchInput");
    els.exportBtn = $("exportBtn");
    els.chartBars = $("chartBars");
    els.leadsTableBody = $("leadsTableBody");
    els.emptyState = $("emptyState");
    els.kpiVisits = $("kpiVisits");
    els.kpiVisitsToday = $("kpiVisitsToday");
    els.kpiLeads = $("kpiLeads");
    els.kpiLeadsToday = $("kpiLeadsToday");
    els.kpiRate = $("kpiRate");
    els.kpiUpdated = $("kpiUpdated");

    els.connectBtn.addEventListener("click", function () {
      var url = els.sheetUrl.value.trim();
      if (url) {
        window.localStorage.setItem(LOCAL_URL_KEY, url);
      } else {
        window.localStorage.removeItem(LOCAL_URL_KEY);
      }
      loadData();
    });

    els.refreshBtn.addEventListener("click", loadData);

    els.searchInput.addEventListener("input", function () {
      state.search = els.searchInput.value;
      renderLeadsTable();
    });

    els.exportBtn.addEventListener("click", exportCsv);

    loadData();
  });
})();

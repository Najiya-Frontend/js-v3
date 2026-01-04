// js/services/toast.js
function tenxToast(msg, ms, kind) {
  ms = (ms == null) ? 2500 : Number(ms);
  kind = String(kind || "info");

  try {
    if (!document || !document.body) return;

    var el = document.getElementById("tenx-toast");
    if (!el) {
      el = document.createElement("div");
      el.id = "tenx-toast";
      document.body.appendChild(el);
    }

    if (tenxToast._t1) { clearTimeout(tenxToast._t1); tenxToast._t1 = null; }
    if (tenxToast._t2) { clearTimeout(tenxToast._t2); tenxToast._t2 = null; }

    el.textContent = String(msg == null ? "" : msg);
    el.className = "is-show is-" + kind;

    tenxToast._t1 = setTimeout(function () {
      el.className = el.className.replace(/\bis-show\b/g, "");
    }, Math.max(800, ms));

    tenxToast._t2 = setTimeout(function () {
      el.className = "";
      el.textContent = "";
    }, Math.max(900, ms + 250));
  } catch (e) {}
}

/* Süti-hozzájárulás. A statisztika (PostHog) csak "Elfogadom" után indul: a
   chat widget a BANACRAFT_CONFIG.requireConsent beállítás mellett megvárja a
   "banacraft:consent" eseményt. A döntést a böngésző megjegyzi (localStorage);
   a láblécben lévő "Süti-beállítások" linkkel bármikor módosítható. */
(function () {
  var KEY = "bc_consent";
  function stored() { try { return localStorage.getItem(KEY); } catch (e) { return null; } }
  function decide(value) {
    try { localStorage.setItem(KEY, value); } catch (e) {}
    window.dispatchEvent(new CustomEvent("banacraft:consent", { detail: value }));
    var b = document.getElementById("bc-consent");
    if (b) b.remove();
  }

  function banner() {
    if (document.getElementById("bc-consent")) return;
    var css = document.createElement("style");
    css.textContent =
      "#bc-consent{position:fixed;left:16px;bottom:16px;z-index:2147483647;max-width:420px;padding:18px 20px;border-radius:16px;" +
      "background:#1f2421;color:#f4f1ea;font:14px/1.5 Inter,system-ui,sans-serif;box-shadow:0 12px 40px rgba(0,0,0,.35)}" +
      "#bc-consent p{margin:0 0 12px;color:#f4f1ea;font-size:14px}#bc-consent a{color:#f2c46d}" +
      "#bc-consent .bc-row{display:flex;gap:8px;flex-wrap:wrap}" +
      "#bc-consent button{flex:1;min-height:42px;padding:9px 14px;border-radius:999px;font:600 14px Inter,system-ui,sans-serif;cursor:pointer}" +
      "#bc-consent .bc-yes{background:#f2c46d;color:#1f2421;border:none}" +
      "#bc-consent .bc-no{background:transparent;color:#f4f1ea;border:1.5px solid rgba(244,241,234,.4)}" +
      "@media(max-width:600px){#bc-consent{left:12px;right:12px;bottom:12px;max-width:none}}";
    document.head.appendChild(css);
    var el = document.createElement("div");
    el.id = "bc-consent";
    el.setAttribute("role", "dialog");
    el.setAttribute("aria-label", "Süti-beállítások");
    el.innerHTML =
      "<p>Az oldal működéséhez szükséges tárolón túl csak akkor használunk statisztikai sütiket, ha hozzájárul. " +
      '<a href="adatkezeles.html">Adatkezelési tájékoztató</a></p>' +
      '<div class="bc-row"><button type="button" class="bc-no">Csak a szükségesek</button><button type="button" class="bc-yes">Elfogadom</button></div>';
    el.querySelector(".bc-yes").onclick = function () { decide("granted"); };
    el.querySelector(".bc-no").onclick = function () { decide("denied"); };
    document.body.appendChild(el);
  }

  window.BANACRAFT_CONSENT = { open: banner, get: stored };
  document.addEventListener("click", function (e) {
    var a = e.target && e.target.closest ? e.target.closest("[data-consent-settings]") : null;
    if (a) { e.preventDefault(); banner(); }
  });
  function start() { if (!stored()) banner(); }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", start);
  else start();
})();

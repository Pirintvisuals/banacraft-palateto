/* Az oldal saját ajánlatkérő űrlapjai.
   Eddig csak egy köszönő üzenetet mutattak, az adatok sehova nem mentek. Most a
   chatbot API-ja továbbítja őket e-mailben Banacraftnak, ugyanúgy, mint a chat
   "Inkább visszahívást kérek" gombját: "VISSZAHÍVÁS: név, telefon" tárggyal, az
   űrlap minden kitöltött mezőjével. Fájlt (fotót) ez az út nem visz át.

   Használat: BANACRAFT_SEND_FORM(form) -> Promise<{ ok, error, phoneError, files }> */
(function () {
  var NAMES = { name: "Név", phone: "Telefonszám", email: "E-mail", city: "Település", type: "Típus", service: "Szolgáltatás", size: "Méret", message: "Üzenet" };

  function labelOf(el) {
    var l = el.id && el.type !== "radio" ? document.querySelector('label[for="' + el.id + '"]') : null;
    var text = (l && l.textContent) || NAMES[el.name] || el.name || el.placeholder || el.id || "";
    return text.replace(/\*/g, "").replace(/\s+/g, " ").trim();
  }

  function collect(form) {
    var out = { lines: [], name: "", phone: "", files: 0 };
    form.querySelectorAll("input, select, textarea").forEach(function (el) {
      if (el.type === "file") { out.files += el.files ? el.files.length : 0; return; }
      if (/^(submit|button|hidden|reset)$/.test(el.type) || el.classList.contains("f-captcha")) return;
      if ((el.type === "radio" || el.type === "checkbox") && !el.checked) return;
      var v = String(el.value || "").trim();
      if (!v) return;
      if (el.type === "tel" && !out.phone) out.phone = v;
      else if (!out.name && /(^|[-_])(name|nev)$/i.test(el.id || el.name || "")) out.name = v;
      out.lines.push(labelOf(el) + ": " + v);
    });
    return out;
  }

  window.BANACRAFT_SEND_FORM = function (form) {
    var api = (window.BANACRAFT_CONFIG || {}).apiUrl;
    var data = collect(form);
    if (!api) return Promise.resolve({ ok: false, error: "no_api", files: data.files });
    var title = (form.querySelector("h2, h3") || document.querySelector("title") || {}).textContent || "Ajánlatkérés";
    var body = {
      action: "callback",
      contact: { name: data.name, phone: data.phone },
      history: [
        { role: "assistant", content: "Weboldali űrlap (" + location.hostname + "): " + String(title).trim() },
        { role: "user", content: data.lines.join("\n") + (data.files ? "\n(Az ügyfél " + data.files + " fájlt is kiválasztott - ezek nem jöttek át, kérd el e-mailben.)" : "") },
      ],
      state: {},
      pageUrl: location.href,
      sessionId: "form-" + Math.random().toString(36).slice(2, 10),
    };
    return fetch(api, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) })
      .then(function (r) { return r.json(); })
      .then(function (d) {
        if (d && d.callbackDone) return { ok: true, files: data.files };
        if (d && d.formErrors && d.formErrors.phone) return { ok: false, phoneError: d.formErrors.phone, files: data.files };
        return { ok: false, error: "rejected", files: data.files };
      })
      .catch(function () { return { ok: false, error: "network", files: data.files }; });
  };

  // The whole submit: button state, a bad phone number marked on its field, and
  // a visible error with the phone number when sending fails - the customer must
  // never see "thank you" for a request that did not arrive.
  window.BANACRAFT_SUBMIT = function (form, onSuccess) {
    var btn = form.querySelector('[type="submit"]');
    var label = btn ? btn.textContent : "";
    var old = form.querySelector(".bc-form-error");
    if (old) old.remove();
    if (btn) { btn.disabled = true; btn.textContent = "Küldés…"; }
    return window.BANACRAFT_SEND_FORM(form).then(function (res) {
      if (btn) { btn.disabled = false; btn.textContent = label; }
      if (res.ok) { onSuccess(res); return; }
      var phone = form.querySelector('input[type="tel"]');
      if (res.phoneError && phone) {
        phone.setCustomValidity(res.phoneError);
        phone.reportValidity();
        phone.addEventListener("input", function () { phone.setCustomValidity(""); }, { once: true });
        return;
      }
      var e = document.createElement("p");
      e.className = "bc-form-error";
      e.setAttribute("role", "alert");
      e.style.cssText = "margin:12px 0 0;color:#b42318;font-weight:600;font-size:.95rem";
      e.innerHTML = 'Elnézést, az üzenetet most nem sikerült elküldeni. Kérjük, hívjon minket: <a href="tel:+36706252014">+36 70 625 2014</a>';
      if (btn) btn.insertAdjacentElement("afterend", e); else form.appendChild(e);
    });
  };

  // Photos picked in the form cannot travel this way; say so where the thank-you is.
  window.BANACRAFT_PHOTO_NOTE = function (el, files) {
    if (!files || !el) return;
    var p = document.createElement("p");
    p.style.cssText = "margin-top:10px;font-size:.92rem";
    p.innerHTML = 'A kiválasztott fotókat ezen az úton nem tudjuk fogadni - kérjük, küldje el őket az <a href="mailto:info@banacraft.hu">info@banacraft.hu</a> címre.';
    el.appendChild(p);
  };
})();

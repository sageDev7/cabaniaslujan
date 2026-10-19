/* Kit base sageDev — main.js (sirve para el index y las páginas internas: todo está protegido con «if»). */
(function () {
  "use strict";

  /* ---------- WhatsApp: número único; cada botón .js-wa trae su propio data-msg ---------- */
  var WA_NUMBER = "5492664771877";
  function waUrl(msg) { return "https://wa.me/" + WA_NUMBER + "?text=" + encodeURIComponent(msg); }
  document.querySelectorAll(".js-wa").forEach(function (a) {
    a.href = waUrl(a.getAttribute("data-msg") || "Hola, quisiera hacer una consulta.");
    a.target = "_blank"; a.rel = "noopener";
  });
  /* links a páginas que todavía no existen */
  document.querySelectorAll("[data-soon]").forEach(function (a) { a.addEventListener("click", function (e) { e.preventDefault(); }); });

  var body = document.body;
  var reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ---------- header: transparente arriba, sólido al scrollear ---------- */
  var hdr = document.getElementById("hdr");
  if (hdr) {
    var waTop = document.getElementById("waFloat");
    var onScroll = function () {
      var sc = window.scrollY > 40;
      hdr.classList.toggle("sc", sc);
      if (waTop) waTop.classList.toggle("arriba", !sc);  /* flotante oculto antes de scrollear */
    };
    onScroll(); window.addEventListener("scroll", onScroll, { passive: true });
  }

  /* ---------- menú mobile: la hamburguesa se transforma en cruz (un solo botón) ---------- */
  var burger = document.getElementById("burger");
  function setNav(open) {
    body.classList.toggle("nav-open", open);
    if (!burger) return;
    burger.setAttribute("aria-expanded", open ? "true" : "false");
    burger.setAttribute("aria-label", open ? "Cerrar menú" : "Abrir menú");
  }
  if (burger) {
    burger.addEventListener("click", function () { setNav(!body.classList.contains("nav-open")); });
    var ov = document.getElementById("mnavOv"); if (ov) ov.addEventListener("click", function () { setNav(false); });
    document.querySelectorAll(".mnav a").forEach(function (a) { a.addEventListener("click", function () { setNav(false); }); });
  }

  /* ---------- reveals (usar .on, no .in, para otros estados) ---------- */
  var items = document.querySelectorAll(".reveal");
  if (reduce || !("IntersectionObserver" in window)) {
    items.forEach(function (el) { el.classList.add("in"); });
  } else {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) { if (en.isIntersecting) { en.target.classList.add("in"); io.unobserve(en.target); } });
    }, { threshold: 0.12, rootMargin: "0px 0px -40px 0px" });
    items.forEach(function (el) { io.observe(el); });
  }

  /* ---------- flotante de WhatsApp: se oculta en contacto y footer ---------- */
  var fab = document.getElementById("waFloat");
  if (fab && "IntersectionObserver" in window) {
    var hidden = new Set();
    var fio = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) { if (en.isIntersecting) hidden.add(en.target); else hidden.delete(en.target); });
      fab.classList.toggle("hide", hidden.size > 0);
    });
    document.querySelectorAll("#contacto, #ftr").forEach(function (el) { fio.observe(el); });
  }

  /* ---------- formulario: se envía por email (FormSubmit) o por WhatsApp ----------
     Si el proyecto no lleva el botón de WhatsApp, borrar #formWaBtn del HTML: el resto sigue andando.
     El email es obligatorio solo para el envío por email. */
  var form = document.getElementById("contactForm");
  var modal = document.getElementById("okModal");
  if (form) {
    var btn = document.getElementById("formSubmitBtn"), waBtn = document.getElementById("formWaBtn");
    var email = document.getElementById("fEmail"), iframe = document.getElementById("formsubmit-iframe");
    var btnTxt = btn ? btn.textContent : "", sending = false;
    var valid = function (input, porEmail) {
      var v = input.value.trim();
      var ok = input === email ? (v === "" ? !porEmail : /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v)) : v !== "";
      input.closest(".field").classList.toggle("err", !ok);
      return ok;
    };
    var check = function (porEmail) {
      var ok = true;
      form.querySelectorAll("[required]").forEach(function (i) { if (!valid(i, porEmail)) ok = false; });
      if (email && !valid(email, porEmail)) ok = false;
      if (!ok) { var f = form.querySelector(".field.err input,.field.err select,.field.err textarea"); if (f) f.focus(); }
      return ok;
    };
    form.addEventListener("submit", function (e) {
      if (!btn) { e.preventDefault(); if (waBtn) waBtn.click(); return; }   /* formulario solo por WhatsApp */
      if (!check(true)) { e.preventDefault(); return; }
      if (!form.getAttribute("action")) { e.preventDefault(); return; }   /* envío por email todavía sin configurar */
      sending = true; btn.disabled = true; btn.textContent = "Enviando...";
    });
    if (waBtn) waBtn.addEventListener("click", function () {
      if (!check(false)) return;
      var val = function (id) { var el = document.getElementById(id); return el ? el.value.trim() : ""; };
      var txt = "Hola, soy " + val("fNombre") + "." + (val("fArea") ? " Quisiera hacer una consulta sobre " + val("fArea") + "." : "") +
        "\n\n" + val("fMsg") + "\n\nTeléfono: " + val("fTel") + (val("fEmail") ? "\nEmail: " + val("fEmail") : "");
      window.open(waUrl(txt), "_blank", "noopener");
    });
    form.querySelectorAll("input:not([type=hidden]),select,textarea").forEach(function (i) {
      var re = function () { var f = i.closest(".field"); if (f && f.classList.contains("err")) valid(i, false); };
      i.addEventListener("input", re); i.addEventListener("change", re);
    });
    if (iframe) iframe.addEventListener("load", function () {
      if (!sending) return;
      sending = false; form.reset(); btn.disabled = false; btn.textContent = btnTxt;
      if (modal) modal.classList.add("show");
    });
  }
  if (modal) modal.addEventListener("click", function (e) { if (e.target === modal || e.target.hasAttribute("data-close")) modal.classList.remove("show"); });
  document.addEventListener("keydown", function (e) {
    if (e.key !== "Escape") return;
    setNav(false); if (modal) modal.classList.remove("show");
  });

  /* ---------- preguntas frecuentes: una abierta a la vez, con animación de altura ---------- */
  var faqs = document.querySelectorAll(".faq details");
  function toggleFaq(d, abrir) {
    var a = d.querySelector(".faq-a");
    if (!a || d.classList.contains("abierta") === abrir) return;
    d.classList.toggle("abierta", abrir);
    if (reduce) { d.open = abrir; return; }
    if (abrir) d.open = true;
    var desde = abrir ? 0 : a.scrollHeight, hasta = abrir ? a.scrollHeight : 0;
    var anim = a.animate([{ height: desde + "px", opacity: abrir ? 0 : 1 }, { height: hasta + "px", opacity: abrir ? 1 : 0 }],
      { duration: 480, easing: "cubic-bezier(.2,.7,.2,1)" });
    anim.onfinish = function () { if (!d.classList.contains("abierta")) d.open = false; };
  }
  faqs.forEach(function (d) {
    var sum = d.querySelector("summary");
    if (!sum) return;
    sum.addEventListener("click", function (e) {
      e.preventDefault();
      var abrir = !d.classList.contains("abierta");
      if (abrir) faqs.forEach(function (o) { if (o !== d) toggleFaq(o, false); });
      toggleFaq(d, abrir);
    });
  });

  /* ---------- cifras que cuentan desde 0 al entrar en pantalla ---------- */
  var nums = document.querySelectorAll(".js-count");
  if (nums.length && !reduce && "IntersectionObserver" in window) {
    var cio = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (!en.isIntersecting) return;
        var el = en.target, to = +el.getAttribute("data-to"), pre = el.getAttribute("data-pre") || "", t0 = null, dur = 1600;
        cio.unobserve(el);
        var step = function (t) {
          if (!t0) t0 = t;
          var p = Math.min((t - t0) / dur, 1), e = 1 - Math.pow(1 - p, 3);  /* desacelera al final */
          el.textContent = pre + Math.round(to * e);
          if (p < 1) requestAnimationFrame(step);
        };
        requestAnimationFrame(step);
      });
    }, { threshold: 0.6 });
    nums.forEach(function (el) { el.textContent = (el.getAttribute("data-pre") || "") + "0"; cio.observe(el); });
  }

  var yr = document.getElementById("yr"); if (yr) yr.textContent = new Date().getFullYear();

  /* ---------- hero: fundido entre fotos ---------- */
  var slides = document.querySelectorAll(".slide");
  if (slides.length > 1 && !reduce) {
    var si = 0;
    setInterval(function () {
      slides[si].classList.remove("on");
      si = (si + 1) % slides.length;
      slides[si].classList.add("on");
    }, 6000);
  }

  /* ---------- fechas: hoy como mínimo y la salida siempre después de la llegada ---------- */
  var hoy = new Date(); hoy.setMinutes(hoy.getMinutes() - hoy.getTimezoneOffset());
  var hoyStr = hoy.toISOString().slice(0, 10);
  function parFechas(a, b) {
    if (!a || !b) return;
    a.min = hoyStr; b.min = hoyStr;
    a.addEventListener("change", function () { b.min = a.value || hoyStr; if (b.value && b.value <= a.value) b.value = ""; });
  }
  function fmt(v) { if (!v) return ""; var p = v.split("-"); return p[2] + "/" + p[1] + "/" + p[0]; }
  function noches(a, b) { var n = Math.round((new Date(b) - new Date(a)) / 864e5); return n > 0 ? " (" + n + (n === 1 ? " noche)" : " noches)") : ""; }
  function msgReserva(nombre, a, b, pers, extra) {
    return "¡Hola!" + (nombre ? " Soy " + nombre + "." : "") + " Quisiera consultar disponibilidad en Cabañas Luján." +
      "\n\nLlegada: " + fmt(a) + "\nSalida: " + fmt(b) + noches(a, b) + "\nPersonas: " + pers + (extra ? "\n\n" + extra : "");
  }

  /* buscador del hero */
  var dIn = document.getElementById("dIn"), dOut = document.getElementById("dOut"), dispo = document.getElementById("dispo");
  parFechas(dIn, dOut);
  if (dispo) dispo.addEventListener("submit", function (e) {
    e.preventDefault();
    var falta = !dIn.value ? dIn : (!dOut.value ? dOut : null);
    [dIn, dOut].forEach(function (i) { i.closest("label").classList.toggle("err", !i.value); });
    if (falta) { if (falta.showPicker) { try { falta.showPicker(); } catch (x) { falta.focus(); } } else falta.focus(); return; }
    window.open(waUrl(msgReserva("", dIn.value, dOut.value, document.getElementById("dPers").value)), "_blank", "noopener");
  });
  [dIn, dOut].forEach(function (i) { if (i) i.addEventListener("change", function () { i.closest("label").classList.remove("err"); }); });

  /* formulario de reserva (solo WhatsApp) */
  var rf = document.getElementById("reservaForm");
  var rIn = document.getElementById("rIn"), rOut = document.getElementById("rOut");
  parFechas(rIn, rOut);
  if (rf) {
    rf.addEventListener("submit", function (e) {
      e.preventDefault();
      var ok = true;
      rf.querySelectorAll("[required]").forEach(function (i) {
        var bad = !i.value.trim(); i.closest(".field").classList.toggle("err", bad); if (bad) ok = false;
      });
      if (!ok) { rf.querySelector(".field.err input").focus(); return; }
      var v = function (id) { return document.getElementById(id).value.trim(); };
      window.open(waUrl(msgReserva(v("rNombre"), v("rIn"), v("rOut"), v("rPers"), v("rMsg"))), "_blank", "noopener");
    });
    rf.querySelectorAll("input").forEach(function (i) {
      var re = function () { if (i.value.trim()) i.closest(".field").classList.remove("err"); };
      i.addEventListener("input", re); i.addEventListener("change", re);
    });
  }

  /* ---------- galería: lightbox con flechas, teclado y swipe ---------- */
  var lb = document.getElementById("lb"), lbs = Array.prototype.slice.call(document.querySelectorAll(".js-lb"));
  if (lb && lbs.length) {
    var lbImg = document.getElementById("lbImg"), lbCap = document.getElementById("lbCap"), li = 0;
    var show = function (i) {
      li = (i + lbs.length) % lbs.length;
      var b = lbs[li]; lbImg.src = b.getAttribute("data-src"); lbImg.alt = b.querySelector("img").alt;
      lbCap.textContent = b.getAttribute("data-cap") || "";
    };
    var cerrar = function () { lb.classList.remove("show"); body.classList.remove("lb-open"); };
    lbs.forEach(function (b, i) { b.addEventListener("click", function () { show(i); lb.classList.add("show"); body.classList.add("lb-open"); }); });
    lb.querySelector(".lb-x").addEventListener("click", cerrar);
    lb.querySelector(".lb-prev").addEventListener("click", function () { show(li - 1); });
    lb.querySelector(".lb-next").addEventListener("click", function () { show(li + 1); });
    lb.addEventListener("click", function (e) { if (e.target === lb || e.target.tagName === "FIGURE") cerrar(); });
    document.addEventListener("keydown", function (e) {
      if (!lb.classList.contains("show")) return;
      if (e.key === "Escape") cerrar();
      if (e.key === "ArrowLeft") show(li - 1);
      if (e.key === "ArrowRight") show(li + 1);
    });
    var x0 = null;
    lb.addEventListener("touchstart", function (e) { x0 = e.touches[0].clientX; }, { passive: true });
    lb.addEventListener("touchend", function (e) {
      if (x0 === null) return; var dx = e.changedTouches[0].clientX - x0; x0 = null;
      if (Math.abs(dx) > 50) show(li + (dx < 0 ? 1 : -1));
    });
  }
})();

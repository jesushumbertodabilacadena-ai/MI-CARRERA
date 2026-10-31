/* Interactividad de la versión estática: animaciones de aparición, barra de progreso,
   menú móvil y visor de fotos. JavaScript puro, sin dependencias. */
(function () {
  "use strict";

  /* 1. Animaciones de aparición al hacer scroll */
  var reveals = Array.prototype.slice.call(document.querySelectorAll(".reveal"));
  if (reveals.length) {
    var show = function (el) {
      if (el.dataset.revealed) return;
      el.dataset.revealed = "1";
      var t = el.getAttribute("style") || "";
      var delay = (t.match(/cubic-bezier\(\.22,1,\.36,1\)\s*([\d.]+)s/) || [])[1] || "0";
      el.style.opacity = "0";
      el.style.transform = "translateY(26px)";
      el.style.willChange = "opacity, transform";
      setTimeout(function () {
        el.style.opacity = "1";
        el.style.transform = "none";
      }, Math.round(parseFloat(delay) * 1000));
    };
    // Barrido de seguridad: revela todo lo que haya quedado arriba o en pantalla,
    // aunque el usuario salte con la barra de desplazamiento o la tecla Fin.
    var sweep = function () {
      var vh = window.innerHeight || document.documentElement.clientHeight;
      reveals.forEach(function (el) {
        if (!el.dataset.revealed && el.getBoundingClientRect().top < vh * 1.05) show(el);
      });
    };
    if ("IntersectionObserver" in window) {
      reveals.forEach(function (el) {
        var io = new IntersectionObserver(function (entries) {
          entries.forEach(function (en) {
            if (en.isIntersecting) { show(el); io.unobserve(el); }
          });
        }, { threshold: 0.08, rootMargin: "0px 0px -6% 0px" });
        io.observe(el);
      });
    }
    var ticking = false;
    var sweepSoon = function () {
      if (!ticking) {
        ticking = true;
        requestAnimationFrame(function () { sweep(); ticking = false; });
      }
    };
    window.addEventListener("scroll", sweepSoon, { passive: true });
    window.addEventListener("resize", sweepSoon);
    window.addEventListener("load", sweep);
    document.addEventListener("visibilitychange", sweep);
    sweep();
  }

  /* 2. Barra de progreso de lectura */
  var bar = document.querySelector(".progress-gold");
  function onScroll() {
    if (!bar) return;
    var h = document.documentElement;
    var max = h.scrollHeight - h.clientHeight;
    var pct = max > 0 ? (h.scrollTop / max) * 100 : 0;
    bar.style.width = pct + "%";
  }
  window.addEventListener("scroll", onScroll, { passive: true });
  onScroll();

  /* 3. Menú móvil */
  var btn = document.querySelector('button[aria-label="Abrir menú"]');
  var nav = document.querySelector('nav[aria-label="Secciones"]');
  if (btn && nav) {
    var panel = document.createElement("div");
    panel.id = "menu-panel";
    Array.prototype.forEach.call(nav.querySelectorAll("a"), function (a) {
      var c = a.cloneNode(true);
      c.className = "";
      panel.appendChild(c);
    });
    document.body.appendChild(panel);
    var close = function () { panel.classList.remove("open"); btn.setAttribute("aria-expanded", "false"); };
    btn.addEventListener("click", function (e) {
      e.stopPropagation();
      var open = panel.classList.toggle("open");
      btn.setAttribute("aria-expanded", open ? "true" : "false");
    });
    panel.addEventListener("click", function (e) { if (e.target.tagName === "A") close(); });
    document.addEventListener("click", function (e) {
      if (panel.classList.contains("open") && !panel.contains(e.target) && e.target !== btn) close();
    });
    document.addEventListener("keydown", function (e) { if (e.key === "Escape") close(); });
  }

  /* 4. Visor de fotos y videos (lightbox) */
  var photoBtns = Array.prototype.slice.call(document.querySelectorAll('button[aria-label^="Abrir"]'));
  if (photoBtns.length || document.querySelector("[data-lb-img], [data-lb-video]")) {
    var ov = document.createElement("div");
    ov.className = "lb-overlay";
    ov.innerHTML = '<button class="lb-close" aria-label="Cerrar visor">&times;</button>' +
                   '<img alt=""/>' +
                   '<video controls playsinline preload="metadata" class="lb-video"></video>' +
                   '<p class="lb-caption"></p>';
    document.body.appendChild(ov);
    var ovImg = ov.querySelector("img");
    var ovVid = ov.querySelector("video");
    var ovCap = ov.querySelector(".lb-caption");
    var stopVid = function () {
      try { ovVid.pause(); } catch (err) {}
      ovVid.removeAttribute("src");
      try { ovVid.load(); } catch (err2) {}
    };
    var openLb = function (src, cap) {
      stopVid(); ov.classList.remove("lb-vid");
      ovImg.style.display = "";
      ovImg.src = src; ovImg.alt = cap; ovCap.textContent = cap;
      ov.classList.add("lb-open");
      document.body.style.overflow = "hidden";
    };
    var openLbVideo = function (src, cap) {
      ovImg.src = ""; ovImg.style.display = "none";
      ovVid.src = src; ovCap.textContent = cap;
      ov.classList.add("lb-open", "lb-vid");
      document.body.style.overflow = "hidden";
      var p = ovVid.play();
      if (p && p.catch) p.catch(function () {});
    };
    var closeLb = function () {
      ov.classList.remove("lb-open");
      document.body.style.overflow = "";
      stopVid();
      setTimeout(function () { if (!ov.classList.contains("lb-open")) { ovImg.src = ""; ovImg.style.display = ""; } }, 260);
    };
    photoBtns.forEach(function (b) {
      b.addEventListener("click", function (e) {
        e.preventDefault();
        var img = b.querySelector("img");
        if (!img) return;
        var cap = (b.getAttribute("aria-label") || "").replace(/^Abrir foto:\s*/i, "").replace(/^Abrir:\s*/i, "");
        if (!cap) { var sp = b.querySelector("span"); cap = sp ? sp.textContent : (img.alt || ""); }
        openLb(img.currentSrc || img.src, cap);
      });
    });
    // Tarjetas de publicaciones clicables (foto o video de la mención)
    Array.prototype.forEach.call(document.querySelectorAll("[data-lb-img]"), function (card) {
      var act = function () { openLb(card.getAttribute("data-lb-img"), card.getAttribute("data-lb-cap") || ""); };
      card.addEventListener("click", act);
      card.addEventListener("keydown", function (e) {
        if (e.key === "Enter" || e.key === " ") { e.preventDefault(); act(); }
      });
    });
    Array.prototype.forEach.call(document.querySelectorAll("[data-lb-video]"), function (card) {
      var act = function () { openLbVideo(card.getAttribute("data-lb-video"), card.getAttribute("data-lb-cap") || ""); };
      card.addEventListener("click", act);
      card.addEventListener("keydown", function (e) {
        if (e.key === "Enter" || e.key === " ") { e.preventDefault(); act(); }
      });
    });
    ov.addEventListener("click", function (e) {
      // Cierra con el botón ×, con clic en el fondo o en la foto.
      // NUNCA al tocar el video: ahí el usuario usa los controles nativos.
      if (e.target.closest(".lb-close") || e.target === ov || e.target === ovImg) closeLb();
    });
    document.addEventListener("keydown", function (e) { if (e.key === "Escape") closeLb(); });
  }

  /* 5. Botón de reproducir visible + indicador de carga en cada video
     (se excluye el reproductor del visor/lighbox, que ya tiene controles propios) */
  Array.prototype.forEach.call(document.querySelectorAll("video"), function (v) {
    if (v.classList.contains("lb-video")) return;
    var wrap = v.parentElement;
    if (!wrap) return;
    var ov = document.createElement("button");
    ov.type = "button";
    ov.className = "vid-play";
    ov.setAttribute("aria-label", "Reproducir video");
    ov.innerHTML = '<span class="vid-play-circle">' +
      '<svg viewBox="0 0 24 24" aria-hidden="true"><polygon points="6 3 20 12 6 21 6 3"/></svg></span>';
    var buf = document.createElement("span");
    buf.className = "vid-buffer";
    buf.innerHTML = '<span class="vid-spinner"></span>';
    wrap.appendChild(buf);
    wrap.appendChild(ov);
    var showPlay = function () { ov.style.display = "flex"; buf.classList.remove("on"); };
    var wantPlay = false;
    var doPlay = function () {
      wantPlay = true;
      ov.style.display = "none";
      buf.classList.add("on");
      var p = v.play();
      if (p && p.catch) p.catch(function () {
        // Reintenta cuando el navegador tenga datos suficientes (carga lenta,
        // servidores sin soporte de descarga por rangos, etc.)
        var retry = function () {
          v.removeEventListener("canplay", retry);
          if (!wantPlay) return;
          var p2 = v.play();
          if (p2 && p2.catch) p2.catch(function () { showPlay(); });
        };
        v.addEventListener("canplay", retry);
      });
    };
    ov.addEventListener("click", function (e) {
      e.preventDefault();
      e.stopPropagation();
      doPlay();
    });
    v.addEventListener("seeking", function () { if (wantPlay) buf.classList.add("on"); });
    v.addEventListener("playing", function () { buf.classList.remove("on"); });
    v.addEventListener("waiting", function () { buf.classList.add("on"); });
    v.addEventListener("ended", showPlay);
    v.addEventListener("error", showPlay);
  });
})();

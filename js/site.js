/* Avodah Employment — interactions
   1. Loader (homepage only): knot rope ties itself, then the page reveals.
   2. Reveal-on-scroll for sections (staggered fade-up via --d, applied in JS
      so hover transitions stay instant).
   3. Decision Moments (homepage only): scroll-driven vertical ticker.
   Interior pages reuse 2 and reveal their hero on DOMContentLoaded.
*/

(function () {
  "use strict";

  /* Dev flag: ?flat=1 disables scroll choreography for full-page captures */
  if (new URLSearchParams(location.search).has("flat")) {
    document.documentElement.classList.add("flat");
  }

  /* ---------- reveals ---------- */

  function staggeredReveal(el) {
    var d = parseFloat(el.style.getPropertyValue("--d")) || 0;
    setTimeout(function () {
      el.classList.add("is-in");
    }, d * 1000);
  }

  function revealHero() {
    document.querySelectorAll(".reveal-load").forEach(staggeredReveal);
  }

  var io = new IntersectionObserver(
    function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          staggeredReveal(entry.target);
          io.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.15, rootMargin: "0px 0px -40px 0px" }
  );
  document.querySelectorAll(".reveal").forEach(function (el) {
    io.observe(el);
  });

  /* ---------- loader (homepage only) ---------- */

  var loader = document.getElementById("loader");
  var ropeFill = document.getElementById("ropeFill");

  if (loader && ropeFill) {
    var progress = 0;
    var loaderStart = Date.now();
    var MIN_LOADER_TIME = 3000; // let the rope tie itself — don't rush it

    var finishLoading = function () {
      ropeFill.style.width = "100%";
      setTimeout(function () {
        loader.classList.add("is-done");
        document.body.classList.remove("is-loading");
        revealHero();
      }, 600);
    };

    var trickle = setInterval(function () {
      progress = Math.min(progress + Math.random() * 6, 90);
      ropeFill.style.width = progress + "%";
    }, 200);

    window.addEventListener("load", function () {
      var remaining = Math.max(MIN_LOADER_TIME - (Date.now() - loaderStart), 0);
      setTimeout(function () {
        clearInterval(trickle);
        finishLoading();
      }, remaining + 350);
    });

    // Safety: never trap the user on the loader
    setTimeout(function () {
      if (!loader.classList.contains("is-done")) {
        clearInterval(trickle);
        finishLoading();
      }
    }, 7000);
  } else {
    // Interior pages: reveal the hero as soon as the DOM is ready.
    if (document.readyState !== "loading") revealHero();
    else document.addEventListener("DOMContentLoaded", revealHero);
  }

  /* ---------- overlay menu (tablet / mobile) ---------- */

  var menuBtn = document.querySelector(".menu-btn");
  var navLinks = document.querySelectorAll(".primary-nav a");

  if (menuBtn && navLinks.length) {
    var overlay = document.createElement("div");
    overlay.className = "menu-overlay";
    overlay.setAttribute("aria-hidden", "true");

    var top = document.createElement("div");
    top.className = "menu-overlay__top";
    top.innerHTML =
      '<img src="assets/wordmark-ivory.svg" alt="Avodah" />' +
      '<button class="menu-overlay__close" aria-label="Close menu">✕</button>';
    overlay.appendChild(top);

    var linksWrap = document.createElement("nav");
    linksWrap.className = "menu-overlay__links";
    navLinks.forEach(function (a, i) {
      var link = document.createElement("a");
      link.href = a.getAttribute("href");
      link.textContent = a.textContent;
      link.style.transitionDelay = 0.06 + i * 0.05 + "s";
      linksWrap.appendChild(link);
    });
    var contact = document.createElement("a");
    contact.href = "contact.html";
    contact.textContent = "Start an Intake";
    contact.style.transitionDelay = 0.06 + navLinks.length * 0.05 + "s";
    linksWrap.appendChild(contact);
    overlay.appendChild(linksWrap);

    var meta = document.createElement("div");
    meta.className = "menu-overlay__meta";
    meta.textContent = "Est. 2026 · Richmond + Norfolk";
    overlay.appendChild(meta);

    document.body.appendChild(overlay);

    var openMenu = function () {
      document.body.classList.add("menu-open");
      overlay.setAttribute("aria-hidden", "false");
    };
    var closeMenu = function () {
      document.body.classList.remove("menu-open");
      overlay.setAttribute("aria-hidden", "true");
    };
    menuBtn.addEventListener("click", openMenu);
    overlay.querySelector(".menu-overlay__close").addEventListener("click", closeMenu);
    linksWrap.querySelectorAll("a").forEach(function (a) {
      a.addEventListener("click", closeMenu);
    });
    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape") closeMenu();
    });
  }

  /* ---------- desktop / mobile preview toggle (client review aid) ---------- */

  if (!document.documentElement.hasAttribute("data-viewer") && window.self === window.top) {
    var pageName = location.pathname.split("/").pop() || "index.html";
    var toggle = document.createElement("div");
    toggle.className = "device-toggle";
    toggle.innerHTML =
      '<span class="is-active">Desktop</span>' +
      '<a href="viewer.html#' + pageName + '">Mobile</a>';
    document.body.appendChild(toggle);
  }

  /* ---------- decision moments scroll ticker (homepage only) ---------- */

  var section = document.getElementById("decisions");
  var items = Array.prototype.slice.call(
    document.querySelectorAll("#decisionStack li")
  );

  if (section && items.length) {
    var activeIndex = -1;

    var setActive = function (i) {
      if (i === activeIndex) return;
      activeIndex = i;
      items.forEach(function (li, j) {
        li.classList.remove("is-active", "is-near", "is-mid");
        var d = Math.abs(j - i);
        if (d === 0) li.classList.add("is-active");
        else if (d === 1) li.classList.add("is-near");
        else if (d === 2) li.classList.add("is-mid");
      });
    };

    var onScroll = function () {
      var rect = section.getBoundingClientRect();
      var total = rect.height - window.innerHeight;
      if (total <= 0) return;
      var p = Math.min(Math.max(-rect.top / total, 0), 1);
      var i = Math.min(Math.floor(p * items.length), items.length - 1);
      setActive(i);
    };

    var ticking = false;
    window.addEventListener("scroll", function () {
      if (!ticking) {
        window.requestAnimationFrame(function () {
          onScroll();
          ticking = false;
        });
        ticking = true;
      }
    });

    setActive(0);
    onScroll();
  }
})();

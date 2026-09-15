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

  var pageName = location.pathname.split("/").pop() || "index.html";


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
    var MIN_LOADER_TIME = 250;

    var finishLoading = function () {
      ropeFill.style.width = "100%";
      setTimeout(function () {
        loader.classList.add("is-done");
        document.body.classList.remove("is-loading");
        revealHero();
      }, 180);
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
      }, remaining);
    });

    // Safety: never trap the user on the loader
    setTimeout(function () {
      if (!loader.classList.contains("is-done")) {
        clearInterval(trickle);
        finishLoading();
      }
    }, 1500);
  } else {
    // Interior pages: reveal the hero as soon as the DOM is ready.
    if (document.readyState !== "loading") revealHero();
    else document.addEventListener("DOMContentLoaded", revealHero);
  }

  /* ---------- shared interior-page conversion panel ---------- */

  var conversionExcluded = ["index.html", "contact.html", "privacy.html", "disclaimer.html", "viewer.html"];
  var conversionMain = document.querySelector("main");
  if (conversionMain && conversionExcluded.indexOf(pageName) === -1 && !document.querySelector("form[data-preview-form]")) {
    var oldCloser = conversionMain.lastElementChild;
    if (oldCloser && oldCloser.matches(".cta-band, .closer-row, .closer-center")) {
      oldCloser.remove();
    }

    var conversionPanel = document.createElement("section");
    conversionPanel.className = "conversion-panel conversion-panel--employment";
    conversionPanel.setAttribute("aria-labelledby", "conversion-panel-title");
    conversionPanel.innerHTML = [
      '<div class="conversion-panel__intro">',
      '<span class="eyebrow eyebrow--ivory-dim">A simple first step</span>',
      '<h2 id="conversion-panel-title">Tell us how we can help.</h2>',
      '<p>Share only the basic names, topic and deadline. Avodah will use those details to determine whether it can speak with you and what should happen next. Detailed facts and documents can wait.</p>',
      '</div>',
      '<form class="conversion-panel__form" data-preview-form>',
      '<p class="preview-form-notice" tabindex="-1">Preview only. This form does not transmit or store information.</p>',
      '<label>Full name<input type="text" autocomplete="name" /></label>',
      '<label>Phone number or email<input type="text" autocomplete="email" /></label>',
      '<label>Other parties or organizations involved<input type="text" /></label>',
      '<div class="conversion-panel__row"><label>General matter type<select><option value="">Choose one</option><option>Agreement or transition</option><option>Investigation</option><option>Workplace claim or dispute</option><option>Federal or state manager matter</option><option>Physician or licensing matter</option><option>Other employment matter</option></select></label><label>Important deadline<input type="text" inputmode="numeric" placeholder="MM / DD / YYYY" /></label></div>',
      '<label class="conversion-panel__consent"><input type="checkbox" /><span>Submitting this form does not create an attorney-client relationship. Do not send confidential information until Avodah confirms it can speak with you.</span></label>',
      '<button class="btn btn--aubergine" type="submit"><span class="btn__label">Submit Inquiry</span><span class="btn__chip" aria-hidden="true">&#8594;</span></button>',
      '</form>'
    ].join("");
    conversionMain.insertAdjacentElement("afterend", conversionPanel);
  }

  /* ---------- preview-only forms ---------- */

  document.querySelectorAll("form[data-preview-form]").forEach(function (form) {
    form.addEventListener("submit", function (event) {
      event.preventDefault();
      var notice = form.querySelector(".preview-form-notice");
      if (notice) {
        notice.textContent = "Preview only. No information was sent.";
        notice.setAttribute("role", "status");
        notice.focus();
      }
    });
  });

  /* ---------- contact actions and future approved phone ---------- */

  // Leave these empty until Rose confirms the number, destination and routing.
  // When approved, use a full display number and a digits-only tel value.
  var approvedPhoneDisplay = "";
  var approvedPhoneHref = "";
  var headerContact = document.querySelector(".site-header__cta");
  if (headerContact) {
    if (headerContact.tagName === "A") headerContact.setAttribute("href", "contact.html");
    headerContact.removeAttribute("aria-disabled");
    headerContact.removeAttribute("title");
    headerContact.classList.remove("js-preview-call");
    var headerLabel = headerContact.querySelector(".btn__label");
    if (headerLabel) headerLabel.textContent = "Contact Us";
  }

  if (document.querySelector(".article-page") && !document.querySelector(".primary-nav")) {
    var compactHeader = document.querySelector(".site-header");
    var compactContact = document.querySelector(".site-header__cta");
    if (compactHeader && compactContact) {
      var compactNav = document.createElement("nav");
      compactNav.className = "primary-nav";
      compactNav.setAttribute("aria-label", "Primary");
      compactNav.innerHTML = '<a href="employers.html">Employers</a><a href="executives.html">Executives</a><a href="physicians.html">Physicians</a><a href="government-employees.html">Federal and State Employees</a><a href="investigations.html">Investigations</a><a href="insights.html">Insights</a>';
      compactHeader.insertBefore(compactNav, compactContact);
    }
  }

  if (document.querySelector(".article-page") && document.querySelector(".primary-nav") && !document.querySelector(".menu-btn")) {
    var articleMenu = document.createElement("button");
    articleMenu.className = "menu-btn";
    articleMenu.setAttribute("aria-label", "Open menu");
    articleMenu.textContent = "Menu";
    document.querySelector(".site-header").appendChild(articleMenu);
  }

  var siteHeader = document.querySelector(".site-header");
  var menuControl = document.querySelector(".menu-btn");
  if (siteHeader && headerContact && !siteHeader.querySelector(".header-actions")) {
    var headerActions = document.createElement("div");
    headerActions.className = "header-actions";
    siteHeader.insertBefore(headerActions, headerContact);
    if (approvedPhoneDisplay && approvedPhoneHref) {
      var headerPhone = document.createElement("a");
      headerPhone.className = "header-phone";
      headerPhone.href = "tel:" + approvedPhoneHref;
      headerPhone.textContent = approvedPhoneDisplay;
      headerPhone.setAttribute("aria-label", "Call Avodah Employment at " + approvedPhoneDisplay);
      headerActions.appendChild(headerPhone);
    }
    headerActions.appendChild(headerContact);
    if (menuControl) headerActions.appendChild(menuControl);
  }

  if (approvedPhoneDisplay && approvedPhoneHref) {
    var phoneUtility = document.createElement("div");
    phoneUtility.className = "header-phone-utility";
    phoneUtility.innerHTML = '<a href="tel:' + approvedPhoneHref + '" aria-label="Call Avodah Employment at ' + approvedPhoneDisplay + '">' + approvedPhoneDisplay + '</a>';
    siteHeader.insertAdjacentElement("afterend", phoneUtility);
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
    contact.textContent = "Contact Us";
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

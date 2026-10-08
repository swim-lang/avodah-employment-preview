/* Avodah Employment — interactions
   1. Loader (homepage only): knot rope ties itself, then the page reveals.
   2. Reveal-on-scroll for sections (staggered fade-up via --d, applied in JS
      so hover transitions stay instant).
   3. Decision Moments (homepage only): scroll-driven vertical ticker.
   Interior pages reuse 2 and reveal their hero on DOMContentLoaded.
*/

(function () {
  "use strict";

  var GA_MEASUREMENT_ID = "G-YDHFMVWHHJ";
  var SITE_NAME = "Avodah Employment";

  function trackEvent(name, parameters) {
    if (typeof window.gtag !== "function") return;
    var eventParameters = {
      site_name: SITE_NAME,
      page_path: location.pathname,
    };
    Object.keys(parameters || {}).forEach(function (key) {
      eventParameters[key] = parameters[key];
    });
    window.gtag("event", name, eventParameters);
  }

  if (location.hostname === "avodahemployment.com" || location.hostname === "www.avodahemployment.com") {
    window.dataLayer = window.dataLayer || [];
    window.gtag = function () { window.dataLayer.push(arguments); };
    window.gtag("js", new Date());
    window.gtag("config", GA_MEASUREMENT_ID, { anonymize_ip: true });
    var analyticsScript = document.createElement("script");
    analyticsScript.async = true;
    analyticsScript.src = "https://www.googletagmanager.com/gtag/js?id=" + GA_MEASUREMENT_ID;
    document.head.appendChild(analyticsScript);
  }

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
    document.querySelectorAll(".reveal-load").forEach(function (el) {
      el.classList.add("is-in");
    });
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
    var MIN_LOADER_TIME = 120;
    var loadingFinished = false;

    var finishLoading = function () {
      if (loadingFinished) return;
      loadingFinished = true;
      ropeFill.style.width = "100%";
      setTimeout(function () {
        loader.classList.add("is-done");
        document.body.classList.remove("is-loading");
        revealHero();
      }, 100);
    };

    var trickle = setInterval(function () {
      progress = Math.min(progress + Math.random() * 6, 90);
      ropeFill.style.width = progress + "%";
    }, 200);

    var queueFinish = function () {
      var remaining = Math.max(MIN_LOADER_TIME - (Date.now() - loaderStart), 0);
      setTimeout(function () {
        clearInterval(trickle);
        finishLoading();
      }, remaining);
    };

    if (document.readyState !== "loading") queueFinish();
    else document.addEventListener("DOMContentLoaded", queueFinish, { once: true });

    // Safety: never trap the user on the loader
    setTimeout(function () {
      if (!loader.classList.contains("is-done")) {
        clearInterval(trickle);
        finishLoading();
      }
    }, 600);
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
      '<form class="conversion-panel__form" data-preview-form data-intake-form>',
      '<p class="preview-form-notice" tabindex="-1">Checking secure inquiry routing...</p>',
      '<div class="form-trap" aria-hidden="true"><label>Website<input type="text" name="website" tabindex="-1" autocomplete="off" /></label></div>',
      '<input type="hidden" name="role" value="Website visitor" />',
      '<label>Full name<input type="text" name="name" autocomplete="name" maxlength="120" required /></label>',
      '<label>Phone number or email<input type="text" name="contact" maxlength="180" required /></label>',
      '<label>Other parties or organizations involved<input type="text" name="otherParties" maxlength="500" /></label>',
      '<div class="conversion-panel__row"><label>General matter type<select name="matterType" required><option value="">Choose one</option><option>Agreement or transition</option><option>Investigation</option><option>Workplace claim or dispute</option><option>Federal or state manager matter</option><option>Physician or licensing matter</option><option>Other employment matter</option></select></label><label>Important deadline<input type="text" name="deadline" maxlength="80" inputmode="numeric" placeholder="MM / DD / YYYY" /></label></div>',
      '<label class="conversion-panel__consent"><input type="checkbox" name="consent" required /><span>Submitting this form does not create an attorney-client relationship. Do not send confidential information until Avodah confirms it can speak with you.</span></label>',
      '<button class="btn btn--aubergine" type="submit"><span class="btn__label">Submit Inquiry</span><span class="btn__chip" aria-hidden="true">&#8594;</span></button>',
      '</form>'
    ].join("");
    conversionMain.insertAdjacentElement("afterend", conversionPanel);
  }

  /* ---------- inquiry forms ---------- */

  var intakeForms = document.querySelectorAll("form[data-intake-form]");
  var intakeEndpoint = "/api/intake";
  var intakeEnabled = false;
  var staticPreviewHost =
    location.hostname === "swim-lang.github.io" ||
    location.hostname === "localhost" ||
    location.hostname === "127.0.0.1" ||
    location.protocol === "file:";

  function setFormNotice(form, message, isError) {
    var notice = form.querySelector(".preview-form-notice");
    if (!notice) return;
    notice.textContent = message;
    notice.setAttribute("role", isError ? "alert" : "status");
    notice.classList.toggle("is-error", Boolean(isError));
    notice.focus();
  }

  function formPayload(form) {
    var data = new FormData(form);
    var payload = {};
    data.forEach(function (value, key) {
      payload[key] = value;
    });
    payload.consent = data.has("consent");
    payload.page = location.pathname;
    return payload;
  }

  function formLocation(form) {
    if (pageName === "index.html" || form.closest("#inquiry")) return "homepage";
    if (pageName === "contact.html") return "contact_page";
    return "service_page";
  }

  function enableIntakeForms() {
    intakeEnabled = true;
    intakeForms.forEach(function (form) {
      var notice = form.querySelector(".preview-form-notice");
      if (notice) notice.textContent = "Your information will be sent to Avodah's intake team. Please do not include confidential documents or a detailed narrative.";
    });
  }

  if (intakeForms.length && !staticPreviewHost) {
    fetch(intakeEndpoint, { method: "GET", headers: { Accept: "application/json" } })
      .then(function (response) {
        return response.ok ? response.json() : { enabled: false };
      })
      .then(function (result) {
        if (result.enabled === true) enableIntakeForms();
      })
      .catch(function () {
        intakeEnabled = false;
      });
  }

  intakeForms.forEach(function (form) {
    var formStarted = false;
    var recordFormStart = function (event) {
      if (formStarted || (event.target && event.target.name === "website")) return;
      formStarted = true;
      trackEvent("form_start", {
        form_name: "employment_inquiry",
        form_location: formLocation(form),
      });
    };
    form.addEventListener("input", recordFormStart, { passive: true });
    form.addEventListener("change", recordFormStart, { passive: true });

    form.addEventListener("submit", function (event) {
      event.preventDefault();

      if (!intakeEnabled) {
        setFormNotice(
          form,
          staticPreviewHost
            ? "Preview only. No information was sent."
            : "Online inquiries are temporarily unavailable. Please call Avodah Employment at 804-492-7303.",
          !staticPreviewHost
        );
        return;
      }

      var payload = formPayload(form);
      if (!payload.phone && !payload.email && !payload.contact) {
        setFormNotice(form, "Please enter a phone number or email address.", true);
        return;
      }

      var submit = form.querySelector('button[type="submit"]');
      if (submit) submit.disabled = true;
      setFormNotice(form, "Sending your inquiry...", false);

      fetch(intakeEndpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify(payload),
      })
        .then(function (response) {
          return response.json().catch(function () {
            return { ok: false, message: "Your inquiry could not be sent. Please contact Avodah directly." };
          }).then(function (result) {
            if (!response.ok || result.ok !== true) throw new Error(result.message || "Your inquiry could not be sent. Please contact Avodah directly.");
            return result;
          });
        })
        .then(function () {
          form.reset();
          trackEvent("generate_lead", {
            lead_type: "employment_inquiry",
            form_name: "employment_inquiry",
            form_location: formLocation(form),
          });
          setFormNotice(form, "Thank you. Your inquiry was sent to Avodah's intake team.", false);
        })
        .catch(function (error) {
          setFormNotice(form, error.message || "Your inquiry could not be sent. Please contact Avodah directly.", true);
        })
        .finally(function () {
          if (submit) submit.disabled = false;
        });
    });
  });

  /* ---------- contact actions and future approved phone ---------- */

  // Approved Employment CallRail number. The routing destination is intentionally
  // kept out of the public site and remains an internal launch record.
  var approvedPhoneDisplay = "804-492-7303";
  var approvedPhoneHref = "+18044927303";
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
      compactNav.innerHTML = '<a href="employers.html">Employers</a><a href="executives.html">Executives</a><a href="physicians.html">Physicians</a><a href="government-employees.html">Federal and State Employees</a><a href="investigations.html">Investigations</a>';
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

  document.querySelectorAll('a[href^="tel:"]').forEach(function (link) {
    if (!link.dataset.analyticsBound) {
      link.dataset.analyticsBound = "true";
      link.addEventListener("click", function () { trackEvent("click_to_call", { site_section: pageName }); });
    }
  });

  document.querySelectorAll('a[href="contact.html"], a[href="#inquiry"]').forEach(function (link) {
    link.addEventListener("click", function () {
      trackEvent("contact_click", {
        link_text: (link.textContent || "Contact").trim().slice(0, 80),
      });
    });
  });

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

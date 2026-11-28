(() => {
  "use strict";

  // wa.me needs the full international number with country code and no "+".
  const WA_NUMBER = "919773903288";
  const WA_BASE = `https://wa.me/${WA_NUMBER}`;

  const $ = (sel, root = document) => root.querySelector(sel);
  const $$ = (sel, root = document) => [...root.querySelectorAll(sel)];

  function buildWhatsAppUrl(message) {
    return `${WA_BASE}?text=${encodeURIComponent(message)}`;
  }

  function openWhatsApp(message) {
    window.open(buildWhatsAppUrl(message), "_blank", "noopener,noreferrer");
  }

  /* ------------------------------------------------------------------ */
  /* Mobile nav                                                         */
  /* ------------------------------------------------------------------ */
  const toggle = $(".nav-toggle");
  const nav = $("#site-nav");

  function closeNav() {
    if (!toggle || !nav) return;
    toggle.setAttribute("aria-expanded", "false");
    toggle.setAttribute("aria-label", "Open menu");
    nav.classList.remove("is-open");
  }

  if (toggle && nav) {
    toggle.addEventListener("click", () => {
      const open = toggle.getAttribute("aria-expanded") === "true";
      toggle.setAttribute("aria-expanded", String(!open));
      toggle.setAttribute("aria-label", open ? "Open menu" : "Close menu");
      nav.classList.toggle("is-open", !open);
    });

    $$("a", nav).forEach((link) => {
      link.addEventListener("click", closeNav);
    });

    document.addEventListener("keydown", (event) => {
      if (event.key === "Escape") closeNav();
    });

    window.addEventListener("resize", () => {
      if (window.innerWidth > 860) closeNav();
    });
  }

  const header = $(".site-header");
  const onScroll = () => {
    if (header) header.classList.toggle("is-scrolled", window.scrollY > 8);
  };
  onScroll();
  window.addEventListener("scroll", onScroll, { passive: true });

  /* ------------------------------------------------------------------ */
  /* Smooth section scroll for in-page anchors                          */
  /* ------------------------------------------------------------------ */
  $$('a[href^="#"]').forEach((anchor) => {
    anchor.addEventListener("click", (event) => {
      const href = anchor.getAttribute("href");
      if (!href || href === "#" || anchor.hasAttribute("data-whatsapp-quick")) return;
      const target = document.querySelector(href);
      if (!target) return;
      event.preventDefault();
      const header = $(".site-header");
      const offset = (header ? header.offsetHeight : 0) + 8;
      const top = target.getBoundingClientRect().top + window.scrollY - offset;
      window.scrollTo({ top, behavior: "smooth" });
      history.pushState(null, "", href);
    });
  });

  /* ------------------------------------------------------------------ */
  /* WhatsApp quick CTAs                                                */
  /* ------------------------------------------------------------------ */
  const quickMessages = {
    hello:
      "Hello Delfast Logistics — I would like to enquire about moving retail displays / fixtures.",
    quote:
      "Hello Delfast Logistics — I would like to request a quote for display / fixture transport.",
    faq:
      "Hello Delfast Logistics — I have a question about your display & fixture logistics services.",
  };

  $$("[data-whatsapp-quick]").forEach((el) => {
    el.addEventListener("click", (event) => {
      event.preventDefault();
      const key = el.getAttribute("data-whatsapp-quick") || "hello";
      openWhatsApp(quickMessages[key] || quickMessages.hello);
    });
  });

  /* ------------------------------------------------------------------ */
  /* Quote form → WhatsApp                                              */
  /* ------------------------------------------------------------------ */
  // Indian mobile: 10 digits starting with 6-9, with an optional +91 / 91 / 0
  // country or trunk prefix. Separators are stripped before testing.
  const INDIAN_MOBILE = /^(?:\+?91|0)?[6-9]\d{9}$/;
  const EMAIL = /^[^\s@]+@[^\s@]+\.[A-Za-z]{2,}$/;

  const stripSeparators = (value) => value.replace(/[\s\-().]/g, "");

  // Last 10 digits is the local number. Slicing is safer than stripping a "91"
  // prefix by regex, which would corrupt valid numbers that start with 91
  // (e.g. 9123456789).
  const localMobile = (value) => stripSeparators(value).replace(/\D/g, "").slice(-10);

  const validators = {
    name(value) {
      if (!value) return "Please enter your name.";
      if (value.length < 2) return "Please enter your full name.";
      return "";
    },
    mobile(value) {
      if (!value) return "Please enter your mobile number.";
      const compact = stripSeparators(value);
      if (/[^\d+]/.test(compact)) return "Digits only, for example 98765 43210.";
      if (!INDIAN_MOBILE.test(compact)) {
        return "Enter a valid 10-digit Indian mobile number starting with 6, 7, 8 or 9.";
      }
      return "";
    },
    // Optional, but must look like an address if the user fills it in.
    email(value) {
      if (!value) return "";
      if (!EMAIL.test(value)) return "Enter a valid email address, for example name@company.com.";
      return "";
    },
    // Pickup city, drop city and cargo are optional and intentionally have no
    // validator, so they are skipped by the `fields` filter below.
  };

  const form = $("#quote-form");
  if (form) {
    const fields = $$("input[name], textarea[name]", form).filter((el) => validators[el.name]);

    const wrapperOf = (input) => input.closest(".field");

    function setError(input, message) {
      const wrapper = wrapperOf(input);
      if (wrapper) {
        wrapper.classList.toggle("has-error", Boolean(message));
        const slot = wrapper.querySelector(".field__error");
        if (slot) slot.textContent = message;
      }
      input.setAttribute("aria-invalid", message ? "true" : "false");
    }

    function validateField(input) {
      const message = validators[input.name](input.value.trim());
      setError(input, message);
      return message;
    }

    fields.forEach((input) => {
      // Only re-check while typing if the field is already flagged, so the form
      // does not nag before the first submit attempt.
      input.addEventListener("input", () => {
        const wrapper = wrapperOf(input);
        if (wrapper && wrapper.classList.contains("has-error")) validateField(input);
      });

      input.addEventListener("blur", () => {
        const wrapper = wrapperOf(input);
        const flagged = wrapper && wrapper.classList.contains("has-error");
        if (input.value.trim() || flagged) validateField(input);
      });
    });

    form.addEventListener("submit", (event) => {
      event.preventDefault();

      let firstInvalid = null;
      fields.forEach((input) => {
        if (validateField(input) && !firstInvalid) firstInvalid = input;
      });

      if (firstInvalid) {
        firstInvalid.focus();
        return;
      }

      const data = new FormData(form);
      const value = (key) => String(data.get(key) || "").trim();
      const local = localMobile(value("mobile"));

      // Only name and mobile are guaranteed present, so the optional fields
      // fall back to a dash rather than sending blank lines.
      const message = [
        "Quote request — Delfast Logistics",
        "",
        `Name: ${value("name")}`,
        `Mobile: +91 ${local.slice(0, 5)} ${local.slice(5)}`,
        `Email: ${value("email") || "—"}`,
        `Pickup city: ${value("pickup") || "—"}`,
        `Drop city: ${value("drop") || "—"}`,
        `What are you sending: ${value("cargo") || "—"}`,
      ].join("\n");

      openWhatsApp(message);
    });
  }

  /* ------------------------------------------------------------------ */
  /* Accordion: only one open at a time (optional polish)               */
  /* ------------------------------------------------------------------ */
  const accordion = $("[data-accordion]");
  if (accordion) {
    $$("details", accordion).forEach((item) => {
      item.addEventListener("toggle", () => {
        if (!item.open) return;
        $$("details", accordion).forEach((other) => {
          if (other !== item) other.open = false;
        });
      });
    });
  }

  /* ------------------------------------------------------------------ */
  /* Scroll reveals & hero 100+ counter (no GSAP)                       */
  /* ------------------------------------------------------------------ */
  const motionOk = !window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  const revealSelectors = [
    ".about__copy",
    ".compare",
    ".pillar",
    ".service",
    ".work__intro",
    ".work__item",
    ".logo-grid li",
    ".faq__intro",
    ".faq__list details",
    ".quote__copy",
    ".quote-form",
    ".footer__about",
    ".footer__col",
  ].join(",");

  const revealTargets = $$(revealSelectors);

  if (!motionOk) {
    revealTargets.forEach((el) => el.classList.add("is-visible"));
  } else if (revealTargets.length) {
    revealTargets.forEach((el, index) => {
      el.classList.add("reveal");
      if (el.matches(".work__item, .service, .pillar")) {
        const offset = el.classList.contains("work__item") ? index % 8 : index % 3;
        el.style.setProperty("--reveal-delay", `${offset * 0.07}s`);
      }
    });

    const revealObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          entry.target.classList.add("is-visible");
          revealObserver.unobserve(entry.target);
        });
      },
      { root: null, rootMargin: "0px 0px -10% 0px", threshold: 0.12 }
    );

    revealTargets.forEach((el) => revealObserver.observe(el));
  }

  const badgeNum = $(".hero__badge-num");
  if (badgeNum && motionOk) {
    const target = 100;
    let counted = false;

    const runCounter = () => {
      if (counted) return;
      counted = true;
      const start = performance.now();
      const duration = 1500;

      const step = (now) => {
        const progress = Math.min(1, (now - start) / duration);
        const eased = 1 - (1 - progress) ** 3;
        badgeNum.textContent = `${Math.round(eased * target)}+`;
        if (progress < 1) requestAnimationFrame(step);
      };

      requestAnimationFrame(step);
    };

    const counterObserver = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          runCounter();
          counterObserver.disconnect();
        }
      },
      { threshold: 0.35 }
    );

    counterObserver.observe(badgeNum);
  }

})();

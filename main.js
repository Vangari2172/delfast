(() => {
  "use strict";

  const WA_NUMBER = "7900070194";
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
  const form = $("#quote-form");
  if (form) {
    form.addEventListener("submit", (event) => {
      event.preventDefault();
      const data = new FormData(form);
      const name = String(data.get("name") || "").trim();
      const mobile = String(data.get("mobile") || "").trim();
      const email = String(data.get("email") || "").trim();
      const pickup = String(data.get("pickup") || "").trim();
      const drop = String(data.get("drop") || "").trim();
      const cargo = String(data.get("cargo") || "").trim();

      if (!name || !mobile || !pickup || !drop || !cargo) {
        form.reportValidity();
        return;
      }

      const message = [
        "Quote request — Delfast Logistics",
        "",
        `Name: ${name}`,
        `Mobile: ${mobile}`,
        `Email: ${email || "—"}`,
        `Pickup city: ${pickup}`,
        `Drop city: ${drop}`,
        `What are you sending: ${cargo}`,
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
    ".testimonial",
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

(() => {
  const THEME_KEY = "placeholder-name-theme";

  const applyChrome = (theme) => {
    const meta = document.getElementById("meta-theme-color");
    if (meta) {
      meta.setAttribute("content", theme === "light" ? "#f6f3ee" : "#070707");
    }
  };

  const syncToggle = () => {
    const th = document.documentElement.getAttribute("data-theme") === "light" ? "light" : "dark";
    const toggle = document.querySelector("[data-theme-toggle]");
    if (!toggle) return;
    const goLight = th === "dark";
    toggle.setAttribute("aria-label", goLight ? "Switch to light theme" : "Switch to dark theme");
    toggle.setAttribute("title", goLight ? "Light theme" : "Dark theme");
  };

  const setTheme = (theme) => {
    const th = theme === "light" ? "light" : "dark";
    document.documentElement.setAttribute("data-theme", th);
    try {
      localStorage.setItem(THEME_KEY, th);
    } catch (_) {}
    applyChrome(th);
    syncToggle();
  };

  let stored = null;
  try {
    stored = localStorage.getItem(THEME_KEY);
  } catch (_) {}

  if (stored === "light" || stored === "dark") {
    setTheme(stored);
  } else {
    applyChrome(document.documentElement.getAttribute("data-theme") === "light" ? "light" : "dark");
    syncToggle();
  }

  document.querySelector("[data-theme-toggle]")?.addEventListener("click", () => {
    const cur = document.documentElement.getAttribute("data-theme") === "light" ? "light" : "dark";
    setTheme(cur === "dark" ? "light" : "dark");
  });

  const navToggle = document.querySelector("[data-nav-toggle]");
  const navPanel = document.querySelector("[data-nav-panel]");
  if (navToggle && navPanel) {
    navToggle.addEventListener("click", () => {
      const open = navPanel.classList.toggle("is-open");
      navToggle.setAttribute("aria-expanded", open ? "true" : "false");
    });
    navPanel.querySelectorAll("a").forEach((el) => {
      el.addEventListener("click", () => {
        navPanel.classList.remove("is-open");
        navToggle.setAttribute("aria-expanded", "false");
      });
    });
  }

  document.querySelectorAll("[data-tab]").forEach((btn) => {
    btn.addEventListener("click", () => {
      const tab = btn.dataset.tab;
      const root = btn.closest("[data-tabs]");
      if (!root || !tab) return;
      root.querySelectorAll("[data-tab]").forEach((b) =>
        b.classList.toggle("is-active", b.dataset.tab === tab)
      );
      root.querySelectorAll("[data-panel]").forEach((panel) => {
        panel.hidden = panel.dataset.panel !== tab;
      });
    });
  });

  const y = document.querySelector("#year");
  if (y) y.textContent = String(new Date().getFullYear());

  const openNowEls = Array.from(document.querySelectorAll("[data-open-now]"));
  if (openNowEls.length) {
    const toMinutes = (hh, mm) => hh * 60 + mm;
    const DAY_ABBR = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
    const fmtTime = (mins) => {
      const h = Math.floor(mins / 60);
      const m = mins % 60;
      return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
    };
    const daySlots = (day) => {
      // 0 Sun, 1 Mon, ... 6 Sat
      if (day === 0 || day === 1) return [];
      if (day >= 2 && day <= 4) return [toMinutes(12, 0), toMinutes(17, 30)];
      if (day === 5) return [toMinutes(12, 0), toMinutes(17, 50)];
      return [toMinutes(12, 0)]; // Saturday
    };
    const isOpenNow = (d) => {
      const day = d.getDay(); // 0 Sun ... 6 Sat
      const mins = toMinutes(d.getHours(), d.getMinutes());
      // Hours from section:
      // Sun/Mon closed
      // Tue-Thu: 12:00-15:00 and 17:30-22:00
      // Fri: 12:00-15:00 and 17:50-22:00
      // Sat: 12:00-22:00
      if (day === 0 || day === 1) return false;
      if (day >= 2 && day <= 4) {
        return (
          (mins >= toMinutes(12, 0) && mins < toMinutes(15, 0)) ||
          (mins >= toMinutes(17, 30) && mins < toMinutes(22, 0))
        );
      }
      if (day === 5) {
        return (
          (mins >= toMinutes(12, 0) && mins < toMinutes(15, 0)) ||
          (mins >= toMinutes(17, 50) && mins < toMinutes(22, 0))
        );
      }
      // Saturday
      return mins >= toMinutes(12, 0) && mins < toMinutes(22, 0);
    };

    const nextOpenText = (d) => {
      const today = d.getDay();
      const nowMins = toMinutes(d.getHours(), d.getMinutes());
      for (let offset = 0; offset < 7; offset += 1) {
        const day = (today + offset) % 7;
        const starts = daySlots(day);
        if (!starts.length) continue;
        const candidate = offset === 0 ? starts.find((m) => m > nowMins) : starts[0];
        if (candidate == null) continue;
        if (offset === 0) return fmtTime(candidate);
        return `${DAY_ABBR[day]} ${fmtTime(candidate)}`;
      }
      return "";
    };

    const syncOpenNow = () => {
      const open = isOpenNow(new Date());
      const opensAt = nextOpenText(new Date());
      openNowEls.forEach((el) => {
        el.textContent = open ? "We are open" : `Opens at ${opensAt}`;
        el.classList.toggle("is-open", open);
        el.classList.toggle("is-closed", !open);
      });
    };

    syncOpenNow();
    const openNowTimer = window.setInterval(syncOpenNow, 30000);
    window.addEventListener(
      "pagehide",
      () => {
        window.clearInterval(openNowTimer);
      },
      { once: true }
    );
  }

  const hoursQuote = document.querySelector("[data-hours-quote]");
  if (hoursQuote) {
    const quotes = [
      "“Simple and to the point, this no-frills favourite in Fitzrovia has a modern take on sushi.”",
      "“Small but lovely … Sushi fans congregate at the brightly lit counter.”",
      "“Great value sushi where you least expect it.”",
    ];
    let quoteIndex = 0;
    let cycleTimer = 0;
    const QUOTE_MS = 5200;
    if (quotes.length > 1) {
      const playQuote = (idx) => {
        hoursQuote.classList.remove("is-typing");
        hoursQuote.textContent = quotes[idx];
        void hoursQuote.offsetWidth;
        hoursQuote.classList.add("is-typing");
      };

      playQuote(quoteIndex);
      cycleTimer = window.setInterval(() => {
        if (document.hidden) return;
        quoteIndex = (quoteIndex + 1) % quotes.length;
        playQuote(quoteIndex);
      }, QUOTE_MS);
      window.addEventListener(
        "pagehide",
        () => {
          window.clearInterval(cycleTimer);
        },
        { once: true }
      );
    }
  }

  const heroRoot = document.querySelector("[data-hero-slideshow]");
  const heroSlides = heroRoot ? Array.from(heroRoot.querySelectorAll(".hero-slide")) : [];
  if (heroRoot && heroSlides.length > 0) {
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let cur = heroSlides.findIndex((el) => el.classList.contains("is-active"));
    if (cur < 0) cur = 0;

    const syncHeroMedia = () => {
      heroSlides.forEach((el, i) => {
        const active = i === cur;
        el.classList.toggle("is-active", active);
        if (el.tagName !== "VIDEO") return;
        const vid = /** @type {HTMLVideoElement} */ (el);
        vid.muted = true;
        vid.playsInline = true;
        vid.defaultPlaybackRate = 1;
        vid.playbackRate = 1;
        if (active) {
          const playActive = () => {
            const p = vid.play();
            if (p && typeof p.catch === "function") p.catch(() => {});
          };
          if (vid.readyState >= 1) {
            try {
              vid.currentTime = 0;
            } catch (_) {}
            playActive();
          } else {
            vid.addEventListener(
              "loadedmetadata",
              () => {
                try {
                  vid.currentTime = 0;
                } catch (_) {}
                playActive();
              },
              { once: true }
            );
            vid.load();
          }
        } else {
          vid.pause();
        }
      });
    };

    syncHeroMedia();

    if (!reduceMotion && heroSlides.length > 1) {
      const ms = 8000;
      const tick = () => {
        cur = (cur + 1) % heroSlides.length;
        syncHeroMedia();
      };
      const timer = window.setInterval(tick, ms);
      window.addEventListener(
        "pagehide",
        () => {
          window.clearInterval(timer);
        },
        { once: true }
      );
    }
  }

  const spotlightRoot = document.querySelector("[data-spotlight-carousel]");
  if (spotlightRoot) {
    const track = spotlightRoot.querySelector("[data-spotlight-viewport]");
    const slides = Array.from(spotlightRoot.querySelectorAll("[data-spotlight-slide]"));
    const prevBtn = spotlightRoot.querySelector("[data-spotlight-prev]");
    const nextBtn = spotlightRoot.querySelector("[data-spotlight-next]");
    const n = slides.length;

    /** Spotlight slideshow cadence. */
    const AUTOPLAY_MS = 5200;

    if (track && n > 0) {
      let current = 0;
      let autoplayTimer = 0;
      let exitCleanupTimer = 0;

      const sync = () => {
        slides.forEach((sl, j) => {
          const isActive = j === current;
          sl.classList.toggle("is-active", isActive);
          if (isActive) sl.classList.remove("is-exiting");
          const vid = sl.querySelector("video");
          if (!vid) return;
          vid.muted = true;
          vid.playsInline = true;
          if (isActive) {
            const play = () => {
              const p = vid.play();
              if (p && typeof p.catch === "function") p.catch(() => {});
            };
            if (vid.readyState >= 1) {
              play();
            } else {
              vid.addEventListener("loadedmetadata", play, { once: true });
              vid.load();
            }
          } else {
            vid.pause();
            try {
              vid.currentTime = 0;
            } catch (_) {}
          }
        });
      };

      const goTo = (index) => {
        const prev = current;
        current = ((index % n) + n) % n;
        if (prev !== current) {
          const prevSlide = slides[prev];
          if (prevSlide) {
            prevSlide.classList.add("is-exiting");
            window.clearTimeout(exitCleanupTimer);
            exitCleanupTimer = window.setTimeout(() => {
              prevSlide.classList.remove("is-exiting");
            }, 1900);
          }
        }
        sync();
      };

      const goDelta = (delta) => {
        goTo(current + delta);
      };

      const scheduleAutoplay = () => {
        window.clearTimeout(autoplayTimer);
        if (n <= 1) return;
        const tick = () => {
          if (document.hidden) {
            autoplayTimer = window.setTimeout(tick, AUTOPLAY_MS);
            return;
          }
          goDelta(1);
          autoplayTimer = window.setTimeout(tick, AUTOPLAY_MS);
        };
        autoplayTimer = window.setTimeout(tick, AUTOPLAY_MS);
      };

      prevBtn?.addEventListener("click", () => {
        goDelta(-1);
      });
      nextBtn?.addEventListener("click", () => {
        goDelta(1);
      });

      track.addEventListener("keydown", (e) => {
        if (e.key === "ArrowLeft") {
          e.preventDefault();
          goDelta(-1);
        } else if (e.key === "ArrowRight") {
          e.preventDefault();
          goDelta(1);
        } else if (e.key === "Home") {
          e.preventDefault();
          goTo(0);
        } else if (e.key === "End") {
          e.preventDefault();
          goTo(n - 1);
        }
      });

      document.addEventListener("visibilitychange", () => {
        if (!document.hidden) scheduleAutoplay();
      });

      let resizeTimer = 0;
      window.addEventListener("resize", () => {
        window.clearTimeout(resizeTimer);
        resizeTimer = window.setTimeout(() => {
          sync();
        }, 120);
      });

      window.addEventListener(
        "pagehide",
        () => {
          window.clearTimeout(autoplayTimer);
          window.clearTimeout(exitCleanupTimer);
        },
        { once: true }
      );

      sync();
      scheduleAutoplay();
    }
  }

  const aboutGlide = document.querySelector("[data-about-glide]");
  if (aboutGlide) {
    const aboutSlidesEl = aboutGlide.querySelector(".glide__slides");
    const aboutSlides = Array.from(aboutGlide.querySelectorAll(".glide__slide"));
    if (aboutSlidesEl && aboutSlides.length > 0) {
      let current = 0;
      let startX = null;
      let startY = null;
      let wasSwipe = false;
      const ABOUT_MS = 3000;
      const captionWords = [
        "Placeholder Name Moment",
        "Chef's Detail",
        "Counter Light",
        "Omakase Mood",
        "Evening Plate",
        "Sushi Study",
      ];

      const makeMeta = (imgSrc, idx) => {
        const title = `${captionWords[idx % captionWords.length]}`;
        const desc = "Curated sushi frame from the Placeholder Name gallery.";
        return { title, desc };
      };

      const lightbox = document.createElement("div");
      lightbox.className = "about-lightbox";
      lightbox.setAttribute("aria-hidden", "true");
      lightbox.innerHTML = `
        <button type="button" class="about-lightbox__close" aria-label="Close image">×</button>
        <figure class="about-lightbox__figure">
          <img class="about-lightbox__img" alt="">
          <figcaption class="about-lightbox__meta">
            <strong class="about-lightbox__title"></strong>
            <span class="about-lightbox__desc"></span>
          </figcaption>
        </figure>
      `;
      document.body.appendChild(lightbox);
      const lightboxImg = lightbox.querySelector(".about-lightbox__img");
      const lightboxTitle = lightbox.querySelector(".about-lightbox__title");
      const lightboxDesc = lightbox.querySelector(".about-lightbox__desc");

      const openLightbox = (slide) => {
        const img = slide.querySelector("img");
        if (!img || !lightboxImg || !lightboxTitle || !lightboxDesc) return;
        lightboxImg.src = img.currentSrc || img.src;
        lightboxImg.alt = img.alt || "";
        lightboxTitle.textContent = slide.dataset.aboutTitle || "";
        lightboxDesc.textContent = slide.dataset.aboutDesc || "";
        lightbox.classList.add("is-open");
        lightbox.setAttribute("aria-hidden", "false");
      };

      const closeLightbox = () => {
        lightbox.classList.remove("is-open");
        lightbox.setAttribute("aria-hidden", "true");
      };
      lightbox.addEventListener("click", (e) => {
        if (e.target === lightbox || e.target.closest(".about-lightbox__close")) {
          closeLightbox();
        }
      });
      window.addEventListener("keydown", (e) => {
        if (e.key === "Escape" && lightbox.classList.contains("is-open")) closeLightbox();
      });

      aboutSlides.forEach((slide, idx) => {
        const img = slide.querySelector("img");
        if (!img) return;
        const meta = makeMeta(img.getAttribute("src") || "", idx);
        slide.dataset.aboutTitle = meta.title;
        slide.dataset.aboutDesc = meta.desc;
        slide.setAttribute("role", "button");
        slide.setAttribute("tabindex", "0");
        slide.setAttribute("aria-label", `${meta.title}. Open expanded image.`);

        const cap = document.createElement("span");
        cap.className = "about-glide__caption";
        cap.textContent = meta.title;
        slide.appendChild(cap);

        slide.addEventListener("click", () => {
          if (wasSwipe) {
            wasSwipe = false;
            return;
          }
          openLightbox(slide);
        });
        slide.addEventListener("keydown", (e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            openLightbox(slide);
          }
        });
      });
      const gap = () => {
        const st = window.getComputedStyle(aboutSlidesEl);
        return parseFloat(st.columnGap || st.gap || "0") || 0;
      };
      const visible = () => {
        if (window.matchMedia("(max-width: 640px)").matches) return 1;
        if (window.matchMedia("(max-width: 900px)").matches) return 2;
        return 3;
      };
      const maxIndex = () => Math.max(0, aboutSlides.length - visible());
      const step = () => {
        const v = visible();
        const g = gap();
        return v <= 1 ? aboutGlide.clientWidth : (aboutGlide.clientWidth - g * (v - 1)) / v + g;
      };
      const syncAbout = (animate = true) => {
        const clamped = Math.max(0, Math.min(maxIndex(), current));
        if (clamped !== current) current = clamped;
        aboutSlidesEl.style.transition = animate
          ? "transform 0.55s cubic-bezier(0.22, 1, 0.36, 1)"
          : "none";
        aboutSlidesEl.style.transform = `translate3d(-${current * step()}px, 0, 0)`;
      };
      const goAbout = (index, animate = true) => {
        const max = maxIndex();
        if (max <= 0) {
          current = 0;
        } else if (index > max) {
          current = 0;
        } else if (index < 0) {
          current = max;
        } else {
          current = index;
        }
        syncAbout(animate);
      };
      let aboutTimer = 0;
      const startAboutLoop = () => {
        window.clearInterval(aboutTimer);
        if (aboutSlides.length <= visible()) return;
        aboutTimer = window.setInterval(() => {
          if (document.hidden) return;
          goAbout(current + 1, true);
        }, ABOUT_MS);
      };

      const onTouchStart = (e) => {
        const touch = e.touches && e.touches[0];
        if (!touch) return;
        startX = touch.clientX;
        startY = touch.clientY;
        wasSwipe = false;
      };

      const onTouchEnd = (e) => {
        if (startX === null || startY === null) return;
        const touch = e.changedTouches && e.changedTouches[0];
        if (!touch) return;
        const dx = touch.clientX - startX;
        const dy = touch.clientY - startY;
        startX = null;
        startY = null;
        if (Math.abs(dx) < 44 || Math.abs(dx) <= Math.abs(dy)) return;
        wasSwipe = true;
        goAbout(current + (dx < 0 ? 1 : -1), true);
      };

      aboutGlide.addEventListener("touchstart", onTouchStart, { passive: true });
      aboutGlide.addEventListener("touchend", onTouchEnd, { passive: true });
      aboutGlide.addEventListener("pointerdown", (e) => {
        startX = e.clientX;
        startY = e.clientY;
        wasSwipe = false;
      });
      aboutGlide.addEventListener("pointerup", (e) => {
        if (startX === null || startY === null) return;
        const dx = e.clientX - startX;
        const dy = e.clientY - startY;
        startX = null;
        startY = null;
        if (Math.abs(dx) < 44 || Math.abs(dx) <= Math.abs(dy)) return;
        wasSwipe = true;
        goAbout(current + (dx < 0 ? 1 : -1), true);
      });
      aboutGlide.addEventListener("keydown", (e) => {
        if (e.key === "ArrowLeft") {
          e.preventDefault();
          goAbout(current - 1, true);
        } else if (e.key === "ArrowRight") {
          e.preventDefault();
          goAbout(current + 1, true);
        }
      });

      syncAbout(false);
      window.addEventListener("resize", () => syncAbout(false));
      startAboutLoop();
      window.addEventListener(
        "pagehide",
        () => {
          window.clearInterval(aboutTimer);
        },
        { once: true }
      );
    }
  }

  const pressSection = document.querySelector("section#press.press-section");
  const pressCarousel = document.querySelector(".press-grid--single");
  if (pressCarousel) {
    const cards = Array.from(pressCarousel.querySelectorAll(".press-card"));
    if (cards.length > 0) {
      let current = 0;
      const sync = () => {
        cards.forEach((card, idx) => {
          card.classList.toggle("is-active", idx === current);
          card.setAttribute("aria-hidden", idx === current ? "false" : "true");
        });
      };
      sync();
      if (cards.length > 1) {
        const PRESS_MS = 4800;
        const timer = window.setInterval(() => {
          if (document.hidden) return;
          current = (current + 1) % cards.length;
          sync();
        }, PRESS_MS);
        window.addEventListener(
          "pagehide",
          () => {
            window.clearInterval(timer);
          },
          { once: true }
        );
      }
    }
  }

  if (pressSection && "IntersectionObserver" in window) {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      pressSection.classList.add("press-section--visible");
    } else {
      const pressIo = new IntersectionObserver(
        (entries, observer) => {
          entries.forEach((entry) => {
            if (!entry.isIntersecting) return;
            entry.target.classList.add("press-section--visible");
            observer.unobserve(entry.target);
          });
        },
        { threshold: 0.12, rootMargin: "0px 0px -5% 0px" }
      );
      pressIo.observe(pressSection);
    }
  } else if (pressSection) {
    pressSection.classList.add("press-section--visible");
  }
})();

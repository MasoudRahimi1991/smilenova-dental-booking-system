const menuToggle = document.getElementById("menuToggle");
const mainNav = document.getElementById("mainNav");

if (menuToggle && mainNav) {
  menuToggle.addEventListener("click", function () {
    mainNav.classList.toggle("is-open");
    menuToggle.classList.toggle("is-open");
  });
}

const homepageAppointmentLabel =
  document.getElementById("homepageAppointmentLabel");

const homepageAppointmentText =
  document.getElementById("homepageAppointmentText");

const homepageAppointmentLinkText =
  document.getElementById("homepageAppointmentLinkText");
  function updateMiniCalendarFromAppointment(text) {
  const miniCalendar = document.getElementById("homepageMiniCalendar");

  if (!miniCalendar || !text) return;

  const match = text.match(/(\d{1,2}):(\d{2})/);

  const today = new Date();

  const dayNames = ["So", "Mo", "Di", "Mi", "Do", "Fr", "Sa"];

  const days = Array.from({ length: 4 }, function (_, index) {
    const date = new Date(today);
    date.setDate(today.getDate() + index);

    return {
      dayName: dayNames[date.getDay()],
      dayNumber: String(date.getDate()).padStart(2, "0"),
      active: index === 1,
    };
  });

  miniCalendar.innerHTML = "";

  days.forEach(function (day) {
    const item = document.createElement("div");

    if (day.active) {
      item.classList.add("active");
    }

    item.innerHTML = `
      <span>${day.dayName}</span>
      <strong>${day.dayNumber}</strong>
    `;

    miniCalendar.appendChild(item);
  });
}

function safeText(value) {
  return String(value || "");
}

async function loadHomepageSettings() {
  if (
    !homepageAppointmentLabel ||
    !homepageAppointmentText ||
    !homepageAppointmentLinkText
  ) {
    return;
  }

  try {
    const response = await fetch("/api/homepage-settings");
    const data = await response.json();

    if (!response.ok || !data.success || !data.settings) {
      return;
    }

    homepageAppointmentLabel.textContent =
      safeText(data.settings.appointment_label);

    homepageAppointmentText.textContent =
      safeText(data.settings.appointment_text);
updateMiniCalendarFromAppointment(data.settings.appointment_text);
    homepageAppointmentLinkText.textContent =
      safeText(data.settings.appointment_link_text);
  } catch (error) {
    console.error("Homepage settings could not be loaded.");
  }
}
const revealElements = document.querySelectorAll(".reveal");


/* =========================================================
   PREMIUM INTERACTIONS
   Reveal, Mouse Glow, Button Ripple, Card Tilt
   ========================================================= */

function initRevealAnimations() {
    const revealElements = document.querySelectorAll(".reveal");

    const observer = new IntersectionObserver(
        function (entries) {
            entries.forEach(function (entry) {
                if (entry.isIntersecting) {
                    entry.target.classList.add("is-visible");
                    observer.unobserve(entry.target);
                }
            });
        },
        {
            threshold: 0.16,
        }
    );

    revealElements.forEach(function (element) {
        observer.observe(element);
    });
}

function initMouseGlowCards() {
    const cards = document.querySelectorAll(
        ".service-card, .team-card, .trust-card, .contact-card, .summary-card, .timeline-item, .stat-card, .dashboard-card"
    );

    cards.forEach(function (card) {
        card.addEventListener("mousemove", function (event) {
            const rect = card.getBoundingClientRect();

            const x = event.clientX - rect.left;
            const y = event.clientY - rect.top;

            card.style.setProperty("--mouse-x", `${x}px`);
            card.style.setProperty("--mouse-y", `${y}px`);
        });
    });
}

function initButtonRipple() {
    const buttons = document.querySelectorAll(".btn");

    buttons.forEach(function (button) {
        button.addEventListener("click", function (event) {
            const ripple = document.createElement("span");
            const rect = button.getBoundingClientRect();

            const size = Math.max(rect.width, rect.height);
            const x = event.clientX - rect.left - size / 2;
            const y = event.clientY - rect.top - size / 2;

            ripple.className = "btn-ripple";
            ripple.style.width = `${size}px`;
            ripple.style.height = `${size}px`;
            ripple.style.left = `${x}px`;
            ripple.style.top = `${y}px`;

            button.appendChild(ripple);

            setTimeout(function () {
                ripple.remove();
            }, 650);
        });
    });
}

function initCardTilt() {
    const cards = document.querySelectorAll(
        ".service-card, .team-card, .trust-card, .dashboard-card"
    );

    cards.forEach(function (card) {
        card.addEventListener("mousemove", function (event) {
            const rect = card.getBoundingClientRect();

            const x = event.clientX - rect.left;
            const y = event.clientY - rect.top;

            const rotateX = ((y / rect.height) - 0.5) * -8;
            const rotateY = ((x / rect.width) - 0.5) * 8;

            card.style.transform =
                `perspective(900px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) translateY(-8px)`;
        });

        card.addEventListener("mouseleave", function () {
            card.style.transform = "";
        });
    });
}
function initPageLoader() {

    const loader = document.getElementById("pageLoader");

    if (!loader) return;

    window.addEventListener("load", function () {

        setTimeout(function () {

            loader.classList.add("hidden");

        }, 700);

    });

}
function initCounters() {
    const counters = document.querySelectorAll("[data-counter]");

    if (!counters.length) return;

    const observer = new IntersectionObserver(
        function (entries) {
            entries.forEach(function (entry) {
                if (!entry.isIntersecting) return;

                const counter = entry.target;
                const target = Number(counter.dataset.counter);
                const isDecimal = String(counter.dataset.counter).includes(".");
                const duration = 1200;
                const startTime = performance.now();

                function updateCounter(currentTime) {
                    const progress = Math.min((currentTime - startTime) / duration, 1);
                    const easedProgress = 1 - Math.pow(1 - progress, 3);
                    const currentValue = target * easedProgress;

                    counter.textContent = isDecimal
                        ? currentValue.toFixed(1)
                        : Math.round(currentValue);

                    if (progress < 1) {
                        requestAnimationFrame(updateCounter);
                    } else {
                        counter.textContent = isDecimal
                            ? target.toFixed(1)
                            : target;
                    }
                }

                requestAnimationFrame(updateCounter);
                observer.unobserve(counter);
            });
        },
        {
            threshold: 0.5,
        }
    );

    counters.forEach(function (counter) {
        observer.observe(counter);
    });
}

initCounters();

initPageLoader();

initRevealAnimations();
initMouseGlowCards();
initButtonRipple();
initCardTilt();

loadHomepageSettings();
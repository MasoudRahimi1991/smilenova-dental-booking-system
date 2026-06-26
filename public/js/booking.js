const bookingForm = document.getElementById("bookingForm");
const serviceInput = document.getElementById("service");
const bookingDateInput = document.getElementById("bookingDate");
const bookingTimeInput = document.getElementById("bookingTime");
const slotGrid = document.getElementById("slotGrid");
const formMessage = document.getElementById("formMessage");

const patientNameInput = document.getElementById("patientName");
const emailInput = document.getElementById("email");
const phoneInput = document.getElementById("phone");
const notesInput = document.getElementById("notes");
const websiteInput = document.getElementById("website");

const defaultTimes = [
  "09:00",
  "09:30",
  "10:00",
  "10:30",
  "11:00",
  "11:30",
  "14:00",
  "14:30",
  "15:00",
  "15:30",
  "16:00",
  "16:30"
];

const allowedServices = [
  "Kontrolluntersuchung",
  "Professionelle Zahnreinigung",
  "Zahnaufhellung",
  "Notfallbehandlung"
];

function escapeHtml(value) {
  return String(value || "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function normalizeText(value) {
  return String(value || "").trim();
}

function containsDangerousInput(value) {
  const patterns = [
    /<script/i,
    /<\/script/i,
    /javascript:/i,
    /onerror=/i,
    /onload=/i,
    /onclick=/i,
    /<iframe/i,
    /<object/i,
    /<embed/i,
    /<svg/i,
    /data:text\/html/i
  ];

  return patterns.some(function (pattern) {
    return pattern.test(String(value));
  });
}

function setMessage(message, type) {
  if (!formMessage) return;

  formMessage.textContent = escapeHtml(message);
  formMessage.className = `form-message ${type}`;
}

function clearMessage() {
  if (!formMessage) return;

  formMessage.textContent = "";
  formMessage.className = "form-message";
}

function getTodayDateString() {
  const today = new Date();

  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, "0");
  const day = String(today.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function isValidDateString(dateValue) {
  return /^\d{4}-\d{2}-\d{2}$/.test(dateValue);
}

function isPastDate(dateValue) {
  return dateValue < getTodayDateString();
}

function isWeekend(dateValue) {
  const date = new Date(`${dateValue}T00:00:00`);
  const day = date.getDay();

  return day === 0 || day === 6;
}

function setMinDate() {
  const today = getTodayDateString();

  bookingDateInput.min = today;

  if (bookingDateInput.value && bookingDateInput.value < today) {
    bookingDateInput.value = "";
    bookingTimeInput.value = "";
    renderPlaceholder("Vergangene Daten sind nicht erlaubt.");
  }
}

function renderPlaceholder(message) {
  slotGrid.innerHTML = "";

  const paragraph = document.createElement("p");
  paragraph.className = "slot-placeholder";
  paragraph.textContent = message;

  slotGrid.appendChild(paragraph);
}

function clearSelectedSlots() {
  document.querySelectorAll(".slot-btn").forEach(function (button) {
    button.classList.remove("selected");
  });
}

function renderSlots(slots) {
  slotGrid.innerHTML = "";
  bookingTimeInput.value = "";

  if (!Array.isArray(slots) || slots.length === 0) {
    renderPlaceholder("Keine freien Zeiten gefunden.");
    return;
  }

  slots.forEach(function (slot) {
    const button = document.createElement("button");

    button.type = "button";
    button.textContent = slot.time;
    button.className = "slot-btn";

    if (!slot.available) {
      button.disabled = true;
      button.classList.add("disabled");
      button.title = "Dieser Termin ist nicht verfügbar.";
    }

    button.addEventListener("click", function () {
      if (!slot.available) return;

      clearSelectedSlots();

      button.classList.add("selected");
      bookingTimeInput.value = slot.time;
      clearMessage();
    });

    slotGrid.appendChild(button);
  });
}

function renderDefaultSlots() {
  const slots = defaultTimes.map(function (time) {
    return {
      time: time,
      available: true
    };
  });

  renderSlots(slots);
}

async function loadAvailableSlots() {
  const selectedDate = normalizeText(bookingDateInput.value);

  bookingTimeInput.value = "";

  if (!selectedDate) {
    renderPlaceholder("Bitte wählen Sie zuerst ein Datum aus.");
    return;
  }

  if (!isValidDateString(selectedDate) || containsDangerousInput(selectedDate)) {
    bookingDateInput.value = "";
    renderPlaceholder("Ungültiges Datum.");
    setMessage("Ungültiges Datum.", "error");
    return;
  }

  if (isPastDate(selectedDate)) {
    bookingDateInput.value = "";
    bookingTimeInput.value = "";
    renderPlaceholder("Vergangene Daten sind nicht erlaubt.");
    setMessage("Vergangene Daten sind nicht erlaubt.", "error");
    return;
  }

  if (isWeekend(selectedDate)) {
    bookingDateInput.value = "";
    bookingTimeInput.value = "";
    renderPlaceholder("Samstag und Sonntag sind geschlossen. Bitte wählen Sie einen Werktag aus.");
    setMessage("Die Praxis ist am Wochenende geschlossen.", "error");
    return;
  }

  try {
    clearMessage();
    renderPlaceholder("Freie Zeiten werden geladen...");

    const response = await fetch(`/api/slots?date=${encodeURIComponent(selectedDate)}`);
    const data = await response.json();

    if (!response.ok || !data.success) {
      renderDefaultSlots();
      return;
    }

    renderSlots(data.slots);
  } catch (error) {
    renderDefaultSlots();
  }
}

function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function isValidPhone(phone) {
  return /^[0-9+\-\s()]{6,30}$/.test(phone);
}

function validateBookingForm() {
  const service = normalizeText(serviceInput.value);
  const bookingDate = normalizeText(bookingDateInput.value);
  const bookingTime = normalizeText(bookingTimeInput.value);
  const patientName = normalizeText(patientNameInput.value);
  const email = normalizeText(emailInput.value);
  const phone = normalizeText(phoneInput.value);
  const notes = normalizeText(notesInput.value);
  const website = websiteInput ? normalizeText(websiteInput.value) : "";

  if (website !== "") {
    return "Spam detected.";
  }

  const allTextValues = [
    service,
    bookingDate,
    bookingTime,
    patientName,
    email,
    phone,
    notes
  ];

  if (allTextValues.some(containsDangerousInput)) {
    return "Ungültige Eingabe erkannt.";
  }

  if (!allowedServices.includes(service)) {
    return "Bitte wählen Sie eine gültige Behandlung aus.";
  }

  if (!bookingDate) {
    return "Bitte wählen Sie ein Datum aus.";
  }

  if (!isValidDateString(bookingDate)) {
    return "Bitte wählen Sie ein gültiges Datum aus.";
  }

  if (isPastDate(bookingDate)) {
    return "Vergangene Daten sind nicht erlaubt.";
  }

  if (isWeekend(bookingDate)) {
    return "Samstag und Sonntag sind geschlossen.";
  }

  if (!bookingTime) {
    return "Bitte wählen Sie eine Uhrzeit aus.";
  }

  if (patientName.length < 2 || patientName.length > 60) {
    return "Der Name muss zwischen 2 und 60 Zeichen lang sein.";
  }

  if (!isValidEmail(email) || email.length > 120) {
    return "Bitte geben Sie eine gültige E-Mail-Adresse ein.";
  }

  if (!isValidPhone(phone)) {
    return "Bitte geben Sie eine gültige Telefonnummer ein.";
  }

  if (notes.length > 500) {
    return "Der Hinweis darf maximal 500 Zeichen lang sein.";
  }

  return null;
}

function getBookingPayload() {
  return {
    patientName: normalizeText(patientNameInput.value),
    email: normalizeText(emailInput.value).toLowerCase(),
    phone: normalizeText(phoneInput.value),
    service: normalizeText(serviceInput.value),
    bookingDate: normalizeText(bookingDateInput.value),
    bookingTime: normalizeText(bookingTimeInput.value),
    notes: normalizeText(notesInput.value),
    website: websiteInput ? normalizeText(websiteInput.value) : ""
  };
}

bookingDateInput.addEventListener("change", loadAvailableSlots);

bookingForm.addEventListener("submit", async function (event) {
  event.preventDefault();

  const validationError = validateBookingForm();

  if (validationError) {
    setMessage(validationError, "error");
    return;
  }

  try {
    setMessage("Termin wird gespeichert...", "info");

    const response = await fetch("/api/bookings", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(getBookingPayload())
    });

    const data = await response.json();

    if (!response.ok || !data.success) {
      setMessage(data.message || "Termin konnte nicht gespeichert werden.", "error");
      return;
    }

    setMessage("Termin wurde erfolgreich gebucht.", "success");

    bookingForm.reset();
    bookingTimeInput.value = "";
    renderPlaceholder("Bitte wählen Sie zuerst ein Datum aus.");
    setMinDate();
  } catch (error) {
    setMessage("Serververbindung fehlgeschlagen.", "error");
  }
});

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
      threshold: 0.16
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
    ".service-card, .team-card, .dashboard-card"
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

setMinDate();
renderPlaceholder("Bitte wählen Sie zuerst ein Datum aus.");

initRevealAnimations();
initMouseGlowCards();
initButtonRipple();

if (window.matchMedia("(min-width: 900px)").matches) {
  initCardTilt();
}
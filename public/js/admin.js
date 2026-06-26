const API_BASE_URL = "";

const adminToken = localStorage.getItem("adminToken");

if (!adminToken) {
  window.location.href = "admin-login.html";
}

const bookingList = document.getElementById("bookingList");
const adminCount = document.getElementById("adminCount");
const refreshBookingsButton = document.getElementById("refreshBookings");
const adminSearch = document.getElementById("adminSearch");
const statusFilter = document.getElementById("statusFilter");
const logoutButton = document.getElementById("logoutButton");

const totalBookings = document.getElementById("totalBookings");
const pendingBookings = document.getElementById("pendingBookings");
const confirmedBookings = document.getElementById("confirmedBookings");
const inProgressBookings = document.getElementById("inProgressBookings");
const completedBookings = document.getElementById("completedBookings");
const cancelledBookings = document.getElementById("cancelledBookings");

const adminTabs = document.querySelectorAll(".admin-tab");

const editBookingSection = document.getElementById("editBookingSection");
const editBookingForm = document.getElementById("editBookingForm");
const editBookingId = document.getElementById("editBookingId");
const editPatientName = document.getElementById("editPatientName");
const editEmail = document.getElementById("editEmail");
const editPhone = document.getElementById("editPhone");
const editService = document.getElementById("editService");
const editBookingDate = document.getElementById("editBookingDate");
const editBookingTime = document.getElementById("editBookingTime");
const editNotes = document.getElementById("editNotes");
const editBookingMessage = document.getElementById("editBookingMessage");
const cancelEditButton = document.getElementById("cancelEditButton");

const homepageSettingsForm = document.getElementById("homepageSettingsForm");
const appointmentLabelInput = document.getElementById("appointmentLabel");
const appointmentTextInput = document.getElementById("appointmentText");
const appointmentLinkTextInput = document.getElementById("appointmentLinkText");
const homepageSettingsMessage = document.getElementById("homepageSettingsMessage");

let allBookings = [];
let currentTabStatus = "pending";

function authHeaders() {
  return {
    "Content-Type": "application/json",
    Authorization: `Bearer ${adminToken}`,
  };
}

function safeText(value) {
  return String(value || "");
}

function formatDate(value) {
  return value ? String(value).slice(0, 10) : "";
}

function formatTime(value) {
  return value ? String(value).slice(0, 5) : "";
}

function getStatusLabel(status) {
  if (status === "pending") return "Inbox";
  if (status === "confirmed") return "Bestätigt";
  if (status === "in_progress") return "In Bearbeitung";
  if (status === "completed") return "Abgeschlossen";
  if (status === "cancelled") return "Storniert";

  return status;
}

function handleUnauthorized(response) {
  if (response.status === 401 || response.status === 403) {
    localStorage.removeItem("adminToken");
    window.location.href = "admin-login.html";
    return true;
  }

  return false;
}

function setMessage(element, message, type) {
  if (!element) return;

  element.textContent = message;
  element.className = `form-message ${type}`;
}

function countByStatus(status) {
  return allBookings.filter(function (booking) {
    return booking.status === status;
  }).length;
}

function updateDashboardStats() {
  totalBookings.textContent = allBookings.length;
  pendingBookings.textContent = countByStatus("pending");
  confirmedBookings.textContent = countByStatus("confirmed");
  inProgressBookings.textContent = countByStatus("in_progress");
  completedBookings.textContent = countByStatus("completed");
  cancelledBookings.textContent = countByStatus("cancelled");
}

async function loadBookings() {
  bookingList.innerHTML = `<p class="empty-text">Termine werden geladen...</p>`;

  try {
    const response = await fetch(`${API_BASE_URL}/api/admin/bookings`, {
      method: "GET",
      headers: authHeaders(),
    });

    if (handleUnauthorized(response)) return;

    const data = await response.json();

    if (!response.ok || !data.success) {
      throw new Error(data.message || "Termine konnten nicht geladen werden.");
    }

    allBookings = Array.isArray(data.bookings) ? data.bookings : [];

    updateDashboardStats();
    applyFilters();
  } catch (error) {
    bookingList.innerHTML = `
      <p class="empty-text">Termine konnten nicht geladen werden.</p>
    `;

    adminCount.textContent = error.message;
  }
}

function applyFilters() {
  const searchValue = adminSearch.value.toLowerCase().trim();
  const selectedStatus = statusFilter.value;

  const filteredBookings = allBookings.filter(function (booking) {
    const patientName = safeText(booking.patient_name).toLowerCase();
    const email = safeText(booking.email).toLowerCase();
    const phone = safeText(booking.phone).toLowerCase();

    const matchesSearch =
      patientName.includes(searchValue) ||
      email.includes(searchValue) ||
      phone.includes(searchValue);

    const matchesTab =
      currentTabStatus === "all" || booking.status === currentTabStatus;

    const matchesDropdown =
      selectedStatus === "all" || booking.status === selectedStatus;

    return matchesSearch && matchesTab && matchesDropdown;
  });

  renderBookings(filteredBookings);
}

function renderBookings(bookings) {
  bookingList.innerHTML = "";

  if (!bookings.length) {
    bookingList.innerHTML = `
      <p class="empty-text">Keine Termine in diesem Bereich.</p>
    `;

    adminCount.textContent = "0 Termine gefunden.";
    return;
  }

  adminCount.textContent = `${bookings.length} Termine gefunden.`;

  bookings.forEach(function (booking) {
    const card = document.createElement("article");
    card.className = "admin-booking-card";

    card.innerHTML = `
      <div>
        <h3>${safeText(booking.patient_name)}</h3>

        <p><strong>Behandlung:</strong> ${safeText(booking.service)}</p>

        <p>
          <strong>Datum:</strong> ${formatDate(booking.booking_date)}
          ·
          <strong>Uhrzeit:</strong> ${formatTime(booking.booking_time)}
        </p>

        <p><strong>E-Mail:</strong> ${safeText(booking.email)}</p>

        <p><strong>Telefon:</strong> ${safeText(booking.phone)}</p>

        <p>
          <strong>Hinweis:</strong>
          ${safeText(booking.notes || "Keine Hinweise")}
        </p>

        <span class="status-badge ${safeText(booking.status)}">
          ${getStatusLabel(booking.status)}
        </span>
      </div>
    `;

    card.appendChild(createActionsWrapper(booking));
    bookingList.appendChild(card);
  });
}

function createActionsWrapper(booking) {
  const wrapper = document.createElement("div");
  wrapper.className = "admin-actions";

  wrapper.appendChild(createStatusButton("Inbox", "pending", booking.id));
  wrapper.appendChild(createStatusButton("Bestätigen", "confirmed", booking.id));
  wrapper.appendChild(createStatusButton("Bearbeiten", "in_progress", booking.id));
  wrapper.appendChild(createStatusButton("Abschließen", "completed", booking.id));
  wrapper.appendChild(createStatusButton("Stornieren", "cancelled", booking.id));
  wrapper.appendChild(createEditButton(booking.id));
  wrapper.appendChild(createDeleteButton(booking.id));

  return wrapper;
}

function createStatusButton(text, status, bookingId) {
  const button = document.createElement("button");

  button.type = "button";
  button.textContent = text;
  button.className = `action-btn ${status}`;

  button.addEventListener("click", function () {
    updateBookingStatus(bookingId, status);
  });

  return button;
}

function createEditButton(bookingId) {
  const button = document.createElement("button");

  button.type = "button";
  button.textContent = "Daten ändern";
  button.className = "action-btn edit";

  button.addEventListener("click", function () {
    openEditBooking(bookingId);
  });

  return button;
}

function createDeleteButton(bookingId) {
  const button = document.createElement("button");

  button.type = "button";
  button.textContent = "Löschen";
  button.className = "action-btn delete";

  button.addEventListener("click", function () {
    deleteBooking(bookingId);
  });

  return button;
}

async function updateBookingStatus(bookingId, status) {
  try {
    const response = await fetch(
      `${API_BASE_URL}/api/admin/bookings/${bookingId}/status`,
      {
        method: "PATCH",
        headers: authHeaders(),
        body: JSON.stringify({ status }),
      }
    );

    if (handleUnauthorized(response)) return;

    const data = await response.json();

    if (!response.ok || !data.success) {
      throw new Error(data.message || "Status konnte nicht geändert werden.");
    }

    await loadBookings();
  } catch (error) {
    alert(error.message);
  }
}

function openEditBooking(bookingId) {
  const booking = allBookings.find(function (item) {
    return String(item.id) === String(bookingId);
  });

  if (!booking) return;

  editBookingId.value = booking.id;
  editPatientName.value = safeText(booking.patient_name);
  editEmail.value = safeText(booking.email);
  editPhone.value = safeText(booking.phone);
  editService.value = safeText(booking.service);
  editBookingDate.value = formatDate(booking.booking_date);
  editBookingTime.value = formatTime(booking.booking_time);
  editNotes.value = safeText(booking.notes);

  setMessage(editBookingMessage, "", "");

  editBookingSection.style.display = "block";
  editBookingSection.scrollIntoView({
    behavior: "smooth",
    block: "start",
  });
}

function closeEditBooking() {
  editBookingForm.reset();
  editBookingId.value = "";
  editBookingSection.style.display = "none";
  setMessage(editBookingMessage, "", "");
}

editBookingForm.addEventListener("submit", async function (event) {
  event.preventDefault();

  try {
    setMessage(editBookingMessage, "Änderungen werden gespeichert...", "info");

    const response = await fetch(
      `${API_BASE_URL}/api/admin/bookings/${editBookingId.value}`,
      {
        method: "PUT",
        headers: authHeaders(),
        body: JSON.stringify({
          patientName: editPatientName.value.trim(),
          email: editEmail.value.trim().toLowerCase(),
          phone: editPhone.value.trim(),
          service: editService.value,
          bookingDate: editBookingDate.value,
          bookingTime: editBookingTime.value,
          notes: editNotes.value.trim(),
        }),
      }
    );

    if (handleUnauthorized(response)) return;

    const data = await response.json();

    if (!response.ok || !data.success) {
      throw new Error(data.message || "Termin konnte nicht aktualisiert werden.");
    }

    setMessage(editBookingMessage, "Termin wurde aktualisiert.", "success");

    await loadBookings();

    setTimeout(function () {
      closeEditBooking();
    }, 700);
  } catch (error) {
    setMessage(editBookingMessage, error.message, "error");
  }
});

cancelEditButton.addEventListener("click", closeEditBooking);

async function deleteBooking(bookingId) {
  const confirmDelete = confirm("Diesen Termin wirklich löschen?");

  if (!confirmDelete) return;

  try {
    const response = await fetch(
      `${API_BASE_URL}/api/admin/bookings/${bookingId}`,
      {
        method: "DELETE",
        headers: authHeaders(),
      }
    );

    if (handleUnauthorized(response)) return;

    const data = await response.json();

    if (!response.ok || !data.success) {
      throw new Error(data.message || "Termin konnte nicht gelöscht werden.");
    }

    await loadBookings();
  } catch (error) {
    alert(error.message);
  }
}

async function loadHomepageSettings() {
  if (!homepageSettingsForm) return;

  try {
    const response = await fetch(`${API_BASE_URL}/api/homepage-settings`);
    const data = await response.json();

    if (!response.ok || !data.success || !data.settings) {
      return;
    }

    appointmentLabelInput.value = data.settings.appointment_label || "";
    appointmentTextInput.value = data.settings.appointment_text || "";
    appointmentLinkTextInput.value = data.settings.appointment_link_text || "";
  } catch (error) {
    console.error(error);
  }
}

homepageSettingsForm.addEventListener("submit", async function (event) {
  event.preventDefault();

  try {
    setMessage(homepageSettingsMessage, "Startseite wird gespeichert...", "info");

    const response = await fetch(`${API_BASE_URL}/api/homepage-settings`, {
      method: "PUT",
      headers: authHeaders(),
      body: JSON.stringify({
        appointmentLabel: appointmentLabelInput.value.trim(),
        appointmentText: appointmentTextInput.value.trim(),
        appointmentLinkText: appointmentLinkTextInput.value.trim(),
      }),
    });

    if (handleUnauthorized(response)) return;

    const data = await response.json();

    if (!response.ok || !data.success) {
      throw new Error(data.message || "Startseite konnte nicht gespeichert werden.");
    }

    setMessage(homepageSettingsMessage, "Startseite wurde gespeichert.", "success");
  } catch (error) {
    setMessage(homepageSettingsMessage, error.message, "error");
  }
});

adminTabs.forEach(function (tab) {
  tab.addEventListener("click", function () {
    adminTabs.forEach(function (item) {
      item.classList.remove("active");
    });

    tab.classList.add("active");
    currentTabStatus = tab.dataset.status || "pending";

    statusFilter.value = "all";
    applyFilters();
  });
});

adminSearch.addEventListener("input", applyFilters);
statusFilter.addEventListener("change", applyFilters);
refreshBookingsButton.addEventListener("click", loadBookings);

logoutButton.addEventListener("click", function () {
  localStorage.removeItem("adminToken");
  window.location.href = "admin-login.html";
});

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

function initMobileNavigation() {
  const menuToggle = document.getElementById("menuToggle");
  const mainNav = document.getElementById("mainNav");

  if (!menuToggle || !mainNav) return;

  menuToggle.addEventListener("click", function () {
    menuToggle.classList.toggle("is-open");
    mainNav.classList.toggle("is-open");
  });
}

loadHomepageSettings();
loadBookings();
initRevealAnimations();
initMobileNavigation();
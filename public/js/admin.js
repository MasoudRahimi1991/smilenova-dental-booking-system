const adminToken = localStorage.getItem("adminToken");

if (!adminToken) {
  window.location.href = "/admin-login.html";
}

const API_BASE_URL = "";

const bookingsTableBody = document.getElementById("bookingsTableBody");
const adminCount = document.getElementById("adminCount");
const refreshBookingsButton = document.getElementById("refreshBookings");
const adminSearch = document.getElementById("adminSearch");
const statusFilter = document.getElementById("statusFilter");
const logoutButton = document.getElementById("logoutButton");

const homepageSettingsForm = document.getElementById("homepageSettingsForm");
const appointmentLabelInput = document.getElementById("appointmentLabel");
const appointmentTextInput = document.getElementById("appointmentText");
const appointmentLinkTextInput = document.getElementById("appointmentLinkText");
const homepageSettingsMessage = document.getElementById("homepageSettingsMessage");
function clearHomepageSettingsMessage() {
  homepageSettingsMessage.textContent = "";
  homepageSettingsMessage.className = "form-message";
}

appointmentLabelInput.addEventListener(
  "input",
  clearHomepageSettingsMessage
);

appointmentTextInput.addEventListener(
  "input",
  clearHomepageSettingsMessage
);

appointmentLinkTextInput.addEventListener(
  "input",
  clearHomepageSettingsMessage
);

const totalBookings = document.getElementById("totalBookings");
const pendingBookings = document.getElementById("pendingBookings");
const confirmedBookings = document.getElementById("confirmedBookings");
const inProgressBookings = document.getElementById("inProgressBookings");
const completedBookings = document.getElementById("completedBookings");
const cancelledBookings = document.getElementById("cancelledBookings");

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
const cancelEditBooking = document.getElementById("cancelEditBooking");

const adminTabs = document.querySelectorAll(".admin-tab");

let allBookings = [];
let currentTabStatus = "pending";

function authHeaders() {
  return {
    "Content-Type": "application/json",
    "Authorization": `Bearer ${adminToken}`
  };
}

function safeText(value) {
  return String(value || "");
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

function handleUnauthorized(response) {
  if (response.status === 401 || response.status === 403) {
    localStorage.removeItem("adminToken");
    window.location.href = "/admin-login.html";
    return true;
  }

  return false;
}

function setMessage(element, message, type) {
  element.textContent = message;
  element.className = `form-message ${type}`;
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
  bookingsTableBody.innerHTML = `
    <tr>
      <td colspan="7">Termine werden geladen...</td>
    </tr>
  `;

  try {
    const response = await fetch(`${API_BASE_URL}/api/admin/bookings`, {
      method: "GET",
      headers: authHeaders()
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
    bookingsTableBody.innerHTML = `
      <tr>
        <td colspan="7">Termine konnten nicht geladen werden.</td>
      </tr>
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
  bookingsTableBody.innerHTML = "";

  if (!bookings.length) {
    bookingsTableBody.innerHTML = `
      <tr>
        <td colspan="7">Keine Termine in diesem Bereich.</td>
      </tr>
    `;

    adminCount.textContent = "0 Termine gefunden.";
    return;
  }

  adminCount.textContent = `${bookings.length} Termine gefunden.`;

  bookings.forEach(function (booking) {
    const row = document.createElement("tr");

    row.appendChild(createPatientCell(booking));
    row.appendChild(createContactCell(booking));
    row.appendChild(createTextCell(booking.service));
    row.appendChild(createTextCell(formatDate(booking.booking_date)));
    row.appendChild(createTextCell(formatTime(booking.booking_time)));
    row.appendChild(createStatusCell(booking.status));
    row.appendChild(createActionsCell(booking));

    bookingsTableBody.appendChild(row);
  });
}

function createTextCell(value) {
  const cell = document.createElement("td");
  cell.textContent = safeText(value);
  return cell;
}

function createPatientCell(booking) {
  const cell = document.createElement("td");

  const strong = document.createElement("strong");
  strong.textContent = safeText(booking.patient_name);

  const small = document.createElement("small");
  small.textContent = safeText(booking.notes || "Keine Hinweise");

  cell.appendChild(strong);
  cell.appendChild(document.createElement("br"));
  cell.appendChild(small);

  return cell;
}

function createContactCell(booking) {
  const cell = document.createElement("td");

  cell.textContent = safeText(booking.email);
  cell.appendChild(document.createElement("br"));

  const small = document.createElement("small");
  small.textContent = safeText(booking.phone);

  cell.appendChild(small);

  return cell;
}

function createStatusCell(status) {
  const cell = document.createElement("td");

  const badge = document.createElement("span");
  badge.className = `status-badge ${safeText(status)}`;
  badge.textContent = getStatusLabel(status);

  cell.appendChild(badge);

  return cell;
}

function createActionsCell(booking) {
  const cell = document.createElement("td");
  const wrapper = document.createElement("div");

  wrapper.className = "admin-actions";

  wrapper.appendChild(createStatusButton("Inbox", "pending", booking.id));
  wrapper.appendChild(createStatusButton("Bestätigen", "confirmed", booking.id));
  wrapper.appendChild(createStatusButton("Bearbeiten", "in_progress", booking.id));
  wrapper.appendChild(createStatusButton("Abschließen", "completed", booking.id));
  wrapper.appendChild(createStatusButton("Stornieren", "cancelled", booking.id));
  wrapper.appendChild(createEditButton(booking.id));
  wrapper.appendChild(createDeleteButton(booking.id));

  cell.appendChild(wrapper);

  return cell;
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
    const response = await fetch(`${API_BASE_URL}/api/admin/bookings/${bookingId}/status`, {
      method: "PATCH",
      headers: authHeaders(),
      body: JSON.stringify({ status: status })
    });

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

async function deleteBooking(bookingId) {
  const confirmDelete = confirm("Möchten Sie diesen Termin wirklich löschen?");

  if (!confirmDelete) return;

  try {
    const response = await fetch(`${API_BASE_URL}/api/admin/bookings/${bookingId}`, {
      method: "DELETE",
      headers: authHeaders()
    });

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

function openEditBooking(bookingId) {
  const booking = allBookings.find(function (item) {
    return item.id === bookingId;
  });

  if (!booking) return;

  editBookingId.value = booking.id;
  editPatientName.value = safeText(booking.patient_name);
  editEmail.value = safeText(booking.email);
  editPhone.value = safeText(booking.phone);
  editService.value = safeText(booking.service);
  editBookingDate.value = formatDate(booking.booking_date);
  editBookingTime.value = formatTime(booking.booking_time);
  editNotes.value = safeText(booking.notes || "");

  editBookingSection.style.display = "block";
  editBookingMessage.textContent = "";

  editBookingSection.scrollIntoView({ behavior: "smooth" });
}

function validateEditBookingForm() {
  const values = [
    editPatientName.value,
    editEmail.value,
    editPhone.value,
    editService.value,
    editBookingDate.value,
    editBookingTime.value,
    editNotes.value
  ];

  if (values.some(containsDangerousInput)) {
    return "Ungültige Eingabe erkannt.";
  }

  if (editPatientName.value.trim().length < 2 || editPatientName.value.trim().length > 60) {
    return "Der Name muss zwischen 2 und 60 Zeichen lang sein.";
  }

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(editEmail.value.trim())) {
    return "Bitte geben Sie eine gültige E-Mail-Adresse ein.";
  }

  if (!/^[0-9+\-\s()]{6,30}$/.test(editPhone.value.trim())) {
    return "Bitte geben Sie eine gültige Telefonnummer ein.";
  }

  if (!editService.value || !editBookingDate.value || !editBookingTime.value) {
    return "Bitte füllen Sie alle Pflichtfelder aus.";
  }

  if (editNotes.value.trim().length > 500) {
    return "Der Hinweis darf maximal 500 Zeichen lang sein.";
  }

  return null;
}

editBookingForm.addEventListener("submit", async function (event) {
  event.preventDefault();

  const validationError = validateEditBookingForm();

  if (validationError) {
    setMessage(editBookingMessage, validationError, "error");
    return;
  }

  try {
    const response = await fetch(`${API_BASE_URL}/api/admin/bookings/${editBookingId.value}`, {
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
        website: ""
      })
    });

    if (handleUnauthorized(response)) return;

    const data = await response.json();

    if (!response.ok || !data.success) {
      throw new Error(data.message || "Termin konnte nicht geändert werden.");
    }

    setMessage(editBookingMessage, data.message, "success");

    editBookingSection.style.display = "none";
    editBookingForm.reset();

    await loadBookings();
  } catch (error) {
    setMessage(editBookingMessage, error.message, "error");
  }
});

async function loadHomepageSettings() {
  try {
    const response = await fetch(`${API_BASE_URL}/api/homepage-settings`);
    const data = await response.json();

    if (!response.ok || !data.success || !data.settings) {
      throw new Error("Einstellungen konnten nicht geladen werden.");
    }

    appointmentLabelInput.value = data.settings.appointment_label;
    appointmentTextInput.value = data.settings.appointment_text;
    appointmentLinkTextInput.value = data.settings.appointment_link_text;
  } catch (error) {
    setMessage(homepageSettingsMessage, error.message, "error");
  }
}

homepageSettingsForm.addEventListener("submit", async function (event) {
  event.preventDefault();
  clearHomepageSettingsMessage();

  const values = [
    appointmentLabelInput.value,
    appointmentTextInput.value,
    appointmentLinkTextInput.value
  ];

  if (values.some(containsDangerousInput)) {
    setMessage(homepageSettingsMessage, "Ungültige Eingabe erkannt.", "error");
    return;
  }

  try {
    const response = await fetch(`${API_BASE_URL}/api/homepage-settings`, {
      method: "PUT",
      headers: authHeaders(),
      body: JSON.stringify({
        appointmentLabel: appointmentLabelInput.value.trim(),
        appointmentText: appointmentTextInput.value.trim(),
        appointmentLinkText: appointmentLinkTextInput.value.trim()
      })
    });

    if (handleUnauthorized(response)) return;

    const data = await response.json();

    if (!response.ok || !data.success) {
      throw new Error(data.message || "Einstellungen konnten nicht gespeichert werden.");
    }

    setMessage(homepageSettingsMessage, data.message, "success");
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
    currentTabStatus = tab.dataset.status;
    statusFilter.value = "all";

    applyFilters();
  });
});

cancelEditBooking.addEventListener("click", function () {
  editBookingSection.style.display = "none";
  editBookingForm.reset();
});

refreshBookingsButton.addEventListener("click", loadBookings);
adminSearch.addEventListener("input", applyFilters);
statusFilter.addEventListener("change", applyFilters);

logoutButton.addEventListener("click", function () {
  localStorage.removeItem("adminToken");
  window.location.href = "/admin-login.html";
});

document.addEventListener("DOMContentLoaded", function () {
  loadBookings();
  loadHomepageSettings();
});
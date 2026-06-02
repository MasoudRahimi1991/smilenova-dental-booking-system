const bookingsTableBody = document.getElementById("bookingsTableBody");
const adminCount = document.getElementById("adminCount");
const refreshBookingsButton = document.getElementById("refreshBookings");
const adminSearch = document.getElementById("adminSearch");
const statusFilter = document.getElementById("statusFilter");
let allBookings = [];
const homepageSettingsForm = document.getElementById("homepageSettingsForm");
const appointmentLabelInput = document.getElementById("appointmentLabel");
const appointmentTextInput = document.getElementById("appointmentText");
const appointmentLinkTextInput = document.getElementById("appointmentLinkText");
const homepageSettingsMessage = document.getElementById("homepageSettingsMessage");
const totalBookings = document.getElementById("totalBookings");
const confirmedBookings = document.getElementById("confirmedBookings");
const completedBookings = document.getElementById("completedBookings");
const cancelledBookings = document.getElementById("cancelledBookings");
const editBookingSection = document.getElementById("editBookingSection");
const editBookingForm = document.getElementById("editBookingForm");
const editBookingId = document.getElementById("editBookingId");
const editPatientName = document.getElementById("editPatientName");
const editEmail = document.getElementById("editEmail");
const editPhone = document.getElementById("editPhone");
const editService = document.getElementById("editService");
const editDoctor = document.getElementById("editDoctor");
const editBookingDate = document.getElementById("editBookingDate");
const editBookingTime = document.getElementById("editBookingTime");
const editNotes = document.getElementById("editNotes");
const editBookingMessage = document.getElementById("editBookingMessage");
const cancelEditBooking = document.getElementById("cancelEditBooking");

const API_BASE_URL = "https://smilenova-dental-booking-system.onrender.com";

document.addEventListener("DOMContentLoaded", function () {
  loadBookings();
});

refreshBookingsButton.addEventListener("click", function () {
  loadBookings();
});

function loadBookings() {
  bookingsTableBody.innerHTML = `
    <tr>
      <td colspan="8">Termine werden geladen...</td>
    </tr>
  `;

  fetch(`${API_BASE_URL}/api/admin/bookings`)
    .then(function (response) {
      if (!response.ok) {
        throw new Error("Failed to load bookings.");
      }

      return response.json();
    })
 .then(function (bookings) {
  allBookings = bookings;
  updateDashboardStats(bookings);
  applyFilters();
})
    .catch(function () {
      bookingsTableBody.innerHTML = `
        <tr>
          <td colspan="8">Termine konnten nicht geladen werden.</td>
        </tr>
      `;

      adminCount.textContent = "Fehler beim Laden der Termine.";
    });
}

function renderBookings(bookings) {
  bookingsTableBody.innerHTML = "";

  if (bookings.length === 0) {
    bookingsTableBody.innerHTML = `
      <tr>
        <td colspan="8">Keine Termine vorhanden.</td>
      </tr>
    `;

    adminCount.textContent = "0 Termine gefunden.";
    return;
  }

  adminCount.textContent = `${bookings.length} Termine gefunden.`;

  bookings.forEach(function (booking) {
    const row = document.createElement("tr");

    row.innerHTML = `
      <td>
        <strong>${booking.patient_name}</strong>
        <br />
        <small>${booking.notes || "Keine Hinweise"}</small>
      </td>

      <td>
        ${booking.email}
        <br />
        <small>${booking.phone}</small>
      </td>

      <td>${booking.service}</td>
      <td>${booking.doctor}</td>
      <td>${booking.booking_date}</td>
      <td>${booking.booking_time}</td>

      <td>
        <span class="status-badge ${booking.status}">
          ${getStatusLabel(booking.status)}
        </span>
      </td>

      <td>
        <div class="admin-actions">
          <button onclick="updateBookingStatus(${booking.id}, 'confirmed')" class="action-btn confirm">
            Bestätigen
          </button>

          <button onclick="updateBookingStatus(${booking.id}, 'completed')" class="action-btn complete">
            Abschließen
          </button>

          <button onclick="updateBookingStatus(${booking.id}, 'cancelled')" class="action-btn cancel">
            Stornieren
          </button>
          <button onclick="openEditBooking(${booking.id})" class="action-btn edit">
  Bearbeiten
</button>

          <button onclick="deleteBooking(${booking.id})" class="action-btn delete">
            Löschen
          </button>
        </div>
      </td>
    `;

    bookingsTableBody.appendChild(row);
  });
}

function updateBookingStatus(bookingId, status) {
  fetch(`${API_BASE_URL}/api/admin/bookings/${bookingId}/status`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      status: status
    })
  })
    .then(function (response) {
      if (!response.ok) {
        throw new Error("Failed to update booking status.");
      }

      return response.json();
    })
    .then(function () {
      loadBookings();
    })
    .catch(function (error) {
      alert(error.message);
    });
}

function deleteBooking(bookingId) {
  const confirmDelete = confirm("Möchten Sie diesen Termin wirklich löschen?");

  if (!confirmDelete) {
    return;
  }

  fetch(`${API_BASE_URL}/api/admin/bookings/${bookingId}`, {
    method: "DELETE"
  })
    .then(function (response) {
      if (!response.ok) {
        throw new Error("Failed to delete booking.");
      }

      return response.json();
    })
    .then(function () {
      loadBookings();
    })
    .catch(function (error) {
      alert(error.message);
    });
}
adminSearch.addEventListener("input", function () {
  applyFilters();
});

statusFilter.addEventListener("change", function () {
  applyFilters();
});

function applyFilters() {
  const searchValue = adminSearch.value.toLowerCase().trim();
  const selectedStatus = statusFilter.value;

  let filteredBookings = allBookings.filter(function (booking) {
    const patientName = booking.patient_name.toLowerCase();
    const email = booking.email.toLowerCase();
    const phone = booking.phone.toLowerCase();

    const matchesSearch =
      patientName.includes(searchValue) ||
      email.includes(searchValue) ||
      phone.includes(searchValue);

    const matchesStatus =
      selectedStatus === "all" || booking.status === selectedStatus;

    return matchesSearch && matchesStatus;
  });

  renderBookings(filteredBookings);
}
loadHomepageSettings();

function loadHomepageSettings() {
  fetch(`${API_BASE_URL}/api/homepage-settings`)
    .then(function (response) {
      if (!response.ok) {
        throw new Error("Failed to load homepage settings.");
      }

      return response.json();
    })
    .then(function (settings) {
      appointmentLabelInput.value = settings.appointment_label;
      appointmentTextInput.value = settings.appointment_text;
      appointmentLinkTextInput.value = settings.appointment_link_text;
    })
    .catch(function () {
      homepageSettingsMessage.textContent = "Einstellungen konnten nicht geladen werden.";
    });
}

homepageSettingsForm.addEventListener("submit", function (event) {
  event.preventDefault();

  const settingsData = {
    appointmentLabel: appointmentLabelInput.value.trim(),
    appointmentText: appointmentTextInput.value.trim(),
    appointmentLinkText: appointmentLinkTextInput.value.trim()
  };

  fetch(`${API_BASE_URL}/api/homepage-settings`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify(settingsData)
  })
    .then(function (response) {
      if (!response.ok) {
        throw new Error("Failed to save homepage settings.");
      }

      return response.json();
    })
    .then(function (data) {
      homepageSettingsMessage.textContent = data.message;
    })
    .catch(function (error) {
      homepageSettingsMessage.textContent = error.message;
    });
});
function getStatusLabel(status) {
  if (status === "confirmed") {
    return "Bestätigt";
  }

  if (status === "completed") {
    return "Abgeschlossen";
  }

  if (status === "cancelled") {
    return "Storniert";
  }

  return status;
}
function updateDashboardStats(bookings) {
  const total = bookings.length;

  const confirmed = bookings.filter(function (booking) {
    return booking.status === "confirmed";
  }).length;

  const completed = bookings.filter(function (booking) {
    return booking.status === "completed";
  }).length;

  const cancelled = bookings.filter(function (booking) {
    return booking.status === "cancelled";
  }).length;

  totalBookings.textContent = total;
  confirmedBookings.textContent = confirmed;
  completedBookings.textContent = completed;
  cancelledBookings.textContent = cancelled;
}
function openEditBooking(bookingId) {
  const booking = allBookings.find(function (item) {
    return item.id === bookingId;
  });

  if (!booking) {
    return;
  }

  editBookingId.value = booking.id;
  editPatientName.value = booking.patient_name;
  editEmail.value = booking.email;
  editPhone.value = booking.phone;
  editService.value = booking.service;
  editDoctor.value = booking.doctor;
  editBookingDate.value = booking.booking_date;
  editBookingTime.value = booking.booking_time;
  editNotes.value = booking.notes || "";

  editBookingSection.style.display = "block";
  editBookingMessage.textContent = "";

  editBookingSection.scrollIntoView({
    behavior: "smooth"
  });
}

cancelEditBooking.addEventListener("click", function () {
  editBookingSection.style.display = "none";
  editBookingForm.reset();
});

editBookingForm.addEventListener("submit", function (event) {
  event.preventDefault();

  const bookingId = editBookingId.value;

  const updatedBooking = {
    patientName: editPatientName.value.trim(),
    email: editEmail.value.trim(),
    phone: editPhone.value.trim(),
    service: editService.value,
    doctor: editDoctor.value,
    bookingDate: editBookingDate.value,
    bookingTime: editBookingTime.value,
    notes: editNotes.value.trim()
  };

  fetch(`${API_BASE_URL}/api/admin/bookings/${bookingId}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify(updatedBooking)
  })
    .then(function (response) {
      if (!response.ok) {
        throw new Error("Failed to update booking.");
      }

      return response.json();
    })
  .then(function (data) {
  editBookingMessage.textContent = data.message;

  editBookingSection.style.display = "none";
  editBookingForm.reset();

  loadBookings();

  document.querySelector(".admin-table-wrapper").scrollIntoView({
    behavior: "smooth"
  });
})
    .catch(function (error) {
      editBookingMessage.textContent = error.message;
    });
});
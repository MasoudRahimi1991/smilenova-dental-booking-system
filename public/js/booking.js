const bookingForm = document.getElementById("bookingForm");
const serviceInput = document.getElementById("service");
const doctorInput = document.getElementById("doctor");
const bookingDateInput = document.getElementById("bookingDate");
const slotGrid = document.getElementById("slotGrid");
const bookingTimeInput = document.getElementById("bookingTime");
const formMessage = document.getElementById("formMessage");

const API_BASE_URL = "http://localhost:3000";
const today = new Date().toISOString().split("T")[0];
bookingDateInput.setAttribute("min", today);

bookingDateInput.addEventListener("change", function () {
  const selectedDate = bookingDateInput.value;
    const selectedDay = new Date(selectedDate).getDay();

  if (selectedDay === 0 || selectedDay === 6) {
    bookingTimeInput.value = "";

    slotGrid.innerHTML = `
      <p class="slot-placeholder">
        Die Praxis ist am Wochenende geschlossen.
      </p>
    `;

    return;
  }

  bookingTimeInput.value = "";

  if (!selectedDate) {
    slotGrid.innerHTML = `
      <p class="slot-placeholder">
        Bitte wählen Sie zuerst ein Datum aus.
      </p>
    `;
    return;
  }

  loadAvailableSlots(selectedDate);
});

function loadAvailableSlots(selectedDate) {
  slotGrid.innerHTML = `
    <p class="slot-placeholder">
      Freie Uhrzeiten werden geladen...
    </p>
  `;

  fetch(`${API_BASE_URL}/api/slots?date=${selectedDate}`)
    .then(function (response) {
      if (!response.ok) {
        throw new Error("Failed to load slots.");
      }

      return response.json();
    })
    .then(function (slots) {
      renderSlots(slots);
    })
    .catch(function () {
      slotGrid.innerHTML = `
        <p class="slot-placeholder">
          Die freien Uhrzeiten konnten nicht geladen werden.
        </p>
      `;
    });
}

function renderSlots(slots) {
  slotGrid.innerHTML = "";

  slots.forEach(function (slot) {
    const button = document.createElement("button");

    button.type = "button";
    button.textContent = slot.time;
    button.classList.add("slot-btn");

    if (!slot.available) {
      button.classList.add("disabled");
      button.disabled = true;
    }

    button.addEventListener("click", function () {
      selectSlot(button, slot.time);
    });

    slotGrid.appendChild(button);
  });
}

function selectSlot(clickedButton, selectedTime) {
  const allSlotButtons = document.querySelectorAll(".slot-btn");

  allSlotButtons.forEach(function (button) {
    button.classList.remove("active");
  });

  clickedButton.classList.add("active");
  bookingTimeInput.value = selectedTime;
}

bookingForm.addEventListener("submit", function (event) {
  event.preventDefault();

  if (!bookingTimeInput.value) {
    showMessage("Bitte wählen Sie eine freie Uhrzeit aus.", "error");
    return;
  }

  const bookingData = {
    patientName: document.getElementById("patientName").value.trim(),
    email: document.getElementById("email").value.trim(),
    phone: document.getElementById("phone").value.trim(),
    service: serviceInput.value,
    doctor: doctorInput.value,
    bookingDate: bookingDateInput.value,
    bookingTime: bookingTimeInput.value,
    notes: document.getElementById("notes").value.trim()
  };

  createBooking(bookingData);
});

function createBooking(bookingData) {
  showMessage("Termin wird gespeichert...", "info");

  fetch(`${API_BASE_URL}/api/bookings`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify(bookingData)
  })
    .then(function (response) {
      return response.json().then(function (data) {
        if (!response.ok) {
          throw new Error(data.message || "Booking failed.");
        }

        return data;
      });
    })
    .then(function (data) {
      showMessage(data.message, "success");

      bookingForm.reset();
      bookingTimeInput.value = "";

      slotGrid.innerHTML = `
        <p class="slot-placeholder">
          Bitte wählen Sie zuerst ein Datum aus.
        </p>
      `;
    })
    .catch(function (error) {
      showMessage(error.message, "error");
    });
}

function showMessage(message, type) {
  formMessage.textContent = message;

  formMessage.classList.remove("success", "error", "info");
  formMessage.classList.add(type);
}
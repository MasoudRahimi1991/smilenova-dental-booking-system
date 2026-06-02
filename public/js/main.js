const HOME_API_BASE_URL = "https://smilenova-dental-booking-system.onrender.com";

document.addEventListener("DOMContentLoaded", function () {
  setupMobileMenu();
  loadHomepageSettings();
});

function setupMobileMenu() {
  const menuToggle = document.getElementById("menuToggle");
  const mainNav = document.getElementById("mainNav");

  if (!menuToggle || !mainNav) {
    return;
  }

  menuToggle.addEventListener("click", function () {
    mainNav.classList.toggle("is-open");
    menuToggle.classList.toggle("is-open");
  });

  mainNav.addEventListener("click", function (event) {
    if (event.target.tagName === "A") {
      mainNav.classList.remove("is-open");
      menuToggle.classList.remove("is-open");
    }
  });
}

function loadHomepageSettings() {
  const homepageAppointmentLabel = document.getElementById("homepageAppointmentLabel");
  const homepageAppointmentText = document.getElementById("homepageAppointmentText");
  const homepageAppointmentLinkText = document.getElementById("homepageAppointmentLinkText");

  if (
    !homepageAppointmentLabel ||
    !homepageAppointmentText ||
    !homepageAppointmentLinkText
  ) {
    return;
  }

  fetch(`${HOME_API_BASE_URL}/api/homepage-settings`)
    .then(function (response) {
      if (!response.ok) {
        throw new Error("Failed to load homepage settings.");
      }

      return response.json();
    })
    .then(function (settings) {
      homepageAppointmentLabel.textContent = settings.appointment_label;
      homepageAppointmentText.textContent = settings.appointment_text;
      homepageAppointmentLinkText.textContent = settings.appointment_link_text;
    })
    .catch(function () {
      console.log("Homepage settings could not be loaded.");
    });
}
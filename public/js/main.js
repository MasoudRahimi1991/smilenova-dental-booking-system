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

    homepageAppointmentLinkText.textContent =
      safeText(data.settings.appointment_link_text);
  } catch (error) {
    console.error("Homepage settings could not be loaded.");
  }
}

loadHomepageSettings();
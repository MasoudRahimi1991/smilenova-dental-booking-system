const adminLoginForm = document.getElementById("adminLoginForm");
const loginMessage = document.getElementById("loginMessage");

const usernameInput = document.getElementById("username");
const passwordInput = document.getElementById("password");
const websiteInput = document.getElementById("website");

const API_BASE_URL = "";

function setMessage(message, type) {
  loginMessage.textContent = message;
  loginMessage.className = `login-message ${type}`;
}

function containsDangerousInput(value) {
  const dangerousPatterns = [
    /<script/i,
    /<\/script/i,
    /javascript:/i,
    /onerror=/i,
    /onload=/i,
    /<iframe/i,
    /<object/i,
    /<embed/i
  ];

  return dangerousPatterns.some(function (pattern) {
    return pattern.test(value);
  });
}

function validateLoginInput(username, password, website) {
  if (website.trim() !== "") {
    return "Spam detected.";
  }

  if (!username || !password) {
    return "Please fill in all required fields.";
  }

  if (username.length < 3 || username.length > 40) {
    return "Username must be between 3 and 40 characters.";
  }

  if (password.length < 8 || password.length > 100) {
    return "Password must be between 8 and 100 characters.";
  }

  if (containsDangerousInput(username) || containsDangerousInput(password)) {
    return "Invalid characters detected.";
  }

  return null;
}

adminLoginForm.addEventListener("submit", async function (event) {
  event.preventDefault();

  const username = usernameInput.value.trim();
  const password = passwordInput.value;
  const website = websiteInput.value;

  const validationError = validateLoginInput(username, password, website);

  if (validationError) {
    setMessage(validationError, "error");
    return;
  }

  try {
    setMessage("Checking login data...", "info");

    const response = await fetch(`${API_BASE_URL}/api/admin/login`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        username: username,
        password: password,
        website: website
      })
    });

    const data = await response.json();

    if (!response.ok) {
      setMessage(data.message || "Login failed.", "error");
      return;
    }

    if (!data.token) {
      setMessage("Login failed. No token received.", "error");
      return;
    }

    localStorage.setItem("adminToken", data.token);

    setMessage("Login successful. Redirecting...", "success");

    setTimeout(function () {
      window.location.href = "/admin.html";
    }, 600);
  } catch (error) {
    setMessage("Server connection failed.", "error");
  }
});
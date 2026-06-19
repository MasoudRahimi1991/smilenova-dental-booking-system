const path = require("path");
const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const compression = require("compression");
const morgan = require("morgan");
const validator = require("validator");
const xss = require("xss");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const { Pool } = require("pg");
const { rateLimit } = require("express-rate-limit");
const { slowDown } = require("express-slow-down");

require("dotenv").config();

const app = express();
const PORT = process.env.PORT || 3000;

app.disable("x-powered-by");
app.set("trust proxy", 1);

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl:
    process.env.NODE_ENV === "production"
      ? { rejectUnauthorized: false }
      : false
});

const allowedOrigins = [
    "http://localhost:3000",
    "http://127.0.0.1:3000",
    "http://127.0.0.1:5500",
    "https://smilenova-dental-booking-system.onrender.com",
    process.env.FRONTEND_URL
].filter(Boolean);

app.use(
  helmet({
    crossOriginResourcePolicy: { policy: "cross-origin" }
  })
);

app.use(
  cors({
    origin: function (origin, callback) {
      if (!origin || allowedOrigins.includes(origin)) {
        return callback(null, true);
      }

      return callback(new Error("Not allowed by CORS"));
    },
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE"],
    allowedHeaders: ["Content-Type", "Authorization"],
    credentials: false
  })
);

app.use(compression());
app.use(morgan(process.env.NODE_ENV === "production" ? "combined" : "dev"));
app.use(express.json({ limit: "10kb" }));
app.use(express.urlencoded({ extended: false, limit: "10kb" }));
app.use(express.static(path.join(__dirname, "public")));

const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 150,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: "Too many requests. Please try again later."
  }
});

const bookingLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 8,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: "Too many booking attempts. Please try again later."
  }
});

const adminLoginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: "Too many login attempts. Please try again later."
  }
});

const speedLimiter = slowDown({
  windowMs: 15 * 60 * 1000,
  delayAfter: 5,
  delayMs: function (hits) {
    return hits * 300;
  }
});

app.use("/api", generalLimiter);

const availableTimes = [
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

const allowedStatuses = [
  "pending",
  "confirmed",
  "in_progress",
  "completed",
  "cancelled"
];

function sanitizeText(value) {
  return xss(String(value || "").trim());
}

function hasOnlyAllowedFields(body, allowedFields) {
  return Object.keys(body).every(function (field) {
    return allowedFields.includes(field);
  });
}

function containsDangerousInput(value) {
  const dangerousPatterns = [
    /<script/i,
    /<\/script/i,
    /javascript:/i,
    /onerror=/i,
    /onload=/i,
    /onclick=/i,
    /<iframe/i,
    /<object/i,
    /<embed/i
  ];

  return dangerousPatterns.some(function (pattern) {
    return pattern.test(String(value));
  });
}

function isValidDate(value) {
  return /^\d{4}-\d{2}-\d{2}$/.test(value);
}

function isPastDate(dateValue) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const selectedDate = new Date(dateValue);
  selectedDate.setHours(0, 0, 0, 0);

  return selectedDate < today;
}

function isWeekend(dateValue) {
  const day = new Date(dateValue).getDay();
  return day === 0 || day === 6;
}

function isValidId(id) {
  return validator.isInt(String(id), { min: 1 });
}

function isValidPhone(phone) {
  return /^[0-9+\-\s()]{6,30}$/.test(phone);
}

function validateBookingBody(body) {
  const allowedFields = [
    "patientName",
    "email",
    "phone",
    "service",
    "bookingDate",
    "bookingTime",
    "notes",
    "website"
  ];

  if (!hasOnlyAllowedFields(body, allowedFields)) {
    return "Unknown fields are not allowed.";
  }

  if (body.website && String(body.website).trim() !== "") {
    return "Spam detected.";
  }

  const patientName = sanitizeText(body.patientName);
  const email = sanitizeText(body.email);
  const phone = sanitizeText(body.phone);
  const service = sanitizeText(body.service);
  const bookingDate = sanitizeText(body.bookingDate);
  const bookingTime = sanitizeText(body.bookingTime);
  const notes = sanitizeText(body.notes);

  const valuesToCheck = [
    patientName,
    email,
    phone,
    service,
    bookingDate,
    bookingTime,
    notes
  ];

  if (valuesToCheck.some(containsDangerousInput)) {
    return "Invalid input detected.";
  }

  if (!patientName || !email || !phone || !service || !bookingDate || !bookingTime) {
    return "Please fill in all required fields.";
  }

  if (patientName.length < 2 || patientName.length > 60) {
    return "Patient name must be between 2 and 60 characters.";
  }

  if (!validator.isEmail(email) || email.length > 120) {
    return "Please enter a valid email address.";
  }

  if (!isValidPhone(phone)) {
    return "Please enter a valid phone number.";
  }

  if (!allowedServices.includes(service)) {
    return "Invalid service selected.";
  }

  if (!isValidDate(bookingDate)) {
    return "Invalid booking date.";
  }

  if (isPastDate(bookingDate)) {
    return "Booking date cannot be in the past.";
  }

  if (isWeekend(bookingDate)) {
    return "The clinic is closed on weekends.";
  }

  if (!availableTimes.includes(bookingTime)) {
    return "Invalid booking time.";
  }

  if (notes.length > 500) {
    return "Notes cannot be longer than 500 characters.";
  }

  return null;
}

function getCleanBookingData(body) {
  return {
    patientName: sanitizeText(body.patientName),
    email: sanitizeText(body.email).toLowerCase(),
    phone: sanitizeText(body.phone),
    service: sanitizeText(body.service),
    bookingDate: sanitizeText(body.bookingDate),
    bookingTime: sanitizeText(body.bookingTime),
    notes: sanitizeText(body.notes)
  };
}

function createAdminToken(username) {
  return jwt.sign(
    {
      role: "admin",
      username: username
    },
    process.env.JWT_SECRET,
    {
      expiresIn: "2h"
    }
  );
}

function requireAdmin(req, res, next) {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({
      success: false,
      message: "Unauthorized."
    });
  }

  const token = authHeader.split(" ")[1];

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    if (decoded.role !== "admin") {
      return res.status(403).json({
        success: false,
        message: "Forbidden."
      });
    }

    req.admin = decoded;
    next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      message: "Invalid or expired token."
    });
  }
}

app.get("/api/health", async function (req, res) {
  try {
    await pool.query("SELECT NOW()");

    res.json({
      success: true,
      message: "Server and database are running."
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Database connection failed."
    });
  }
});

app.post("/api/admin/login", adminLoginLimiter, speedLimiter, async function (req, res) {
  try {
    const allowedFields = ["username", "password", "website"];

    if (!hasOnlyAllowedFields(req.body, allowedFields)) {
      return res.status(400).json({
        success: false,
        message: "Unknown fields are not allowed."
      });
    }

    const username = sanitizeText(req.body.username);
    const password = String(req.body.password || "");
    const website = sanitizeText(req.body.website);

    if (website) {
      return res.status(400).json({
        success: false,
        message: "Spam detected."
      });
    }

    if (!username || !password) {
      return res.status(400).json({
        success: false,
        message: "Username and password are required."
      });
    }

    if (username.length < 3 || username.length > 40) {
      return res.status(400).json({
        success: false,
        message: "Invalid username length."
      });
    }

    if (password.length < 8 || password.length > 100) {
      return res.status(400).json({
        success: false,
        message: "Invalid password length."
      });
    }

    if (containsDangerousInput(username) || containsDangerousInput(password)) {
      return res.status(400).json({
        success: false,
        message: "Invalid input detected."
      });
    }

    if (!process.env.ADMIN_USERNAME || !process.env.ADMIN_PASSWORD_HASH || !process.env.JWT_SECRET) {
      return res.status(500).json({
        success: false,
        message: "Admin login is not configured."
      });
    }

    if (username !== process.env.ADMIN_USERNAME) {
      return res.status(401).json({
        success: false,
        message: "Invalid login data."
      });
    }

    const passwordIsValid = await bcrypt.compare(
      password,
      process.env.ADMIN_PASSWORD_HASH
    );

    if (!passwordIsValid) {
      return res.status(401).json({
        success: false,
        message: "Invalid login data."
      });
    }

    const token = createAdminToken(username);

    res.json({
      success: true,
      message: "Login successful.",
      token: token
    });
  } catch (error) {
  console.error("Admin login error:", error);

  res.status(500).json({
    success: false,
    message: "Login failed."
    });
  }
});

app.get("/api/slots", async function (req, res) {
  try {
    const selectedDate = sanitizeText(req.query.date);

    if (!selectedDate || !isValidDate(selectedDate)) {
      return res.status(400).json({
        success: false,
        message: "Valid date is required."
      });
    }

    if (isPastDate(selectedDate) || isWeekend(selectedDate)) {
      return res.json({
        success: true,
        slots: availableTimes.map(function (time) {
          return {
            time: time,
            available: false
          };
        })
      });
    }

    const result = await pool.query(
      `
      SELECT booking_time
      FROM bookings
      WHERE booking_date = $1
      AND status IN ('pending', 'confirmed')
      `,
      [selectedDate]
    );

    const bookedTimes = result.rows.map(function (row) {
      return String(row.booking_time).slice(0, 5);
    });

    const slots = availableTimes.map(function (time) {
      return {
        time: time,
        available: !bookedTimes.includes(time)
      };
    });

    res.json({
      success: true,
      slots: slots
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to load available slots."
    });
  }
});

app.post("/api/bookings", bookingLimiter, speedLimiter, async function (req, res) {
  try {
    const validationError = validateBookingBody(req.body);

    if (validationError) {
      return res.status(400).json({
        success: false,
        message: validationError
      });
    }

    const booking = getCleanBookingData(req.body);

    const existingBooking = await pool.query(
      `
      SELECT id
      FROM bookings
      WHERE booking_date = $1
      AND booking_time = $2
      AND status IN ('pending', 'confirmed')
      `,
      [booking.bookingDate, booking.bookingTime]
    );

    if (existingBooking.rows.length > 0) {
      return res.status(409).json({
        success: false,
        message: "This time slot is already booked."
      });
    }

    const result = await pool.query(
      `
      INSERT INTO bookings (
        patient_name,
        email,
        phone,
        service,
        booking_date,
        booking_time,
        notes,
        status
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, 'pending')
      RETURNING
        id,
        patient_name,
        email,
        phone,
        service,
        booking_date,
        booking_time,
        notes,
        status,
        created_at
      `,
      [
        booking.patientName,
        booking.email,
        booking.phone,
        booking.service,
        booking.bookingDate,
        booking.bookingTime,
        booking.notes
      ]
    );

    res.status(201).json({
      success: true,
      message: "Appointment request submitted successfully.",
      booking: result.rows[0]
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to create booking."
    });
  }
});

app.get("/api/admin/bookings", requireAdmin, async function (req, res) {
  try {
    const result = await pool.query(
      `
      SELECT
        id,
        patient_name,
        email,
        phone,
        service,
        booking_date,
        booking_time,
        notes,
        status,
        created_at,
        updated_at
      FROM bookings
      ORDER BY booking_date ASC, booking_time ASC
      `
    );

    res.json({
      success: true,
      bookings: result.rows
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to load bookings."
    });
  }
});

app.get("/api/admin/bookings/stats", requireAdmin, async function (req, res) {
  try {
    const result = await pool.query(
      `
      SELECT
        COUNT(*)::int AS total,
        COUNT(*) FILTER (WHERE status = 'pending')::int AS pending,
        COUNT(*) FILTER (WHERE status = 'confirmed')::int AS confirmed,
        COUNT(*) FILTER (WHERE status = 'completed')::int AS completed,
        COUNT(*) FILTER (WHERE status = 'cancelled')::int AS cancelled
      FROM bookings
      `
    );

    res.json({
      success: true,
      stats: result.rows[0]
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to load booking statistics."
    });
  }
});

app.patch("/api/admin/bookings/:id/status", requireAdmin, async function (req, res) {
  try {
    const bookingId = req.params.id;
    const status = sanitizeText(req.body.status);

    if (!isValidId(bookingId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid booking ID."
      });
    }

    if (!allowedStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: "Invalid booking status."
      });
    }

    const result = await pool.query(
      `
      UPDATE bookings
      SET status = $1, updated_at = NOW()
      WHERE id = $2
      RETURNING id, status
      `,
      [status, bookingId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Booking not found."
      });
    }

    res.json({
      success: true,
      message: "Booking status updated successfully.",
      booking: result.rows[0]
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to update booking status."
    });
  }
});

app.put("/api/admin/bookings/:id", requireAdmin, async function (req, res) {
  try {
    const bookingId = req.params.id;

    if (!isValidId(bookingId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid booking ID."
      });
    }

    const validationError = validateBookingBody(req.body);

    if (validationError) {
      return res.status(400).json({
        success: false,
        message: validationError
      });
    }

    const booking = getCleanBookingData(req.body);

    const conflict = await pool.query(
      `
      SELECT id
      FROM bookings
      WHERE booking_date = $1
      AND booking_time = $2
      AND status IN ('pending', 'confirmed')
      AND id <> $3
      `,
      [booking.bookingDate, booking.bookingTime, bookingId]
    );

    if (conflict.rows.length > 0) {
      return res.status(409).json({
        success: false,
        message: "This time slot is already booked."
      });
    }

    const result = await pool.query(
      `
      UPDATE bookings
      SET
        patient_name = $1,
        email = $2,
        phone = $3,
        service = $4,
        booking_date = $5,
        booking_time = $6,
        notes = $7,
        updated_at = NOW()
      WHERE id = $8
      RETURNING
        id,
        patient_name,
        email,
        phone,
        service,
        booking_date,
        booking_time,
        notes,
        status,
        created_at,
        updated_at
      `,
      [
        booking.patientName,
        booking.email,
        booking.phone,
        booking.service,
        booking.bookingDate,
        booking.bookingTime,
        booking.notes,
        bookingId
      ]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Booking not found."
      });
    }

    res.json({
      success: true,
      message: "Booking updated successfully.",
      booking: result.rows[0]
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to update booking."
    });
  }
});

app.delete("/api/admin/bookings/:id", requireAdmin, async function (req, res) {
  try {
    const bookingId = req.params.id;

    if (!isValidId(bookingId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid booking ID."
      });
    }

    const result = await pool.query(
      `
      DELETE FROM bookings
      WHERE id = $1
      RETURNING id
      `,
      [bookingId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Booking not found."
      });
    }

    res.json({
      success: true,
      message: "Booking deleted successfully."
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to delete booking."
    });
  }
});

app.get("/api/homepage-settings", async function (req, res) {
  try {
    const result = await pool.query(
      `
      SELECT
        appointment_label,
        appointment_text,
        appointment_link_text
      FROM homepage_settings
      WHERE id = 1
      `
    );

    res.json({
      success: true,
      settings: result.rows[0] || null
    });
  } catch (error) {
  console.error("Homepage settings load error:", error);

  res.status(500).json({
    success: false,
    message: "Failed to load homepage settings."
    });
  }
});

app.put("/api/homepage-settings", requireAdmin, async function (req, res) {
  try {
    const allowedFields = [
      "appointmentLabel",
      "appointmentText",
      "appointmentLinkText"
    ];

    if (!hasOnlyAllowedFields(req.body, allowedFields)) {
      return res.status(400).json({
        success: false,
        message: "Unknown fields are not allowed."
      });
    }

    const appointmentLabel = sanitizeText(req.body.appointmentLabel);
    const appointmentText = sanitizeText(req.body.appointmentText);
    const appointmentLinkText = sanitizeText(req.body.appointmentLinkText);

    const valuesToCheck = [
      appointmentLabel,
      appointmentText,
      appointmentLinkText
    ];

    if (valuesToCheck.some(containsDangerousInput)) {
      return res.status(400).json({
        success: false,
        message: "Invalid input detected."
      });
    }

    if (
      appointmentLabel.length < 2 ||
      appointmentLabel.length > 80 ||
      appointmentText.length < 2 ||
      appointmentText.length > 120 ||
      appointmentLinkText.length < 2 ||
      appointmentLinkText.length > 80
    ) {
      return res.status(400).json({
        success: false,
        message: "Homepage settings contain invalid text length."
      });
    }

    const result = await pool.query(
      `
      UPDATE homepage_settings
      SET
        appointment_label = $1,
        appointment_text = $2,
        appointment_link_text = $3,
        updated_at = NOW()
      WHERE id = 1
      RETURNING
        appointment_label,
        appointment_text,
        appointment_link_text
      `,
      [appointmentLabel, appointmentText, appointmentLinkText]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Homepage settings not found."
      });
    }

    res.json({
      success: true,
      message: "Homepage settings updated successfully.",
      settings: result.rows[0]
    });
  } catch (error) {
  console.error("Homepage settings save error:", error);

  res.status(500).json({
    success: false,
    message: "Failed to save homepage settings."
    });
  }
});

app.get("/", function (req, res) {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

app.use(function (req, res) {
  res.status(404).json({
    success: false,
    message: "Route not found."
  });
});

app.use(function (error, req, res, next) {
    console.error("Global error:", error);

    res.status(500).json({
        success: false,
        message: "Internal server error."
    });
});

async function startServer() {
  try {
    await pool.query("SELECT NOW()");
    await pool.query(`
CREATE TABLE IF NOT EXISTS homepage_settings (
    id INTEGER PRIMARY KEY,
    appointment_label VARCHAR(80) NOT NULL,
    appointment_text VARCHAR(120) NOT NULL,
    appointment_link_text VARCHAR(80) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
)
`);
await pool.query(`
INSERT INTO homepage_settings (
    id,
    appointment_label,
    appointment_text,
    appointment_link_text
)
VALUES (
    1,
    'Nächster freier Termin',
    'Heute - 13:30 Uhr',
    'Diesen Termin reservieren'
)
ON CONFLICT (id) DO NOTHING
`);
await pool.query(`
CREATE TABLE IF NOT EXISTS bookings (
    id SERIAL PRIMARY KEY,
    patient_name VARCHAR(60) NOT NULL,
    email VARCHAR(120) NOT NULL,
    phone VARCHAR(30) NOT NULL,
    service VARCHAR(80) NOT NULL,
    booking_date DATE NOT NULL,
    booking_time TIME NOT NULL,
    notes VARCHAR(500),
    status VARCHAR(20) NOT NULL DEFAULT 'pending',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
)
`);
await pool.query(`
CREATE INDEX IF NOT EXISTS idx_bookings_date_time
ON bookings (booking_date, booking_time)
`);

await pool.query(`
CREATE INDEX IF NOT EXISTS idx_bookings_status
ON bookings (status)
`);

    app.listen(PORT, function () {
      console.log(`Server is running on port ${PORT}`);
    });
  } catch (error) {
    console.error("Database connection failed:", error.message);
    process.exit(1);
  }
}

startServer();
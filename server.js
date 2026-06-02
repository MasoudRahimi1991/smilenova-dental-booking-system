const express = require("express");
const cors = require("cors");
const path = require("path");
const db = require("./database/database");

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

app.use(express.static(path.join(__dirname, "public")));

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

app.get("/api/slots", function (req, res) {
  const selectedDate = req.query.date;

  if (!selectedDate) {
    return res.status(400).json({
      message: "Date is required."
    });
  }

  const sql = `
    SELECT booking_time 
    FROM bookings
    WHERE booking_date = ?
    AND status = 'confirmed'
  `;

  db.all(sql, [selectedDate], function (error, rows) {
    if (error) {
      return res.status(500).json({
        message: "Failed to load available slots."
      });
    }

    const bookedTimes = rows.map(function (row) {
      return row.booking_time;
    });

    const slots = availableTimes.map(function (time) {
      return {
        time: time,
        available: !bookedTimes.includes(time)
      };
    });

    res.json(slots);
  });
});

app.post("/api/bookings", function (req, res) {
  const {
    patientName,
    email,
    phone,
    service,
    doctor,
    bookingDate,
    bookingTime,
    notes
  } = req.body;

  if (
    !patientName ||
    !email ||
    !phone ||
    !service ||
    !doctor ||
    !bookingDate ||
    !bookingTime
  ) {
    return res.status(400).json({
      message: "Please fill in all required fields."
    });
  }

  const checkSql = `
    SELECT id 
    FROM bookings
    WHERE booking_date = ?
    AND booking_time = ?
    AND status = 'confirmed'
  `;

  db.get(checkSql, [bookingDate, bookingTime], function (error, existingBooking) {
    if (error) {
      return res.status(500).json({
        message: "Booking check failed."
      });
    }

    if (existingBooking) {
      return res.status(409).json({
        message: "This time slot is already booked."
      });
    }

    const insertSql = `
      INSERT INTO bookings (
        patient_name,
        email,
        phone,
        service,
        doctor,
        booking_date,
        booking_time,
        notes
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `;

    db.run(
      insertSql,
      [
        patientName,
        email,
        phone,
        service,
        doctor,
        bookingDate,
        bookingTime,
        notes || ""
      ],
      function (insertError) {
        if (insertError) {
          return res.status(500).json({
            message: "Failed to create booking."
          });
        }

        res.status(201).json({
          message: "Appointment booked successfully.",
          bookingId: this.lastID
        });
      }
    );
  });
});

app.get("/api/admin/bookings", function (req, res) {
  const sql = `
    SELECT *
    FROM bookings
    ORDER BY booking_date ASC, booking_time ASC
  `;

  db.all(sql, [], function (error, rows) {
    if (error) {
      return res.status(500).json({
        message: "Failed to load bookings."
      });
    }

    res.json(rows);
  });
});

app.patch("/api/admin/bookings/:id/status", function (req, res) {
  const bookingId = req.params.id;
  const { status } = req.body;

  const allowedStatuses = ["confirmed", "cancelled", "completed"];

  if (!allowedStatuses.includes(status)) {
    return res.status(400).json({
      message: "Invalid booking status."
    });
  }

  const sql = `
    UPDATE bookings
    SET status = ?
    WHERE id = ?
  `;

  db.run(sql, [status, bookingId], function (error) {
    if (error) {
      return res.status(500).json({
        message: "Failed to update booking status."
      });
    }

    res.json({
      message: "Booking status updated successfully."
    });
  });
});

app.delete("/api/admin/bookings/:id", function (req, res) {
  const bookingId = req.params.id;

  const sql = `
    DELETE FROM bookings
    WHERE id = ?
  `;

  db.run(sql, [bookingId], function (error) {
    if (error) {
      return res.status(500).json({
        message: "Failed to delete booking."
      });
    }

    res.json({
      message: "Booking deleted successfully."
    });
  });
});
app.get("/api/homepage-settings", function (req, res) {
  const sql = `
    SELECT *
    FROM homepage_settings
    LIMIT 1
  `;

  db.get(sql, [], function (error, row) {
    if (error) {
      return res.status(500).json({
        message: "Failed to load homepage settings."
      });
    }

    res.json(row);
  });
});
app.put("/api/homepage-settings", function (req, res) {
  const {
    appointmentLabel,
    appointmentText,
    appointmentLinkText
  } = req.body;

  const sql = `
    UPDATE homepage_settings
    SET
      appointment_label = ?,
      appointment_text = ?,
      appointment_link_text = ?
    WHERE id = 1
  `;

  db.run(
    sql,
    [
      appointmentLabel,
      appointmentText,
      appointmentLinkText
    ],
    function (error) {
      if (error) {
        return res.status(500).json({
          message: "Failed to save homepage settings."
        });
      }

      res.json({
        message: "Homepage settings updated successfully."
      });
    }
  );
});
app.put("/api/admin/bookings/:id", function (req, res) {
  const bookingId = req.params.id;

  const {
    patientName,
    email,
    phone,
    service,
    doctor,
    bookingDate,
    bookingTime,
    notes
  } = req.body;

  if (
    !patientName ||
    !email ||
    !phone ||
    !service ||
    !doctor ||
    !bookingDate ||
    !bookingTime
  ) {
    return res.status(400).json({
      message: "Please fill in all required fields."
    });
  }

  const sql = `
    UPDATE bookings
    SET
      patient_name = ?,
      email = ?,
      phone = ?,
      service = ?,
      doctor = ?,
      booking_date = ?,
      booking_time = ?,
      notes = ?
    WHERE id = ?
  `;

  db.run(
    sql,
    [
      patientName,
      email,
      phone,
      service,
      doctor,
      bookingDate,
      bookingTime,
      notes || "",
      bookingId
    ],
    function (error) {
      if (error) {
        return res.status(500).json({
          message: "Failed to update booking."
        });
      }

      res.json({
        message: "Booking updated successfully."
      });
    }
  );
});
app.get("/", function (req, res) {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

app.listen(PORT, function () {
  console.log(`Server is running on http://localhost:${PORT}`);
});
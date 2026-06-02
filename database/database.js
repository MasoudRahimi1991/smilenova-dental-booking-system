const sqlite3 = require("sqlite3").verbose();
const path = require("path");

const databasePath = path.join(__dirname, "smilenova.sqlite");

const db = new sqlite3.Database(databasePath, function (error) {
  if (error) {
    console.error("Database connection failed:", error.message);
    return;
  }

  console.log("Database connected successfully.");
});

db.serialize(function () {
  db.run(`
    CREATE TABLE IF NOT EXISTS bookings (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      patient_name TEXT NOT NULL,
      email TEXT NOT NULL,
      phone TEXT NOT NULL,
      service TEXT NOT NULL,
      doctor TEXT NOT NULL,
      booking_date TEXT NOT NULL,
      booking_time TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'confirmed',
      notes TEXT,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    )
  `);
});

module.exports = db;
const settingsTableSql = `
  CREATE TABLE IF NOT EXISTS homepage_settings (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    appointment_label TEXT NOT NULL DEFAULT 'Nächster freier Termin',
    appointment_text TEXT NOT NULL DEFAULT 'Heute · 14:30 Uhr',
    appointment_link_text TEXT NOT NULL DEFAULT 'Diesen Termin reservieren'
  )
`;

db.run(settingsTableSql, function (error) {
  if (error) {
    console.error("Settings table could not be created:", error.message);
    return;
  }

  const insertDefaultSettingsSql = `
    INSERT INTO homepage_settings (
      appointment_label,
      appointment_text,
      appointment_link_text
    )
    SELECT
      'Nächster freier Termin',
      'Heute · 14:30 Uhr',
      'Diesen Termin reservieren'
    WHERE NOT EXISTS (
      SELECT 1 FROM homepage_settings WHERE id = 1
    )
  `;

  db.run(insertDefaultSettingsSql);
});
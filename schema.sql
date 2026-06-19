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
);

CREATE TABLE IF NOT EXISTS homepage_settings (
    id INTEGER PRIMARY KEY,
    appointment_label VARCHAR(80) NOT NULL,
    appointment_text VARCHAR(120) NOT NULL,
    appointment_link_text VARCHAR(80) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

INSERT INTO homepage_settings (
    id,
    appointment_label,
    appointment_text,
    appointment_link_text
)
VALUES (
    1,
    'Nächster freier Termin',
    'Heute · 14:30 Uhr',
    'Diesen Termin reservieren'
)
ON CONFLICT (id) DO NOTHING;

CREATE INDEX IF NOT EXISTS idx_bookings_date_time
ON bookings (booking_date, booking_time);

CREATE INDEX IF NOT EXISTS idx_bookings_status
ON bookings (status);
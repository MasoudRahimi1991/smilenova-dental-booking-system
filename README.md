# SmileNova Dental Booking System

🌐 **Live Demo**
https://smilenova-dental-booking-system.onrender.com

💻 **Source Code**
https://github.com/MasoudRahimi1991/smilenova-dental-booking-system

🌍 **Portfolio Website**
https://masoud-dev.de

📧 **Contact**
[info@masoud-dev.de](mailto:info@masoud-dev.de)

---

## Overview

SmileNova is a full-stack dental appointment booking system developed with Node.js, Express.js, SQLite, HTML, CSS, and JavaScript.

The application allows patients to book appointments online while providing administrators with a complete dashboard for managing appointments, booking statuses, and homepage content.

This project was created as a portfolio project to demonstrate full-stack web development skills, REST API design, database management, and real-world business workflow implementation.

---

## Features

### Patient Features

* Online appointment booking
* Doctor selection
* Service selection
* Date and time selection
* Real-time available slot management
* Prevention of double bookings
* Responsive user interface

### Admin Features

* View all appointments
* Edit appointments
* Delete appointments
* Confirm appointments
* Complete appointments
* Cancel appointments
* Dashboard statistics
* Homepage appointment management

### System Features

* REST API architecture
* SQLite database integration
* Real-time appointment availability
* Appointment status management
* Responsive design
* Dynamic homepage content

---

## Technologies

### Frontend

* HTML5
* CSS3
* JavaScript

### Backend

* Node.js
* Express.js

### Database

* SQLite

### Deployment

* Render

---

## Project Structure

```text
smilenova-dental-booking-system
│
├── database
├── public
│   ├── css
│   ├── js
│   ├── index.html
│   ├── booking.html
│   └── admin.html
│
├── server.js
├── package.json
└── README.md
```

## API Endpoints

### Public Routes

```http
GET /api/slots
POST /api/bookings
GET /api/homepage-settings
```

### Admin Routes

```http
GET /api/admin/bookings
PUT /api/admin/bookings/:id
PATCH /api/admin/bookings/:id/status
DELETE /api/admin/bookings/:id
PUT /api/homepage-settings
```

## Installation

Clone the repository:

```bash
git clone https://github.com/MasoudRahimi1991/smilenova-dental-booking-system.git
```

Install dependencies:

```bash
npm install
```

Start the application:

```bash
node server.js
```

Open:

```text
http://localhost:3000
```

---

## Future Improvements

* User authentication
* Email notifications
* PostgreSQL migration
* Calendar integration
* Multi-user admin roles
* Advanced reporting

---

## Author

**Masoud Rahimi**

Backend Developer

🌍 https://masoud-dev.de

📧 [info@masoud-dev.de](mailto:info@masoud-dev.de)

💻 https://github.com/MasoudRahimi1991

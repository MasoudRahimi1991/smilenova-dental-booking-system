# SmileNova Dental Booking System

A full-stack dental appointment booking system built with Node.js, Express, PostgreSQL and Vanilla JavaScript.

The primary goal of this project was to demonstrate backend engineering skills including authentication, authorization, API design, database architecture, security best practices, validation, and deployment workflows.

---

# Live Demo

### Portfolio Website

https://masoud-dev.de

### Application Homepage

https://smilenova-dental-booking-system.onrender.com

### Admin Dashboard

https://smilenova-dental-booking-system.onrender.com/admin-login.html

---

# Demo Credentials

This project is publicly available for demonstration purposes.

Visitors are welcome to test all features including appointment booking, appointment management and the administration dashboard.

**Username:** demo

**Password:** demo123456

---

# Project Overview

SmileNova Dental Booking System is a portfolio project that simulates a real-world dental clinic booking platform.

Patients can:

* Select a service
* Choose an available appointment date
* Select a free time slot
* Submit an appointment request

Administrators can:

* Log in securely
* Manage bookings
* Update appointment statuses
* Edit bookings
* Delete bookings
* View booking statistics
* Manage homepage content

The project was intentionally developed with a strong focus on backend architecture rather than frontend complexity.

The frontend remains lightweight and simple because the primary objective of this project is to showcase backend development skills.

The backend architecture was designed to be scalable and can easily support additional frontend pages, mobile applications or third-party integrations in the future.

---

# Key Features

## Patient Features

* Online appointment booking
* Dynamic appointment slot availability
* Service selection
* Automatic double-booking prevention
* Form validation
* Mobile-friendly interface

## Administrator Features

* Secure administrator login
* JWT authentication
* Appointment management dashboard
* Appointment editing
* Appointment deletion
* Booking statistics
* Homepage content management
* Appointment status management

---

# Backend Technologies

* Node.js
* Express.js
* PostgreSQL

---

# Frontend Technologies

* HTML5
* CSS3
* Vanilla JavaScript

---

# Security Features

The project includes multiple layers of security commonly used in production environments.

### Authentication & Authorization

* JWT Authentication
* Protected Admin Routes
* Token Verification Middleware
* Role-Based Access Control

### Password Security

* bcrypt Password Hashing
* Secure Password Verification

### Input Validation

* Server-Side Validation
* Input Sanitization
* Dangerous Input Detection
* Unknown Field Protection

### API Protection

* Express Rate Limiting
* Request Slowdown Protection
* Request Size Limiting

### Security Middleware

* Helmet Security Headers
* CORS Protection
* XSS Protection

### Database Security

* Parameterized SQL Queries
* SQL Injection Protection
* Secure Database Validation

---

# REST API Endpoints

## Public Endpoints

```http
GET    /api/health
GET    /api/slots
POST   /api/bookings
GET    /api/homepage-settings
```

## Protected Endpoints

```http
POST   /api/admin/login

GET    /api/admin/bookings
GET    /api/admin/bookings/stats

PATCH  /api/admin/bookings/:id/status

PUT    /api/admin/bookings/:id

DELETE /api/admin/bookings/:id

PUT    /api/homepage-settings
```

---

# Database Structure

## Bookings Table

Stores:

* Patient Name
* Email Address
* Phone Number
* Selected Service
* Appointment Date
* Appointment Time
* Notes
* Booking Status
* Creation Date
* Last Update Date

## Homepage Settings Table

Stores dynamic homepage content:

* Appointment Label
* Appointment Text
* Appointment Button Text

---

# Automatic Database Initialization

The application automatically creates required database tables and indexes during startup if they do not already exist.

This simplifies deployment and allows the application to run immediately after installation.

---

# Project Architecture

The application follows a REST API architecture.

Frontend and backend are separated logically.

The frontend communicates with the backend exclusively through API endpoints.

This approach allows the backend to remain reusable for:

* Future React applications
* Future Vue applications
* Mobile applications
* Third-party integrations
* Additional frontend pages

without requiring major backend changes.

---

# Purpose Of The Project

This project was created primarily as a backend portfolio project.

The main focus was:

* Backend Development
* REST API Design
* Authentication
* Authorization
* PostgreSQL Integration
* Security Best Practices
* Database Design
* Production Deployment
* Real-World Application Structure

The frontend was intentionally kept simple because the goal was to demonstrate backend engineering skills rather than frontend design.

---

# Future Improvements

Potential future enhancements include:

* Email notifications
* Password reset system
* Patient accounts
* Appointment reminders
* Calendar integration
* Multi-language support
* File uploads
* Multi-clinic support
* Mobile application integration
* Advanced analytics dashboard

---

# Author

Masoud Rahimi

Portfolio Website:

https://masoud-dev.de

GitHub:

https://github.com/MasoudRahimi1991

---

# License

This project is intended for educational, portfolio and demonstration purposes.

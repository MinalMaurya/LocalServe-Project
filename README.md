# 🌐 LocalServe – Local Service Discovery & Booking Platform  

A modern full-stack service-marketplace that connects **customers** with **local vendors** such as electricians, plumbers, tutors, mechanics, and home services.  
Built with **React.js**, professional UI/UX, role-based navigation, vendor dashboards, review system, and fully localStorage-driven data persistence.

---

## 📘 Table of Contents
- [Project Overview](#project-overview)
- [Features](#features)
  - [Guest Features](#guest-features)
  - [Customer Features](#customer-features)
  - [Vendor Features](#vendor-features)
- [Tech Stack Used](#tech-stack-used)
- [Folder Structure](#folder-structure)
- [How Data Is Stored](#how-data-is-stored)
- [How to Run the Project](#how-to-run-the-project)
- [Future Enhancements](#future-enhancements)
- [Screenshots (optional)](#screenshots-optional)

---

## 📌 Project Overview

**LocalServe** is built to simplify how people find and hire trusted local service experts.  
It supports **two user roles**:

### 1️⃣ Customer
- Explore all services openly
- Must login to view details or book
- Can request services, add favorites, write/edit reviews

### 2️⃣ Vendor
- View and manage customer requests  
- Update profile (name, description, phone, location)  
- See ratings & reviews  
- Manage job status  

Sessions and data are stored using **LocalStorage** so the app works fully without a backend.

---

## ⭐ Features

### 👀 Guest Features
- Browse all service cards  
- Rating & location visible  
- Clicking a card shows an **auth popup** asking to Login/Signup  
- Only role = `guest` or no-session gets blocked  
- Public pages: Home, About, Contact  

---

### 🧑‍💼 Customer Features

#### 🔐 Authentication
- Login / Signup with role = customer  
- Session saved in LocalStorage  
- Navbar changes after login  

#### 🔍 Service Discovery
- Category badge  
- Verified badge  
- Status indicator (Available / Busy / Offline)  
- Star ratings (full/half/empty)  
- Add/remove favorites  

#### 📄 Service Details Page
- Full service description  
- Reviews by customers  
- Add review  
- Edit review  
- Submit service request form  

#### 📦 My Requests
- List of all requests  
- Status tracking (“Pending”, “Accepted”, “Rejected”)  

#### ❤️ Favorites
- Saved using LocalStorage  
- Accessible anytime  

---

### 👨‍🔧 Vendor Features

#### 🏠 Vendor Dashboard
- Hero section with vendor profile  
- Total requests, Pending, Accepted counts  
- Average rating  
- Performance insights  

#### 📩 Vendor Requests Page
- View all customer requests  
- Accept/Reject buttons  
- Shows urgency, date, customer message  
- Auto-updates localStorage  

#### ⭐ Vendor Reviews Page
- Review summary  
- Ratings bar graph  
- Filter by stars  
- Sort by newest/oldest  
- Shows customer name, review, date  

---

## 🛠 Tech Stack Used

### ✔ Frontend
| Technology | Usage |
|-----------|--------|
| **React.js** | UI components |
| **React Router** | Navigation, protected routes |
| **Bootstrap 5** | Responsive UI |
| **Framer Motion** | Page & element animations |
| **React Icons** | Icons |
| **LocalStorage API** | User sessions, requests, vendor data |

### ✔ Backend (Future-ready)
Currently LocalStorage-based, but structured for:
- Node.js / Express  
- MongoDB / PostgreSQL  
- JWT authentication  
- Cloud file storage  

---

## 📂 Folder Structure

Your project contains **exactly these files**, and the README now includes them:

```text
src/
├── components/
│   ├── layout/
│   │   ├── Header.jsx
│   │   ├── Footer.jsx
│   │   ├── Home.jsx
│   │   ├── About.jsx
│   │   ├── Contact.jsx
│   │   ├── Login.jsx
│   │   ├── Signup.jsx
│   │   ├── Profile.jsx
│   ├── service/
│   │   ├── ServiceCard.jsx
│   │   ├── ServiceDetails.jsx
│   ├── vendors/
│       ├── VendorDashboard.jsx
│       ├── VendorRequestsPage.jsx
│       ├── VendorReviewsPage.jsx
├── App.js
├── App.css
└── index.js

## 🧱 How Data Is Stored

LocalServe uses the browser's **LocalStorage** to simulate a backend database.  
Below is the list of keys and what each one stores:

| LocalStorage Key | Purpose |
|------------------|---------|
| **authUser** | Stores logged-in user details (name, email, role = customer/vendor). |
| **local-service-discovery:services** | Stores the published list of services (both static + vendor-created). |
| **local-service-discovery:favorites** | Stores the IDs of services the customer added to Favorites. |
| **local-service-discovery:contact-requests** | Stores all customer → vendor service requests, with status updates like Pending/Accepted/Rejected. |
| **local-service-discovery:vendor-profiles** | Stores vendor profile details (company name, phone, location, availability, description). |
| **local-service-discovery:vendor-reviews** | Stores all submitted reviews for services, with customer name, rating, comment, and timestamp. |

### 📌 Notes
- All data persists until manually cleared.  
- Perfect for demos, frontend projects, UI/UX testing, and offline simulation.  
- Can be replaced later with a backend (Node/Express + MongoDB/PostgreSQL).

---

## 🚀 How to Run the Project
Prerequisites
	-	Node.js (v16+ recommended)
	-	npm (installed with Node)

## 📁 Run the Project
in commond type 
- cd local-service-discovery
- npm install
- npm start 
## 🌐 After Starting
	-	App runs at: http://localhost:3000
	-	Hot reload enabled
	-	No server restart needed



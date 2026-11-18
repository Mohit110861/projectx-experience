# Project X Experience — Event Booking Platform

Project X Experience is a full-stack event booking website built by **Mohit**, with React, Node.js/Express and MySQL. Visitors browse events, view the gallery and reels, and request spots with email OTP verification. The admin dashboard manages events and slots, bookings and payments, users (including blocking), gallery and reel uploads, the site header, and Excel exports of paid users.

## Features
- **User Authentication**: Secure login & registration with JWT and bcrypt.
- **2FA OTP Verification**: 
  - Mandatory Email OTP to activate your account upon Registration (or delayed login attempts).
  - Mandatory Email OTP to finalize and secure event ticket booking.
- **Role-Based Access**: 
  - **Admin**: Create, edit, and delete events. Confirm and reject all incoming booking requests, mark them as 'Paid' or 'Not Paid'. Access is strictly locked to database-flagged users only.
  - **User**: Browse events, submit ticket booking requests via OTP, view personal dashboard pending status, and cancel bookings.
- **Event Management**: Create free and paid events with detailed descriptions, external image URLs, dates, categories, and seating capacity.
- **Smart Booking System**:
  - Mandatory 2FA OTP to authorize a booking request.
  - All booking requests (both free and paid) enter a secure 'Pending' queue for Admin verification.
  - Seat availability accurately updates and securely validates against overbooking logic.
- **Admin Analytics Dashboard**: Track live data such as Pending Requests, Total Revenue, and Total Confirmed Paid Clients directly from the admin panel.
- **Email Notifications**: Automated email delivery upon successful booking confirmation using Nodemailer.
- **Sleek UI/UX**: Built entirely with React, Tailwind CSS, and polished with micro-interactions.

---

## 🚀 Setup Instructions

### Prerequisites
Make sure you have [Node.js](https://nodejs.org/) installed on your machine.
You will also need **MySQL 8** running locally (e.g. [MySQL Community Server](https://dev.mysql.com/downloads/mysql/)). The server creates the `eventora` database and all tables automatically on first start (schema in `server/schema.sql`).

### 1. Environment Variables Configuration
Navigate to `server/.env` and fill in the necessary keys:
```env
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=your_mysql_password
DB_NAME=eventora
JWT_SECRET=supersecretjwtkey_eventora
EMAIL_USER=your_gmail_address
EMAIL_PASS=your_gmail_app_password
PORT=5000
```
> **Note**: For `EMAIL_PASS`, you need to generate an "App Password" from your Google Account settings, standard passwords won't work due to 2FA.
> If `EMAIL_USER` / `EMAIL_PASS` are left empty, emails are skipped and OTP codes are printed in the server terminal instead.

To load demo data (admin@eventora.com / user@eventora.com, password `password123`):
```bash
npm run seed --prefix server
```

### 2. Run from Outer Folder (Single Terminal)
You can now manage both backend and frontend from the project root:

```bash
# from the project root
npm install
npm run install:all
npm run dev
```

- `npm run dev` starts both `server` and `client` together using `concurrently`.
- `npm run dev:all` installs dependencies (server + client) and starts both in one command.
- `npm run start` runs backend `start` + frontend `preview` together.

### 3. Install Dependencies
Open two separate terminals for the backend and frontend.

**Backend Terminal:**
```bash
cd server
npm install --legacy-peer-deps
```

**Frontend Terminal:**
```bash
cd client
npm install
```

### 4. Run the Application Local Servers
**Run Backend:**
```bash
cd server
npm run dev
```
*(Server will run on `http://localhost:5000`)*

**Run Frontend:**
```bash
cd client
npm run dev
```
*(Client will run on a local port provided by Vite, typically `http://localhost:5173`)*

---

## 🛠️ Admin dashboard (`/admin`)

Log in as an admin and open **Admin** in the navbar. Sections:

| Section | What you can do |
|---|---|
| Overview | Revenue collected, pending requests, unpaid amounts, slots & revenue per event, quick Excel download |
| Events & Slots | Create / edit / delete events, upload posters, set price, total slots and slots left |
| Bookings & Payments | Approve requests (paid / unpaid), record payments (UPI, cash, card, bank, ref no.), cancel, filter & search |
| Users | Search users, see bookings and total paid, **block / unblock** (blocked users can't log in or book) |
| Gallery | Drag-and-drop photo uploads (up to 30 at once), captions, reorder, delete |
| Reels | Post a reel with an uploaded video (plays on the site) and/or an Instagram link (embedded + "Open on Instagram") |
| Header & Site | Announcement bar, hero text, hero background image/video, Instagram link, footer contact |

**Excel export:** `Download paid users` creates an `.xlsx` with three sheets: paid bookings (name, email, phone, event, ticket amount, method, reference, paid date), revenue by event, and all users.

Uploaded files are stored in `server/uploads/` (not committed to git; back this folder up together with the MySQL database).

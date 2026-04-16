## MyChamber

A full-stack healthcare platform that streamlines doctor discovery, appointment booking, and clinical workflow management through a clean, role-based system.

## 💡 Why MyChamber?

Healthcare booking systems often suffer from poor scheduling logic and unclear cancellation handling.

MyChamber focuses on:
- Structured appointment lifecycle management
- Clear separation of roles (patient, doctor, admin)
- Transparent cancellation and notification flows
- Scalable backend architecture for real-world use

## 🚀 Features

- 🔍 Smart doctor discovery by specialization and profile details
- 📅 Appointment booking with live slot availability
- ❌ Structured cancellation flow for patient and doctor actions
- 🔔 Notification system for appointment updates and status changes
- 👤 Separate dashboards for patient, doctor, and admin users
- 🧾 Doctor clinical history module with report upload support
- 📊 Admin monitoring for doctors, patients, appointments, and reviews

## 📸 Screenshots

### 🏠 Homepage
<p align="center">
  <img src="https://github.com/user-attachments/assets/6bfe87c2-083c-4e90-950e-aa4883bdd1ec" width="800"/>
</p>

### 🔐 Login Page

<p align="center">
  <img src="https://github.com/user-attachments/assets/67819117-4cdb-4c93-ba82-9a0fde41061c" width="800"/>
</p>

### 🔍 Doctor Finding Page

<p align="center">
  <img src="https://github.com/user-attachments/assets/788941ea-5196-4108-9dd2-54064bfaeed9" width="800"/>
</p>
 
### 👤 Patient Dashboard
<p align="center">
  <img src="https://github.com/user-attachments/assets/0d363e60-a006-43cc-9b2c-9211dd23112d" width="800"/>
</p>

### 🩺 Doctor Dashboard (Schedule & Patient Management)
<p align="center"> <img src="https://github.com/user-attachments/assets/5002dc66-31f0-4b36-a6ce-1ab4e83a4f9d" width="800"/> </p>

### 📊 Admin Dashboard (System Monitoring & Control)
<p align="center"> <img src="https://github.com/user-attachments/assets/92b3ede0-2e07-4433-979c-12d20a3d2b6b" width="800"/> </p>



## 🛠️ Tech Stack

- Frontend: React 18, Vite 5, Tailwind CSS, Axios
- Backend: Node.js, Express
- Database: MySQL (mysql2)
- Authentication: JWT (jsonwebtoken), bcryptjs
- Validation and Uploads: express-validator, multer
- UI Libraries: Framer Motion, Recharts, Lucide React

## ⚙️ Installation & Setup

### 1. Clone repository

```bash
git clone https://github.com/yourusername/mychamber.git
cd mychamber
```

### 2. Install dependencies

```bash
# Backend (root)
npm install

# Frontend
cd frontend
npm install
cd ..
```

### 3. Configure environment variables

Create a .env file in the project root:

```env
PORT=5000
NODE_ENV=development

DB_HOST=localhost
DB_USER=root
DB_PASSWORD=your_mysql_password
DB_NAME=mychamber_db
DB_PORT=3306

JWT_SECRET=your_secret_key
JWT_EXPIRE=7d

AUTO_STATUS_CLEANUP_INTERVAL_MS=300000
```

### 4. Initialize database

```bash
mysql -u root -p < schema.sql
```

Run migrations as needed from the migrations folder. On Windows, you can also use:

```bat
run-migration.bat
```

### 5. Run development servers

```bash
# Terminal 1: backend (root)
npm run dev

# Terminal 2: frontend
cd frontend
npm run dev
```

### 6. Access application

- Frontend: http://localhost:5173
- Backend API: http://localhost:5000/api
- Health check: http://localhost:5000/api/health

## 📁 Project Structure

```text
MyChamber/
├── config/
├── controllers/
├── middleware/
├── migrations/
├── models/
├── routes/
├── uploads/
│   ├── profile-images/
│   └── reports/
├── frontend/
│   ├── public/
│   └── src/
│       ├── components/
│       ├── pages/
│       ├── services/
│       ├── routes/
│       ├── context/
│       └── utils/
├── server.js
├── schema.sql
└── README.md
```

## 🔑 Environment Variables

Minimum required values:

```env
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=your_mysql_password
DB_NAME=mychamber_db
DB_PORT=3306
JWT_SECRET=your_secret_key
```

## 🧠 Core Logic

### Appointment Booking Flow

- Patient selects doctor, date, and slot
- Backend validates doctor availability and schedule date range
- System blocks duplicate bookings for same patient, same doctor, same day
- Slot conflict checks prevent overlapping bookings
- Successful booking triggers status tracking and notification events

### Patient Cancellation Rules

- Patient can cancel their own appointment from patient panel
- Cancellation is blocked for already completed or already cancelled records
- Status is normalized across canceled/cancelled inputs for consistency
- Cancelled appointment remains visible for history and tracking

### Doctor Cancellation Handling

- Doctor can update status from doctor appointment management page
- Cancelling requires a cancellation message (validated server-side)
- Patient receives a notification containing doctor-provided context
- Cancellation metadata is stored for who cancelled and when

## 🔌 API Overview

### Authentication

- POST /api/auth/register
- POST /api/auth/login
- GET /api/auth/profile
- PUT /api/auth/profile

### Doctors and Schedules

- GET /api/doctors
- GET /api/doctors/search
- GET /api/doctors/:id
- POST /api/doctors/schedule
- GET /api/doctors/my/schedule

### Appointments

- GET /api/appointments/slots/:doctorId/:date
- POST /api/appointments/book
- GET /api/appointments/patient
- GET /api/appointments/doctor
- PUT /api/appointments/:id/cancel
- PUT /api/appointments/:id/status
- POST /api/appointments/report-issue

### Notifications, Reviews, and Admin

- GET /api/notifications
- PUT /api/notifications/:id/read
- POST /api/reviews
- GET /api/reviews/doctor/:doctorId
- GET /api/admin/stats

## 🎯 UI/UX Highlights

- Role-based navigation keeps each user flow focused and uncluttered
- Appointment cards show clear status progression and actionable controls
- Cancellation details and reporting actions reduce communication gaps
- Dashboard summaries help doctors and admins make quick operational decisions

## 📌 Future Improvements

- 💳 Online payment and billing integration
- 📱 Feature-complete mobile app parity
- 🤖 AI-based doctor recommendation and triage support
- 🌍 Multi-language support and localization
- 📈 Extended analytics for patient retention and doctor performance

## 🤝 Contributing

Contributions are welcome.

1. Fork the repository
2. Create a feature branch
3. Commit changes with clear messages
4. Open a pull request with scope and test notes

For major changes, open an issue first to discuss architecture and implementation approach.

## 📄 License

This project is licensed under the MIT License — feel free to use and modify.

# 🏦 BachatGara — Automated SMS Financial Tracker & Budget Manager

BachatGara is a full-stack personal finance application with a real-time Android Gateway. It automatically parses incoming bank transaction SMS messages from Nepalese commercial banks, synchronizes alerts over real-time Server-Sent Events (SSE), and updates user accounts and ledger entries dynamically.

---

## 🏗️ Architecture & Technology Stack

- **Backend**: Node.js, Express, PostgreSQL, Server-Sent Events (SSE), JWT Authentication, Nodemailer (SMTP)
- **Frontend**: React, Vite, Vanilla CSS, Lucide React Icons
- **Android App**: Kotlin, Jetpack Compose, Retrofit 2, OkHttp 4 (SSE Client), BroadcastReceiver, Foreground Service

---

## 🚀 Getting Started

Follow the steps below to clone, configure, and run the project locally.

### 1. Prerequisites

Ensure you have the following installed:
- [Node.js](https://nodejs.org/) (v18 or higher)
- [PostgreSQL](https://www.postgresql.org/) (v14 or higher)
- [Android Studio](https://developer.android.com/studio) (for running the Android app)

---

### 2. Database Creation

Open PostgreSQL (e.g. pgAdmin or `psql`) and create a blank database named `BachatGara`:
```sql
CREATE DATABASE "BachatGara";
```

---

### 3. Backend Setup & Single-Command DB Initialization

1. Navigate to the `Backend` directory:
   ```bash
   cd Backend
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Copy the example environment configuration:
   ```bash
   cp example.env .env
   ```
4. Open `.env` and fill in your local PostgreSQL credentials:
   ```ini
   PORT=5000
   DB_USER=postgres
   DB_HOST=localhost
   DB_DATABASE=BachatGara
   DB_PASSWORD=your_postgres_password
   DB_PORT=5432
   JWT_SECRET=your_super_secret_jwt_key
   JWT_EXPIRES_IN=7d

   DEV_FRONTEND_URL=http://localhost:3000

   SMTP_HOST=smtp.gmail.com
   SMTP_PORT=587
   SMTP_USER=your_email@gmail.com
   SMTP_PASSWORD=your_app_password
   ```
5. **Initialize database schema & seed bank logos in one command**:
   ```bash
   npm run db:init
   ```
   *(This single command automatically loads `schema.sql`, creates all required tables, triggers, and seeds the canonical Nepalese bank records.)*

6. Start the backend development server:
   ```bash
   npm run dev
   ```
   *The backend will start at `http://localhost:5000` (and print your local network IP address for the Android app).*

---

### 4. Frontend Setup

1. Open a new terminal and navigate to the `Frontend` directory:
   ```bash
   cd Frontend
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Copy the example environment configuration:
   ```bash
   cp example.env .env
   ```
4. Ensure `.env` points to the backend API:
   ```ini
   VITE_PORT=3000
   VITE_API_URL=http://localhost:5000
   ```
5. Start the Vite development server:
   ```bash
   npm run dev
   ```
   *Access the web app at `http://localhost:3000` in your browser.*

---

### 5. Android Gateway Setup

1. Open **Android Studio**.
2. Select **Open** and select the `BachatGara_Android` directory.
3. Allow Gradle to sync and download required Android SDK packages.
4. Connect an Android device (or launch an Emulator) and click **Run 'app'**.
5. When the app launches on your phone:
   - Enter your computer's local IP address (e.g., `http://192.168.18.14:5000`).
   - Log in using your registered BachatGara account.
   - Grant **SMS Receive & Read** permissions when prompted.
6. The Android background service will now listen for incoming bank SMS alerts and forward parsed financial events in real time to your web app.

---

## 🧪 Running Automated Tests

To execute the backend test suite:
```bash
cd Backend
npm test
```

---

## 📄 Key Features

- **Automated SMS Parsing**: Reads and parses Nepalese commercial bank transaction alerts (Debit/Credit/Transfers).
- **Observer Pattern Real-Time Sync**: Instant account updates and SMS queue resolutions pushed live via SSE stream.
- **Internal Bank Transfers**: Support for transferring funds between your tracked bank accounts with automatic balance adjustment and transfer fee deductions.
- **Budgeting & Savings Goals**: Goal trackers with progress percentage, auto-contributions, and monthly budget pool rollovers.

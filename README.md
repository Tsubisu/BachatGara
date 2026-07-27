Follow the steps below to clone, configure, and run the project locally.

1. Prerequisites
Ensure you have the following installed:

Node.js (v18 or higher)
PostgreSQL (v14 or higher)
Android Studio (for running the Android app)
2. Database Setup
Open PostgreSQL and create a database named BachatGara: CREATE DATABASE "BachatGara";

Run the initial database schema script found in Backend/schema.sql: psql -U postgres -d BachatGara -f Backend/schema.sql

3. Backend Setup
Navigate to the Backend directory: cd Backend

Install dependencies: npm install

Copy the example environment configuration: cp example.env .env

Open .env and fill in your local PostgreSQL credentials: PORT=5000 DB_USER=postgres DB_HOST=localhost DB_DATABASE=BachatGara DB_PASSWORD=your_postgres_password DB_PORT=5432 JWT_SECRET=your_super_secret_jwt_key JWT_EXPIRES_IN=7d

DEV_FRONTEND_URL=http://localhost:3000

SMTP_HOST=smtp.gmail.com SMTP_PORT=587 SMTP_USER=

your_email@gmail.com
 SMTP_PASSWORD=your_app_password

Initialize database tables and bank logos: npm run db:init

Start the backend development server: npm run dev

(The backend will start at http://localhost:5000 and output your local network IP for the Android app.)

4. Frontend Setup
Open a new terminal and navigate to the Frontend directory: cd Frontend

Install dependencies: npm install

Copy the example environment configuration: cp example.env .env

Ensure .env points to the backend API: VITE_PORT=3000 VITE_API_URL=http://localhost:5000

Start the Vite development server: npm run dev

(Access the web app at http://localhost:3000 in your browser.)

5. Android Gateway Setup
Open Android Studio.
Select Open and select the BachatGara_Android directory.
Allow Gradle to sync and download required Android SDK packages.
Connect an Android device (or launch an Emulator) and click Run 'app'.
When the app launches on your phone:
Enter your computer's local IP address (e.g., http://192.168.18.14:5000).
Log in using your registered BachatGara account.
Grant SMS Receive & Read permissions when prompted.
The Android background service will now listen for incoming bank SMS alerts and forward parsed financial events in real time to your web app.

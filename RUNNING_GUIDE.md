# 🚀 Running Guide: Student Performance Predictor

This guide will help you set up and run the entire **Student Performance Predictor** application perfectly on your local machine.

---

## 💡 Why the "Maven Not Found" Error Occurs

If you got a `mvn: command not found` error, it is because Maven is not installed on your system or not added to your system's `PATH`.

**The Good News:** You **do not** need to install Maven globally! This project includes the **Maven Wrapper** (`mvnw` for macOS/Linux and `mvnw.cmd` for Windows). 
- Instead of running `mvn spring-boot:run`, you just run `./mvnw spring-boot:run` (macOS/Linux) or `.\mvnw.cmd spring-boot:run` (Windows).
- The wrapper will automatically download the correct version of Maven behind the scenes and run the project perfectly.

---

## 🛠️ Step 1: System Prerequisites

Before starting, ensure you have the following installed on your machine:

1. **Java Development Kit (JDK) 21**
   - Download & Install from [Oracle JDK 21](https://www.oracle.com/java/technologies/downloads/#java21) or [Adoptium Temurin 21](https://adoptium.net/).
   - Ensure the `JAVA_HOME` environment variable is set and points to your JDK 21 installation.
   - Verify by running in your terminal:
     ```bash
     java -version
     ```
     *(Should output Java 21)*

2. **PostgreSQL Database**
   - Download & Install from [PostgreSQL Official Site](https://www.postgresql.org/download/).
   - Ensure it is running on the default port `5432`.
   - **Credentials:**
     - The services are configured with standard PostgreSQL default credentials:
       - **Username:** `postgres`
       - **Password:** *(empty / none)*
     - *If your local PostgreSQL installation uses a specific password (e.g. `your_secure_password`), open the `application.yml` files in both `auth-service/src/main/resources/application.yml` and `student-service/src/main/resources/application.yml` and set the `password` field.*
   - **Database Setup:** 
     Connect to your PostgreSQL server (using pgAdmin, DBeaver, or psql terminal) and create two empty databases:
     ```sql
     CREATE DATABASE student_performance_auth;
     CREATE DATABASE student_performance_students;
     ```

3. **Node.js (for the Frontend Client)**
   - Download & Install from [Node.js Official Site](https://nodejs.org/) (Version 18 or higher recommended).
   - Verify installation:
     ```bash
     node -v
     npm -v
     ```

---

## 🚀 Step 2: Running the Backend Microservices

We have provided convenient automation scripts to start all 6 microservices in the correct order with appropriate startup delays.

### Option A: On Windows (PowerShell)
1. Open **PowerShell** as Administrator.
2. Navigate to the project root directory:
   ```powershell
   cd path\to\final-year-project
   ```
3. Run the startup script:
   ```powershell
   .\start-services.ps1
   ```
   *This will open individual command prompt windows for each microservice and launch them using the Maven Wrapper (`mvnw.cmd`).*

---

### Option B: On macOS / Linux (Terminal)
1. Open your **Terminal**.
2. Navigate to the project root directory:
   ```bash
   cd /path/to/final-year-project
   ```
3. Give execution permission to the scripts:
   ```bash
   chmod +x start-services.sh stop-services.sh mvnw
   ```
4. Run the startup script:
   ```bash
   ./start-services.sh
   ```
   *This starts all microservices in the background. Logs will be written to the `logs/` directory.*
5. To see the status of the logs, you can run:
   ```bash
   tail -f logs/discovery-server.log
   ```

---

### Option C: Manual Launch (Alternative)
If you prefer running services manually one by one (or inside an IDE like IntelliJ IDEA), start them in this exact order:

| Order | Service | Directory | Port | Command (macOS/Linux) | Command (Windows) |
|---|---|---|---|---|---|
| 1 | **Discovery Server** | `/discovery-server` | 8761 | `./mvnw spring-boot:run` | `.\mvnw.cmd spring-boot:run` |
| 2 | **API Gateway** | `/api-gateway` | 8080 | `./mvnw spring-boot:run` | `.\mvnw.cmd spring-boot:run` |
| 3 | **Auth Service** | `/auth-service` | 8081 | `./mvnw spring-boot:run` | `.\mvnw.cmd spring-boot:run` |
| 4 | **Student Service** | `/student-service` | 8082 | `./mvnw spring-boot:run` | `.\mvnw.cmd spring-boot:run` |
| 5 | **Analytics Service** | `/analytics-service` | 8083 | `./mvnw spring-boot:run` | `.\mvnw.cmd spring-boot:run` |
| 6 | **Report Service** | `/report-service` | 8084 | `./mvnw spring-boot:run` | `.\mvnw.cmd spring-boot:run` |

---

## 💻 Step 3: Running the Frontend Client

1. Open a new terminal window.
2. Navigate to the `client/` directory:
   ```bash
   cd client
   ```
3. Install the dependencies:
   ```bash
   npm install
   ```
4. Start the frontend React Vite server:
   ```bash
   npm run dev
   ```
5. Open your browser and go to:
   ```text
   http://localhost:5173
   ```

---

## 🎯 Step-by-Step Walkthrough: Testing Every Functionality

Once everything is running, follow this guided flow to explore and test every single core feature of the platform:

### 🔐 Phase 1: User Registration & Sign In
1. Go to `http://localhost:5173/register` in your browser.
2. Register an **Admin** user:
   - **Username:** `admin_demo`
   - **Email:** `admin@demo.com`
   - **Role:** Select `Admin` from the dropdown list.
   - **Password:** `123456`
3. Click **Register**. You will be redirected to the Login page.
4. Log in using your newly created admin credentials.

---

### 📂 Phase 2: Bulk CSV Ingestion & Cleansing
1. Once logged in, click on **CSV Management** in the left sidebar.
2. Select or drag-and-drop the pre-provided **`dummy_students.csv`** file located in the root of the project.
3. Click **Upload and Ingest**.
4. The backend's `DataCleansingService` will synchronously process the records, clean up duplicate or invalid entries, apply default mappings, and save them in PostgreSQL and MongoDB!
5. You will see a success toast and the status update showing the uploaded record count.

---

### 📊 Phase 3: Exploring the Admin / Teacher Dashboard
1. Click on **Dashboard** in the sidebar.
2. You will be greeted with a dynamic, real-time workspace featuring:
   - **Metrics Bar:** Overall active students, average cohort attendance, midterm averages, and percentage of predicted at-risk students.
   - **Prediction Analytics Chart:** Interactive visual correlation between student study hours and academic scores.
   - **Assignment Trend Chart:** Cohort-wide assignment marks progression.
   - **Live Pulse Ticker:** A live feed displaying recent risk assessments and audit logs.

---

### 🔍 Phase 4: Cohort Directory & AI Risk Predictor
1. Navigate to the **Students** tab in the sidebar.
2. You will see the entire cohort list populated from the CSV!
3. Observe the **Risk Prediction Badge** for each student:
   - 🔴 **High Risk**
   - 🟡 **Medium Risk**
   - 🟢 **Low Risk**
   - *These are calculated dynamically by the Linear Regression Engine based on academic records, study hours, and attendance trends!*
4. Click on any student (e.g., *John Doe*).
5. Explore the **Student Profile** workspace:
   - In-depth attendance trackers, homework performance breakdown, and a predicted score trajectory using the machine learning regression line!

---

### 🏆 Phase 5: Cohort rankings & Leaderboards
1. Click on **Rankings** in the sidebar.
2. This displays a gamified academic ranking leaderboard.
3. The rankings are calculated dynamically based on attendance and assignment averages to promote positive reinforcement and allow teachers to see top performers at a glance.

---

### 🖨️ Phase 6: Generating Admin Reports
1. Click on **Reports** in the sidebar.
2. Choose a cohort report type:
   - High Risk Anomaly Report
   - Attendance Droppers Report
   - Grade Cohort Averages
3. Review the analytics breakdown and download raw exports for university/school files!

---

## 🛑 How to Stop the Services

### On Windows
Run the PowerShell script to kill the backend and frontend processes:
```powershell
.\kill_ports.ps1
```

### On macOS / Linux
Run the shell script to kill the running ports:
```bash
./stop-services.sh
```

---

## 🔍 Troubleshooting Tips
- **Spring Boot registry connection failures?** Wait for the `discovery-server` to fully boot up (takes about 15-20 seconds) before launching the other services.
- **Port Conflict?** Ensure port `8080`, `8761`, `8081`, `8082`, `8083`, `8084`, and `5173` are not being used by other applications.
- **Database Error?** Check your PostgreSQL logs to ensure the server is running, the databases exist, and the credentials match what's in `application.yml`.

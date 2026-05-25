# 🛠️ System Setup & Deployment Guide

This document provides step-by-step instructions to set up, configure, and run the complete **Student Performance Prediction & Management System** on your local machine.

---

## 📋 Prerequisites

Ensure you have the following software installed on your machine:

| Dependency | Required Version | Purpose |
| :--- | :--- | :--- |
| **Java Development Kit (JDK)** | JDK 21 | Core Spring Boot Runtime |
| **Apache Maven** | 3.9+ | Java Dependency & Build Management |
| **Node.js** | 18+ (LTS recommended) | Frontend compilation & React dev server |
| **PostgreSQL** | 15+ | Relational Database for Auth & Students |
| **MongoDB** | 6.0+ | Document Database for Analytics & Logs |

---

## 🗄️ Database Setup

The application relies on two PostgreSQL databases and one MongoDB database. Follow these commands to set them up:

### 1. PostgreSQL Database Initialization
Open your terminal or PostgreSQL CLI (`psql`) and execute the following commands using the master `postgres` user:

```sql
-- Create the Auth database (handles roles, credentials, and profiles)
CREATE DATABASE student_performance_auth;

-- Create the Student database (handles portfolios, marks, slots, and attendance)
CREATE DATABASE student_performance_students;
```

> [!IMPORTANT]
> **Database Credentials Alignment:**
> The Spring Boot microservices are configured by default to connect to PostgreSQL using:
> * **Host:** `localhost` (port `5432`)
> * **Username:** `postgres`
> * **Password:** `varsha27`
>
> If you have a different PostgreSQL password, you must update the `spring.datasource.password` property in:
> * `auth-service/src/main/resources/application.yml`
> * `student-service/src/main/resources/application.yml`

### 2. MongoDB Initialization
No manual database or table initialization is required for MongoDB! 
Simply ensure that your MongoDB community server is running locally on port `27017`. The `analytics-service` will automatically create the `student_performance_analytics` database and its collections upon first boot.

---

## 🚀 Application Launch Procedure

You can start the entire platform automatically using the built-in startup scripts, or launch services manually one by one.

### Method A: Automated Startup (Recommended)

The repository provides shell and PowerShell scripts that handle startup dependencies in the correct order (Discovery Server first, followed by Gateway, then the functional microservices).

#### On macOS / Linux:
Make the shell scripts executable and run the startup command:
```bash
# Grant execution permissions
chmod +x start-services.sh stop-services.sh

# Run the complete cluster in the background
./start-services.sh
```

#### On Windows (PowerShell):
```powershell
# Set execution policy if restricted
Set-ExecutionPolicy -Scope Process -ExecutionPolicy Bypass

# Start the cluster in secondary command windows
.\start-services.ps1
```

> [!TIP]
> To check the running status or view microservice boot logs, check the generated log files in the root folder:
> * `tail -f discovery-server.log`
> * `tail -f auth-service.log`
> * `tail -f student-service.log`

---

### Method B: Manual Service-by-Service Startup

If you prefer to run services individually for debugging, execute the following commands in separate terminal sessions from the project root directory:

```bash
# 1. Start Discovery Server (Wait ~10 seconds for it to fully load before starting others)
mvn -f discovery-server/pom.xml spring-boot:run

# 2. Start API Gateway Edge Router
mvn -f api-gateway/pom.xml spring-boot:run

# 3. Start Authentication & Identity Service
mvn -f auth-service/pom.xml spring-boot:run

# 4. Start Student Academic Profile Service
mvn -f student-service/pom.xml spring-boot:run

# 5. Start Predictor Analytics Engine
mvn -f analytics-service/pom.xml spring-boot:run

# 6. Start Export & Feign Report Service
mvn -f report-service/pom.xml spring-boot:run
```

---

## 💻 Frontend Client Setup

Once the backend microservices are up and running, configure and start the React Single Page Application:

```bash
# 1. Navigate to the client directory
cd client

# 2. Clean install dependencies
npm install

# 3. Compile and launch development server
npm run dev
```

* The terminal will output the local dev port, typically **[http://localhost:5173/](http://localhost:5173/)**.
* Open this URL in your browser.

---

## 🔑 Default Administrator Login

To log in to the administrative dashboard on a fresh database:

1. Register an administrator account or use the default seeder.
2. The initial HOD, HOD-assigned faculty, and admin accounts can be managed straight from the **User Account Management** page.
3. **Password Conventions:** 
   * When registering users via the Admin dashboard, the system automates secure default password generation: `[First 3 characters of their email] + #123`.
   * For example: `counselor@test.com` ➔ Default password: `cou#123`.

---

## 🛠️ Port & Services Reference Map

| Component | Port | Default URL | Purpose |
| :--- | :--- | :--- | :--- |
| **discovery-server** | `8761` | [http://localhost:8761/](http://localhost:8761/) | Eureka Service Registry Dashboard |
| **api-gateway** | `8080` | [http://localhost:8080/](http://localhost:8080/) | Entry Gateway for Client (API Proxy) |
| **auth-service** | `8081` | [http://localhost:8081/](http://localhost:8081/) | JWT Tokens, Registration, and User Scoping |
| **student-service** | `8082` | [http://localhost:8082/](http://localhost:8082/) | Student Academic Metrics & Bookings |
| **analytics-service** | `8083` | [http://localhost:8083/](http://localhost:8083/) | MongoDB ML Risk Prediction Engine |
| **report-service** | `8084` | [http://localhost:8084/](http://localhost:8084/) | Watchlist PDF & Excel File Exporter |
| **client** | `5173` | [http://localhost:5173/](http://localhost:5173/) | React Single Page Application Frontend |

---

## ⚠️ Troubleshooting Tips

### 1. Connection Pool Failures / Spring Boot Crashes on fresh DB
On a fresh Postgres installation, you may encounter:
`SQL Error: 0, SQLState: 23514 / violating check constraint roles_name_check`

**Solution:**
Open your PostgreSQL console and execute the following command to drop the legacy check constraint:
```sql
\c student_performance_auth;
ALTER TABLE roles DROP CONSTRAINT IF EXISTS roles_name_check;
```

### 2. Slow Downstream Routing (503 Service Unavailable)
If the API Gateway returns a `503 Service Unavailable` immediately after boot, the downstream microservice has not finished registering with Eureka yet.
**Solution:** Wait 10-15 seconds and check the Eureka Dashboard at `http://localhost:8761/`. Ensure the service's status is listed as `UP` before making requests.

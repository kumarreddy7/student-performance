# 🚀 Student Performance Predictor — Setup Guide

This document provides a comprehensive guide to setting up and running the Student Performance Prediction and Management System from scratch.

---

## 📋 System Prerequisites

Ensure you have the following software installed on your machine:
* **Java Development Kit (JDK):** Version 21 (Homebrew Java, OpenJDK, or Temurin recommended).
* **Node.js:** Version 20.x or higher (LTS recommended) and **npm** (comes with Node).
* **PostgreSQL Database:** Running locally on port `5432`.
* **MongoDB:** Running locally on port `27017`.
* **Maven:** Installed globally (or use the included `./mvnw` Maven Wrapper).

---

## 🗄️ Database Configurations

You must set up three databases before running the microservices.

### 1. PostgreSQL Setup (Ports & Database Names)
Log in to your PostgreSQL command line or tool (PgAdmin / DBeaver) and execute:
```sql
CREATE DATABASE student_performance_auth;
CREATE DATABASE student_performance_students;
```

#### Credentials:
Ensure the default password matches your PostgreSQL setup. The current configurations use:
* **Username:** `postgres`
* **Password:** `varsha27`

> [!NOTE]
> If your local PostgreSQL password differs, update the connection credentials in:
> * `auth-service/src/main/resources/application.yml`
> * `student-service/src/main/resources/application.yml`

### 2. MongoDB Setup
Ensure MongoDB is running locally. It will automatically create the database and collections on first connection:
* **Database Name:** `student_performance_analytics`
* **URI:** `mongodb://localhost:27017/student_performance_analytics`

---

## 💻 Running via Terminal (macOS / Linux)

For fast startup, we have optimized the shell scripts in the root directory.

### Step 1: Start the Backends
Run the startup script from the project root. This cleans stale caches, builds, and starts all six Spring Boot services in sequence:
```bash
# Terminate any previously running instances
bash stop-services.sh

# Start Eureka, API Gateway, and all 4 microservices
bash start-services.sh
```

### Step 2: Start the Frontend
In a separate terminal window, start the React + Vite dev server:
```bash
cd client
npm install
npm run dev
```

---

## 🎨 Running via VS Code (Recommended)

We have created an automated launcher in `.vscode/launch.json` and `.vscode/tasks.json` that lets you manage and debug all microservices with a single click.

### Step 1: Open the Project in VS Code
Open the project root folder `final-year-project-updated` in Visual Studio Code.

### Step 2: Start the Vite Client
1. Press `Cmd + Shift + P` (macOS) or `Ctrl + Shift + P` (Windows).
2. Type `Tasks: Run Task` and press Enter.
3. Select **`Run Client (Vite)`**. This launches the frontend development server on port `5173`.

### Step 3: Run the Backend Microservices
1. Open the **Run and Debug** view in VS Code (`Cmd + Shift + D` or click the play button with a bug on the left sidebar).
2. From the dropdown at the top, select **`🚀 Start All Backends`**.
3. Press the green **Start** play button (or hit `F5`).

VS Code will automatically boot all six Spring Boot microservices in the correct order, attach debuggers, and display their stdout feeds directly inside your Debug Console!

---

## 🔗 Port Mappings & Dashboard Verification

Once running, verify that everything is healthy:

| Port | Service Name | Purpose / Endpoint | Verification Link |
|:---|:---|:---|:---|
| **8761** | **discovery-server** | Eureka Service Directory | [http://localhost:8761](http://localhost:8761) |
| **8080** | **api-gateway** | Gateway router and edge CORS | [http://localhost:8080/api](http://localhost:8080/api) |
| **8081** | **auth-service** | User details & JWT sessions | [http://localhost:8081](http://localhost:8081) |
| **8082** | **student-service** | Student, marks, attendance, slots | [http://localhost:8082](http://localhost:8082) |
| **8083** | **analytics-service**| Mongo Performance & Risk Model | [http://localhost:8083](http://localhost:8083) |
| **8084** | **report-service** | Excel & PDF reports exporter | [http://localhost:8084](http://localhost:8084) |
| **5173** | **client** | React + Vite UI portal | [http://localhost:5173](http://localhost:5173) |

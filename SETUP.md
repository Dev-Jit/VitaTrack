# VitaTrack Setup Guide

This guide helps you run VitaTrack on a new PC without installing local PostgreSQL.

## Prerequisites

- Java 17 or newer
- Maven
- Node.js 18+ and npm
- Git

## 1) Clone the repository

```bash
git clone <your-repository-url>
cd Vitatrack
```

## 2) Configure backend environment

From the project root:

1. Copy `.env.example` to `.env`
2. Fill in real values

Required keys in `/.env`:

```env
SERVER_PORT=8081

DB_URL=jdbc:postgresql://<project-ref>.pooler.supabase.com:6543/postgres?sslmode=require
DB_USERNAME=<supabase-db-username>
DB_PASSWORD=<supabase-db-password>

APP_JWT_SECRET=<very-long-random-secret>
APP_JWT_EXPIRATION_MS=86400000

APP_CORS_ALLOWED_ORIGINS=http://localhost:3000,http://localhost:5173
APP_CORS_ALLOWED_METHODS=GET,POST,PUT,PATCH,DELETE,OPTIONS
APP_CORS_ALLOWED_HEADERS=*
APP_CORS_ALLOW_CREDENTIALS=true
```

Notes:
- For Supabase pooler, use port `6543`.
- Keep `sslmode=require` in `DB_URL`.

## 3) Configure frontend environment

In `frontend/`:

1. Copy `.env.example` to `.env`
2. Ensure this value is set:

```env
VITE_API_BASE_URL=http://localhost:8081/api
```

## 4) Run the backend

From project root:

```bash
mvn spring-boot:run
```

Backend runs on `http://localhost:8081`.

## 5) Run the frontend

Open a second terminal:

```bash
cd frontend
npm install
npm run dev
```

Frontend runs on `http://localhost:5173`.

## 6) Verify app

- Open `http://localhost:5173`
- Register a user
- Login
- Open Profile and save details
- Open Exercises/Videos and test logging

## Troubleshooting

### Backend still tries localhost DB

Make sure you run backend from project root (`Vitatrack`) so Spring can load `/.env`.

### Authentication to Supabase fails

- Recheck `DB_USERNAME` and `DB_PASSWORD`
- Confirm `DB_URL` host/port from Supabase
- Keep `sslmode=require`

### Frontend cannot reach backend

Check `frontend/.env`:

```env
VITE_API_BASE_URL=http://localhost:8081/api
```

Then restart frontend dev server.

## Security

Do not commit secrets:
- `/.env`
- `/frontend/.env`

Only commit:
- `/.env.example`
- `/frontend/.env.example`

# JobPortal 🧑‍💼💻

A **full-stack Job Portal** application built with **ASP.NET Core (Web API, EF Core, Identity)** and **React (Vite + TypeScript)**.  
Users can **register, login, post jobs, search jobs, and apply with resumes**.  
Recruiters can manage job listings and applications, while admins have dashboard controls.

---

## 🚀 Tech Stack

### Backend
- **ASP.NET Core 7 (Web API)**
- **Entity Framework Core** (ORM, migrations, LINQ)
- **ASP.NET Core Identity** (user management & roles)
- **JWT Authentication** (for API + SPA communication)
- **SQL Server / PostgreSQL** (database)
- **Swagger / OpenAPI** (API documentation)

### Frontend
- **React (Vite + TypeScript)**
- **React Router** (routing & protected routes)
- **TailwindCSS / MUI** (styling — pick one)
- **Fetch API / Axios** (API requests)

### Deployment & DevOps
- **Docker + docker-compose**
- **GitHub Actions** (CI/CD pipeline)
- **Azure App Service + Azure SQL + Azure Blob Storage**
- Or **Netlify/Vercel** for frontend hosting

---

## ✨ Features

### 👤 User
- Register / login with JWT auth
- Browse and search job listings
- Apply to jobs with resume upload
- Track application status

### 🏢 Recruiter
- Create, update, delete job postings
- View applicants per job
- Manage application statuses (reviewed, interview, hired, rejected)

### 👨‍💻 Admin (optional)
- Manage all users, jobs, and applications
- Dashboard with system-wide metrics

---

## 📂 Project Structure

```
/jobportal
  /src
    /JobPortal.Api         # ASP.NET Core Web API backend
    /JobPortal.WebClient   # React (Vite + TypeScript) frontend
  docker-compose.yml
  .github/workflows/ci.yml
  README.md
```

---

## 🛠️ Setup & Run

### Backend (ASP.NET Core)
```bash
cd src/JobPortal.Api

# Restore dependencies
dotnet restore

# Create database & run migrations
dotnet ef migrations add InitialCreate
dotnet ef database update

# Run API
dotnet run
```
- API runs on `https://localhost:7001` (HTTPS) and `http://localhost:5001` (HTTP).
- Swagger docs available at `/swagger`.

### Frontend (React + Vite + TypeScript)
```bash
cd src/JobPortal.WebClient

# Install dependencies
npm install

# Start dev server
npm run dev
```
- Frontend runs on `http://localhost:5173` (Vite default).
- Configured proxy sends `/api` requests to the backend.

---

## 🔑 Environment Variables

### Backend (`appsettings.json` or env vars)
```json
"ConnectionStrings": {
  "DefaultConnection": "Server=localhost;Database=JobPortalDb;User Id=sa;Password=YourStrong!Passw0rd;"
},
"Jwt": {
  "Key": "super_secret_key_here",
  "Issuer": "jobportal",
  "Audience": "jobportal_users"
}
```

### Frontend (`.env`)
```env
VITE_API_URL=http://localhost:5001/api
```

---

## 📌 API Endpoints (MVP)

### Auth
- `POST /api/auth/register` → create account
- `POST /api/auth/login` → login, returns JWT

### Jobs
- `GET /api/jobs` → list jobs (supports pagination, filters)
- `GET /api/jobs/{id}` → get job details
- `POST /api/jobs` → create job (recruiter-only)
- `PUT /api/jobs/{id}` → update job (recruiter-only)
- `DELETE /api/jobs/{id}` → delete job (recruiter/admin)

### Applications
- `POST /api/applications` → apply with resume
- `GET /api/applications/{jobId}` → recruiter views applicants
- `PUT /api/applications/{id}` → update status

### Uploads
- `POST /api/uploads` → upload resume (returns file URL)

---

## 📦 Docker (optional)

Local dev with containers:
```bash
docker-compose up --build
```

Services:
- `db` → SQL Server
- `api` → ASP.NET Core backend
- `web` → React frontend

---

## 🚀 Deployment

### Backend
- Deploy API as **Azure App Service** (or containerized to Azure Container Apps).
- Use **Azure SQL Database** for DB.
- Store resumes in **Azure Blob Storage**.

### Frontend
- Deploy React static build to **Netlify** / **Vercel** / **Azure Static Web Apps**.
- Or serve frontend build from backend `wwwroot`.

---

## 🧪 Testing

### Backend
- **Unit tests** with xUnit
- **Integration tests** with ASP.NET Core TestServer

### Frontend
- **Jest + React Testing Library** for component tests

---

## 🗺️ Roadmap

- [x] Backend scaffold with EF Core & JobsController
- [x] Add migrations & database
- [ ] Add Identity & JWT authentication
- [ ] Implement AuthController (register/login)
- [ ] Build React frontend (Vite + TS)
- [ ] Implement auth flow on frontend
- [ ] Jobs CRUD (frontend + backend integration)
- [ ] Resume uploads
- [ ] Recruiter dashboard
- [ ] Admin role & dashboard
- [ ] CI/CD with GitHub Actions
- [ ] Deploy backend (Azure) + frontend (Netlify/Vercel)

---

## 📸 Screenshots / Demo (to add later)

_Add screenshots or a short demo video/gif once core features are done._

---

## 💡 Resume Highlight

> *“Developed a Job Portal web application using ASP.NET Core, EF Core, Identity, and React (Vite + TypeScript). Implemented JWT authentication, role-based authorization, and resume uploads. Deployed backend on Azure App Service and frontend on Netlify.”*

---

## 🤝 Contributing

Clone the repo, open a branch, and make PRs.  
All suggestions welcome!

# 🚀 LeadFlow CRM

**A Full-Stack Customer Relationship Management (CRM) Application** built as part of the VyorAI SDE Internship Evaluation.

Manage leads, track sales pipeline stages, schedule follow-ups, and monitor business activities through a dashboard.

<p align="center">

![Python](https://img.shields.io/badge/Python-3.12-blue?logo=python&logoColor=white)
![Django](https://img.shields.io/badge/Django-5.2-green?logo=django&logoColor=white)
![DRF](https://img.shields.io/badge/DRF-3.18-red)
![React](https://img.shields.io/badge/React-19-61DAFB?logo=react&logoColor=black)
![Vite](https://img.shields.io/badge/Vite-8-646CFF?logo=vite&logoColor=white)
![License](https://img.shields.io/badge/License-MIT-yellow.svg)

</p>

---

## ✨ Features

- 🔐 JWT-based Authentication and Authorization.
- 👥 Lead Management (Create, Read, Update, Delete).
- 📊 Sales Pipeline Tracking.
- 📅 Follow-up Scheduling and Management.
- ⏰ Automatic Overdue Follow-up Detection.
- 📈 Dashboard with Live Statistics.
- 🔒 User-Level Data Isolation.
- ✅ Server-Side Validation and Error Handling.

---

## 🛠 Tech Stack

| Layer | Technology |
|---|---|
| Backend | Python, Django 5.2, Django REST Framework |
| Authentication | SimpleJWT |
| Frontend | React 19, Vite 8 |
| Routing | React Router |
| API Client | Axios |
| Database | SQLite / PostgreSQL |
| Styling | Responsive CSS |

---

## 🏗 Architecture

```mermaid
flowchart TD
    A[User] --> B[React + Vite]
    B --> C[Axios API Client]
    C --> D[Django REST Framework]
    D --> E[JWT Authentication]
    D --> F[Accounts / Leads / Activities]
    F --> G[(SQLite / PostgreSQL)]
    D --> H[Dashboard API]
```

---

## 📁 Project Structure

```text
LeadFlow-CRM/
├── backend/
│   ├── config/
│   ├── accounts/
│   ├── leads/
│   ├── activities/
│   ├── dashboard/
│   ├── requirements.txt
│   └── manage.py
│
├── frontend/
│   └── src/
│       ├── api/
│       ├── components/
│       ├── context/
│       ├── layouts/
│       ├── pages/
│       ├── routes/
│       ├── hooks/
│       └── utils/
│
└── README.md
```

---

## 📸 Screenshots

### Dashboard

### Dashboard
![Dashboard](image/image1.png)

### Leads Management
![Leads Management](image/image2.png)

### Follow-ups
![Follow-ups](image/image3.png)

## 🚀 Getting Started

### Prerequisites

- Python 3.12+
- Node.js 20+
- npm

### Backend Setup

```bash
cd backend

python -m venv .venv

# Windows
.venv\Scripts\activate

pip install -r requirements.txt

copy .env.example .env

python manage.py migrate

python manage.py runserver
```

### Frontend Setup

Open another terminal:

```bash
cd frontend

copy .env.example .env

npm install

npm run dev
```

**Frontend:** http://localhost:5173

**Backend:** http://127.0.0.1:8000/api/v1/

---

## 🔒 Security Highlights

- JWT authentication with refresh token rotation.
- Secure password hashing using Django PBKDF2.
- User-specific data access and ownership permissions.
- Server-side input validation.
- Protected API endpoints.
- Standardized API error responses.

---

## 🧪 Testing

| Test | Result |
|---|---|
| Backend automated tests | 42 Passed |
| API smoke tests | 24/24 Passed |
| Frontend production build | Passed |
| Frontend lint | 0 Errors, 1 Warning |

*Browser E2E testing and PostgreSQL integration remain unverified.*

---

## 🔮 Future Improvements

- [ ] Pagination and advanced filtering.
- [ ] Password reset and email verification.
- [ ] Advanced dashboard analytics.
- [ ] Frontend automated testing.
- [ ] Production deployment.

---

## 📜 License

**MIT License**

Copyright (c) 2026 Shailesh Kumar

Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT.

Developed as part of the **VyorAI SDE Internship Evaluation**.

---

<p align="center">

**Built with ❤️ using Python, Django REST Framework and React.**

[GitHub Repository](https://github.com/SKM2227229725/LeadFlow-CRM)

</p>
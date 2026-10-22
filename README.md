# Civil Master Solution API

This is the backend API for **Civil Master Solution (CMS)** — a dynamic content management system where all data (products, news, projects, partners, customers, etc.) is managed by the **admin panel**.
Public users can view the website, submit request forms, and interact with an AI-powered chatbot for inquiries.

## Product repository

This fork is also mirrored, with its history preserved, as the [`api`](https://github.com/Khant26/civil-master-solution/tree/api) branch of the combined [Civil Master Solution repository](https://github.com/Khant26/civil-master-solution). The original fork remains available for attribution and upstream comparison.

---

## Features

* Built with Django REST Framework (DRF)
* PostgreSQL (Supabase) integration for data storage
* JWT authentication for secure admin access
* CORS enabled for frontend integration
* AI-Powered Chatbot with Gemini API for Q&A (English and Thai support)
* Easy Request Form submission for public users
* Separate Admin API routes for content management
* Security Features: Rate limiting, honeypot detection, input validation, session management, and logging
* Production-Ready: HTTPS support, caching, and scalability options

### 🔧 Admin can manage:
* Partnerships  
* Customerships  
* Products  
* Request Forms (from public users)  
* Project References  
* News 

### 🤖 Chatbot Features:
* Bilingual support (English/Thai detection and responses)
* 50 questions per session limit, 70-word limit per question
* 30-minute session timeout
* Security: Rate limiting (10/min per session, 50/min per IP), honeypot for bot detection, caching for efficiency
* Powered by Google Gemini API with concurrency control

---

## Tech Stack

| Component             | Technology                       |
| --------------------- | ---------------------            |
| Backend Framework     | Django 5.2                       |
| REST API              | Django REST Framework            |
| Authentication        | JWT (SimpleJWT)                  |
| Database              | PostgreSQL (Supabase)            |
| AI Chatbot            | Google Gemini API                |
| Security              | Rate Limiting, Honeypot, Logging |
| Deployment Ready      | ✅ Yes                          |
| Environment Variables | `.env` file                      |
| Virtual Environment   | Python `venv`                    | 

---

## Installation Guide

### 1. Clone the repository

```bash
git clone https://github.com/civilmastersolution-CMS/cms_testing_backend.git
cd cms-backend
```

### 2. Create a virtual environment

```bash
python -m venv venv
```

### 3. Activate it

* **Windows**

  ```bash
  venv\Scripts\activate
  ```
* **Mac/Linux**

  ```bash
  source venv/bin/activate
  ```

### 4. Install dependencies

```bash
pip install -r requirements.txt
```

### 5. Setup environment variables

Copy the template and fill in values (never commit `.env`):

```bash
cp .env.example .env
```

| Variable | Purpose |
|---|---|
| `SECRET_KEY` | Django secret key. **Required** when `DEBUG` is off (legacy name `DJANGO_SECRET_KEY` also works). |
| `DEBUG` | `True` for local development only. |
| `ALLOWED_HOSTS` | Extra hostnames, comma-separated. |
| `DATABASE_URL` | Postgres URL; SQLite is used when empty. |
| `REDIS_URL` | Redis cache; in-memory cache when empty. |
| `FRONTEND_URL`, `ADMIN_URL`, `CORS_ALLOWED_ORIGINS`, `CSRF_TRUSTED_ORIGINS` | Allowed browser origins (the public site and its `/admin` dashboard). |
| `CORS_ALLOW_VERCEL_PREVIEWS` | Allow `https://*.vercel.app` (default `True`). |
| `SECURE_SSL_REDIRECT` | HTTPS redirect when `DEBUG` is off (default `True`). |
| `MEDIA_ROOT` | Upload directory (Render disk / Docker volume). |
| `GEMINI_API_KEY` | Chatbot (Google Gemini). |
| `EMAIL_HOST`, `EMAIL_PORT`, `EMAIL_HOST_USER`, `EMAIL_HOST_PASSWORD`, `DEFAULT_FROM_EMAIL`, `ADMIN_ALERT_EMAIL` | SMTP for request-form replies and alerts. |
| `DJANGO_SUPERUSER_USERNAME`, `DJANGO_SUPERUSER_EMAIL`, `DJANGO_SUPERUSER_PASSWORD` | Optional; `build.sh` creates this superuser once. |

### 6. Run migrations

```bash
python manage.py migrate
```

### 7. Create a superuser

```bash
python manage.py createsuperuser
```

### 8. Run the development server

```bash
python manage.py runserver
```

---

## Health check, tests and Docker

- `GET /health/` returns `{"status": "ok"}` (200); Render's `healthCheckPath` and the Docker `HEALTHCHECK` use it.
- Checks and tests (no network or real secrets needed):

```bash
SECRET_KEY=dummy DEBUG=False python manage.py check
SECRET_KEY=dummy DEBUG=False python manage.py test
```

- Docker (gunicorn on `0.0.0.0:8000`, static files collected at build time):

```bash
docker build -t cms-api .
docker run --rm --env-file .env cms-api python manage.py migrate
docker run -d -p 8000:8000 --env-file .env -v cms-media:/app/media cms-api
```

## API Endpoints

| Function            | Endpoint                    | Method |
| ------------------- | --------------------------- | ------ |
| Partnerships        | `/api/partnerships/`        | GET    |
| Customerships       | `/api/customerships/`       | GET    |
| Products            | `/api/products/`            | GET    |
| Request Form        | `/api/requestforms/`        | POST   |
| Project References  | `/api/projectreferences/`   | GET    |
| News                | `/api/news/`                | GET    |
| Django Admin Panel  | `/admin/`                   | Web UI |
| Chatbot             | `/api/chatnot`              | POST   |

---

## Example Request Body

### Request Form

```json
{
    "full_name": "John Doe",
    "email_address": "John@gmail.com",
    "contact_number": "09123456789",
    "company_name": "John company",
    "country": "Japan",
    "product_name": "Unknown",
    "comments": "Optional comment here"
}
```

---
### Security Notes
* Rate Limiting: Protects against abuse (10/min per session, 50/min per IP).
* Honeypot: Detects bots via hidden fields.
* Input Validation: Limits word count and sanitizes inputs.
* Session Management: 30-minute timeouts and 50-message limits.
* Logging: Monitors security events in chatbot_security.log.
* Production: Enable HTTPS, use WAF (e.g., Cloudflare), and set budgets in Google Cloud for Gemini API.
* Audit: Regularly update dependencies and scan for vulnerabilities.

##  Author

**Civil Master Solution (CMS)**
Developed by: *Thantwyl*
Repository: [GitHub - cms_testing_backend](https://github.com/civilmastersolution-CMS/cms_testing_backend.git)

---

# CMS Backend - Render Deployment Guide

## ✅ **Files Ready for Deployment:**

### 1. **requirements.txt** - ✅ Updated
- Clean, production-ready dependencies
- Includes: Django, DRF, Gunicorn, WhiteNoise, PostgreSQL, Redis, AI/ML libraries

### 2. **build.sh** - ✅ Created
- Installs dependencies
- Collects static files
- Runs migrations

### 3. **render.yaml** - ✅ Created
- Complete service configuration
- PostgreSQL database setup
- Redis cache setup
- Environment variables template

### 4. **runtime.txt** - ✅ Created
- Specifies Python 3.11.0

### 5. **settings.py** - ✅ Updated
- Dynamic database configuration (Render/Supabase/SQLite)
- WhiteNoise for static files
- Redis cache support
- Production security settings
- CORS configuration
- SSL/HTTPS settings

### 6. **.gitignore** - ✅ Updated
- Excludes .env, logs, staticfiles, db.sqlite3
- Clean for Git commits

### 7. **.env.example** - ✅ Created
- Template for environment variables
- Documentation for team members

---

## 🚀 **Deployment Steps:**

### **Step 1: Test Locally**

```bash
# Install dependencies
pip install -r requirements.txt

# Run migrations
python manage.py migrate

# Collect static files
python manage.py collectstatic --noinput

# Test server
python manage.py runserver
```

### **Step 2: Commit to Git**

```bash
# Check status
git status

# Add all files
git add .

# Commit
git commit -m "Prepare Django backend for Render deployment"

# Push to GitHub
git push origin main
```

### **Step 3: Create Render Services**

#### **A. PostgreSQL Database**
1. Go to [render.com](https://render.com) → New → PostgreSQL
2. Settings:
   - Name: `cms-postgres-db`
   - Database: `cms_chatbot`
   - User: `cms_user`
   - Region: Singapore
   - Plan: Free
3. Copy **Internal Database URL**

#### **B. Redis Cache**
1. New → Redis
2. Settings:
   - Name: `cms-redis`
   - Region: Singapore
   - Plan: Free
3. Copy **Internal Redis URL**

#### **C. Web Service**
1. New → Web Service
2. Connect GitHub repository
3. Settings:
   - Name: `cms-backend`
   - Region: Singapore
   - Branch: `main`
   - Build Command: `./build.sh`
   - Start Command: `gunicorn CMSproject.wsgi:application --bind 0.0.0.0:$PORT`

### **Step 4: Set Environment Variables**

In Render Web Service → Environment:

```
SECRET_KEY = [Auto-generate]
DEBUG = False
GEMINI_API_KEY = [your Gemini API key]
DATABASE_URL = [From PostgreSQL service]
REDIS_URL = [From Redis service]
FRONTEND_URL = https://www.civilmastersolution.com
EMAIL_HOST = smtp.gmail.com
EMAIL_PORT = 587
EMAIL_HOST_USER = [sender Gmail address]
EMAIL_HOST_PASSWORD = [Gmail app password]
ADMIN_ALERT_EMAIL = [alert recipient address]
```

### **Step 5: Deploy**

Click **"Create Web Service"** - Render will:
- Clone repository
- Run `build.sh`
- Start Gunicorn server

### **Step 6: Create Superuser**

In Render Dashboard → Shell:

```bash
python manage.py createsuperuser
```

### **Step 7: Verify**

Test these URLs:
- Admin: `https://your-app.onrender.com/admin/`
- Chatbot API: `https://your-app.onrender.com/api/chatbot/`

---

## ⚠️ **Important Notes:**

### **Free Tier Limitations:**
- Spins down after 15 min inactivity
- First request takes ~30 seconds
- 750 hours/month (shared across services)

### **Database:**
- PostgreSQL: 1GB free storage
- Automatically backed up

### **Redis:**
- 25MB free tier
- Auto-evicts old keys

### **Static Files:**
- Served by WhiteNoise
- Automatically compressed

---

## 🔧 **Post-Deployment:**

### **Update Frontend:**

```env
REACT_APP_API_URL=https://your-app.onrender.com
```

### **Monitor Logs:**

Check Render Dashboard → Logs tab for:
- Build logs
- Application logs
- Error messages

---

## ✅ **Deployment Checklist:**

- [ ] All files updated and committed to Git
- [ ] PostgreSQL database created on Render
- [ ] Redis cache created on Render
- [ ] Web service configured with correct build/start commands
- [ ] All environment variables set
- [ ] Deployment successful (check logs)
- [ ] Superuser created
- [ ] Admin panel accessible
- [ ] Chatbot API working
- [ ] Frontend updated with new API URL
- [ ] End-to-end testing completed

---

Your Django backend is now **100% ready for Render deployment**! 🎉

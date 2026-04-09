# Student Free Deployment Guide (No Upfront AWS Spend)

This guide gets your project online using free plans first, while keeping your AWS design as an architecture plan for later.

## Target Stack

1. Frontend: Vercel (Hobby)
2. Backend: Render Free Web Service
3. Database: MongoDB Atlas M0 (free-forever)

## Why This Path

1. You can ship a live demo now without funding AWS resources.
2. Services scale down on idle on free tiers.
3. You can migrate the same app to AWS later with minimal code changes.

## Step 1: Create MongoDB Atlas Free Cluster

1. Create Atlas account and choose `M0` free tier cluster.
2. Create DB user and password.
3. Allow network access:
   1. For quick setup: `0.0.0.0/0`
   2. For safer setup later: restrict by known IPs
4. Copy connection string:
   - `mongodb+srv://<user>:<password>@<cluster-url>/...`

Use `DB_NAME=sentinel_prod` (or your own name).

## Step 2: Deploy Backend to Render (Free)

You can use the included [`render.yaml`](/Users/bhooomickadg/Downloads/atos_frontend-main/render.yaml), or configure in dashboard manually.

### Manual Render Settings

1. Service type: `Web Service`
2. Runtime: `Python 3`
3. Root directory: `backend`
4. Build command: `pip install -r requirements.txt`
5. Start command: `uvicorn server:app --host 0.0.0.0 --port $PORT`
6. Instance type: `Free`

### Required Backend Environment Variables

1. `MONGO_URL` = your Atlas URI
2. `DB_NAME` = `sentinel_prod`
3. `JWT_SECRET` = random strong string
4. `CORS_ORIGINS` = `https://<your-frontend-domain>`

Optional:

1. `RESEND_API_KEY`
2. `EMAIL_FROM`

After deploy, note your backend URL:

- `https://<service-name>.onrender.com`

Health check:

- `https://<service-name>.onrender.com/api/health`

## Step 3: Deploy Frontend to Vercel (Free)

Use the `frontend` directory as project root in Vercel.

### Vercel Project Settings

1. Framework preset: `Create React App`
2. Root directory: `frontend`
3. Build command: `npm run build`
4. Output directory: `build`

### Required Frontend Environment Variable

1. `REACT_APP_BACKEND_URL` = `https://<service-name>.onrender.com`

Then deploy. The included [`frontend/vercel.json`](/Users/bhooomickadg/Downloads/atos_frontend-main/frontend/vercel.json) handles SPA routing fallback.

## Step 4: End-to-End Check

1. Open frontend URL.
2. Login with demo credentials:
   1. `bhooomickadg@gmail.com / 12345`
3. Confirm dashboard loads and API calls succeed.
4. Open backend health URL and confirm `"status"` is `healthy` or `degraded`.

## Free-Tier Cost Safety

1. Keep one backend service only.
2. Avoid high-volume traffic tests.
3. Keep media/file uploads out of backend local filesystem.
4. If inactive, Render may spin down service (first request can take ~1 minute).

## If Render Requires Billing Method in Your Region

Fallback with still-free workflow:

1. Deploy frontend on Vercel.
2. Run backend locally:
   - `cd backend && uvicorn server:app --host 0.0.0.0 --port 8000`
3. Tunnel local backend with Cloudflare Tunnel or ngrok free.
4. Set `REACT_APP_BACKEND_URL` in Vercel to your tunnel URL.

This keeps monthly cost at zero for demo/student use.

## Keep AWS in Your Presentation

For your slide/demo narrative:

1. Current deployment: Vercel + Render + Atlas (student free path)
2. Production target: AWS-native security architecture (your slide)
3. Migration plan: replace hosting layer with AWS services when account is active and budget-safe

## References (official docs)

1. Vercel pricing and usage caps: https://vercel.com/pricing
2. Render free instances: https://render.com/docs/free
3. Render FastAPI deploy: https://render.com/docs/deploy-fastapi
4. MongoDB Atlas pricing (M0 free tier): https://www.mongodb.com/pricing


# Coffeelings API - Quick Start Guide

## What Was Implemented

A complete production-ready NestJS backend API with:

- ✅ Firebase Authentication integration
- ✅ Cloud Firestore database
- ✅ Full CRUD operations for daily mood entries
- ✅ Multi-user data isolation
- ✅ Input validation and error handling
- ✅ CORS configuration
- ✅ Health check endpoint
- ✅ Docker containerization
- ✅ Cloud Run deployment ready

## Project Structure

```
coffeelings_api/
├── src/
│   ├── common/           # Guards, decorators, filters
│   ├── config/           # Environment configuration
│   ├── firebase/         # Firebase Admin SDK service
│   ├── roasts/           # Main API module (calendar endpoints)
│   ├── health/           # Health check endpoint
│   ├── app.module.ts     # Root module
│   └── main.ts           # Application bootstrap
├── Dockerfile            # Production Docker image
├── .env.example          # Environment template
└── README.md             # Full documentation
```

## Quick Setup (3 Steps)

### 1. Configure Firebase

Create a `.env` file:

```bash
cp .env.example .env
```

Get your Firebase credentials:
1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project (or create one)
3. Go to Project Settings > Service Accounts
4. Click "Generate New Private Key"
5. Copy the values to your `.env` file

### 2. Install & Build

```bash
npm install
npm run build
```

### 3. Run the API

```bash
npm run start:dev
```

The API will be available at `http://localhost:5174`

## Testing It Works

### 1. Test Health Endpoint (No Auth Required)

```bash
curl http://localhost:5174/health
```

Expected response:
```json
{
  "status": "ok",
  "timestamp": "2025-01-26T..."
}
```

### 2. Test Protected Endpoint (Auth Required)

First, get a Firebase ID token from your frontend or Firebase Auth.

Then test the calendar endpoint:

```bash
curl "http://localhost:5174/calendar?year=2025&month=01" \
  -H "Authorization: Bearer YOUR_FIREBASE_TOKEN"
```

Expected response:
```json
{
  "2025": {
    "01": []
  }
}
```

## API Endpoints

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/health` | ❌ No | Health check |
| GET | `/calendar?year=YYYY&month=MM` | ✅ Yes | Get monthly roasts |
| POST | `/calendar` | ✅ Yes | Create new roast |
| PATCH | `/calendar/:id` | ✅ Yes | Update roast |
| DELETE | `/calendar/:id` | ✅ Yes | Delete roast |

## Example: Create a Roast

```bash
curl -X POST http://localhost:5174/calendar \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_FIREBASE_TOKEN" \
  -d '{
    "roast": "excited",
    "message": "Great coffee today!",
    "date": 1704067200000
  }'
```

Valid roast values: `excited`, `ok`, `tired`, `sad`, `angry`

## Environment Variables

Required in `.env`:

```env
# Server
PORT=5174
NODE_ENV=development

# Firebase (get from Firebase Console)
FIREBASE_PROJECT_ID=your-project-id
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
FIREBASE_CLIENT_EMAIL=firebase-adminsdk-xxxxx@your-project.iam.gserviceaccount.com

# CORS
ALLOWED_ORIGINS=http://localhost:5173,http://localhost:5174
```

## Docker Deployment

Build and run with Docker:

```bash
# Build
docker build -t coffeelings-api .

# Run
docker run -p 8080:8080 --env-file .env coffeelings-api
```

## Cloud Run Deployment

```bash
# Build for Cloud Run
docker build -t gcr.io/YOUR_PROJECT_ID/coffeelings-api .

# Push to GCR
docker push gcr.io/YOUR_PROJECT_ID/coffeelings-api

# Deploy
gcloud run deploy coffeelings-api \
  --image gcr.io/YOUR_PROJECT_ID/coffeelings-api \
  --platform managed \
  --region us-central1 \
  --allow-unauthenticated
```

Don't forget to set environment variables in Cloud Run console.

## Firestore Setup

The API will automatically create the following structure:

```
users/
  {userId}/
    roasts/
      {roastId}/
        - id, roast, message, date, userId, year, month, createdAt, updatedAt
```

No manual setup required. Just ensure Firestore is enabled in your Firebase project:
1. Firebase Console > Firestore Database
2. Click "Create database"
3. Choose production mode or test mode
4. Select a location

## Common Issues

### "Firebase credentials not properly configured"
- Check your `.env` file has all three Firebase variables
- Ensure the private key includes `\n` newlines (use quotes)
- Verify the service account JSON is from the correct Firebase project

### "Invalid or expired token"
- Make sure you're using a fresh Firebase ID token
- Tokens expire after 1 hour
- Get a new token from Firebase Authentication

### Port already in use
- Change `PORT` in `.env` to a different port (e.g., 5175)
- Or kill the process using port 5174: `lsof -ti:5174 | xargs kill`

## Next Steps

1. **Frontend Integration**: Update your frontend to point to `http://localhost:5174`
2. **Test All Endpoints**: Use the examples in README.md to test CRUD operations
3. **Deploy to Cloud Run**: Follow the deployment section above
4. **Add Monitoring**: Set up Cloud Logging and monitoring in GCP

## Development Commands

```bash
npm run start:dev     # Development mode with hot reload
npm run build         # Build for production
npm run start:prod    # Run production build
npm run format        # Format code with Prettier
npm run lint          # Lint code with ESLint
```

## Support

- Full API spec: `BACKEND_API_SPEC.md`
- Detailed docs: `README.md`
- Project instructions: `CLAUDE.md`

## Architecture Highlights

**Security**
- Firebase ID token verification on all protected routes
- User data isolation (users can only access their own data)
- Input validation with class-validator
- CORS restricted to configured origins

**Data Model**
- Hierarchical calendar structure (year/month)
- UUID v4 for roast IDs
- Unix timestamps in milliseconds
- Automatic year/month indexing for efficient queries

**Cloud Ready**
- Graceful shutdown handling
- Health check endpoint
- Non-root Docker user
- Dynamic PORT binding for Cloud Run

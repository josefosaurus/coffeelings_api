# Backend API Specification - Coffeelings

This document describes the API endpoints that the backend must implement to support the Coffeelings frontend application.

## Base URL

```
http://localhost:5174
```

**Note:** The base URL should be configurable via environment variables in production.

## Headers

All requests expect the following headers:

```
Content-Type: application/json
```

## Authentication

Authentication is handled by Firebase on the client side. The backend should validate Firebase ID tokens if implementing authentication:

- Frontend uses Firebase Authentication (email/password)
- Backend should verify Firebase ID tokens sent in the `Authorization` header
- Format: `Authorization: Bearer <firebase-id-token>`

## Data Models

### DailyRoast

The core data model for a journal entry.

```typescript
{
  id: string;           // Unique identifier (UUID)
  roast: Roast;         // Emotional state (see Roast enum below)
  message?: string;     // Optional journal entry text
  date: number;         // Unix timestamp in milliseconds
}
```

### Roast Enum

Valid emotional states:

```typescript
type Roast = 'excited' | 'ok' | 'tired' | 'sad' | 'angry';
```

### Calendar Data Structure

The calendar data is organized by year and month:

```typescript
{
  [year: string]: {
    [month: string]: DailyRoast[]
  }
}
```

**Example:**
```json
{
  "2025": {
    "01": [
      {
        "id": "550e8400-e29b-41d4-a716-446655440000",
        "roast": "excited",
        "message": "Great coffee today!",
        "date": 1704067200000
      }
    ],
    "02": [...]
  }
}
```

## API Endpoints

### 1. Get Calendar Data

Retrieves calendar entries for a specific year and month.

**Endpoint:** `GET /calendar`

**Query Parameters:**
- `year` (string, required): The year (e.g., "2025")
- `month` (string, required): The month with leading zero (e.g., "01", "12")

**Example Request:**
```
GET /calendar?year=2025&month=01
```

**Success Response:**
- **Status Code:** `200 OK`
- **Body:**
  ```json
  {
    "2025": {
      "01": [
        {
          "id": "550e8400-e29b-41d4-a716-446655440000",
          "roast": "excited",
          "message": "Great coffee today!",
          "date": 1704067200000
        },
        {
          "id": "6ba7b810-9dad-11d1-80b4-00c04fd430c8",
          "roast": "ok",
          "message": "Average day",
          "date": 1704153600000
        }
      ]
    }
  }
  ```

**Notes:**
- The current implementation returns the entire calendar data structure
- Frontend filters by year/month, but backend should ideally filter server-side
- Empty months should return an empty array: `{"2025": {"01": []}}`

---

### 2. Create Roast Entry

Creates a new journal entry.

**Endpoint:** `POST /calendar`

**Request Body:**
```json
{
  "roast": "excited",
  "message": "Amazing brew this morning!",
  "date": 1704067200000
}
```

**Payload Schema:**
- `roast` (string, required): Must be one of: 'excited', 'ok', 'tired', 'sad', 'angry'
- `message` (string, optional): Journal entry text
- `date` (number, required): Unix timestamp in milliseconds

**Success Response:**
- **Status Code:** `201 Created`
- **Body:**
  ```json
  {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "roast": "excited",
    "message": "Amazing brew this morning!",
    "date": 1704067200000
  }
  ```

**Error Responses:**

- **Status Code:** `400 Bad Request`
  ```json
  {
    "error": "Invalid roast value. Must be one of: excited, ok, tired, sad, angry"
  }
  ```

- **Status Code:** `400 Bad Request`
  ```json
  {
    "error": "Date is required and must be a valid Unix timestamp"
  }
  ```

**Notes:**
- Backend must generate a unique UUID for the `id` field
- Date validation should ensure it's a valid timestamp
- Duplicate entries for the same date should be allowed (user can have multiple entries per day)

---

### 3. Update Roast Entry

Updates an existing journal entry.

**Endpoint:** `PATCH /calendar/:id`

**URL Parameters:**
- `id` (string): The unique identifier of the roast entry

**Request Body:**

All fields are optional. Only include fields you want to update:

```json
{
  "roast": "ok",
  "message": "Updated message",
  "date": 1704067200000
}
```

**Payload Schema:**
- `roast` (string, optional): Must be one of: 'excited', 'ok', 'tired', 'sad', 'angry'
- `message` (string, optional): Journal entry text
- `date` (number, optional): Unix timestamp in milliseconds

**Success Response:**
- **Status Code:** `200 OK`
- **Body:**
  ```json
  {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "roast": "ok",
    "message": "Updated message",
    "date": 1704067200000
  }
  ```

**Error Responses:**

- **Status Code:** `404 Not Found`
  ```json
  {
    "error": "Roast not found"
  }
  ```

- **Status Code:** `400 Bad Request`
  ```json
  {
    "error": "Invalid roast value"
  }
  ```

**Notes:**
- Partial updates are supported (PATCH semantics)
- Returns the complete updated roast entry
- If changing the date, the entry should be moved to the appropriate year/month bucket

---

### 4. Delete Roast Entry

Deletes a journal entry.

**Endpoint:** `DELETE /calendar/:id`

**URL Parameters:**
- `id` (string): The unique identifier of the roast entry

**Success Response:**
- **Status Code:** `204 No Content`
- **Body:** Empty

**Error Responses:**

- **Status Code:** `404 Not Found`
  ```json
  {
    "error": "Roast not found"
  }
  ```

**Notes:**
- Should permanently delete the entry
- No response body needed for successful deletion
- Idempotent: Deleting a non-existent entry may return 404 or 204 (prefer 404 for clarity)

---

## Feature Flags Consideration

The frontend includes feature flags for:
- `VITE_ENABLE_DELETE_ROAST` (default: false)
- `VITE_ENABLE_UPDATE_ROAST` (default: true)

The backend should still implement all CRUD operations, as these flags only control UI visibility.

---

## Error Handling

### General Error Response Format

```json
{
  "error": "Error message description"
}
```

### Common HTTP Status Codes

- `200 OK` - Successful GET, PATCH
- `201 Created` - Successful POST
- `204 No Content` - Successful DELETE
- `400 Bad Request` - Invalid request data
- `401 Unauthorized` - Missing or invalid authentication token
- `403 Forbidden` - Valid token but insufficient permissions
- `404 Not Found` - Resource not found
- `500 Internal Server Error` - Server error

---

## Data Persistence

### Storage Requirements

- Calendar data should persist across server restarts
- Data is organized by year and month for efficient querying
- Consider indexing on `date` field for performance

### Recommended Database Schema

**Option 1: Document Database (MongoDB, Firestore)**
```json
{
  "_id": "550e8400-e29b-41d4-a716-446655440000",
  "roast": "excited",
  "message": "Great coffee today!",
  "date": 1704067200000,
  "year": "2025",
  "month": "01",
  "userId": "firebase-user-id"
}
```

**Option 2: Relational Database (PostgreSQL, MySQL)**
```sql
CREATE TABLE roasts (
  id UUID PRIMARY KEY,
  user_id VARCHAR(255) NOT NULL,
  roast VARCHAR(20) NOT NULL CHECK (roast IN ('excited', 'ok', 'tired', 'sad', 'angry')),
  message TEXT,
  date BIGINT NOT NULL,
  year INTEGER NOT NULL,
  month INTEGER NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_user_year_month ON roasts(user_id, year, month);
CREATE INDEX idx_user_date ON roasts(user_id, date);
```

---

## Multi-User Support

While the current frontend is single-user, the backend should be designed for multi-user support:

1. **User Isolation:**
   - Each user's roast entries should be isolated
   - Filter all queries by authenticated user ID

2. **Authentication:**
   - Validate Firebase ID tokens on each request
   - Extract user ID from the token
   - Associate roast entries with the user ID

3. **Authorization:**
   - Users can only CRUD their own roast entries
   - Return 403 Forbidden if attempting to access another user's data

---

## Performance Considerations

### Caching Strategy

- GET /calendar responses are cached on the frontend with a 5-minute stale time
- Backend can implement caching but should invalidate cache on mutations
- Consider using ETags for conditional requests

### Pagination

Current implementation loads all data for a month. For users with many entries:
- Consider implementing pagination if needed: `GET /calendar?year=2025&month=01&page=1&limit=50`
- Not required for MVP

### Rate Limiting

Recommended rate limits:
- 100 requests per minute per user
- 10 POST/PATCH/DELETE requests per minute per user

---

## Testing

### Mock Data

The MSW (Mock Service Worker) handlers in the frontend provide examples of expected behavior. See `src/mocks/handlers.ts` and `src/mocks/db/history.ts`.

### Test Scenarios

1. **Create Entry:**
   - Valid roast creation with all fields
   - Valid roast creation with minimal fields (only roast and date)
   - Invalid roast type
   - Missing required date field

2. **Update Entry:**
   - Partial update (single field)
   - Full update (all fields)
   - Update non-existent entry
   - Invalid field values

3. **Delete Entry:**
   - Delete existing entry
   - Delete non-existent entry (idempotency)

4. **Fetch Calendar:**
   - Fetch existing month with data
   - Fetch empty month
   - Invalid year/month format

---

## CORS Configuration

The backend must enable CORS for the frontend origin:

```javascript
// Example CORS configuration
{
  origin: 'http://localhost:5173', // Vite dev server
  methods: ['GET', 'POST', 'PATCH', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true
}
```

For production, update origin to the production frontend URL.

---

## Environment Variables

Backend should accept the following environment variables:

```env
# Server Configuration
PORT=5174
NODE_ENV=production

# Database
DATABASE_URL=your_database_connection_string

# Firebase Admin SDK (for token verification)
FIREBASE_PROJECT_ID=your_project_id
FIREBASE_PRIVATE_KEY=your_private_key
FIREBASE_CLIENT_EMAIL=your_client_email

# CORS
ALLOWED_ORIGINS=http://localhost:5173,https://yourdomain.com
```

---

## Example Implementation (Node.js/Express)

```javascript
const express = require('express');
const app = express();

app.use(express.json());

// Middleware to verify Firebase token
const authenticateUser = async (req, res, next) => {
  const token = req.headers.authorization?.split('Bearer ')[1];
  // Verify token and attach user ID to req.user
  next();
};

// Get calendar data
app.get('/calendar', authenticateUser, async (req, res) => {
  const { year, month } = req.query;
  const userId = req.user.uid;

  // Fetch from database
  const entries = await db.getRoasts(userId, year, month);

  res.json({
    [year]: {
      [month]: entries
    }
  });
});

// Create roast
app.post('/calendar', authenticateUser, async (req, res) => {
  const { roast, message, date } = req.body;
  const userId = req.user.uid;

  const newRoast = await db.createRoast({
    userId,
    roast,
    message,
    date
  });

  res.status(201).json(newRoast);
});

// Update roast
app.patch('/calendar/:id', authenticateUser, async (req, res) => {
  const { id } = req.params;
  const userId = req.user.uid;

  const updated = await db.updateRoast(id, userId, req.body);

  if (!updated) {
    return res.status(404).json({ error: 'Roast not found' });
  }

  res.json(updated);
});

// Delete roast
app.delete('/calendar/:id', authenticateUser, async (req, res) => {
  const { id } = req.params;
  const userId = req.user.uid;

  const deleted = await db.deleteRoast(id, userId);

  if (!deleted) {
    return res.status(404).json({ error: 'Roast not found' });
  }

  res.status(204).send();
});

app.listen(5174, () => console.log('Server running on port 5174'));
```

---

## Additional Notes

1. **Timestamps:** Always use Unix timestamps in milliseconds, not seconds
2. **Month Format:** Months should be zero-padded (01-12), not 1-12
3. **Year Format:** Year should be a 4-digit string ("2025")
4. **UUID Format:** Use standard UUID v4 format for IDs
5. **Timezone Handling:** Dates are stored as UTC timestamps; frontend handles timezone conversion

---

## API Versioning

Consider versioning the API for future changes:
- Current: No version prefix (or implicit v1)
- Future: `/v2/calendar`

---

## Monitoring & Logging

Recommended logging:
- All API requests (method, path, user ID, status code)
- Failed authentication attempts
- Validation errors
- Database errors
- Response times for performance monitoring

---

## Deployment to Google Cloud Platform (GCP)

### Overview

This section provides recommendations for deploying the backend API as a container on Google Cloud Platform.

### Recommended GCP Service: **Cloud Run**

**Cloud Run** is the recommended deployment option for this API because:
- ✅ Fully managed, serverless container platform
- ✅ Automatic scaling (including scale to zero for cost savings)
- ✅ Pay only for actual usage (billed per request)
- ✅ Built-in HTTPS/SSL certificates
- ✅ Easy integration with other GCP services
- ✅ Perfect for HTTP APIs with variable traffic

**Alternative Options:**
- **GKE (Google Kubernetes Engine)**: For complex microservices or if you need full Kubernetes features
- **App Engine**: If you prefer a fully managed PaaS without containers

---

### 1. Containerization with Docker

#### Dockerfile

Create a `Dockerfile` in your backend project root:

```dockerfile
# Use official Node.js LTS image
FROM node:20-alpine AS builder

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci --only=production

# Copy application code
COPY . .

# Build if needed (for TypeScript projects)
# RUN npm run build

# Production stage
FROM node:20-alpine

# Install dumb-init for proper signal handling
RUN apk add --no-cache dumb-init

# Create non-root user
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001

WORKDIR /app

# Copy dependencies and built application from builder
COPY --from=builder --chown=nodejs:nodejs /app/node_modules ./node_modules
COPY --from=builder --chown=nodejs:nodejs /app .

# Switch to non-root user
USER nodejs

# Expose port (Cloud Run uses PORT env variable)
EXPOSE 8080

# Use dumb-init to handle signals properly
ENTRYPOINT ["dumb-init", "--"]

# Start application
CMD ["node", "server.js"]
```

#### .dockerignore

Create a `.dockerignore` file:

```
node_modules
npm-debug.log
.env
.env.*
.git
.gitignore
README.md
.dockerignore
Dockerfile
.vscode
.idea
coverage
.nyc_output
dist
*.test.js
*.spec.js
```

#### Build and Test Locally

```bash
# Build the Docker image
docker build -t coffeelings-api:latest .

# Test locally
docker run -p 8080:8080 \
  -e PORT=8080 \
  -e NODE_ENV=production \
  -e DATABASE_URL=your_connection_string \
  coffeelings-api:latest

# Test the API
curl http://localhost:8080/calendar?year=2025&month=01
```

---

### 2. Database Options on GCP

#### Option 1: Cloud Firestore (Recommended for MVP)

**Pros:**
- NoSQL document database (fits the data model well)
- Real-time updates
- Automatic scaling
- Generous free tier
- Integrated with Firebase Auth
- No server management

**Setup:**
```javascript
const { Firestore } = require('@google-cloud/firestore');
const firestore = new Firestore({
  projectId: process.env.GCP_PROJECT_ID,
});

// Collection structure: users/{userId}/roasts/{roastId}
```

**Cost:** ~$0.06 per 100K reads, $0.18 per 100K writes

#### Option 2: Cloud SQL (PostgreSQL)

**Pros:**
- Fully managed relational database
- Strong consistency
- Complex queries support
- Automatic backups

**Setup:**
1. Create Cloud SQL instance
2. Use Cloud SQL Proxy for secure connections
3. Connection via Unix socket or TCP

**Dockerfile addition for Cloud SQL Proxy:**
```dockerfile
# Add Cloud SQL Proxy
RUN wget https://dl.google.com/cloudsql/cloud_sql_proxy.linux.amd64 -O /cloud_sql_proxy
RUN chmod +x /cloud_sql_proxy
```

**Cost:** Starting at ~$9/month (db-f1-micro)

#### Option 3: MongoDB Atlas

**Pros:**
- Managed MongoDB service
- Works well with the current data model
- Good free tier
- Multi-cloud support

**Setup:**
```bash
# Install MongoDB driver
npm install mongodb

# Connection string
DATABASE_URL=mongodb+srv://username:password@cluster.mongodb.net/coffeelings
```

**Recommendation:** Use **Cloud Firestore** for simplicity and Firebase integration.

---

### 3. Deploying to Cloud Run

#### Prerequisites

1. Install Google Cloud SDK:
   ```bash
   # macOS
   brew install google-cloud-sdk

   # Initialize
   gcloud init
   ```

2. Enable required APIs:
   ```bash
   gcloud services enable run.googleapis.com
   gcloud services enable containerregistry.googleapis.com
   gcloud services enable cloudbuild.googleapis.com
   ```

3. Set up authentication:
   ```bash
   gcloud auth login
   gcloud config set project YOUR_PROJECT_ID
   ```

#### Deployment Steps

**Method 1: Using gcloud CLI (Recommended)**

```bash
# Set variables
export PROJECT_ID=your-project-id
export REGION=us-central1
export SERVICE_NAME=coffeelings-api

# Build and deploy in one command
gcloud run deploy $SERVICE_NAME \
  --source . \
  --region $REGION \
  --platform managed \
  --allow-unauthenticated \
  --set-env-vars "NODE_ENV=production" \
  --max-instances 10 \
  --memory 512Mi \
  --cpu 1 \
  --timeout 60s
```

**Method 2: Using Artifact Registry (Production)**

```bash
# Configure Docker for Artifact Registry
gcloud auth configure-docker us-central1-docker.pkg.dev

# Create repository
gcloud artifacts repositories create coffeelings-repo \
  --repository-format=docker \
  --location=us-central1

# Build and push
export IMAGE_URL=us-central1-docker.pkg.dev/$PROJECT_ID/coffeelings-repo/api:latest

docker build -t $IMAGE_URL .
docker push $IMAGE_URL

# Deploy
gcloud run deploy coffeelings-api \
  --image $IMAGE_URL \
  --region us-central1 \
  --platform managed \
  --allow-unauthenticated
```

#### Cloud Run Configuration

**Environment Variables:**
```bash
gcloud run services update coffeelings-api \
  --set-env-vars "NODE_ENV=production,LOG_LEVEL=info" \
  --region us-central1
```

**Secrets (for sensitive data):**
```bash
# Create secret
echo -n "your-database-url" | gcloud secrets create database-url --data-file=-

# Grant Cloud Run access
gcloud secrets add-iam-policy-binding database-url \
  --member=serviceAccount:SERVICE_ACCOUNT_EMAIL \
  --role=roles/secretmanager.secretAccessor

# Update Cloud Run to use secret
gcloud run services update coffeelings-api \
  --set-secrets DATABASE_URL=database-url:latest \
  --region us-central1
```

**Custom Domain:**
```bash
# Map custom domain
gcloud run domain-mappings create \
  --service coffeelings-api \
  --domain api.coffeelings.com \
  --region us-central1
```

---

### 4. CI/CD Pipeline with Cloud Build

#### cloudbuild.yaml

Create a `cloudbuild.yaml` file for automated deployments:

```yaml
steps:
  # Run tests
  - name: 'node:20-alpine'
    entrypoint: npm
    args: ['ci']

  - name: 'node:20-alpine'
    entrypoint: npm
    args: ['test']

  # Build Docker image
  - name: 'gcr.io/cloud-builders/docker'
    args:
      - 'build'
      - '-t'
      - 'us-central1-docker.pkg.dev/$PROJECT_ID/coffeelings-repo/api:$COMMIT_SHA'
      - '-t'
      - 'us-central1-docker.pkg.dev/$PROJECT_ID/coffeelings-repo/api:latest'
      - '.'

  # Push to Artifact Registry
  - name: 'gcr.io/cloud-builders/docker'
    args:
      - 'push'
      - '--all-tags'
      - 'us-central1-docker.pkg.dev/$PROJECT_ID/coffeelings-repo/api'

  # Deploy to Cloud Run
  - name: 'gcr.io/google.com/cloudsdktool/cloud-sdk'
    entrypoint: gcloud
    args:
      - 'run'
      - 'deploy'
      - 'coffeelings-api'
      - '--image'
      - 'us-central1-docker.pkg.dev/$PROJECT_ID/coffeelings-repo/api:$COMMIT_SHA'
      - '--region'
      - 'us-central1'
      - '--platform'
      - 'managed'

images:
  - 'us-central1-docker.pkg.dev/$PROJECT_ID/coffeelings-repo/api:$COMMIT_SHA'
  - 'us-central1-docker.pkg.dev/$PROJECT_ID/coffeelings-repo/api:latest'

timeout: 1200s
```

#### GitHub Actions Integration

Alternative to Cloud Build, use GitHub Actions:

```yaml
# .github/workflows/deploy.yml
name: Deploy to Cloud Run

on:
  push:
    branches:
      - main

env:
  PROJECT_ID: ${{ secrets.GCP_PROJECT_ID }}
  SERVICE: coffeelings-api
  REGION: us-central1

jobs:
  deploy:
    runs-on: ubuntu-latest

    steps:
      - name: Checkout
        uses: actions/checkout@v3

      - name: Google Auth
        uses: google-github-actions/auth@v1
        with:
          credentials_json: ${{ secrets.GCP_SA_KEY }}

      - name: Set up Cloud SDK
        uses: google-github-actions/setup-gcloud@v1

      - name: Configure Docker
        run: gcloud auth configure-docker us-central1-docker.pkg.dev

      - name: Build and Push
        run: |
          docker build -t us-central1-docker.pkg.dev/$PROJECT_ID/coffeelings-repo/api:$GITHUB_SHA .
          docker push us-central1-docker.pkg.dev/$PROJECT_ID/coffeelings-repo/api:$GITHUB_SHA

      - name: Deploy to Cloud Run
        run: |
          gcloud run deploy $SERVICE \
            --image us-central1-docker.pkg.dev/$PROJECT_ID/coffeelings-repo/api:$GITHUB_SHA \
            --region $REGION \
            --platform managed \
            --allow-unauthenticated
```

---

### 5. Monitoring & Logging on GCP

#### Cloud Logging

Logs are automatically collected from Cloud Run. View them:

```bash
# View logs
gcloud run services logs read coffeelings-api --region us-central1 --limit 50

# Follow logs in real-time
gcloud run services logs tail coffeelings-api --region us-central1
```

**Structured Logging in Node.js:**

```javascript
const bunyan = require('bunyan');
const { LoggingBunyan } = require('@google-cloud/logging-bunyan');

const loggingBunyan = new LoggingBunyan();

const logger = bunyan.createLogger({
  name: 'coffeelings-api',
  streams: [
    { stream: process.stdout, level: 'info' },
    loggingBunyan.stream('info'),
  ],
});

// Use in your app
logger.info({ userId: 'user123', action: 'create_roast' }, 'Roast created');
logger.error({ error: err }, 'Database error');
```

#### Cloud Monitoring

Set up alerts and dashboards:

1. **Error Rate Alert:**
   ```bash
   # Create alert for high error rate
   gcloud alpha monitoring policies create \
     --notification-channels=CHANNEL_ID \
     --display-name="High Error Rate" \
     --condition-threshold-value=0.05 \
     --condition-threshold-duration=300s
   ```

2. **Uptime Checks:**
   - Navigate to Cloud Console > Monitoring > Uptime Checks
   - Create check for your Cloud Run URL
   - Set alert notification channels

#### Cloud Trace

Enable request tracing:

```javascript
// Add to your app
require('@google-cloud/trace-agent').start({
  projectId: process.env.GCP_PROJECT_ID,
  keyFilename: process.env.GOOGLE_APPLICATION_CREDENTIALS
});
```

#### Key Metrics to Monitor

- Request count and latency
- Error rate (4xx, 5xx responses)
- Container CPU and memory usage
- Database connection pool stats
- Firebase token verification failures

---

### 6. Security Best Practices

#### Cloud Run Security

1. **Use least-privilege service account:**
   ```bash
   # Create custom service account
   gcloud iam service-accounts create coffeelings-api-sa \
     --display-name="Coffeelings API Service Account"

   # Grant necessary permissions
   gcloud projects add-iam-policy-binding PROJECT_ID \
     --member="serviceAccount:coffeelings-api-sa@PROJECT_ID.iam.gserviceaccount.com" \
     --role="roles/cloudsql.client"

   # Deploy with custom service account
   gcloud run deploy coffeelings-api \
     --service-account=coffeelings-api-sa@PROJECT_ID.iam.gserviceaccount.com
   ```

2. **Enable Binary Authorization:**
   ```bash
   gcloud run services update coffeelings-api \
     --binary-authorization=default \
     --region us-central1
   ```

3. **Use VPC Connector for private resources:**
   ```bash
   # Create VPC connector
   gcloud compute networks vpc-access connectors create coffeelings-connector \
     --region=us-central1 \
     --range=10.8.0.0/28

   # Attach to Cloud Run
   gcloud run services update coffeelings-api \
     --vpc-connector=coffeelings-connector \
     --region=us-central1
   ```

#### Secret Management

Store sensitive data in Secret Manager:

```javascript
const { SecretManagerServiceClient } = require('@google-cloud/secret-manager');
const client = new SecretManagerServiceClient();

async function getSecret(secretName) {
  const [version] = await client.accessSecretVersion({
    name: `projects/${projectId}/secrets/${secretName}/versions/latest`,
  });
  return version.payload.data.toString();
}
```

#### CORS Configuration for Production

```javascript
const cors = require('cors');

const corsOptions = {
  origin: process.env.ALLOWED_ORIGINS?.split(',') || [],
  methods: ['GET', 'POST', 'PATCH', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true,
  maxAge: 86400 // 24 hours
};

app.use(cors(corsOptions));
```

---

### 7. Cost Optimization

#### Cloud Run Pricing (as of 2024)

**Free Tier (per month):**
- 2 million requests
- 360,000 GB-seconds of memory
- 180,000 vCPU-seconds

**Beyond Free Tier:**
- $0.40 per million requests
- $0.00002400 per GB-second
- $0.00001000 per vCPU-second

#### Cost-Saving Strategies

1. **Right-size your containers:**
   ```bash
   # Start with minimal resources
   gcloud run deploy coffeelings-api \
     --memory 256Mi \
     --cpu 1 \
     --min-instances 0 \
     --max-instances 10
   ```

2. **Use minimum instances strategically:**
   ```bash
   # For production with traffic, keep 1 instance warm
   gcloud run deploy coffeelings-api \
     --min-instances 1 \
     --max-instances 100
   ```

3. **Optimize database queries:**
   - Use connection pooling
   - Implement caching (Redis/Memcached)
   - Index frequently queried fields

4. **Enable request timeout:**
   ```bash
   gcloud run deploy coffeelings-api \
     --timeout 60s  # Kill slow requests
   ```

#### Estimated Monthly Costs (Moderate Usage)

| Resource | Usage | Cost |
|----------|-------|------|
| Cloud Run | 1M requests, 512MB | ~$5 |
| Cloud Firestore | 10M reads, 1M writes | ~$6 |
| Cloud Logging | 10GB | ~$0.50 |
| Cloud Monitoring | Standard | Free |
| **Total** | | **~$11.50/month** |

---

### 8. Production Checklist

Before going to production:

- [ ] Configure custom domain with SSL
- [ ] Set up Cloud Armor for DDoS protection
- [ ] Enable Cloud CDN for static assets
- [ ] Configure backup strategy for database
- [ ] Set up error alerting (email/Slack)
- [ ] Implement health check endpoint (`/health`)
- [ ] Enable request logging
- [ ] Set up staging environment
- [ ] Configure environment variables via Secret Manager
- [ ] Set appropriate max instances limit
- [ ] Test auto-scaling behavior
- [ ] Document rollback procedure
- [ ] Set up uptime monitoring
- [ ] Review IAM permissions (principle of least privilege)
- [ ] Enable audit logging

---

### 9. Example Deployment Script

Create a `deploy.sh` script:

```bash
#!/bin/bash

set -e

# Configuration
PROJECT_ID="your-project-id"
REGION="us-central1"
SERVICE_NAME="coffeelings-api"
IMAGE_NAME="us-central1-docker.pkg.dev/${PROJECT_ID}/coffeelings-repo/api"

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}Starting deployment to Cloud Run...${NC}"

# Build Docker image
echo -e "${BLUE}Building Docker image...${NC}"
docker build -t ${IMAGE_NAME}:latest .

# Push to Artifact Registry
echo -e "${BLUE}Pushing image to Artifact Registry...${NC}"
docker push ${IMAGE_NAME}:latest

# Deploy to Cloud Run
echo -e "${BLUE}Deploying to Cloud Run...${NC}"
gcloud run deploy ${SERVICE_NAME} \
  --image ${IMAGE_NAME}:latest \
  --region ${REGION} \
  --platform managed \
  --allow-unauthenticated \
  --memory 512Mi \
  --cpu 1 \
  --min-instances 0 \
  --max-instances 10 \
  --timeout 60s \
  --set-env-vars "NODE_ENV=production" \
  --quiet

# Get the service URL
SERVICE_URL=$(gcloud run services describe ${SERVICE_NAME} \
  --region ${REGION} \
  --format 'value(status.url)')

echo -e "${GREEN}Deployment successful!${NC}"
echo -e "${GREEN}Service URL: ${SERVICE_URL}${NC}"

# Test the deployment
echo -e "${BLUE}Testing deployment...${NC}"
HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" ${SERVICE_URL}/health)

if [ ${HTTP_CODE} -eq 200 ]; then
  echo -e "${GREEN}Health check passed!${NC}"
else
  echo -e "${RED}Health check failed with code: ${HTTP_CODE}${NC}"
  exit 1
fi
```

Make it executable:
```bash
chmod +x deploy.sh
./deploy.sh
```

---

### 10. Troubleshooting Common Issues

#### Issue: Container fails to start

**Solution:**
```bash
# Check logs
gcloud run services logs read coffeelings-api --region us-central1 --limit 100

# Common causes:
# 1. PORT env variable not used (Cloud Run sets PORT dynamically)
# 2. Missing dependencies
# 3. Database connection issues
```

#### Issue: Timeout errors

**Solution:**
```bash
# Increase timeout (max 60 minutes for 2nd gen)
gcloud run services update coffeelings-api \
  --timeout 300s \
  --region us-central1
```

#### Issue: Cold start latency

**Solution:**
```bash
# Keep at least 1 instance warm
gcloud run deploy coffeelings-api \
  --min-instances 1 \
  --cpu-throttling  # Reduce costs when idle
```

#### Issue: Database connection failures

**Solution:**
- Use connection pooling
- Implement retry logic with exponential backoff
- Use Cloud SQL Proxy for Cloud SQL
- Check VPC connector configuration

---

## Questions or Issues?

For questions about this specification, refer to:
- Frontend codebase: `src/services/calendar.ts`
- Mock handlers: `src/mocks/handlers.ts`
- Type definitions: `src/models/types.ts`
- Test files: `src/hooks/useCalendar.test.tsx`
- Google Cloud Documentation: https://cloud.google.com/run/docs

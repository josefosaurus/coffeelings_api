# Coffeelings Backend API

A production-ready NestJS REST API for the Coffeelings mood journal application with Firebase Authentication, Cloud Firestore storage, and Cloud Run deployment compatibility.

## Features

- **Firebase Authentication**: Secure user authentication with Firebase ID tokens
- **Cloud Firestore**: NoSQL database for storing daily mood entries
- **Multi-user Support**: Complete data isolation between users
- **CRUD Operations**: Full create, read, update, delete functionality
- **Validation**: Comprehensive input validation with class-validator
- **Error Handling**: Consistent error response format
- **CORS Support**: Configurable cross-origin resource sharing
- **Health Checks**: Built-in health check endpoint
- **Cloud Run Ready**: Docker container with proper signal handling

## Data Model

### DailyRoast

```typescript
{
  id: string;           // UUID v4
  roast: 'excited' | 'ok' | 'tired' | 'sad' | 'angry';
  message?: string;     // Optional journal text
  date: number;         // Unix timestamp in milliseconds
}
```

### Calendar Response

```typescript
{
  [year: string]: {      // "2025"
    [month: string]: DailyRoast[]  // "01", "02", etc. (zero-padded)
  }
}
```

## API Endpoints

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/health` | No | Health check endpoint |
| GET | `/calendar?year=YYYY&month=MM` | Yes | Retrieve entries for a month |
| POST | `/calendar` | Yes | Create new entry |
| PATCH | `/calendar/:id` | Yes | Update existing entry |
| DELETE | `/calendar/:id` | Yes | Delete entry |

## Prerequisites

- Node.js 20 or higher
- npm or yarn
- Firebase project with Authentication and Firestore enabled
- Firebase service account credentials

## Installation

1. Clone the repository:
```bash
cd coffeelings_api
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
```bash
cp .env.example .env
```

4. Edit `.env` with your Firebase credentials:
```env
PORT=5174
NODE_ENV=development
FIREBASE_PROJECT_ID=your-project-id
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
FIREBASE_CLIENT_EMAIL=firebase-adminsdk-xxxxx@your-project.iam.gserviceaccount.com
ALLOWED_ORIGINS=http://localhost:5173,http://localhost:5174
```

## Getting Firebase Credentials

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project
3. Navigate to Project Settings > Service Accounts
4. Click "Generate New Private Key"
5. Copy the values from the downloaded JSON file to your `.env` file

## Running the Application

### Development Mode

```bash
npm run start:dev
```

The API will be available at `http://localhost:5174`

### Production Mode

```bash
npm run build
npm run start:prod
```

### Docker

Build and run with Docker:

```bash
# Build the image
docker build -t coffeelings-api .

# Run the container
docker run -p 8080:8080 --env-file .env coffeelings-api
```

## Testing the API

### Health Check

```bash
curl http://localhost:5174/health
```

Response:
```json
{
  "status": "ok",
  "timestamp": "2025-01-26T..."
}
```

### Authentication

All `/calendar` endpoints require Firebase authentication. Include the Firebase ID token in the Authorization header:

```bash
Authorization: Bearer <firebase-id-token>
```

### Create Roast

```bash
curl -X POST http://localhost:5174/calendar \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <firebase-token>" \
  -d '{
    "roast": "excited",
    "message": "Great coffee today!",
    "date": 1704067200000
  }'
```

Response (201):
```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "roast": "excited",
  "message": "Great coffee today!",
  "date": 1704067200000
}
```

### Get Calendar

```bash
curl "http://localhost:5174/calendar?year=2025&month=01" \
  -H "Authorization: Bearer <firebase-token>"
```

Response (200):
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
    ]
  }
}
```

### Update Roast

```bash
curl -X PATCH http://localhost:5174/calendar/{id} \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <firebase-token>" \
  -d '{
    "roast": "ok",
    "message": "Updated message"
  }'
```

Response (200):
```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "roast": "ok",
  "message": "Updated message",
  "date": 1704067200000
}
```

### Delete Roast

```bash
curl -X DELETE http://localhost:5174/calendar/{id} \
  -H "Authorization: Bearer <firebase-token>"
```

Response (204): No content

## Error Responses

All errors follow a consistent format:

```json
{
  "error": "Error message description"
}
```

### Status Codes

- `200 OK` - Successful GET/PATCH
- `201 Created` - Successful POST
- `204 No Content` - Successful DELETE
- `400 Bad Request` - Validation errors
- `401 Unauthorized` - Missing/invalid auth token
- `403 Forbidden` - Valid token but insufficient permissions
- `404 Not Found` - Resource not found
- `500 Internal Server Error` - Server errors

## Project Structure

```
src/
├── common/
│   ├── decorators/
│   │   └── user-id.decorator.ts          # Extract userId from request
│   ├── filters/
│   │   └── http-exception.filter.ts      # Global error handler
│   └── guards/
│       └── firebase-auth.guard.ts         # Firebase token verification
├── config/
│   └── configuration.ts                   # Environment configuration
├── firebase/
│   ├── firebase.service.ts                # Firebase Admin SDK
│   └── firebase.module.ts                 # Firebase module
├── roasts/
│   ├── dto/
│   │   ├── create-roast.dto.ts           # POST validation
│   │   ├── update-roast.dto.ts           # PATCH validation
│   │   └── query-calendar.dto.ts         # GET query validation
│   ├── entities/
│   │   └── roast.entity.ts               # Roast type definition
│   ├── roasts.controller.ts              # Calendar endpoints
│   ├── roasts.service.ts                 # Business logic
│   └── roasts.module.ts                  # Roasts module
├── health/
│   ├── health.controller.ts              # Health check endpoint
│   └── health.module.ts                  # Health module
├── app.module.ts                         # Root module
└── main.ts                               # Bootstrap & Cloud Run config
```

## Firestore Data Structure

```
users/
  {userId}/
    roasts/
      {roastId}/
        - id: string
        - roast: string
        - message?: string
        - date: number
        - userId: string
        - year: string      # Computed for indexing
        - month: string     # Computed for indexing
        - createdAt: number
        - updatedAt: number
```

## Security Features

- Firebase ID token verification on all protected endpoints
- User data isolation (users can only access their own data)
- Input validation on all requests
- CORS restricted to configured origins
- Environment-based configuration
- Non-root Docker user

## Deployment to Google Cloud Run

1. Build the Docker image:
```bash
docker build -t gcr.io/YOUR_PROJECT_ID/coffeelings-api .
```

2. Push to Google Container Registry:
```bash
docker push gcr.io/YOUR_PROJECT_ID/coffeelings-api
```

3. Deploy to Cloud Run:
```bash
gcloud run deploy coffeelings-api \
  --image gcr.io/YOUR_PROJECT_ID/coffeelings-api \
  --platform managed \
  --region us-central1 \
  --allow-unauthenticated \
  --set-env-vars FIREBASE_PROJECT_ID=your-project-id \
  --set-env-vars FIREBASE_CLIENT_EMAIL=your-email \
  --set-env-vars ALLOWED_ORIGINS=https://yourdomain.com
```

4. Set Firebase private key as secret:
```bash
echo -n "YOUR_PRIVATE_KEY" | gcloud secrets create firebase-private-key --data-file=-
```

## Development

### Format Code

```bash
npm run format
```

### Lint Code

```bash
npm run lint
```

### Run Tests

```bash
npm run test
npm run test:e2e
npm run test:cov
```

## Environment Variables

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| PORT | No | 5174 | Server port |
| NODE_ENV | No | development | Environment (development/production) |
| FIREBASE_PROJECT_ID | Yes | - | Firebase project ID |
| FIREBASE_PRIVATE_KEY | Yes | - | Firebase service account private key |
| FIREBASE_CLIENT_EMAIL | Yes | - | Firebase service account email |
| ALLOWED_ORIGINS | No | http://localhost:5173 | Comma-separated CORS origins |

## License

MIT

## Support

For issues and questions, please refer to the BACKEND_API_SPEC.md file for detailed API specifications.

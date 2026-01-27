# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Coffeelings Backend API - A REST API for a mood/emotion journal application where users track their daily emotional states ("roasts") along with optional journal entries. This backend supports a frontend application built with React and uses Firebase Authentication for user management.

## Core Data Model

The API centers around a single entity called `DailyRoast`:

```typescript
{
  id: string;           // UUID v4
  roast: 'excited' | 'ok' | 'tired' | 'sad' | 'angry';
  message?: string;     // Optional journal text
  date: number;         // Unix timestamp in milliseconds
}
```

Calendar data is organized hierarchically by year/month:
```typescript
{
  [year: string]: {      // "2025"
    [month: string]: DailyRoast[]  // "01", "02", etc. (zero-padded)
  }
}
```

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/calendar?year=YYYY&month=MM` | Retrieve entries for a month |
| POST | `/calendar` | Create new entry |
| PATCH | `/calendar/:id` | Update existing entry |
| DELETE | `/calendar/:id` | Delete entry |

## Authentication Architecture

- **Client-side**: Firebase Authentication (email/password)
- **Server-side**: Verify Firebase ID tokens from `Authorization: Bearer <token>` header
- **Multi-user isolation**: All operations must be scoped to the authenticated user's ID
- Each roast entry should be associated with a `userId` field
- Users can only access/modify their own data (return 403 for unauthorized access)

## Data Storage Strategy

The API specification recommends these storage options:

1. **Cloud Firestore (Recommended)**: NoSQL document database, integrates with Firebase Auth, good free tier
   - Collection structure: `users/{userId}/roasts/{roastId}`

2. **Cloud SQL (PostgreSQL)**: Relational option with strong consistency
   - Requires `roasts` table with composite index on `(user_id, year, month)`

3. **MongoDB Atlas**: Alternative NoSQL option

## Key Implementation Requirements

### Date Handling
- All dates are Unix timestamps in **milliseconds** (not seconds)
- Months are zero-padded strings: "01" through "12"
- Years are 4-digit strings: "2025"
- Timestamps are stored as UTC; frontend handles timezone conversion

### Validation
- `roast` field must be one of: 'excited', 'ok', 'tired', 'sad', 'angry'
- `date` field is required for POST requests
- `id` field must be generated server-side as UUID v4
- Partial updates supported for PATCH (only validate provided fields)

### Response Codes
- `200 OK` - Successful GET/PATCH
- `201 Created` - Successful POST (return created object with generated id)
- `204 No Content` - Successful DELETE (no response body)
- `400 Bad Request` - Validation errors
- `401 Unauthorized` - Missing/invalid auth token
- `403 Forbidden` - Valid token but insufficient permissions
- `404 Not Found` - Resource not found
- `500 Internal Server Error` - Server errors

### Error Response Format
```json
{
  "error": "Error message description"
}
```

## Security Considerations

- Validate all Firebase tokens on each request
- Never trust client-provided user IDs; always extract from verified token
- Implement rate limiting (recommended: 100 req/min per user, 10 mutations/min)
- Enable CORS for frontend origins only
- Use environment variables for sensitive configuration
- Store secrets in Secret Manager (GCP) or equivalent

## CORS Configuration

Required CORS settings:
```javascript
{
  origin: ['http://localhost:5173', 'https://yourdomain.com'],
  methods: ['GET', 'POST', 'PATCH', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true
}
```

## Environment Variables

Required configuration:
```env
PORT=5174                          # Default API port
NODE_ENV=production               # Environment
DATABASE_URL=<connection_string>  # Database connection
FIREBASE_PROJECT_ID=<project_id>  # Firebase config
FIREBASE_PRIVATE_KEY=<key>        # Firebase service account
FIREBASE_CLIENT_EMAIL=<email>     # Firebase service account
ALLOWED_ORIGINS=http://localhost:5173,https://yourdomain.com
```

## Deployment Target

The specification includes comprehensive guidance for deploying to **Google Cloud Platform (GCP)**:

- **Primary service**: Cloud Run (serverless, containerized)
- **Database**: Cloud Firestore (recommended) or Cloud SQL
- **Secrets**: Secret Manager
- **CI/CD**: Cloud Build or GitHub Actions
- **Monitoring**: Cloud Logging, Cloud Monitoring, Cloud Trace

### Cloud Run Requirements
- Container must listen on `PORT` environment variable (dynamically assigned)
- Use non-root user in Dockerfile
- Include dumb-init for proper signal handling
- Implement `/health` endpoint for health checks

## Data Organization Notes

- Frontend expects the nested year/month structure from GET `/calendar`
- When updating an entry's date, move it to the appropriate year/month bucket
- Empty months should return empty arrays: `{"2025": {"01": []}}`
- Multiple entries per day are allowed (no uniqueness constraint on date per user)

## Frontend Integration Points

The frontend (React + TanStack Query) has these characteristics:
- Caches GET `/calendar` responses with 5-minute stale time
- Feature flags control UI visibility of update/delete (but backend should implement all CRUD)
- Uses Mock Service Worker (MSW) for development; see `src/mocks/handlers.ts` for behavior examples
- Type definitions in `src/models/types.ts`

## Performance Considerations

- Index database on `(user_id, year, month)` for efficient calendar queries
- Index on `(user_id, date)` for date-based lookups
- Consider connection pooling for database connections
- Frontend caching reduces read load; invalidate cache on mutations
- Cloud Run scales to zero when idle (cost optimization)

## Reference Documentation

For detailed specifications, see:
- Full API spec: `BACKEND_API_SPEC.md`
- Frontend mock handlers: Referenced in spec (not in this repo)
- GCP deployment guide: Sections 570-1328 in `BACKEND_API_SPEC.md`

# Postman Testing Guide - Coffeelings API

## Quick Start

The API is now running in **development mode** at `http://localhost:5174` with mock authentication and in-memory storage.

## Import Postman Collection

1. Open Postman
2. Click "Import" button
3. Select the `Postman_Collection.json` file from this directory
4. The collection "Coffeelings API - Development" will be imported with all endpoints

## Authentication

The collection is pre-configured with a development bearer token: `dev-token-123`

All authenticated endpoints will automatically use this token. No Firebase setup required!

### Using Different User IDs (Optional)

You can test multi-user isolation by using different tokens:
- `dev-token-123` → User ID: `test-user-123`
- `dev-user-alice` → User ID: `user-alice`
- `dev-user-bob` → User ID: `user-bob`

Simply change the token in the request to simulate different users.

## Available Endpoints

### 1. Health Check (No Auth)
```
GET http://localhost:5174/health
```
Returns API status. Use this to verify the server is running.

### 2. Get Calendar
```
GET http://localhost:5174/calendar?year=2026&month=01
Authorization: Bearer dev-token-123
```
Retrieve all roasts for a specific month.

### 3. Create Roast
```
POST http://localhost:5174/calendar
Authorization: Bearer dev-token-123
Content-Type: application/json

{
  "roast": "excited",
  "message": "Great coffee today!",
  "date": 1737936000000
}
```

Valid roast types: `excited`, `ok`, `tired`, `sad`, `angry`

The `message` field is optional.

### 4. Update Roast
```
PATCH http://localhost:5174/calendar/{roastId}
Authorization: Bearer dev-token-123
Content-Type: application/json

{
  "roast": "ok",
  "message": "Updated message"
}
```

All fields are optional (partial updates supported).

### 5. Delete Roast
```
DELETE http://localhost:5174/calendar/{roastId}
Authorization: Bearer dev-token-123
```

Returns 204 No Content on success.

## Testing Workflow

### Step 1: Verify Health
Run the "Health Check" request first to ensure the API is running.

### Step 2: Create Some Roasts
Run the "Create Roast" requests (Excited, Tired, OK, Sad, Angry) to add test data.

The collection will automatically save the first created roast ID for use in update/delete operations.

### Step 3: Get Calendar
Run "Get Calendar (Current Month)" to see all your created roasts.

### Step 4: Update a Roast
Run "Update Roast" to modify an existing entry.

### Step 5: Delete a Roast
Run "Delete Roast" to remove an entry.

### Step 6: Test Error Cases
Try the error test requests to see how the API handles:
- Invalid roast types (400 Bad Request)
- Missing required fields (400 Bad Request)
- No authentication token (401 Unauthorized)
- Non-existent roasts (404 Not Found)

## Important Notes

### Date/Time Handling
- All dates are Unix timestamps in **milliseconds** (not seconds)
- Example: `1737936000000` = February 1, 2026, 00:00:00 UTC
- Timestamps are stored in UTC
- Month/year extraction uses local timezone

### Current Date Timestamp
The collection includes a `{{currentTimestamp}}` variable that generates the current timestamp.

To generate timestamps manually:
```bash
# Current time in milliseconds
node -e "console.log(Date.now())"

# Specific date
node -e "console.log(new Date('2026-01-27').getTime())"
```

### In-Memory Storage
Data is stored in-memory and will be **lost when the server restarts**. This is expected for development mode.

For persistent storage, you'll need to configure real Firebase credentials (see `ENV_SETUP_GUIDE.md`).

## Collection Variables

The collection uses these variables:
- `roastId` - Automatically set when creating a roast (used for update/delete)
- `currentTimestamp` - Current time in milliseconds
- `currentYear` - Current year (default: 2026)
- `currentMonth` - Current month (default: 01)

You can modify these in the collection settings if needed.

## Testing Multi-User Isolation

To verify that users can only access their own data:

1. Create roasts with `Bearer dev-user-alice`
2. Try to retrieve them with `Bearer dev-user-bob`
3. You should see empty results (different users)

## Response Formats

### Calendar Response
```json
{
  "2026": {
    "01": [
      {
        "id": "uuid-here",
        "roast": "excited",
        "message": "Great day!",
        "date": 1737936000000
      }
    ]
  }
}
```

### Created Roast Response
```json
{
  "id": "uuid-here",
  "roast": "excited",
  "message": "Great day!",
  "date": 1737936000000
}
```

### Error Response
```json
{
  "error": "Error message description"
}
```

## Troubleshooting

### Server Not Running
If requests fail, check if the server is running:
```bash
curl http://localhost:5174/health
```

If not running, start it:
```bash
npm run start:dev
```

### Port Already in Use
If port 5174 is in use, change the PORT in `.env`:
```env
PORT=5175
```
Then update the Postman collection URLs accordingly.

### Roasts Not Showing in Calendar
Make sure you're querying the correct year/month for the timestamp you used.

Check what year/month a timestamp corresponds to:
```bash
node -e "console.log(new Date(YOUR_TIMESTAMP).toISOString())"
```

## Next Steps

Once you've tested with Postman:
1. Integrate with your frontend application
2. Set up real Firebase credentials for production
3. Deploy to Cloud Run (see `README.md`)

## Development vs Production

**Current Setup (Development):**
- Mock authentication with `dev-token-123`
- In-memory storage (data lost on restart)
- No Firebase connection required
- Perfect for testing and development

**Production Setup:**
- Real Firebase Authentication
- Cloud Firestore for persistent storage
- User data secured and isolated
- Scalable and production-ready

See `ENV_SETUP_GUIDE.md` to set up production Firebase credentials.

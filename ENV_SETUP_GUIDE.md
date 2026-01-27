# Environment Setup Guide

## Quick Setup (3 Steps)

### Step 1: Copy the example file

```bash
cp .env.example .env
```

### Step 2: Get Firebase Credentials

1. **Go to Firebase Console**
   - Visit: https://console.firebase.google.com/
   - Sign in with your Google account

2. **Select or Create Project**
   - Click on your existing project, or
   - Click "Add project" to create a new one

3. **Generate Service Account Key**
   - Click the gear icon ⚙️ > Project Settings
   - Navigate to "Service Accounts" tab
   - Click "Generate New Private Key"
   - Click "Generate Key" in the confirmation dialog
   - A JSON file will be downloaded

### Step 3: Fill in your .env file

Open the downloaded JSON file. You'll see something like this:

```json
{
  "type": "service_account",
  "project_id": "your-project-id",
  "private_key_id": "abc123...",
  "private_key": "-----BEGIN PRIVATE KEY-----\nMIIEvQIBADANBg...\n-----END PRIVATE KEY-----\n",
  "client_email": "firebase-adminsdk-xxxxx@your-project-id.iam.gserviceaccount.com",
  "client_id": "123456789...",
  ...
}
```

Now copy these values to your `.env` file:

```env
# From JSON: "project_id"
FIREBASE_PROJECT_ID=your-project-id

# From JSON: "private_key" (keep the quotes and \n!)
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nMIIEvQIBADANBg...\n-----END PRIVATE KEY-----\n"

# From JSON: "client_email"
FIREBASE_CLIENT_EMAIL=firebase-adminsdk-xxxxx@your-project-id.iam.gserviceaccount.com
```

## Example .env File

Here's what your complete `.env` file should look like:

```env
PORT=5174
NODE_ENV=development

FIREBASE_PROJECT_ID=coffeelings-app-12345
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nMIIEvQIBADANBgkqhkiG9w0BAQEFAASCBKcwggSjAgEAAoIBAQC7xKq...\n-----END PRIVATE KEY-----\n"
FIREBASE_CLIENT_EMAIL=firebase-adminsdk-abc12@coffeelings-app-12345.iam.gserviceaccount.com

ALLOWED_ORIGINS=http://localhost:5173,http://localhost:5174
```

## Important Notes

### ⚠️ Security Warnings

1. **NEVER commit your .env file to Git**
   - It's already in `.gitignore`
   - But double-check before pushing!

2. **Keep your service account key secure**
   - Don't share it publicly
   - Don't put it in screenshots or logs
   - Rotate it if compromised

3. **For production deployments**
   - Use Cloud Run environment variables
   - Or use Secret Manager for sensitive data
   - Don't deploy .env files to production

### 🔧 Common Issues

**Issue: "Firebase credentials not properly configured"**

Solution: Check that:
- All three Firebase variables are set
- The private key includes `\n` for newlines
- The private key is wrapped in quotes
- There are no extra spaces or line breaks

**Issue: Private key format error**

Your private key should look exactly like this:
```
"-----BEGIN PRIVATE KEY-----\nMIIEvQIB...actual key content...\n-----END PRIVATE KEY-----\n"
```

Note:
- Starts with quote and `-----BEGIN`
- Has `\n` (literal backslash-n, not actual newline)
- Ends with `\n` and `-----END`
- Wrapped in quotes

**Issue: Authentication fails**

Check:
1. The service account has the correct permissions
2. Firestore is enabled in your Firebase project
3. The project ID matches exactly

## Enable Firestore

If you haven't enabled Firestore yet:

1. Go to Firebase Console > Firestore Database
2. Click "Create database"
3. Choose "Production mode" or "Test mode"
   - Production mode: Secure by default
   - Test mode: Open for 30 days (easier for development)
4. Select a location (choose one close to your users)
5. Click "Enable"

## Testing Your Configuration

After setting up your `.env` file:

```bash
# Install dependencies
npm install

# Start the development server
npm run start:dev
```

Test the health endpoint (no auth required):
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

If you see this, your server is running correctly!

## Next Steps

1. ✅ Set up Firebase Authentication in your Firebase Console
2. ✅ Get a Firebase ID token from your frontend
3. ✅ Test the protected endpoints with:
   ```bash
   curl "http://localhost:5174/calendar?year=2025&month=01" \
     -H "Authorization: Bearer YOUR_FIREBASE_TOKEN"
   ```

## Production Deployment

For Cloud Run or other production environments:

### Option 1: Environment Variables (Recommended)
Set environment variables in Cloud Run console:
- `FIREBASE_PROJECT_ID`
- `FIREBASE_CLIENT_EMAIL`
- Store `FIREBASE_PRIVATE_KEY` in Secret Manager

### Option 2: Service Account (Best for Cloud Run)
If deploying to GCP, you can use the default service account:
- Cloud Run can authenticate to Firebase automatically
- No need to manually configure credentials
- Update `firebase.service.ts` to use Application Default Credentials

## Troubleshooting

### Check your environment variables are loaded
```bash
# In your terminal where you run npm start:dev
echo $FIREBASE_PROJECT_ID
```

If empty, the .env file isn't being loaded.

### Verify the .env file is in the correct location
```bash
ls -la .env
```

Should show:
```
-rw-r--r--  1 user  staff  XXX Jan 26 XX:XX .env
```

### Check for syntax errors
Make sure there are:
- No spaces around `=`
- No quotes around variable names
- Quotes around the private key value

Good: `FIREBASE_PROJECT_ID=my-project`
Bad: `FIREBASE_PROJECT_ID = my-project`
Bad: `"FIREBASE_PROJECT_ID"=my-project`

## Need Help?

- Firebase Documentation: https://firebase.google.com/docs
- NestJS Config Documentation: https://docs.nestjs.com/techniques/configuration
- See README.md for full API documentation

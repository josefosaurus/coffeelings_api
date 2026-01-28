# How to Import Postman Collection

## Option 1: Import the Collection File

1. **Open Postman**

2. **Click "Import" button** (top left corner)

3. **Select the file**:
   - Click "Upload Files" or drag and drop
   - Select: `Coffeelings_API.postman_collection.json`

4. **Click "Import"**

5. **Done!** You should see "Coffeelings API" collection in your sidebar

## Option 2: If Import Fails - Manual Setup

If the import doesn't work, you can manually test with these requests:

### 1. Health Check (No Auth)
```
GET http://localhost:5174/health
```

### 2. Get Calendar (With Auth)
```
GET http://localhost:5174/calendar?year=2026&month=01
Headers:
  Authorization: Bearer dev-token-123
```

### 3. Create Roast
```
POST http://localhost:5174/calendar
Headers:
  Authorization: Bearer dev-token-123
  Content-Type: application/json
Body:
{
  "roast": "excited",
  "message": "Great day!",
  "date": 1738022400000
}
```

Valid roast types: `excited`, `ok`, `tired`, `sad`, `angry`

## Troubleshooting Import

### "Invalid Format" Error
Try these steps:
1. Make sure you're using Postman (not Insomnia or other tools)
2. Update Postman to the latest version
3. Try importing via URL instead of file

### "Cannot Read File" Error
1. Make sure the file path is correct
2. Check that the file isn't open in another program
3. Try copying the file to your Desktop and importing from there

### Still Having Issues?
Use **Option 2** above and create requests manually in Postman. It's quick and works every time!

## Quick Test After Import

1. Run "Health Check" - should return `{"status": "ok", ...}`
2. Run "Create Roast - Excited" - should return the created roast with an ID
3. Run "Get Calendar" - should show your created roast

## Authentication

All requests (except Health Check) need this header:
```
Authorization: Bearer dev-token-123
```

This is already set in all imported requests!

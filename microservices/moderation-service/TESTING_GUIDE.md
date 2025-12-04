# Moderation Service - Quick Start Testing Guide

## 🚀 Quick Start (5 Minutes)

### Step 1: Start the Service

```bash
cd microservices/moderation-service
cp .env.example .env
npm install
npm run dev
```

### Step 2: Verify Service is Running

```bash
curl http://localhost:3008/health
```

Expected: `{"status":"healthy",...}`

### Step 3: Get a JWT Token

You need JWT tokens with different roles for testing. Use your Auth Service to get tokens:

```bash
# Login as regular user
curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"user@test.com","password":"password123"}'

# Login as moderator
curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"moderator@test.com","password":"password123"}'

# Login as admin
curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@test.com","password":"password123"}'
```

Save the tokens as environment variables:
```bash
export USER_TOKEN="<user_jwt_token>"
export MOD_TOKEN="<moderator_jwt_token>"
export ADMIN_TOKEN="<admin_jwt_token>"
```

## 📝 Test Scenario 1: Report Flow

### Test 1.1: User Creates Report

```bash
curl -X POST http://localhost:3008/api/reports \
  -H "Authorization: Bearer $USER_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "reportedUserId": "user_12345",
    "reportedContentId": "post_67890",
    "contentType": "post",
    "reason": "harassment",
    "description": "This post contains offensive language",
    "evidence": [
      {
        "type": "screenshot",
        "data": "https://example.com/evidence.png"
      }
    ]
  }'
```

✅ **Expected:** Status 201, reportId returned

### Test 1.2: Moderator Views Reports

```bash
curl http://localhost:3008/api/reports?status=pending \
  -H "Authorization: Bearer $MOD_TOKEN"
```

✅ **Expected:** List of pending reports including the one just created

### Test 1.3: Moderator Gets Report Stats

```bash
curl http://localhost:3008/api/reports/stats \
  -H "Authorization: Bearer $MOD_TOKEN"
```

✅ **Expected:** Statistics showing report counts by status, priority, and reason

### Test 1.4: User Views Own Reports

```bash
curl http://localhost:3008/api/reports/user/my-reports \
  -H "Authorization: Bearer $USER_TOKEN"
```

✅ **Expected:** List of reports created by the user

### Test 1.5: User Tries to View All Reports (Should Fail)

```bash
curl http://localhost:3008/api/reports \
  -H "Authorization: Bearer $USER_TOKEN"
```

❌ **Expected:** Status 403, "Moderator or Admin access required"

## ⚖️ Test Scenario 2: Moderation Actions

### Test 2.1: Moderator Issues Warning

```bash
curl -X POST http://localhost:3008/api/actions \
  -H "Authorization: Bearer $MOD_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "targetUserId": "user_12345",
    "actionType": "warning",
    "reason": "First-time violation of community guidelines",
    "severity": "minor",
    "notes": "User has been warned about appropriate language"
  }'
```

✅ **Expected:** Status 201, action created

### Test 2.2: Moderator Issues 7-Day Suspension

```bash
curl -X POST http://localhost:3008/api/actions \
  -H "Authorization: Bearer $MOD_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "targetUserId": "user_12345",
    "actionType": "suspend",
    "reason": "Repeated harassment violations",
    "duration": {
      "value": 7,
      "unit": "days"
    },
    "severity": "severe",
    "notes": "Third violation this month"
  }'
```

✅ **Expected:** Status 201, action created with expiresAt date

### Test 2.3: Check Ban Status

```bash
curl http://localhost:3008/api/actions/check/banned/user_12345 \
  -H "Authorization: Bearer $USER_TOKEN"
```

✅ **Expected:** 
```json
{
  "isBanned": false
}
```

### Test 2.4: Moderator Bans User Permanently

```bash
curl -X POST http://localhost:3008/api/actions \
  -H "Authorization: Bearer $MOD_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "targetUserId": "user_99999",
    "actionType": "ban",
    "reason": "Severe violation: hate speech and harassment",
    "duration": {
      "value": 0,
      "unit": "permanent"
    },
    "severity": "critical",
    "notes": "Multiple severe violations. Account permanently banned."
  }'
```

✅ **Expected:** Status 201, user added to BannedUser collection

### Test 2.5: Check Ban Status for Banned User

```bash
curl http://localhost:3008/api/actions/check/banned/user_99999 \
  -H "Authorization: Bearer $USER_TOKEN"
```

✅ **Expected:**
```json
{
  "isBanned": true,
  "banType": "permanent",
  "reason": "Severe violation: hate speech and harassment",
  "expiresAt": null,
  "appealStatus": "none"
}
```

### Test 2.6: Get User's Moderation History

```bash
curl http://localhost:3008/api/actions/user/user_12345 \
  -H "Authorization: Bearer $MOD_TOKEN"
```

✅ **Expected:** All actions taken against user_12345

### Test 2.7: Moderator Revokes Action

```bash
# First, get the action ID from previous response
export ACTION_ID="<action_id_from_2.2>"

curl -X PATCH http://localhost:3008/api/actions/$ACTION_ID/revoke \
  -H "Authorization: Bearer $MOD_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "reason": "Action revoked after appeal review - violation was misidentified"
  }'
```

✅ **Expected:** Action marked as inactive, isActive: false

## 🎯 Test Scenario 3: Appeal System

### Test 3.1: User Submits Appeal

```bash
# Use the ACTION_ID from Test 2.2
curl -X POST http://localhost:3008/api/appeals \
  -H "Authorization: Bearer $USER_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "actionId": "'$ACTION_ID'",
    "reason": "I believe this action was taken in error. The content was taken out of context and was meant as constructive criticism, not harassment."
  }'
```

✅ **Expected:** Status 201, appeal created with status "pending"

### Test 3.2: User Views Own Appeals

```bash
curl http://localhost:3008/api/appeals/my-appeals \
  -H "Authorization: Bearer $USER_TOKEN"
```

✅ **Expected:** List of appeals submitted by the user

### Test 3.3: User Tries to Submit Duplicate Appeal (Should Fail)

```bash
curl -X POST http://localhost:3008/api/appeals \
  -H "Authorization: Bearer $USER_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "actionId": "'$ACTION_ID'",
    "reason": "Another appeal for the same action"
  }'
```

❌ **Expected:** Status 409, "An appeal is already pending for this action"

### Test 3.4: Moderator Views All Appeals

```bash
curl http://localhost:3008/api/appeals \
  -H "Authorization: Bearer $MOD_TOKEN"
```

✅ **Expected:** List of all appeals

### Test 3.5: Moderator Approves Appeal

```bash
# Get the appeal ID from Test 3.1
export APPEAL_ID="<appeal_id_from_3.1>"

curl -X PATCH http://localhost:3008/api/appeals/$APPEAL_ID/review \
  -H "Authorization: Bearer $MOD_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "status": "approved",
    "reviewNotes": "After review, the content was indeed taken out of context. Action revoked."
  }'
```

✅ **Expected:** Appeal approved, original action automatically revoked

### Test 3.6: Moderator Rejects Appeal

```bash
curl -X PATCH http://localhost:3008/api/appeals/$APPEAL_ID/review \
  -H "Authorization: Bearer $MOD_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "status": "rejected",
    "reviewNotes": "After careful review, the original action was appropriate and will stand."
  }'
```

✅ **Expected:** Appeal rejected, original action remains active

## 🔄 Test Scenario 4: Bulk Operations

### Test 4.1: Update Report Status

```bash
# Get a report ID from Test 1.2
export REPORT_ID="<report_id>"

curl -X PATCH http://localhost:3008/api/reports/$REPORT_ID/status \
  -H "Authorization: Bearer $MOD_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "status": "reviewing",
    "moderatorNotes": "Under review - gathering more information"
  }'
```

✅ **Expected:** Report status updated to "reviewing"

### Test 4.2: Resolve Report with Action

```bash
curl -X PATCH http://localhost:3008/api/reports/$REPORT_ID/status \
  -H "Authorization: Bearer $MOD_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "status": "resolved",
    "action": "user_suspended",
    "moderatorNotes": "User suspended for 7 days. Content removed."
  }'
```

✅ **Expected:** Report marked as resolved with action taken

### Test 4.3: Bulk Update Multiple Reports

```bash
curl -X PATCH http://localhost:3008/api/reports/bulk/update \
  -H "Authorization: Bearer $MOD_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "reportIds": ["report_id_1", "report_id_2", "report_id_3"],
    "status": "dismissed",
    "action": "none"
  }'
```

✅ **Expected:** Multiple reports updated at once

## 🔐 Test Scenario 5: Access Control

### Test 5.1: User Tries to Create Moderation Action (Should Fail)

```bash
curl -X POST http://localhost:3008/api/actions \
  -H "Authorization: Bearer $USER_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "targetUserId": "some_user",
    "actionType": "ban",
    "reason": "Testing"
  }'
```

❌ **Expected:** Status 403, "Moderator or Admin access required"

### Test 5.2: Moderator Tries to View All Banned Users (Should Fail)

```bash
curl http://localhost:3008/api/actions/banned/users \
  -H "Authorization: Bearer $MOD_TOKEN"
```

❌ **Expected:** Status 403, "Admin access required"

### Test 5.3: Admin Views All Banned Users

```bash
curl http://localhost:3008/api/actions/banned/users \
  -H "Authorization: Bearer $ADMIN_TOKEN"
```

✅ **Expected:** List of all banned users

### Test 5.4: No Token Provided (Should Fail)

```bash
curl http://localhost:3008/api/reports
```

❌ **Expected:** Status 401, "No authentication token provided"

## ⏰ Test Scenario 6: Expiration & Automation

### Test 6.1: Expire Old Actions

```bash
curl -X POST http://localhost:3008/api/actions/expire/check
```

✅ **Expected:** Expired actions processed, count returned

## 📊 Test Scenario 7: Advanced Queries

### Test 7.1: Filter Reports by Priority

```bash
curl "http://localhost:3008/api/reports?priority=high&status=pending" \
  -H "Authorization: Bearer $MOD_TOKEN"
```

✅ **Expected:** Only high-priority pending reports

### Test 7.2: Filter Reports by Content Type

```bash
curl "http://localhost:3008/api/reports?contentType=post&reason=harassment" \
  -H "Authorization: Bearer $MOD_TOKEN"
```

✅ **Expected:** Only post reports with harassment reason

### Test 7.3: Paginate Reports

```bash
curl "http://localhost:3008/api/reports?page=1&limit=5" \
  -H "Authorization: Bearer $MOD_TOKEN"
```

✅ **Expected:** First 5 reports with pagination info

### Test 7.4: Sort Actions by Date

```bash
curl "http://localhost:3008/api/actions?sortBy=createdAt&sortOrder=asc" \
  -H "Authorization: Bearer $MOD_TOKEN"
```

✅ **Expected:** Actions sorted by oldest first

## 🧪 Test Scenario 8: Edge Cases

### Test 8.1: Report with No Evidence

```bash
curl -X POST http://localhost:3008/api/reports \
  -H "Authorization: Bearer $USER_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "reportedUserId": "user_456",
    "contentType": "user",
    "reason": "impersonation",
    "description": "This user is impersonating someone else"
  }'
```

✅ **Expected:** Report created without evidence (evidence is optional)

### Test 8.2: Invalid Report Reason (Should Fail)

```bash
curl -X POST http://localhost:3008/api/reports \
  -H "Authorization: Bearer $USER_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "contentType": "post",
    "reason": "invalid_reason",
    "description": "Test"
  }'
```

❌ **Expected:** Status 400, validation error

### Test 8.3: Duplicate Report (Should Fail)

```bash
# Submit the same report twice
curl -X POST http://localhost:3008/api/reports \
  -H "Authorization: Bearer $USER_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "reportedContentId": "post_67890",
    "contentType": "post",
    "reason": "harassment",
    "description": "Duplicate report"
  }'
```

❌ **Expected:** Status 409, "You have already reported this content"

## ✅ Complete Test Checklist

- [ ] Service starts successfully
- [ ] Health check returns healthy
- [ ] User can create reports
- [ ] Moderator can view all reports
- [ ] User can only view own reports
- [ ] User cannot access moderator endpoints
- [ ] Moderator can create actions
- [ ] Ban status checking works
- [ ] User can submit appeals
- [ ] Moderator can review appeals
- [ ] Approved appeals revoke actions
- [ ] Bulk operations work
- [ ] Report statistics accurate
- [ ] Pagination works correctly
- [ ] Filtering works correctly
- [ ] Expired actions are cleaned up
- [ ] Admin-only endpoints blocked for moderators
- [ ] Duplicate reports blocked
- [ ] Invalid data validation works

## 🐛 Common Test Issues

### Issue: "Invalid authentication token"

**Solution:** Generate fresh JWT tokens from Auth Service

### Issue: "Report not found"

**Solution:** Use actual report IDs from GET requests, not placeholders

### Issue: "Moderator or Admin access required"

**Solution:** Ensure you're using MOD_TOKEN or ADMIN_TOKEN, not USER_TOKEN

### Issue: MongoDB connection errors

**Solution:** Ensure MongoDB is running: `mongosh`

## 📈 Performance Testing

### Load Test: Multiple Reports

```bash
# Create 100 reports quickly
for i in {1..100}; do
  curl -X POST http://localhost:3008/api/reports \
    -H "Authorization: Bearer $USER_TOKEN" \
    -H "Content-Type: application/json" \
    -d "{
      \"reportedContentId\": \"post_$i\",
      \"contentType\": \"post\",
      \"reason\": \"spam\",
      \"description\": \"Test report $i\"
    }" &
done
wait
```

Check report stats to verify all created.

### Load Test: Rate Limiting

```bash
# Try to exceed rate limit (100 requests in 15 minutes)
for i in {1..150}; do
  curl http://localhost:3008/api/reports/stats \
    -H "Authorization: Bearer $MOD_TOKEN"
done
```

Expected: After 100 requests, should return 429 "Too many requests"

## 🎉 Success Criteria

✅ All test scenarios pass  
✅ Role-based access control works correctly  
✅ Reports, actions, and appeals flow works end-to-end  
✅ Edge cases handled properly  
✅ Rate limiting enforced  
✅ MongoDB indexes improve query performance  
✅ Logs show all operations clearly

Your Moderation Service is now fully tested and ready for production! 🚀

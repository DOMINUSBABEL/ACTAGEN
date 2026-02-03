# 🛡️ Defense Protocol: Moltbook Saturation Protection

This module protects your ecosystem (ACTAGEN) from request saturation and unauthorized usage when published on public platforms like Moltbook.

## 1. Features
- **Rate Limiting:** Prevents a single user from sending more than 10 requests/minute.
- **Circuit Breaker:** Automatically locks the system if the Gemini API returns "Quota Exceeded" (429) errors.
- **Access Control:** Requires an access code to function on non-localhost environments.

## 2. How to Use

### Local Development (Localhost)
- The system is **OPEN** by default on `localhost` or `127.0.0.1`. You don't need to do anything.

### Public Deployment (Moltbook/Web)
- The system is **LOCKED** by default.
- To allow access, you must append the access code to the URL:
  `https://your-app-url.com/?access_code=DOMINUS_SECURE_2026`

- **Without the code:** Requests will fail with `[Security Block]: UNAUTHORIZED_ACCESS_REQUIRED`.

### Manual Unlock (Console)
If you are on a deployed site and forgot the URL parameter:
1. Open Browser Console (F12).
2. Type: `defense.setAccessCode("DOMINUS_SECURE_2026")`

## 3. Configuration
Edit `services/defenseService.ts` to change:
- `maxRequestsPerMinute` (Default: 10)
- `maxRequestsPerHour` (Default: 100)
- `EXPECTED_CODE_HASH` (Change this password!)

## 4. Monitoring
Check the console for `[Security Block]` or `[GeminiService]` warnings.

---
**WARNING:** Your API Key is currently exposed in the client-side bundle. This defense prevents *saturation* but does not prevent a dedicated attacker from extracting your key. For true security, move the API calls to a backend server.

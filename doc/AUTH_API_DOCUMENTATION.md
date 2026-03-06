# MedMate Authentication API Documentation

This document provides the technical specification for the authentication flow in the MedMate application.

## Base Configuration

- **Prod Backend URL**: `https://medmate-backend-k25riftvia-as.a.run.app`
- **Protocol**: HTTPS
- **Format**: JSON
- **Auth Scheme**: JWT (Bearer Token)

---

## Endpoints

### 1. Login
Authenticates a user and generates a session token.

- **URL**: `/auth/login`
- **Method**: `POST`
- **Auth Required**: No (Public)

#### Request Body
```json
{
  "email": "user@example.com",
  "password": "securepassword123"
}
```

#### Success Response (200 OK)
```json
{
  "access_token": "eyJhbG...",
  "token_type": "bearer"
}
```

#### Error Responses
- **401 Unauthorized**: Missing or incorrect credentials.
- **422 Unprocessable Entity**: Validation error (e.g., malformed email).

---

### 2. Get Current User Profile
Retrieves detailed information about the logged-in user.

- **URL**: `/auth/me`
- **Method**: `GET`
- **Auth Required**: Yes (`Authorization: Bearer <token>`)

#### Success Response (200 OK)
```json
{
  "id": "uuid-string-here",
  "email": "user@example.com",
  "name": "Jane Doe",
  "role": "student",
  "permissions": {
    "can_create_case": true,
    "can_edit_profile": true
  },
  "created_at": "2023-10-27T10:00:00Z"
}
```

---

### 3. Password Management (Public)

| Endpoint | Method | Description |
| :--- | :--- | :--- |
| `/auth/request-password-reset` | `POST` | Sends a reset link to the user's email. |
| `/auth/reset-password` | `POST` | Updates the password using a valid reset token. |

---

## Frontend Integration Details

### Security & Storage
When the login is successful, the frontend performs the following:

1.  **LocalStorage**: Saves token as `auth_token` for manual retrieval.
2.  **Cookies**: Persists token in a cookie named `auth_token` with `Max-Age: 7 days`. This is required for **Next.js Middleware** to handle server-side redirects.
    - `document.cookie = "auth_token=<token>; path=/; Max-Age=604800; SameSite=Lax; Secure"`

### API Interceptor ([apiClient.js](file:///c:/Users/Admin/Desktop/VinTech/medmate-fe/lib/apiClient.js))
All outgoing requests to protected routes automatically include the token:
```javascript
config.headers.Authorization = `Bearer ${token}`;
```

### Route Protection
The [middleware.js](file:///c:/Users/Admin/Desktop/VinTech/medmate-fe/middleware.js) checks for the existence of the `auth_token` cookie. If missing on protected routes (dashboard, cases, etc.), it redirects the user to `/[lang]/login?returnUrl=<current_path>`.

---

## Error Handling
The application uses global interceptors to handle authentication failures:
- **401/403 Error**: If a token expires or is invalid, the system automatically clears the storage and redirects the user to the login page.
- **Token Buffer**: The system checks if a token will expire within the next 5 minutes before making significant requests to prevent mid-session failures.

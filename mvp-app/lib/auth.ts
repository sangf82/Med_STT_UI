export const TOKEN_KEY = "auth_token";

/**
 * Saves the authentication token to both LocalStorage and Cookies.
 * Following the requirements in AUTH_API_DOCUMENTATION.md.
 */
export const setAuthToken = (token: string) => {
  if (typeof window === "undefined") return;

  // 1. LocalStorage
  localStorage.setItem(TOKEN_KEY, token);

  // 2. Cookies (Required for Next.js Middleware)
  // Max-Age: 7 days (604800 seconds)
  document.cookie = `${TOKEN_KEY}=${token}; path=/; Max-Age=604800; SameSite=Lax; Secure`;
};

/**
 * Retrieves the authentication token from LocalStorage or Cookies.
 */
export const getAuthToken = (): string | null => {
  if (typeof window === "undefined") return null;

  // Try LocalStorage first
  const token = localStorage.getItem(TOKEN_KEY);
  if (token) return token;

  // Fallback to Cookies
  const match = document.cookie.match(
    new RegExp("(^| )" + TOKEN_KEY + "=([^;]+)"),
  );
  if (match) return match[2];

  return null;
};

/**
 * Removes the authentication token from both LocalStorage and Cookies.
 */
export const removeAuthToken = () => {
  if (typeof window === "undefined") return;

  localStorage.removeItem(TOKEN_KEY);
  document.cookie = `${TOKEN_KEY}=; path=/; Max-Age=0; SameSite=Lax; Secure`;
};

/**
 * Performs a logout by clearing the token and redirecting to the login page.
 */
export const logout = () => {
  removeAuthToken();
  if (typeof window !== "undefined") {
    window.location.href = "/login";
  }
};

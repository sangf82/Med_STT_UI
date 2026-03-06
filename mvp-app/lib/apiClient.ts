import { getAuthToken, logout } from "./auth";

const BASE_URL =
  process.env.NEXT_PUBLIC_API_URL ||
  "https://medmate-backend-k25riftvia-as.a.run.app";

interface RequestOptions extends RequestInit {
  params?: Record<string, string>;
}

/**
 * A central API client that automatically includes the Auth token.
 * Handles 401/403 errors by logging out the user as specified in documentation.
 */
export async function apiClient<T>(
  endpoint: string,
  options: RequestOptions = {},
): Promise<T> {
  const { params, headers, ...config } = options;

  // Construct URL with query parameters if any
  let url = `${BASE_URL}${endpoint}`;
  if (params) {
    const searchParams = new URLSearchParams(params);
    url += `?${searchParams.toString()}`;
  }

  // Default headers
  const defaultHeaders: Record<string, string> = {
    "Content-Type": "application/json",
  };

  // Include Auth token if available
  const token = getAuthToken();
  if (token) {
    defaultHeaders["Authorization"] = `Bearer ${token}`;
  }

  const response = await fetch(url, {
    ...config,
    headers: {
      ...defaultHeaders,
      ...headers,
    },
  });

  // Handle Unauthorized or Forbidden
  if (response.status === 401 || response.status === 403) {
    logout();
    throw new Error("Unauthorized");
  }

  // Handle other errors
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw {
      status: response.status,
      message: errorData.message || response.statusText,
      data: errorData,
    };
  }

  // For 204 No Content
  if (response.status === 204) {
    return {} as T;
  }

  return response.json();
}

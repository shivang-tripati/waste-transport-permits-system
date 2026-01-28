import { ApiResponse } from '@/lib/api';

const API_BASE_URL = process.env.NEXT_PUBLIC_APP_URL || '';

interface RequestConfig extends RequestInit {
    params?: Record<string, string | number | boolean | undefined>;
}

/**
 * Make an API request
 */
export async function apiRequest<T>(
    endpoint: string,
    config: RequestConfig = {}
): Promise<ApiResponse<T>> {
    const { params, ...init } = config;

    // Build URL with query params
    let url = `${API_BASE_URL}/api/v1${endpoint}`;
    if (params) {
        const searchParams = new URLSearchParams();
        Object.entries(params).forEach(([key, value]) => {
            if (value !== undefined) {
                searchParams.append(key, String(value));
            }
        });
        const queryString = searchParams.toString();
        if (queryString) {
            url += `?${queryString}`;
        }
    }

    // Set default headers
    const headers = new Headers(init.headers);
    if (!headers.has('Content-Type') && init.body) {
        headers.set('Content-Type', 'application/json');
    }

    // Get auth token from localStorage (client-side only)
    if (typeof window !== 'undefined') {
        const token = localStorage.getItem('accessToken');
        if (token && !headers.has('Authorization')) {
            headers.set('Authorization', `Bearer ${token}`);
        }
    }

    const response = await fetch(url, {
        ...init,
        headers,
    });

    const data = await response.json();

    // Handle token refresh if 401
    if (response.status === 401 && typeof window !== 'undefined') {
        const refreshToken = localStorage.getItem('refreshToken');
        if (refreshToken) {
            const refreshResponse = await fetch(`${API_BASE_URL}/api/v1/auth/refresh`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ refreshToken }),
            });

            if (refreshResponse.ok) {
                const refreshData = await refreshResponse.json();
                if (refreshData.success) {
                    localStorage.setItem('accessToken', refreshData.data.accessToken);
                    localStorage.setItem('refreshToken', refreshData.data.refreshToken);

                    // Retry original request
                    headers.set('Authorization', `Bearer ${refreshData.data.accessToken}`);
                    const retryResponse = await fetch(url, { ...init, headers });
                    return retryResponse.json();
                }
            }

            // Refresh failed - clear tokens
            localStorage.removeItem('accessToken');
            localStorage.removeItem('refreshToken');
        }
    }

    return data;
}

/**
 * GET request helper
 */
export async function get<T>(
    endpoint: string,
    params?: Record<string, string | number | boolean | undefined>,
    headers?: Record<string, string>
): Promise<ApiResponse<T>> {
    return apiRequest<T>(endpoint, { method: 'GET', params, headers });
}

/**
 * POST request helper
 */
export async function post<T>(
    endpoint: string,
    body?: unknown,
    params?: Record<string, string | number | boolean | undefined>,
    headers?: Record<string, string>
): Promise<ApiResponse<T>> {
    return apiRequest<T>(endpoint, {
        method: 'POST',
        body: body ? JSON.stringify(body) : undefined,
        params,
        headers,
    });
}

/**
 * PATCH request helper
 */
export async function patch<T>(
    endpoint: string,
    body?: unknown,
    headers?: Record<string, string>
): Promise<ApiResponse<T>> {
    return apiRequest<T>(endpoint, {
        method: 'PATCH',
        body: body ? JSON.stringify(body) : undefined,
        headers,
    });
}

/**
 * DELETE request helper
 */
export async function del<T>(endpoint: string, headers?: Record<string, string>): Promise<ApiResponse<T>> {
    return apiRequest<T>(endpoint, { method: 'DELETE', headers });
}


/**
 * Upload file helper
 */
export async function uploadFile<T>(
    endpoint: string,
    formData: FormData
): Promise<ApiResponse<T>> {
    const token = localStorage.getItem('accessToken');

    const res = await fetch(`/api/v1${endpoint}`, {
        method: 'POST',
        body: formData, // ✅ RAW
        headers: token
            ? { Authorization: `Bearer ${token}` }
            : undefined,
    });

    return res.json();
}


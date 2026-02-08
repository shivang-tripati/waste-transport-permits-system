import { ApiResponse } from "@/lib/api";

const API_BASE_URL = process.env.NEXT_PUBLIC_APP_URL || "";

interface RequestConfig extends RequestInit {
    params?: Record<string, string | number | boolean | undefined>;
}

const isMobile =
    typeof window !== "undefined" &&
    window.navigator.product === "ReactNative";

function buildUrl(
    endpoint: string,
    params?: RequestConfig["params"]
) {
    let url = `${API_BASE_URL}/api/v1${endpoint}`;

    if (!params) return url;

    const searchParams = new URLSearchParams();
    Object.entries(params).forEach(([k, v]) => {
        if (v !== undefined) searchParams.append(k, String(v));
    });

    const qs = searchParams.toString();
    return qs ? `${url}?${qs}` : url;
}

async function safeJson(res: Response) {
    try {
        return await res.json();
    } catch {
        return null;
    }
}

export async function apiRequest<T>(
    endpoint: string,
    config: RequestConfig = {}
): Promise<ApiResponse<T>> {
    const { params, ...init } = config;

    const url = buildUrl(endpoint, params);

    const headers = new Headers(init.headers);

    // Only set JSON header if NOT FormData
    if (!(init.body instanceof FormData) && init.body) {
        headers.set("Content-Type", "application/json");
    }

    // Mobile uses Authorization header
    if (isMobile) {
        const token = localStorage.getItem("accessToken");
        if (token) headers.set("Authorization", `Bearer ${token}`);
    }

    const doFetch = () =>
        fetch(url, {
            method: init.method,
            body: init.body,
            headers,
            credentials: "include",
        });

    let response = await doFetch();
    let data = await safeJson(response);

    // No refresh needed
    if (response.status !== 401 || typeof window === "undefined") {
        return data;
    }

    // 🔥 Refresh flow
    let refreshResponse: Response;

    if (isMobile) {
        refreshResponse = await fetch(`${API_BASE_URL}/api/v1/auth/refresh`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                refreshToken: localStorage.getItem("refreshToken"),
            }),
        });
    } else {
        refreshResponse = await fetch(`${API_BASE_URL}/api/v1/auth/refresh`, {
            method: "POST",
            credentials: "include",
        });
    }

    const refreshData = await safeJson(refreshResponse);

    // Refresh failed → logout
    if (!refreshResponse.ok || !refreshData?.success) {
        if (isMobile) {
            localStorage.removeItem("accessToken");
            localStorage.removeItem("refreshToken");
        }

        window.dispatchEvent(new Event("auth:logout"));
        return data;
    }

    // Update mobile tokens
    if (isMobile) {
        localStorage.setItem("accessToken", refreshData.data.accessToken);
        localStorage.setItem("refreshToken", refreshData.data.refreshToken);

        headers.set(
            "Authorization",
            `Bearer ${refreshData.data.accessToken}`
        );
    }

    // Retry original request
    response = await doFetch();
    return await safeJson(response);
}

/* ---------- helpers ---------- */

export const get = <T>(
    endpoint: string,
    params?: RequestConfig["params"],
    headers?: Record<string, string>
) => apiRequest<T>(endpoint, { method: "GET", params, headers });

export const post = <T>(
    endpoint: string,
    body?: unknown,
    params?: RequestConfig["params"],
    headers?: Record<string, string>
) =>
    apiRequest<T>(endpoint, {
        method: "POST",
        body: body instanceof FormData ? body : body ? JSON.stringify(body) : undefined,
        params,
        headers,
    });

export const patch = <T>(
    endpoint: string,
    body?: unknown,
    headers?: Record<string, string>
) =>
    apiRequest<T>(endpoint, {
        method: "PATCH",
        body: body instanceof FormData ? body : body ? JSON.stringify(body) : undefined,
        headers,
    });

export const del = <T>(
    endpoint: string,
    headers?: Record<string, string>
) => apiRequest<T>(endpoint, { method: "DELETE", headers });

export const uploadFile = <T>(
    endpoint: string,
    formData: FormData
) => apiRequest<T>(endpoint, { method: "POST", body: formData });

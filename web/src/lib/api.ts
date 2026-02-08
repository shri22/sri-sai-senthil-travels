export const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5115/api';

export async function fetchJson(endpoint: string, options: RequestInit = {}) {
    const url = `${API_URL}${endpoint}`;

    const headers = {
        'Content-Type': 'application/json',
        ...options.headers,
    } as HeadersInit;

    const response = await fetch(url, { ...options, headers });

    // Handle 401/403 specifically if needed, or generic errors
    if (!response.ok) {
        const errorText = await response.text();
        throw new Error(errorText || `API Error: ${response.status}`);
    }

    // Some endpoints might return 204 No Content
    if (response.status === 204) return null;

    try {
        return await response.json();
    } catch {
        return null;
    }
}

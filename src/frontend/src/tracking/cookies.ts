
/** Stores a value in a cookie that expires after `days` days. */
export function setCookie(name: string, value: string, days: number) {
    const expires = new Date(Date.now() + days * 864e5).toUTCString();
    document.cookie = `${name}=${encodeURIComponent(value)}; expires=${expires}; path=/; SameSite=Lax`;
}

/**
 * Returns the decoded value of a named cookie, or undefined if not found.
 * Uses a regex instead of splitting on '=' so values containing '=' work correctly.
 */
export function getCookie(name: string): string | undefined {
    const escaped = name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const match = document.cookie.match(new RegExp('(?:^|;\\s*)' + escaped + '=([^;]*)'));
    return match ? decodeURIComponent(match[1]) : undefined;
}

/** Deletes a cookie by setting its expiry to the past. */
export function deleteCookie(name: string) {
    document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; SameSite=Lax`;
}

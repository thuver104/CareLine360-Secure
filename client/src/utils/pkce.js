function base64UrlEncode(buffer) {
    return btoa(
        String.fromCharCode(...new Uint8Array(buffer))
    )
        .replace(/\+/g, "-")
        .replace(/\//g, "_")
        .replace(/=+$/, "");
}

export function generateCodeVerifier() {
    const array = new Uint8Array(32);
    crypto.getRandomValues(array);

    return base64UrlEncode(array);
}

export async function generateCodeChallenge(codeVerifier) {
    const encoder = new TextEncoder();

    const data = encoder.encode(codeVerifier);

    const digest = await crypto.subtle.digest(
        "SHA-256",
        data
    );

    return base64UrlEncode(digest);
}
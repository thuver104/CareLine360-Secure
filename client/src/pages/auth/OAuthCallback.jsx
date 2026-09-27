import { useEffect } from "react";

const OAuthCallback = () => {
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);

    const code = params.get("code");
    const error = params.get("error");

    console.log("OAuth callback code:", code);
    console.log("OAuth callback error:", error);

    if (error) {
      console.error("Google OAuth error:", error);
      return;
    }

    if (code) {
      const codeVerifier = sessionStorage.getItem("pkce_code_verifier");

      console.log("Authorization Code:", code);
      console.log("PKCE Code Verifier:", codeVerifier);

      // Backend exchange will be added here
      // after your teammate provides the OAuth endpoint.
    }
  }, []);

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <h2 className="text-xl font-semibold">
          Completing Google sign-in...
        </h2>

        <p className="mt-2 text-gray-500">
          Please wait.
        </p>
      </div>
    </div>
  );
};

export default OAuthCallback;
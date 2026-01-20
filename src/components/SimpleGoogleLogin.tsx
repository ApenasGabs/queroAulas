import { useGoogleLogin } from "@react-oauth/google";
import React, { useState } from "react";
import { useGoogleAuth } from "../contexts/GoogleAuthContext";

interface SimpleGoogleLoginProps {
  onCredential?: (response: {
    credential?: string;
    access_token?: string;
  }) => void;
}

export const SimpleGoogleLogin: React.FC<SimpleGoogleLoginProps> = ({
  onCredential,
}) => {
  const { setCredential } = useGoogleAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleGoogleLogin = useGoogleLogin({
    scope: "https://www.googleapis.com/auth/drive.readonly",
    onSuccess: async (response) => {
      if (response.access_token) {
        setIsLoading(true);
        setError(null);
        try {
          // Get user info from Google
          const userInfoResponse = await fetch(
            "https://www.googleapis.com/oauth2/v1/userinfo",
            {
              headers: { Authorization: `Bearer ${response.access_token}` },
            },
          );

          if (!userInfoResponse.ok) {
            throw new Error("Falha ao obter informações do usuário");
          }

          const userInfo = await userInfoResponse.json();

          // Create JWT for local state management
          const payload = {
            sub: userInfo.id,
            email: userInfo.email,
            name: userInfo.name,
            picture: userInfo.picture,
            exp: Math.floor(Date.now() / 1000) + 3600, // 1 hour
            iat: Math.floor(Date.now() / 1000),
          };

          const fakeJWT = `${btoa(JSON.stringify({ alg: "RS256" }))}.${btoa(
            JSON.stringify(payload),
          )}.signature`;

          // Store credentials
          setCredential(fakeJWT, response.access_token);

          onCredential?.({
            credential: fakeJWT,
            access_token: response.access_token,
          });
        } catch (error) {
          setError(
            error instanceof Error ? error.message : "Erro ao fazer login",
          );
        } finally {
          setIsLoading(false);
        }
      }
    },
    onError: () => {
      setError("Falha no login. Tente novamente.");
    },
    flow: "implicit",
  });

  return (
    <div className="simple-login">
      <button
        type="button"
        onClick={() => handleGoogleLogin()}
        className="google-login-btn"
        disabled={isLoading}
      >
        {isLoading ? (
          <>
            <span>⏳</span> Autenticando...
          </>
        ) : (
          <>
            <span>🔐</span> Login com Google
          </>
        )}
      </button>
      {error && <p style={{ color: "red", marginTop: "8px" }}>{error}</p>}
    </div>
  );
};

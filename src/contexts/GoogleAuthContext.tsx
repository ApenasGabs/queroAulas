import React, {
  createContext,
  useContext,
  useState,
  type ReactNode,
} from "react";
import { revokeToken } from "../services/apiService";

type DecodedToken = {
  sub: string;
  email: string;
  name: string;
  given_name?: string;
  family_name?: string;
  picture?: string;
  exp: number;
  iat: number;
};

type GoogleAuthContextType = {
  credential: string | null;
  accessToken: string | null;
  decodedToken: DecodedToken | null;
  setCredential: (credential: string, token?: string) => void;
  logout: () => Promise<void>;
};

const GoogleAuthContext = createContext<GoogleAuthContextType | undefined>(
  undefined,
);

interface GoogleAuthProviderProps {
  children: ReactNode;
}

const decodeJwt = (token: string): DecodedToken | null => {
  try {
    const [, payloadBase64] = token.split(".");
    const normalized = payloadBase64.replace(/-/g, "+").replace(/_/g, "/");
    const json = atob(normalized);
    return JSON.parse(json);
  } catch (error) {
    console.error("[GoogleAuthContext] failed to decode JWT", error);
    return null;
  }
};

export const GoogleAuthProvider: React.FC<GoogleAuthProviderProps> = ({
  children,
}) => {
  const [credential, setCredentialState] = useState<string | null>(null);
  const [accessToken, setAccessTokenState] = useState<string | null>(null);
  const [decodedToken, setDecodedToken] = useState<DecodedToken | null>(null);

  const setCredential = (cred: string, token?: string) => {
    const decoded = decodeJwt(cred);
    setCredentialState(cred);
    if (token) {
      setAccessTokenState(token);
    }
    setDecodedToken(decoded);
  };

  const logout = async () => {
    // Revoke token on backend before clearing state
    if (accessToken) {
      try {
        await revokeToken(accessToken);
      } catch (error) {
        console.error("[GoogleAuthContext] failed to revoke token", error);
        // Continue with logout even if revoke fails
      }
    }

    setCredentialState(null);
    setAccessTokenState(null);
    setDecodedToken(null);
  };

  return (
    <GoogleAuthContext.Provider
      value={{
        credential,
        accessToken: accessToken || credential,
        decodedToken,
        setCredential,
        logout,
      }}
    >
      {children}
    </GoogleAuthContext.Provider>
  );
};

// eslint-disable-next-line react-refresh/only-export-components
export function useGoogleAuth() {
  const context = useContext(GoogleAuthContext);
  if (context === undefined) {
    throw new Error("useGoogleAuth must be used within a GoogleAuthProvider");
  }
  return context;
}

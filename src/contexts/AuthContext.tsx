import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";

interface GoogleUser {
  id: string;
  name: string;
  email: string;
  imageUrl: string;
}

interface AuthContextType {
  isAuthenticated: boolean;
  user: GoogleUser | null;
  isLoading: boolean;
  error: string | null;
  signIn: () => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState<GoogleUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const updateUser = (googleUser: gapi.auth2.GoogleUser) => {
    const profile = googleUser.getBasicProfile();
    setUser({
      id: profile.getId(),
      name: profile.getName(),
      email: profile.getEmail(),
      imageUrl: profile.getImageUrl(),
    });
    setIsAuthenticated(true);
  };

  useEffect(() => {
    const initClient = async () => {
      try {
        await new Promise<void>((resolve) => {
          gapi.load("client:auth2", resolve);
        });

        await gapi.client.init({
          apiKey: import.meta.env.VITE_GOOGLE_API_KEY,
          clientId: import.meta.env.VITE_GOOGLE_CLIENT_ID,
          discoveryDocs: [import.meta.env.VITE_GOOGLE_DISCOVERY_DOCS],
          scope: import.meta.env.VITE_GOOGLE_SCOPES,
        });

        const authInstance = gapi.auth2.getAuthInstance();

        // Check if user is already signed in
        if (authInstance.isSignedIn.get()) {
          updateUser(authInstance.currentUser.get());
        }

        // Listen for sign-in state changes
        authInstance.isSignedIn.listen((isSignedIn: boolean) => {
          if (isSignedIn) {
            updateUser(authInstance.currentUser.get());
          } else {
            setIsAuthenticated(false);
            setUser(null);
          }
        });

        setIsLoading(false);
      } catch (err) {
        console.error("Error initializing Google API client:", err);
        setError("Erro ao inicializar autenticação com Google");
        setIsLoading(false);
      }
    };

    initClient();
  }, []);

  const signIn = async () => {
    try {
      setError(null);
      const authInstance = gapi.auth2.getAuthInstance();
      const googleUser = await authInstance.signIn();
      console.log("googleUser: ", googleUser);
      updateUser(googleUser);
    } catch (err) {
      const error = err as { error?: string };
      console.error("Error signing in:", err);
      setError(error.error || "Erro ao fazer login");
      throw err;
    }
  };

  const signOut = async () => {
    try {
      setError(null);
      const authInstance = gapi.auth2.getAuthInstance();
      await authInstance.signOut();
      setIsAuthenticated(false);
      setUser(null);
    } catch (err) {
      console.error("Error signing out:", err);
      setError("Erro ao fazer logout");
      throw err;
    }
  };

  return (
    <AuthContext.Provider
      value={{
        isAuthenticated,
        user,
        isLoading,
        error,
        signIn,
        signOut,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

// eslint-disable-next-line react-refresh/only-export-components
export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}

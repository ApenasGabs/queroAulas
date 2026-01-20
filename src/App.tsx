import { GoogleOAuthProvider } from "@react-oauth/google";
import "./App.css";
import { FolderListingOAuth } from "./components/FolderListingOAuth";
import { SimpleGoogleLogin } from "./components/SimpleGoogleLogin";
import {
  GoogleAuthProvider,
  useGoogleAuth,
} from "./contexts/GoogleAuthContext";

function AppContent() {
  const { credential, accessToken, decodedToken, logout } = useGoogleAuth();

  if (!credential || !decodedToken) {
    return (
      <div className="app">
        <header className="app-header">
          <div className="header-content">
            <div className="logo-section">
              <h1 className="app-title">QueroAulas 🎓</h1>
              <p className="app-subtitle">Acesse suas aulas do Google Drive</p>
            </div>
          </div>
        </header>

        <main className="app-main">
          <div className="welcome-section">
            <div className="welcome-content">
              <span className="welcome-icon">🔐</span>
              <h2>Login com Google</h2>
              <p>Faça login para acessar suas pastas do Drive</p>
              <div className="features">
                <div className="feature">
                  <span>📁</span>
                  <span>Acesse pastas do Google Drive</span>
                </div>
                <div className="feature">
                  <span>🎥</span>
                  <span>Visualize seus vídeos</span>
                </div>
                <div className="feature">
                  <span>✅</span>
                  <span>Organize seus cursos</span>
                </div>
              </div>
              <SimpleGoogleLogin />
            </div>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="app">
      <header className="app-header">
        <div className="header-content">
          <div className="logo-section">
            <h1 className="app-title">QueroAulas 🎓</h1>
            <p className="app-subtitle">
              Transforme suas pastas do Drive em cursos
            </p>
          </div>
          <button onClick={logout} className="logout-btn">
            Sair
          </button>
        </div>
      </header>

      <main className="app-main">
        <FolderListingOAuth
          accessToken={accessToken}
          userEmail={decodedToken.email}
        />
      </main>
    </div>
  );
}

function App() {
  const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;

  return (
    <GoogleOAuthProvider clientId={clientId}>
      <GoogleAuthProvider>
        <AppContent />
      </GoogleAuthProvider>
    </GoogleOAuthProvider>
  );
}

export default App;

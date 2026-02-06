import { useEffect, useState } from "react";
import { apiRequest } from "./api/client";
import { API_ENDPOINTS } from "./api/endpoints";
import type { User } from "./api/types";
import { APP_CONFIG } from "./config";
import TopBar from "./components/TopBar";
import HomePage from "./features/home/HomePage";
import EventSection from "./features/events/EventSection";
import MeSection from "./features/me/MeSection";
import UserSection from "./features/users/UserSection";
import ConfigSection from "./features/config/ConfigSection";

type SectionKey = "events" | "me" | "users" | "config";

export default function App() {
  const [checking, setChecking] = useState(true);
  const [authenticated, setAuthenticated] = useState(false);
  const [section, setSection] = useState<SectionKey>("events");
  const [profile, setProfile] = useState<User | null>(null);

  useEffect(() => {
    const checkAuth = async () => {
      const result = await apiRequest<User>(API_ENDPOINTS.auth.me);
      if (result.ok && result.data) {
        setAuthenticated(true);
        setProfile(result.data);
        window.history.replaceState({}, "", "/dashboard");
      } else {
        setAuthenticated(false);
        setProfile(null);
        window.history.replaceState({}, "", "/");
      }
      setChecking(false);
    };
    checkAuth();
  }, []);

  const handleLogin = () => {
    window.location.href = `${APP_CONFIG.apiBaseUrl}${API_ENDPOINTS.auth.discord}`;
  };

  const handleLogout = () => {
    window.location.href = `${APP_CONFIG.apiBaseUrl}${API_ENDPOINTS.auth.logout}`;
  };

  if (checking) {
    return (
      <div className="loading-screen">
        <p>Loading...</p>
      </div>
    );
  }

  if (!authenticated) {
    return <HomePage onLogin={handleLogin} />;
  }

  return (
    <div className="app">
      <TopBar section={section} onSectionChange={setSection} onLogout={handleLogout} />
      <main className="content">
        {section === "events" && <EventSection />}
        {section === "me" && <MeSection />}
        {section === "users" && <UserSection />}
        {section === "config" && <ConfigSection />}
        {profile && (
          <footer className="footer">
            Signed in as {profile.discord?.display_name ?? profile.discord?.name ?? profile.discord_id}
          </footer>
        )}
      </main>
    </div>
  );
}

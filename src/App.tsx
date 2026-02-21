import { useCallback, useEffect, useMemo, useState } from "react";
import { apiRequest } from "./api/client";
import { API_ENDPOINTS } from "./api/endpoints";
import type { GeneralResponse, User } from "./api/types";
import { APP_CONFIG } from "./config";
import TopBar from "./components/TopBar";
import HomePage from "./features/home/HomePage";
import EventSection from "./features/events/EventSection";
import MeSection from "./features/me/MeSection";
import UserSection from "./features/users/UserSection";
import ConfigSection from "./features/config/ConfigSection";

type SectionKey = "events" | "me" | "users" | "config";

type RouteState = {
  section: SectionKey;
  eventId?: string | null;
  userId?: string | null;
};

const parsePath = (pathname: string): RouteState => {
  if (pathname.startsWith("/event")) {
    const id = pathname.split("/")[2];
    return { section: "events", eventId: id ?? null };
  }
  if (pathname.startsWith("/user")) {
    const id = pathname.split("/")[2];
    return { section: "users", userId: id ?? null };
  }
  if (pathname.startsWith("/me")) {
    return { section: "me" };
  }
  if (pathname.startsWith("/config")) {
    return { section: "config" };
  }
  return { section: "events" };
};

const buildPath = (section: SectionKey, eventId?: string | null, userId?: string | null) => {
  if (section === "events") {
    return eventId ? `/event/${eventId}` : "/event";
  }
  if (section === "users") {
    return userId ? `/user/${userId}` : "/user";
  }
  if (section === "me") {
    return "/me";
  }
  return "/config";
};

export default function App() {
  const [checking, setChecking] = useState(true);
  const [authenticated, setAuthenticated] = useState(false);
  const [section, setSection] = useState<SectionKey>("events");
  const [profile, setProfile] = useState<User | null>(null);
  const [backendVersion, setBackendVersion] = useState("");
  const [selectedEventId, setSelectedEventId] = useState<string | null>(null);
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);

  const userName = useMemo(
    () => profile?.discord?.display_name ?? profile?.discord?.name ?? "Me",
    [profile]
  );
  const userRoles = useMemo(() => profile?.user_role ?? [], [profile]);

  useEffect(() => {
    const checkAuth = async () => {
      const result = await apiRequest<User>(API_ENDPOINTS.auth.me);
      if (result.ok && result.data) {
        setAuthenticated(true);
        setProfile(result.data);
        const route = parsePath(window.location.pathname);
        setSection(route.section);
        setSelectedEventId(route.eventId ?? null);
        setSelectedUserId(route.userId ?? null);
        window.history.replaceState({}, "", buildPath(route.section, route.eventId, route.userId));
        const versionResult = await apiRequest<GeneralResponse>(API_ENDPOINTS.meta.version);
        if (versionResult.ok && versionResult.data?.success) {
          setBackendVersion(versionResult.data.message ?? "");
        } else {
          setBackendVersion("");
        }
      } else {
        setAuthenticated(false);
        setProfile(null);
        setBackendVersion("");
        window.history.replaceState({}, "", "/");
      }
      setChecking(false);
    };
    checkAuth();
  }, []);

  useEffect(() => {
    const handlePopState = () => {
      const route = parsePath(window.location.pathname);
      setSection(route.section);
      setSelectedEventId(route.eventId ?? null);
      setSelectedUserId(route.userId ?? null);
    };
    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, []);

  const navigate = useCallback(
    (nextSection: SectionKey, nextEventId?: string | null, nextUserId?: string | null) => {
      const path = buildPath(nextSection, nextEventId, nextUserId);
      window.history.pushState({}, "", path);
      setSection(nextSection);
      setSelectedEventId(nextEventId ?? null);
      setSelectedUserId(nextUserId ?? null);
    },
    []
  );

  const handleSectionChange = useCallback((next: SectionKey) => navigate(next), [navigate]);
  const handleSelectEvent = useCallback((id: string) => navigate("events", id), [navigate]);
  const handleSelectUser = useCallback((id: string) => navigate("users", null, id), [navigate]);

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
      <TopBar
        section={section}
        onSectionChange={handleSectionChange}
        onLogout={handleLogout}
        userName={userName}
        userRoles={userRoles}
        backendVersion={backendVersion}
      />
      <main className="content">
        {section === "events" && (
          <EventSection
            selectedEventId={selectedEventId}
            onSelectEvent={handleSelectEvent}
            onOpenUser={handleSelectUser}
            userRoles={userRoles}
          />
        )}
        {section === "me" && <MeSection onOpenEvent={handleSelectEvent} />}
        {section === "users" && (
          <UserSection
            selectedUserId={selectedUserId}
            onSelectUser={handleSelectUser}
            onOpenEvent={handleSelectEvent}
          />
        )}
        {section === "config" && <ConfigSection />}
      </main>
    </div>
  );
}

import { useEffect, useRef, useState } from "react";
import { APP_CONFIG } from "../config";

type SectionKey = "events" | "me" | "users" | "config";

type TopBarProps = {
  section: SectionKey;
  onSectionChange: (section: SectionKey) => void;
  onLogout: () => void;
  userName: string;
  userRoles: string[];
  backendVersion: string;
};

const MENU_ITEMS: { key: SectionKey; label: string }[] = [
  { key: "events", label: "Events" },
  { key: "me", label: "Me" },
  { key: "users", label: "Users" },
  { key: "config", label: "Config" },
];

const getRoleClassName = (role: string) => {
  const lowerRole = role.toLowerCase();
  if (lowerRole === "administrator") return "role-admin";
  if (lowerRole === "pm") return "role-pm";
  if (lowerRole === "member") return "role-member";
  return "role-none";
};

export default function TopBar({
  section,
  onSectionChange,
  onLogout,
  userName,
  userRoles,
  backendVersion,
}: TopBarProps) {
  const orderedMenuItems = [
    ...MENU_ITEMS.filter((item) => item.key !== "me"),
    ...MENU_ITEMS.filter((item) => item.key === "me"),
  ];
  const [open, setOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const handleClick = (event: MouseEvent) => {
      if (!dropdownRef.current) return;
      if (!dropdownRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    };
    window.addEventListener("click", handleClick);
    return () => window.removeEventListener("click", handleClick);
  }, []);

  const safeFrontendGithubUrl = APP_CONFIG.frontendGithubUrl.startsWith("https://github.com/")
    ? APP_CONFIG.frontendGithubUrl
    : "https://github.com/";
  const safeBackendGithubUrl = APP_CONFIG.backendGithubUrl.startsWith("https://github.com/")
    ? APP_CONFIG.backendGithubUrl
    : "https://github.com/";
  const safeCommitId = /^[0-9a-f]{7,40}$/i.test(APP_CONFIG.commitId) ? APP_CONFIG.commitId : "";
  const safeBackendVersion = backendVersion.trim();
  const safeRoles = userRoles.length > 0 ? userRoles : ["N/A"];

  const renderMeLabel = () => (
    <span className="me-menu-wrap">
      <span className="me-menu-name">{userName}</span>
      <span className="me-menu-badges">
        {safeRoles.map((role) => (
          <span key={role} className={`role-badge me-menu-badge ${getRoleClassName(role)}`}>
            {role}
          </span>
        ))}
      </span>
    </span>
  );

  return (
    <header className="top-bar">
      <div className="top-bar-left">
        <button
          type="button"
          className="brand"
          onClick={() => onSectionChange("events")}
        >
          <img className="logo small" src={APP_CONFIG.logoUrl} alt={APP_CONFIG.appTitle} />
          <span>{APP_CONFIG.appTitle}</span>
        </button>
        <div className="repo-links">
          <a
            className="repo-badge repo-badge-frontend"
            href={safeFrontendGithubUrl}
            target="_blank"
            rel="noreferrer"
            aria-label="Frontend GitHub Repository"
            title="Frontend GitHub Repository"
          >
            <img className="github-icon" src="/github-logo.svg" alt="GitHub" />
            <span className="repo-label">CTFeed-frontend</span>
            {safeCommitId && <span className="repo-commit">#{safeCommitId}</span>}
          </a>
          <a
            className="repo-badge repo-badge-backend"
            href={safeBackendGithubUrl}
            target="_blank"
            rel="noreferrer"
            aria-label="Backend GitHub Repository"
            title="Backend GitHub Repository"
          >
            <img className="github-icon" src="/github-logo.svg" alt="GitHub" />
            <span className="repo-label">CTFeed</span>
            {safeBackendVersion && <span className="repo-commit">#{safeBackendVersion}</span>}
          </a>
        </div>
      </div>
      <nav className="menu">
        {orderedMenuItems.map((item) => (
          <button
            key={item.key}
            type="button"
            className={section === item.key ? "menu-item active" : "menu-item"}
            onClick={() => onSectionChange(item.key)}
          >
            {item.key === "me" ? renderMeLabel() : item.label}
          </button>
        ))}
        <button type="button" className="menu-item danger" onClick={onLogout}>
          Logout
        </button>
      </nav>
      <div className="menu-dropdown" ref={dropdownRef}>
        <button
          type="button"
          className="menu-trigger"
          onClick={() => setOpen((prev) => !prev)}
          aria-expanded={open}
          aria-haspopup="true"
        >
          Menu
          <span className="menu-caret" aria-hidden="true" />
        </button>
        {open && (
          <div className="menu-panel" role="menu">
            {orderedMenuItems.map((item) => (
              <button
                key={item.key}
                type="button"
                role="menuitem"
                className={section === item.key ? "menu-panel-item active" : "menu-panel-item"}
                onClick={() => {
                  onSectionChange(item.key);
                  setOpen(false);
                }}
              >
                {item.key === "me" ? renderMeLabel() : item.label}
              </button>
            ))}
            <button
              type="button"
              role="menuitem"
              className="menu-panel-item danger"
              onClick={() => {
                onLogout();
                setOpen(false);
              }}
            >
              Logout
            </button>
          </div>
        )}
      </div>
    </header>
  );
}

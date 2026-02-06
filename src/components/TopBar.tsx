import { APP_CONFIG } from "../config";

type SectionKey = "events" | "me" | "users" | "config";

type TopBarProps = {
  section: SectionKey;
  onSectionChange: (section: SectionKey) => void;
  onLogout: () => void;
};

const MENU_ITEMS: { key: SectionKey; label: string }[] = [
  { key: "events", label: "Events" },
  { key: "me", label: "Me" },
  { key: "users", label: "Users" },
  { key: "config", label: "Config" },
];

export default function TopBar({ section, onSectionChange, onLogout }: TopBarProps) {
  return (
    <header className="top-bar">
      <button
        type="button"
        className="brand"
        onClick={() => onSectionChange("events")}
      >
        <img className="logo small" src={APP_CONFIG.logoUrl} alt={APP_CONFIG.appTitle} />
        <span>{APP_CONFIG.appTitle}</span>
      </button>
      <nav className="menu">
        {MENU_ITEMS.map((item) => (
          <button
            key={item.key}
            type="button"
            className={section === item.key ? "menu-item active" : "menu-item"}
            onClick={() => onSectionChange(item.key)}
          >
            {item.label}
          </button>
        ))}
        <button type="button" className="menu-item danger" onClick={onLogout}>
          Logout
        </button>
      </nav>
    </header>
  );
}

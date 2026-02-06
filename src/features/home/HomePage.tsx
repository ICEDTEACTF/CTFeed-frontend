import { APP_CONFIG } from "../../config";

type HomePageProps = {
  onLogin: () => void;
};

export default function HomePage({ onLogin }: HomePageProps) {
  return (
    <main className="home">
      <div className="home-card">
        <img className="logo" src={APP_CONFIG.logoUrl} alt={APP_CONFIG.appTitle} />
        <h1>{APP_CONFIG.appTitle}</h1>
        <p className="home-subtitle">CTF Operations Dashboard</p>
        <button className="primary" type="button" onClick={onLogin}>
          透過 Discord 登入
        </button>
        <p className="home-note">Login is handled by Discord OAuth2.</p>
      </div>
    </main>
  );
}

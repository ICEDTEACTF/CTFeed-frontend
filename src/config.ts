import { APP_COMMIT_ID } from "./commit";

export const APP_CONFIG = {
  apiBaseUrl: import.meta.env.VITE_API_BASE_URL ?? "",
  appTitle: "ICEDTEA CTF bot",
  logoUrl: "/logo.png",
  frontendGithubUrl: import.meta.env.VITE_FRONTEND_GITHUB_URL
    ?? import.meta.env.VITE_GITHUB_URL
    ?? "https://github.com/ICEDTEACTF/CTFeed-frontend",
  backendGithubUrl: import.meta.env.VITE_BACKEND_GITHUB_URL
    ?? "https://github.com/ICEDTEACTF/CTFeed",
  commitId: APP_COMMIT_ID,
};

# ICEDTEA bot Frontend

This is the frontend Dashboard for [ICEDTEACTF/CTFeed](https://github.com/ICEDTEACTF/CTFeed).

## Deployment Steps
1. Copy `.env.example` to `.env` and fill in your values.

2. Build the frontend
    ```
    npm install
    npm run build
    ```
    The build output will be in `dist/`.

3. Configure backend

    Set these backend environment variables:
    ```
    # example
    HTTP_FRONTEND_URL=https://bot.example.com
    HTTP_API_URL=https://api.bot.example.com
    HTTP_COOKIE_DOMAIN=.bot.example.com
    ```

4. Serve `dist/` with a web server  

    Make sure SPA fallback is enabled (all routes should return `index.html`).

## Web server configuration examples
### Caddy
```
app.example.com {
  root * /path/to/CTFeed_frontend/dist
  encode zstd gzip

  # SPA fallback
  try_files {path} /index.html

  file_server
}
```

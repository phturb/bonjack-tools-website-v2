# Bonjack Tools

Personal tools website (React 19, MUI, rsbuild). Deployed to DigitalOcean App Platform on push to `main` (see `.do/app.yaml`).

## Scripts

```sh
yarn dev        # dev server with HMR
yarn build      # production build to dist/
yarn preview    # serve dist/
yarn typecheck  # tsc
yarn lint       # eslint
yarn check      # typecheck + lint + build
```

## Environment

Public variables are read at build time from `.env`, `.env.local`, `.env.<mode>` and `.env.<mode>.local` (rsbuild convention). `.env.development` is committed with local defaults.

| Variable | Purpose |
|---|---|
| `PUBLIC_HTTP_ENDPOINT` | REST API base (default `https://tools.bonjack.club/api`) |
| `PUBLIC_WEBSOCKET_ENDPOINT` | Lois des Norms websocket (default `wss://tools.bonjack.club/ws/`) |
| `PUBLIC_AUTH0_DOMAIN`, `PUBLIC_AUTH0_CLIENT_ID`, `PUBLIC_AUTH0_AUDIENCE` | Auth0 |
| `PUBLIC_SPOTIFY_CLIENT_ID` | Spotify app client id for Guess the Song |

Set the production values in the DigitalOcean app settings.

## Docker

```sh
docker build -t bonjack-tools .            # nginx image serving dist/
docker build -f Dockerfile.dev -t bonjack-tools-dev .
```

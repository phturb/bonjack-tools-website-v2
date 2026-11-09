# Bonjack Tools

Personal tools website (React 19, MUI, rsbuild, TypeScript 7, oxlint). Requires Node 24 or newer, 26 LTS pinned in (`.nvmrc`). Deployed to DigitalOcean App Platform on push to `main` (see `.do/app.yaml`).

Pages include the Swiss tournament tool at `/swiss` (list), `/swiss/new` (create, logged in) and `/swiss/:id` (bracket, public read, creator edit); see `docs/specs/swiss-tournament.md`.

## Scripts

```sh
yarn dev        # dev server with HMR
yarn build      # production build to dist/
yarn preview    # serve dist/
yarn lint       # oxlint with type-aware rules and TypeScript 7 type-check (tsgolint)
yarn typecheck  # plain tsc, same checker as the build
yarn check      # lint + build
```

## Environment

Public variables are read at build time from `.env`, `.env.local`, `.env.<mode>` and `.env.<mode>.local` (rsbuild convention). `.env.development` is committed with local defaults.

| Variable | Purpose |
|---|---|
| `PUBLIC_HTTP_ENDPOINT` | REST API base (default `https://tools.bonjack.club/api`) |
| `PUBLIC_WEBSOCKET_ENDPOINT` | Lois des Norms websocket (default `wss://tools.bonjack.club/ws`) |
| `PUBLIC_AUTH0_DOMAIN`, `PUBLIC_AUTH0_CLIENT_ID`, `PUBLIC_AUTH0_AUDIENCE` | Auth0 |
| `PUBLIC_DEV_SUBJECT` | Dev only, when Auth0 is unset: identity sent as the bearer token (default `dev`). Override at runtime with `localStorage.devSubject` or the "Acting as" field on the Swiss pages |
| `PUBLIC_SPOTIFY_CLIENT_ID` | Spotify app client id for Guess the Song |

Set the production values in the DigitalOcean app settings.

### Auth bypass for local development

Leave `PUBLIC_AUTH0_*` empty and run the backend without `JWT_SECRET` (`go run ./cmd/swissdev` in the backend repo). The app then skips Auth0 and sends `Authorization: Bearer <PUBLIC_DEV_SUBJECT>`; the backend uses that raw value as the caller subject. Change the identity without restarting to test the owner and non-owner views of a tournament: use the "Acting as" field shown on the Swiss pages, or `localStorage.setItem("devSubject", "alice")`. The bypass is inert as soon as `PUBLIC_AUTH0_DOMAIN` is set.

## Docker

```sh
docker build -t bonjack-tools .            # nginx image serving dist/
docker build -f Dockerfile.dev -t bonjack-tools-dev .
```

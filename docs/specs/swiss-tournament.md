# Swiss Tournament — Specification

Status: v1.0 implemented · Owner: Philippe Turner · Repos: `bonjack-tools-website-v2` (UI), `bonjack-tools-backend-go` (API, pairing)

## 1. Goal

A page on tools.bonjack.club where a logged-in user creates a Swiss-system tournament between individual players, configures it, enters results round by round, and everyone can follow it on an esports-style bracket graph grouped by win–loss record (the Worlds / Counter-Strike Major layout).

### In scope (v1)

- Create, configure, and delete a tournament (creator only).
- Manage participants: add, rename, reorder seed, remove (before start); mark as dropped (after start).
- Server-side Swiss pairing with rematch avoidance and byes.
- Enter and correct results; advance to the next round; undo the latest round.
- Public read-only bracket graph at a shareable URL, auto-refreshing.
- Advanced / eliminated lists and a standings table.

### Out of scope (v1)

- Teams, drafts, multi-stage events (Swiss feeding a playoff bracket).
- Discord integration, player stats, Riot data.
- Real-time push; polling is enough.
- Fancy SVG connectors between matches; v1 uses column layout, connectors are v2.

## 2. Concepts

| Term | Meaning |
|---|---|
| Tournament | Named event with a config, a status, participants, rounds and matches. |
| Participant | A person in the tournament. Has a display name and a seed (1 = strongest). Not linked to accounts. |
| Record | Wins–losses of a participant, e.g. `2-1`. |
| Bucket | All participants sharing the same record in a given round. Pairings are made inside a bucket. |
| Round | One set of matches. Round `n` contains the buckets with `wins + losses = n - 1`. |
| Match | Two participants in the same bucket, a best-of, scores, a winner. A bye is a match with one participant, auto-won. |
| Advanced | Reached `winsToAdvance` wins. Plays no more matches. |
| Eliminated | Reached `lossesToEliminate` losses. Plays no more matches. |

## 3. Tournament configuration

Editable while `status = draft`. Frozen after start except `name` and `description`.

| Field | Type | Default | Rules |
|---|---|---|---|
| `name` | string | – | 1–80 chars, required |
| `description` | string | "" | ≤ 500 chars |
| `winsToAdvance` | int | 3 | 1–5 |
| `lossesToEliminate` | int | 3 | 1–5 |
| `bestOf` | int | 1 | 1, 3 or 5; applies to every match |
| `decidersBestOf` | int | same as `bestOf` | 1, 3 or 5; applies to matches where at least one participant would advance or be eliminated with this result |
| `seeding` | enum | `manual` | `manual` (participant order) or `random` (shuffled at start with the stored `rngSeed`) |
| `allowRematches` | bool | false | When false the pairer avoids rematches and only falls back to one if no valid pairing exists |
| `visibility` | enum | `public` | `public` (anyone with the link) or `unlisted` (same, but not shown on the list page). No private option in v1 |

Derived values:

- `maxRounds = winsToAdvance + lossesToEliminate - 1`
- Minimum participants: 2. No maximum enforced in v1; the UI warns above 64.

## 4. Lifecycle

```
draft ──start──▶ in_progress ──(all advanced or eliminated)──▶ completed
  ▲                 │
  └── (not allowed) │ undo last round / edit result of current round
```

- **draft**: config and participants editable. No matches.
- **start**: requires ≥ 2 participants. Applies seeding, generates round 1, status → `in_progress`.
- **in_progress**: results are entered for the current round. When every match of the current round has a result, the creator can **close the round**, which generates the next round. The creator can **undo** the latest generated round only if none of its matches has a result; results of the current round can be edited until the round is closed.
- **completed**: set automatically when, after closing a round, no participant is still active, or when `maxRounds` have been closed. Read-only. Undo is refused (409); a completed tournament cannot be reopened in v1.
- **delete**: allowed in any status, creator only, with confirmation.

## 5. Pairing algorithm (server-side)

Deterministic given the tournament state and `rngSeed`. Runs when a round is generated.

1. **Active set**: participants not advanced, not eliminated, not dropped.
2. **Buckets**: group the active set by record. Process buckets from best record to worst.
3. **Order inside a bucket**: by Buchholz score desc (sum of opponents' wins), then seed asc. Round 1 uses seed only.
4. **Pairing inside a bucket** (even size `2k`): top half vs bottom half, i.e. `1 vs k+1, 2 vs k+2, …`. For each proposed pair, if the two have already met and `allowRematches = false`, swap the lower participant with the next candidate in the bottom half; if no swap avoids a rematch, allow it and flag the match `rematch = true`.
5. **Odd bucket**: the lowest-ordered participant **floats down** to the next bucket (worse record) and is paired first there against that bucket's highest-ordered participant. A participant may float at most once per round. If the worst bucket is odd, its lowest-ordered participant receives a **bye**, counted as a win with score `bestOfWinThreshold–0`. A participant receives at most one bye per tournament; if the candidate already had one, the next lowest is chosen.
6. **Best-of**: `decidersBestOf` if either participant has `wins = winsToAdvance - 1` or `losses = lossesToEliminate - 1`, else `bestOf`.
7. **Dropped participants**: treated as eliminated for pairing. Their unplayed current match, if any, is recorded as a forfeit win for the opponent.

Tie-breaks for the standings table, in order: wins, losses asc, Buchholz, head-to-head, seed. These are display-only; they do not affect advancement.

Worked example, 16 players, 3/3, bo1: rounds have 8, 8, 8, 6, 3 matches; 8 advance, 8 are eliminated, 5 rounds.

## 6. Bracket graph

Column per round. Inside a column, one card group per bucket, best record on top. Each match is a card:

```
┌ Round 3 ─────────────────┐
│ 2-0                      │
│ ┌──────────────────────┐ │
│ │ (1) Alice        2   │ │  ← winner highlighted
│ │ (8) Bob          1   │ │
│ │ bo3 · decider        │ │
│ └──────────────────────┘ │
│ 1-1                      │
│ …                        │
│ 0-2                      │
└──────────────────────────┘
```

- Right of the last column: two panels, **Advanced** (ordered by round reached, then standings) and **Eliminated**.
- Cards of unplayed matches show `–` scores. For the creator, clicking a card opens the result dialog.
- Bye cards show one participant and the label `bye`.
- Rematches and forfeits carry a small chip.
- Layout is a horizontally scrollable flex row; columns are fixed width (320 px), cards stack vertically. No graph library. Connectors between cards are a v2 item.
- Below the graph: a standings table (rank, seed, name, W-L, Buchholz, status) and the current-round action bar for the creator (`Close round`, `Undo round`).

## 7. Pages and routes (website)

| Route | Access | Content |
|---|---|---|
| `/swiss` | public | List of public tournaments (name, status, participants, created), `New tournament` button when logged in. |
| `/swiss/new` | logged in | Config form. Creates in `draft` and redirects to `/swiss/:id`. |
| `/swiss/:id` | public read, creator edit | Draft: config form + participants editor + `Start`. In progress / completed: graph, standings, actions. |

Navigation: add `Swiss Tournament` under the `Games Tool` menu in `src/routes.ts`.

Polling: `useQuery` with `refetchInterval: 5000` on `/swiss/:id` while `status = in_progress`, off otherwise.

Components (under `src/components/Swiss/`): `TournamentForm`, `ParticipantsEditor`, `BracketGraph`, `BucketColumn`, `MatchCard`, `ResultDialog`, `StandingsTable`, `OutcomePanels`. API client in `src/api/swiss.ts`. Types in `src/interfaces/Swiss.ts`, mirrored from the Go JSON.

## 8. Backend API

All mutations require a valid Auth0 JWT; the token `sub` is stored as `owner_sub` and checked on every mutation (403 otherwise). Reads are public. JSON only. Errors are `{ "error": "message" }`.

| Method | Path | Body | Result |
|---|---|---|---|
| GET | `/api/swiss` | – | `[TournamentSummary]` = `{ id, name, status, participants (count), createdAt }`, public only, newest first |
| POST | `/api/swiss` | `TournamentConfig` | `Tournament` (201) |
| GET | `/api/swiss/{id}` | – | `Tournament` with participants, rounds, matches, standings |
| PATCH | `/api/swiss/{id}` | partial `TournamentConfig` | `Tournament`; config fields other than `name`/`description` rejected (409) after start |
| DELETE | `/api/swiss/{id}` | – | 204 |
| PUT | `/api/swiss/{id}/participants` | `[{ id?, name, seed }]` | `Tournament`; full replace, draft only |
| POST | `/api/swiss/{id}/participants/{pid}/drop` | – | `Tournament`; in progress only |
| POST | `/api/swiss/{id}/start` | – | `Tournament`; draft → in progress, round 1 generated |
| PUT | `/api/swiss/{id}/matches/{mid}/result` | `{ p1Score, p2Score }` | `Tournament`; current round only, scores must produce a valid best-of winner |
| POST | `/api/swiss/{id}/rounds/close` | – | `Tournament`; all current matches resolved → next round or completed |
| POST | `/api/swiss/{id}/rounds/undo` | – | `Tournament`; allowed only while in progress, when the latest round is not round 1 and has no results (byes and forfeits excepted); 409 otherwise |

`Tournament` JSON shape:

```jsonc
{
  "id": "k7f2…",                 // short random id, used in URLs
  "name": "Friday Swiss",
  "description": "",
  "status": "in_progress",       // draft | in_progress | completed
  "config": { "winsToAdvance": 3, "lossesToEliminate": 3, "bestOf": 1, "decidersBestOf": 3,
              "seeding": "manual", "allowRematches": false, "visibility": "public" },
  "ownerSub": "oauth2|discord|123",
  "isOwner": true,               // computed for the caller
  "createdAt": "2026-11-07T20:00:00Z",
  "currentRound": 3,
  "participants": [
    { "id": "p1", "name": "Alice", "seed": 1, "wins": 2, "losses": 0, "buchholz": 3,
      "status": "active" }       // active | advanced | eliminated | dropped
  ],
  "rounds": [
    { "number": 1, "closed": true,
      "matches": [
        { "id": "m1", "bucket": { "wins": 0, "losses": 0 }, "bestOf": 1,
          "p1": "p1", "p2": "p9", "p1Score": 1, "p2Score": 0, "winner": "p1",
          "bye": false, "rematch": false, "forfeit": false }
      ] }
  ],
  "standings": ["p1", "p4", "…"]  // participant ids in table order
}
```

### Data model (GORM, Postgres)

```
swiss_tournaments   id (text pk), name, description, status, owner_sub, rng_seed (bigint),
                    wins_to_advance, losses_to_eliminate, best_of, deciders_best_of,
                    seeding, allow_rematches, visibility, created_at, updated_at
swiss_participants  id (text pk), tournament_id (fk, cascade), name, seed, status, had_bye (bool)
swiss_matches       id (text pk), tournament_id (fk, cascade), round, bucket_wins, bucket_losses,
                    p1_id (fk), p2_id (fk, nullable for bye), best_of, p1_score, p2_score,
                    winner_id (fk, nullable), bye, rematch, forfeit, created_at
```

Wins, losses, Buchholz and standings are computed from matches on read, not stored.

Package layout: `swiss/` with `model.go`, `pairing.go` (pure functions, no DB), `service.go` (transactions), `handlers.go`. Routes registered from `server/server.go`. Pairing gets table-driven tests: even and odd buckets, rematch avoidance and fallback, floaters, bye uniqueness, deciders best-of, the 16-player 3/3 case producing 8/8/8/6/3 matches.

## 9. Validation and errors

| Condition | Response |
|---|---|
| Not creator on a mutation | 403 |
| Start with < 2 participants | 422 `at least two participants are required` |
| Duplicate participant names | 422 |
| Result on a match outside the current round, or on a bye | 409 |
| Scores not forming a valid winner for the best-of (e.g. 2–2 in a bo3, or 1–0 in a bo3) | 422 |
| Close round with unresolved matches | 409 |
| Undo when the latest round has results | 409 |
| Config change after start (except name/description) | 409 |

## 10. Frontend behaviour details

- Optimistic updates are not used; every mutation invalidates `["swiss", id]`.
- The result dialog offers score buttons constrained by the best-of (bo1: `1–0` / `0–1`; bo3: `2–0`, `2–1`, `1–2`, `0–2`; bo5 similar).
- The participants editor supports paste of one name per line.
- Share button copies the URL.
- On mobile the graph scrolls horizontally; columns keep 320 px.
- Error boundary and loading states follow the existing pages.

## 11. Milestones

1. **Backend core**: models, migration, pairing with tests, create/read/participants/start.
2. **Backend rounds**: results, close, undo, drop, completion, standings.
3. **Frontend draft flow**: list page, new form, participants editor, start.
4. **Frontend graph**: bracket, result dialog, standings, polling.
5. **Polish**: unlisted visibility, share, README, deploy notes (requires `JWT_*` set on the backend).

## 12. Open questions

1. Should `decidersBestOf` default to 3 when `bestOf` is 1, as majors do, or stay equal to `bestOf`?
2. Is `unlisted` needed in v1, or is `public` only acceptable?
3. Should the creator be able to edit a closed round's result (with automatic re-pairing of later rounds)? Proposed answer: no, use undo.
4. Participant cap: enforce 64, or leave unbounded?

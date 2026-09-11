# Salawat Counter Bot

A WhatsApp bot for a group salawat-counting campaign. It joins your group as a
normal member (via WhatsApp Web login), reads submission messages, uses Claude
to parse the count and write a warm update message, and replies with the
running total.

⚠️ This uses an **unofficial** WhatsApp client (Baileys), which logs in as a
real account via QR code — not Meta's official Business API (which can't post
inside group chats). Use a spare/secondary number for the bot, not your main
personal number, and avoid replying to every single message in a very busy
group, to keep the account looking like normal usage.

## Commands

- Send a bare number (`50`, `+50`) or a natural sentence ("did 50 today,
  alhamdulillah", "صليت ٥٠ صلوات") to log that many salawat. Works in English
  and Arabic.
- `/stats` — all-time salawat totals, broken down by day of week (ASCII bar
  chart). Also triggered by natural phrasing like "show me the stats".
- `/me` — privately sends you your own submission history.
- `/awlia` — lists everyone who has submitted at least once, in random order
  (not ranked by count).
- `/help` — lists the commands above and briefly explains how the counting
  works, in English and Arabic. Also runs automatically whenever a new
  member joins the group.

## 1. Run it locally first (to test + log in)

```bash
npm install
cp .env.example .env
# edit .env and add your ANTHROPIC_API_KEY
npm start
```

A QR code will print in your terminal. Scan it with the WhatsApp account you
want to use as the bot (Linked Devices → Link a Device). Once connected, add
that number to your salawat WhatsApp group.

Send a test message in the group — the console will log the group's chat ID
(looks like `123456789-123456789@g.us`). Copy it into `GROUP_ID` in `.env`,
restart, and from then on the bot only reacts inside that group.

Try sending things like:

- `+50`
- `50 salawat`
- `did 100 today, alhamdulillah`
- `/stats`, `/me`, `/awlia`, `/help`

## 2. Deploy to Railway

Railway keeps this running 24/7 as a persistent process — good fit, since the
bot needs a constant WhatsApp connection.

**Important:** attach a Volume, or your login session and salawat count reset
every time you redeploy.

### Steps

1. Install the Railway CLI and log in:
   ```bash
   npm install -g @railway/cli
   railway login
   ```
2. From inside this project folder:
   ```bash
   railway init
   ```
3. In the Railway dashboard, open the new service → **Settings → Volumes** →
   attach a volume and mount it at `/data`.
4. Set environment variables (dashboard, or via CLI):
   ```bash
   railway variables --set "ANTHROPIC_API_KEY=sk-ant-..." \
                      --set "DATA_DIR=/data" \
                      --set "SALAWAT_GOAL=100000"
   ```
   Leave `GROUP_ID` unset for now.
5. Deploy:
   ```bash
   railway up
   ```
6. Open the deployment logs in the Railway dashboard — the QR code will print
   there. Scan it with the bot's WhatsApp account.
7. Add the bot number to your group, send a test message, and copy the logged
   group ID into the `GROUP_ID` variable (`railway variables --set "GROUP_ID=...@g.us"`).
   This redeploys automatically.

From then on, every valid salawat submission in the group gets tallied and
answered with an AI-generated update automatically.

## Testing

Unit tests use [Vitest](https://vitest.dev) and mock the Anthropic SDK,
Prisma client, and Baileys socket, so they run fully offline — no API keys,
database, or WhatsApp connection needed.

```bash
npm test          # run once
npm run test:watch # watch mode
```

Every push and pull request to `main` and `staging` runs typecheck + tests
via GitHub Actions (`.github/workflows/ci.yml`).

## Notes

- The bot only needs to be added to the group once — no ongoing manual work.
- Submissions and users are stored in Postgres (see
  [Database Setup](#database-setup--salawat-bot) below); back it up
  periodically if the campaign matters a lot to you.
- The WhatsApp login session lives under `DATA_DIR` (default `data/`, or
  `/data` on Railway) — that's what needs a persistent Volume, not the count.
- If WhatsApp logs the session out (rare, but possible), you'll need to
  rescan a fresh QR code from the logs.

# salawat-bot — Architecture

## Diagram

```mermaid
flowchart TB
    WA["WhatsApp"] -->|incoming message / group join| MSG["Messenger"]
    MSG -->|reply| WA

    MSG -->|raw message| INT["Interpreter"]
    REN -->|formatted result| MSG

    INT -->|classify intent| CLAUDE["Claude API"]
    INT -->|command| DISP["Dispatcher"]

    DISP -->|query/update| DBJS["DB.js"]
    DBJS -->|data| DISP
    DBJS <--> DB[("DB")]

    DISP -->|raw result| REN["Presenter"]
    REN -->|format/caption| CLAUDE
```

---

## Modules

### WhatsApp

The external channel. End users send and receive messages here. No logic lives in this layer — it's purely the transport the Messenger integrates with.

### Messenger

Owns the WhatsApp integration (Baileys).

- Listens for incoming WhatsApp messages, plus `group-participants.update`
  events (used to auto-greet new members with `/help`)
- Sends outgoing WhatsApp messages (replies, notifications)
- Passes raw incoming text to the **Interpreter**
- Receives the formatted result directly from the **Presenter** and sends it back to the user over WhatsApp
  Entry point on the way in (to the Interpreter) and exit point on the way out (from the Presenter).

### Interpreter

Owns the NLU layer.

- Takes a raw, freeform user message from the **Messenger**
- Fast-paths obvious cases locally (literal `/stats`, `/me`, `/help`,
  `/awlia`, a bare number) to avoid an API call
- Otherwise uses Claude to classify intent (`salawat` / `stats` / `me` /
  `help` / `awlia` / `none`) and extract a structured command
- Passes that structured command to the **Dispatcher**
  A one-way step in the pipeline — it hands off to the Dispatcher and isn't involved in returning the result.

### Dispatcher

Owns command execution — the business logic core of the bot.

- Receives a structured command from the **Interpreter**
- Executes the appropriate logic for that command
- Reads/writes persistent data via **DB.js** (no external API calls happen here)
- Passes the raw result to the **Presenter**
  This is where you'd add new commands/features as the bot grows — it's the natural extension point.

### Presenter

Owns presentation — turning raw data from the Dispatcher into a human-friendly, nicely formatted message (ASCII bar charts, multilingual text, emojis).

- Receives the raw result from the **Dispatcher**
- For `salawat`/`stats` responses, asks Claude to write a short caption
  around fixed, non-negotiable data (the bar chart lines, the total), and
  falls back to a hardcoded template if Claude's output is malformed
- `/help` and `/awlia` are fully hardcoded (English + Arabic only) rather
  than AI-generated, since a command listing or a name roster needs to stay
  exactly accurate (and, for `/awlia`, keep its random order un-touched)
- Sends the formatted result directly to the **Messenger**
  Keeps formatting concerns out of the Dispatcher entirely — business logic doesn't need to know or care how its output will look on WhatsApp.

### DB.js

Owns all database access.

- Wraps Postgres/Prisma queries used by the Dispatcher
- Single choke point for reads/writes, so query logic isn't scattered across the app

### DB

PostgreSQL — local via Docker in development, Railway-hosted in production. Schema and setup details are in the [Database Setup](#database-setup--salawat-bot) section below.

---

## Message flow (happy path)

1. User sends a message (or joins the group) on **WhatsApp**
2. **Messenger** receives it, forwards the raw text to the **Interpreter**
   (a join event skips straight to a synthetic `/help` command)
3. **Interpreter** interprets it into a structured command, sends it to the **Dispatcher**
4. **Dispatcher** executes the command — reading/writing via **DB.js** as needed
5. **Dispatcher** passes the raw result to the **Presenter**
6. **Presenter** formats it into a human-friendly message and sends it to **Messenger**
7. **Messenger** sends the reply back over **WhatsApp**

# Database Setup — salawat-bot

## Stack

- **PostgreSQL** — local via Docker, production via Railway
- **Prisma 7** (`prisma@7.10.0`, `@prisma/client@7.10.0`) — ORM + migrations
- **Node 24** (`engines.node >= 24.0.0` in `package.json`)

---

## Local development

### 1. Postgres runs in Docker

`docker-compose.yml` (project root):

```yaml
services:
  postgres:
    image: postgres:16
    restart: unless-stopped
    environment:
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: ${DB_PASSWORD}
      POSTGRES_DB: myapp_dev
    ports:
      - "5432:5432"
    volumes:
      - pgdata:/var/lib/postgresql/data
volumes:
  pgdata:
```

`.env` (gitignored):

```dotenv
DB_PASSWORD=mysecretpassword
DATABASE_URL="postgresql://postgres:mysecretpassword@localhost:5432/myapp_dev"
```

### 2. npm scripts

```json
{
  "scripts": {
    "db:up": "docker compose up -d",
    "db:down": "docker compose down",
    "db:reset": "docker compose down -v && docker compose up -d",
    "db:logs": "docker compose logs -f postgres",
    "db:studio": "prisma studio",
    "db:migrate": "prisma migrate dev"
  }
}
```

Daily workflow:

```bash
npm run db:up        # start Postgres in Docker
npm run db:migrate    # apply schema changes
npm run db:studio     # browse data visually
npm run db:down       # stop Postgres
```

---

## Prisma 7 — key differences from older versions

Prisma 7 changed several things that broke the "usual" setup. Notes for future reference:

- **CLI init command renamed**: some contexts use `prisma orm init` instead of `prisma init` (depends on exact version/RC).
- **`datasource.url` no longer goes in `schema.prisma`.** Connection URL now lives in `prisma.config.ts`:

  ```typescript
  // prisma.config.ts
  import "dotenv/config";
  import { defineConfig, env } from "prisma/config";

  export default defineConfig({
    schema: "prisma/schema.prisma",
    migrations: {
      path: "prisma/migrations",
    },
    datasource: {
      url: env("DATABASE_URL"),
    },
  });
  ```

  `schema.prisma` datasource block now just declares the provider:

  ```prisma
  datasource db {
    provider = "postgresql"
  }
  ```

- **Prisma 7 does not auto-load `.env`** — the `import "dotenv/config"` line at the top of `prisma.config.ts` is required, or `DATABASE_URL` will be undefined during migrations.
- **`PrismaClient` requires an explicit adapter** — no more zero-config `new PrismaClient()`.

  ```bash
  npm install @prisma/adapter-pg
  ```

  ```js
  import { PrismaClient } from "@prisma/client";
  import { PrismaPg } from "@prisma/adapter-pg";
  import "dotenv/config";

  const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
  const prisma = new PrismaClient({ adapter });

  export default prisma;
  ```

- **`postinstall` should just be**:
  ```json
  "postinstall": "prisma generate"
  ```
  (Prisma 7/8-rc briefly introduced a `prisma skills sync` postinstall step that syncs unrelated `.claude` / `.agents` skill docs — not needed for DB work, safe to ignore or remove.)

---

## Current schema (`prisma/schema.prisma`)

```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
}

model User {
  id          Int          @id @default(autoincrement())
  phoneNumber String       @unique
  name        String?
  createdAt   DateTime     @default(now())
  submissions Submission[]
}

model Submission {
  id          Int      @id @default(autoincrement())
  count       Int      @default(0)
  submittedAt DateTime @default(now())
  author      User     @relation(fields: [authorId], references: [id])
  authorId    Int
}
```

---

## Production — Railway

### Project layout

Project: **whatsApp auto replay claude bot**
Environment: `production`

Services (same project, so Railway's `${{ServiceName.VAR}}` reference syntax works):

- `whatsAppAiClaudeBot` — the Node app
- `Postgres` — dedicated Postgres instance
  > Note: a Postgres instance was briefly created in a separate Railway project (`empowering-gratitude`) by mistake, then deleted. Cross-project references don't work with the `${{ }}` shorthand — that's why both services need to live in the same project.

### Environment variable

On the `whatsAppAiClaudeBot` service, `DATABASE_URL` is set to:

```
${{Postgres.DATABASE_URL}}
```

This pulls the connection string live from the `Postgres` service — no manual copy-pasting, stays in sync if credentials rotate.

### Outstanding step: run migrations in production

Local `prisma migrate dev` only affects the local Docker DB — it does **not** touch Railway's Postgres. Production tables are currently **empty** and need migrations applied there separately.

**Plan:** add `prisma migrate deploy` to the Railway start command so it runs automatically on every deploy:

Railway dashboard → `whatsAppAiClaudeBot` service → **Settings → Deploy → Start Command**:

```bash
npx prisma migrate deploy && node index.js
```

Why this is safe to run on every deploy: `migrate deploy` checks the `_prisma_migrations` tracking table and only applies migrations that haven't run yet. If nothing's new, it's a fast no-op — this is the standard/recommended pattern for running Prisma in production.

### Viewing production data

Options:

- Railway dashboard → `Postgres` service → **Data** tab (built-in browser, no setup)
- Prisma Studio pointed at prod: `DATABASE_URL="<railway-connection-string>" npx prisma studio` (⚠️ operates directly on live data — be careful with edits/deletes)
- Railway CLI: `railway connect Postgres` (drops into `psql`)
- Any Postgres GUI (TablePlus, DBeaver, Postico) using the public connection string from the `Postgres` service's Variables tab

---

## Open TODOs

- [x] Set Railway start command to `npx prisma migrate deploy && node index.js`
- [x] Confirm tables appear in Railway's Postgres after next deploy
- [x] Rename any stray `prisma7.config.ts` → `prisma.config.ts` if still present

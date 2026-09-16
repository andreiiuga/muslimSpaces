// Deployed as a Railway Function ("weekly-digest-cron" service, Bun runtime),
// NOT part of this repo's build - Railway runs its own copy of this file
// directly, independent of src/. It is not built/typechecked by tsconfig.json
// and has no dependency on anything under src/.
//
// Runs on a cron schedule (Fridays 07:00 UTC, set on the Railway service -
// not in this file). Calls the whatsAppAiClaudeBot service's internal
// /weekly-digest endpoint over Railway's private network, then exits.
//
// If you change this file, you must also push it to Railway by hand via
// `update-function-source-code` (or pasting it into the dashboard) - editing
// this file alone does not redeploy the Function.
//
// Required env vars on the Railway service:
//   TARGET_URL           e.g. http://whatsappaiclaudebot.railway.internal:8080/weekly-digest
//   INTERNAL_API_SECRET  must match the whatsAppAiClaudeBot service's INTERNAL_API_SECRET

const targetUrl = Bun.env.TARGET_URL;
const secret = Bun.env.INTERNAL_API_SECRET;

if (!targetUrl || !secret) {
  console.error('Missing TARGET_URL or INTERNAL_API_SECRET env var.');
  process.exit(1);
}

const res = await fetch(targetUrl, {
  method: 'POST',
  headers: { 'x-internal-secret': secret },
});

const body = await res.text();
console.log(`weekly-digest trigger -> ${res.status}: ${body}`);

if (!res.ok) {
  process.exit(1);
}

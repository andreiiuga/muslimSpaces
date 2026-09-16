// Deployed as a Railway service ("weekly-digest-cron"), built and run from
// this repo like the bot itself (npx tsx scripts/weekly-digest-cron.ts), on
// a cron schedule (Fridays 07:00 UTC, set on the Railway service - not in
// this file). Calls the whatsAppAiClaudeBot service's internal
// /weekly-digest endpoint over Railway's private network, then exits.
//
// Required env vars on the Railway service:
//   TARGET_URL           e.g. http://whatsappaiclaudebot.railway.internal:8080/weekly-digest
//   INTERNAL_API_SECRET  must match the whatsAppAiClaudeBot service's INTERNAL_API_SECRET

const targetUrl = process.env.TARGET_URL;
const secret = process.env.INTERNAL_API_SECRET;

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

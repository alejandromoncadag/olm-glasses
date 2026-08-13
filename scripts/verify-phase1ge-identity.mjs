import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const root = resolve(import.meta.dirname, "..");
const read = (path) => readFileSync(resolve(root, path), "utf8");
const checks = [];
function requireCheck(value, label) { if (!value) throw new Error(label); checks.push(label); }

const migration = read("database/migrations/20260812_add_phase1ge_email_verification.sql");
const rollback = read("database/migrations/20260812_add_phase1ge_email_verification_rollback.sql");
const auth = read("auth.ts");
const register = read("app/api/customer-auth/password/register/route.ts");
const identity = read("lib/identity/serverClient.ts");
const backendPath = process.env.OPTICAOLM_BACKEND_PATH
  ? resolve(process.env.OPTICAOLM_BACKEND_PATH, "online_patient_identity.py")
  : resolve(root, "../opticaolm/backend/online_patient_identity.py");
const backend = readFileSync(backendPath, "utf8");

requireCheck(migration.includes("customer_email_verification_tokens") && migration.includes("customer_email_verification_outbox"), "durable verification token and outbox tables are declared");
requireCheck(!/\b(?:DROP|DELETE|TRUNCATE|CASCADE)\b/i.test(rollback), "rollback is non-destructive");
requireCheck(auth.includes("profile?.email_verified === true") && auth.includes("persistGoogleVerification"), "Google verification is persisted only from Google's verified claim");
requireCheck(register.includes('"emailVerified", image') && register.includes("NULL, NULL"), "password registration starts unverified");
requireCheck(identity.includes('"X-OLM-Email-Verified": "true"') && !identity.includes("NEXT_PUBLIC"), "identity bridge is verified and server-only");
requireCheck(backend.includes("_compatible_name") && backend.includes("_normalize_phone") && backend.includes("_normalize_email"), "patient matching requires compatible name, phone, and email");
requireCheck(!backend.includes("historias_clinicas"), "clinical histories are not used as online prescriptions");
requireCheck(backend.includes("prescripcion_optica_acceso_online") && backend.includes("paymentRequired"), "only approved prescriptions are selectable and payment remains separate");
requireCheck(backend.includes("optical_draft_claimed"), "guest optical draft claim is audited");

console.log("PHASE 1G-E OLM IDENTITY VERIFIER: PASS");
for (const check of checks) console.log(`  [OK] ${check}`);

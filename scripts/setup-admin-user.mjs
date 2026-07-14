import crypto from "crypto";
import pg from "pg";

const { Pool } = pg;

const DATABASE_URL =
  process.env.DATABASE_URL || "postgresql://localhost:5432/olm_glasses_dev";

const ADMIN_FULL_NAME = process.env.ADMIN_FULL_NAME || "Alejandro Moncada";
const ADMIN_EMAIL = (
  process.env.ADMIN_EMAIL || "admin@olmglasses.com"
)
  .trim()
  .toLowerCase();

const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD;
const TEMP_ADMIN_EMAIL = process.env.TEMP_ADMIN_EMAIL?.trim().toLowerCase();

if (!ADMIN_PASSWORD) {
  console.error("Missing ADMIN_PASSWORD environment variable.");
  console.error("");
  console.error("Run this script like this:");
  console.error("ADMIN_PASSWORD='your-password' node scripts/setup-admin-user.mjs");
  process.exit(1);
}

const pool = new Pool({
  connectionString: DATABASE_URL,
});

function hashPassword(password) {
  const salt = crypto.randomBytes(16).toString("hex");

  const hash = crypto
    .pbkdf2Sync(password, salt, 100000, 64, "sha512")
    .toString("hex");

  return `${salt}:${hash}`;
}

async function main() {
  const passwordHash = hashPassword(ADMIN_PASSWORD);

  await pool.query(`
    ALTER TABLE admin_users
    ADD COLUMN IF NOT EXISTS password_hash text;
  `);

  await pool.query(
    `
      INSERT INTO admin_users (
        full_name,
        email,
        role,
        is_active,
        password_hash
      )
      VALUES ($1, $2, 'owner', true, $3)
      ON CONFLICT (email)
      DO UPDATE SET
        full_name = EXCLUDED.full_name,
        role = 'owner',
        is_active = true,
        password_hash = EXCLUDED.password_hash,
        updated_at = now();
    `,
    [ADMIN_FULL_NAME, ADMIN_EMAIL, passwordHash]
  );

  if (TEMP_ADMIN_EMAIL) {
    await pool.query(
      `
        DELETE FROM admin_users
        WHERE email = $1;
      `,
      [TEMP_ADMIN_EMAIL]
    );
  }

  console.log("Owner admin user ready:");
  console.log(`Email: ${ADMIN_EMAIL}`);
  console.log("Password: stored securely as a hash");

  await pool.end();
}

main().catch(async (error) => {
  console.error(error);
  await pool.end();
  process.exit(1);
});



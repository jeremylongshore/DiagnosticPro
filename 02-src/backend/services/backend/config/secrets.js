/**
 * Secret loading for the self-hosted VPS deployment.
 *
 * Secrets are provided as process environment variables, materialized at deploy
 * time from the SOPS-encrypted `.env.sops` (age) via `scripts/sops-env`. There is
 * NO Google Secret Manager dependency any more — GCP has been fully removed from
 * this product. See docker-compose.yml + the VPS runbook for how the env is
 * populated on the host.
 *
 * The module interface (getSecret / loadSecrets / clearCache) is unchanged so
 * index.js needs no edits; only the backing store moved from GCP → env.
 */

/**
 * Read a single secret from the process environment.
 * @param {string} secretName - env var name
 * @param {string} _version - accepted for interface compatibility; ignored
 * @returns {Promise<string|undefined>} the value, or undefined if unset
 */
async function getSecret(secretName, _version = 'latest') {
  return process.env[secretName];
}

/**
 * Load all secrets the app expects, straight from the environment.
 * Optional secrets resolve to undefined when absent (never throws).
 * @returns {Promise<Object>} secrets object
 */
async function loadSecrets() {
  return {
    STRIPE_SECRET_KEY: process.env.STRIPE_SECRET_KEY,
    STRIPE_WEBHOOK_SECRET: process.env.STRIPE_WEBHOOK_SECRET,
    FIREBASE_API_KEY: process.env.FIREBASE_API_KEY || process.env.VITE_FIREBASE_API_KEY,
    API_GATEWAY_KEY: process.env.API_GATEWAY_KEY || process.env.VITE_API_KEY,
    WHOP_API_KEY: process.env.WHOP_API_KEY,
    WHOP_WEBHOOK_SECRET: process.env.WHOP_WEBHOOK_SECRET,
    // LLM: OpenAI (gpt-4o) via the OpenAI-compatible client. LLM_API_KEY is the
    // canonical name; OPENAI/DEEPSEEK/GROQ kept as fallbacks so a provider swap
    // stays a pure env change.
    LLM_API_KEY: process.env.LLM_API_KEY || process.env.OPENAI_API_KEY ||
                 process.env.DEEPSEEK_API_KEY || process.env.GROQ_API_KEY,
    DEEPSEEK_API_KEY: process.env.DEEPSEEK_API_KEY,
    GROQ_API_KEY: process.env.GROQ_API_KEY,
  };
}

/**
 * No-op cache clear (kept for interface compatibility; there is no cache now
 * that secrets come straight from the environment).
 */
function clearCache() {
  // intentionally empty — env vars are read live, nothing is cached
}

module.exports = {
  getSecret,
  loadSecrets,
  clearCache,
};

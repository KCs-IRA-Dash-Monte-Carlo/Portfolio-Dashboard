// Archived phase snapshot: credentials are never stored in the repository.
export const PREDEFINED_FINNHUB_API_KEY = "";

export const FINNHUB_API_KEY_SOURCES = Object.freeze({
  PREDEFINED: "predefined",
  USER_OVERRIDE: "user-override",
  RESTORED: "restored-backup"
});

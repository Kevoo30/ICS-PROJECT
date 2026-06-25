const ACCOUNTS_KEY = "evCharging.accounts";
const CURRENT_USER_KEY = "evCharging.currentUser";
const SESSION_KEY = "evCharging.session";

function readJson(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}

function writeJson(key, value) {
  localStorage.setItem(key, JSON.stringify(value));
}

export function getStoredAccounts() {
  return readJson(ACCOUNTS_KEY, []);
}

export function upsertStoredAccount(account) {
  const accounts = getStoredAccounts();
  const nextAccounts = [...accounts.filter((item) => item.email !== account.email), account];
  writeJson(ACCOUNTS_KEY, nextAccounts);
}

export function findStoredAccount(email, password) {
  return getStoredAccounts().find(
    (item) => item.email.toLowerCase() === String(email).toLowerCase() && item.password === password,
  );
}

export function setStoredCurrentUser(user) {
  writeJson(CURRENT_USER_KEY, user);
}

export function getStoredCurrentUser() {
  return readJson(CURRENT_USER_KEY, null);
}

export function clearStoredCurrentUser() {
  localStorage.removeItem(CURRENT_USER_KEY);
}

export function setAuthSession(user, ttlHours = 12) {
  const safeHours = Number(ttlHours) > 0 ? Number(ttlHours) : 12;
  const expiresAt = Date.now() + safeHours * 60 * 60 * 1000;
  const payload = {
    uid: user?.uid || user?.id || null,
    role: user?.role || "driver",
    expiresAt,
  };
  sessionStorage.setItem(SESSION_KEY, JSON.stringify(payload));
  return payload;
}

export function getAuthSession() {
  try {
    const raw = sessionStorage.getItem(SESSION_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (!parsed?.expiresAt || Number(parsed.expiresAt) <= Date.now()) {
      sessionStorage.removeItem(SESSION_KEY);
      return null;
    }
    return parsed;
  } catch {
    sessionStorage.removeItem(SESSION_KEY);
    return null;
  }
}

export function hasActiveSession(uid) {
  const session = getAuthSession();
  if (!session) return false;
  return !uid || session.uid === uid;
}

export function clearAuthSession() {
  sessionStorage.removeItem(SESSION_KEY);
}

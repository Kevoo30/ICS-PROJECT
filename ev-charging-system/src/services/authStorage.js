const ACCOUNTS_KEY = "evCharging.accounts";
const CURRENT_USER_KEY = "evCharging.currentUser";

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

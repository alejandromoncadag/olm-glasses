"use client";

export type User = {
  email: string;
  fullName: string;
};

type StoredUser = User & { password: string };

const SESSION_KEY = "olm-user";
const USERS_KEY = "olm-users";

function safeParse<T>(value: string | null, fallback: T): T {
  if (!value) return fallback;
  try {
    return JSON.parse(value) as T;
  } catch {
    return fallback;
  }
}

export function getCurrentUser(): User | null {
  if (typeof window === "undefined") return null;
  return safeParse<User | null>(localStorage.getItem(SESSION_KEY), null);
}

function getUsers(): StoredUser[] {
  if (typeof window === "undefined") return [];
  return safeParse<StoredUser[]>(localStorage.getItem(USERS_KEY), []);
}

function saveUsers(users: StoredUser[]) {
  localStorage.setItem(USERS_KEY, JSON.stringify(users));
}

function notify() {
  window.dispatchEvent(new Event("olm-auth-change"));
}

export function login(
  email: string,
  password: string
): { user: User } | { error: string } {
  const normalizedEmail = email.trim().toLowerCase();
  const users = getUsers();
  const match = users.find(
    (user) => user.email === normalizedEmail && user.password === password
  );

  if (!match) {
    return { error: "Correo o contraseña incorrectos." };
  }

  const session: User = { email: match.email, fullName: match.fullName };
  localStorage.setItem(SESSION_KEY, JSON.stringify(session));
  notify();

  return { user: session };
}

export function signup(
  fullName: string,
  email: string,
  password: string
): { user: User } | { error: string } {
  const normalizedEmail = email.trim().toLowerCase();
  const users = getUsers();

  if (users.some((user) => user.email === normalizedEmail)) {
    return { error: "Este correo ya está registrado." };
  }

  const newUser: StoredUser = {
    fullName: fullName.trim(),
    email: normalizedEmail,
    password,
  };

  saveUsers([...users, newUser]);

  const session: User = { email: newUser.email, fullName: newUser.fullName };
  localStorage.setItem(SESSION_KEY, JSON.stringify(session));
  notify();

  return { user: session };
}

export function logout() {
  if (typeof window === "undefined") return;
  localStorage.removeItem(SESSION_KEY);
  notify();
}

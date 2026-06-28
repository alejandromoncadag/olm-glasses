"use client";

export type UserRole = "admin" | "customer";

export type User = {
  email: string;
  fullName: string;
  role: UserRole;
};

type StoredUser = User & { password: string };

const SESSION_KEY = "olm-user";
const USERS_KEY = "olm-users";

const DEFAULT_ADMIN: StoredUser = {
  email: "admin@olm.com",
  fullName: "Admin OLM",
  password: "OLM-local-admin-2026!",
  role: "admin",
};

function safeParse<T>(value: string | null, fallback: T): T {
  if (!value) return fallback;

  try {
    return JSON.parse(value) as T;
  } catch {
    return fallback;
  }
}

function normalizeStoredUser(user: Partial<StoredUser>): StoredUser {
  return {
    email: String(user.email || "").trim().toLowerCase(),
    fullName: String(user.fullName || "Cliente OLM"),
    password: String(user.password || ""),
    role: user.role === "admin" ? "admin" : "customer",
  };
}

export function getCurrentUser(): User | null {
  if (typeof window === "undefined") return null;

  const savedUser = safeParse<Partial<User> | null>(
    localStorage.getItem(SESSION_KEY),
    null
  );

  if (!savedUser?.email) {
    return null;
  }

  return {
    email: savedUser.email.trim().toLowerCase(),
    fullName: savedUser.fullName || "Cliente OLM",
    role: savedUser.role === "admin" ? "admin" : "customer",
  };
}

function getUsers(): StoredUser[] {
  if (typeof window === "undefined") return [];

  const users = safeParse<Partial<StoredUser>[]>(
    localStorage.getItem(USERS_KEY),
    []
  ).map(normalizeStoredUser);

  const usersWithoutDefaultAdmin = users.filter(
    (user) => user.email !== DEFAULT_ADMIN.email
  );

  const updatedUsers = [DEFAULT_ADMIN, ...usersWithoutDefaultAdmin];

  saveUsers(updatedUsers);

  return updatedUsers;
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

  const session: User = {
    email: match.email,
    fullName: match.fullName,
    role: match.role,
  };

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
    role: "customer",
  };

  saveUsers([...users, newUser]);

  const session: User = {
    email: newUser.email,
    fullName: newUser.fullName,
    role: newUser.role,
  };

  localStorage.setItem(SESSION_KEY, JSON.stringify(session));
  notify();

  return { user: session };
}

export function logout() {
  if (typeof window === "undefined") return;

  localStorage.removeItem(SESSION_KEY);
  notify();
}


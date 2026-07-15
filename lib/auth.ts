"use client";

export type UserRole = "admin" | "customer";

export type User = {
  email: string;
  fullName: string;
  role: UserRole;
  adminRole?: string;
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

function notify() {
  window.dispatchEvent(new Event("olm-auth-change"));
}

function normalizeStoredUser(user: Partial<StoredUser>): StoredUser {
  return {
    email: String(user.email || "").trim().toLowerCase(),
    fullName: String(user.fullName || "Cliente OLM"),
    password: String(user.password || ""),
    role: "customer",
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

  const email = savedUser.email.trim().toLowerCase();
  const role = savedUser.role === "admin" ? "admin" : "customer";

  if (
    role === "customer" &&
    !getUsers().some((registeredUser) => registeredUser.email === email)
  ) {
    clearCurrentUser();
    return null;
  }

  return {
    email,
    fullName: savedUser.fullName || "Cliente OLM",
    role,
    adminRole: savedUser.adminRole,
  };
}

export function storeCurrentUser(user: User) {
  if (typeof window === "undefined") return;

  localStorage.setItem(SESSION_KEY, JSON.stringify(user));
}

export function clearCurrentUser() {
  if (typeof window === "undefined") return;

  localStorage.removeItem(SESSION_KEY);
}

function getUsers(): StoredUser[] {
  if (typeof window === "undefined") return [];

  return safeParse<Partial<StoredUser>[]>(
    localStorage.getItem(USERS_KEY),
    []
  ).map(normalizeStoredUser);
}

function saveUsers(users: StoredUser[]) {
  localStorage.setItem(USERS_KEY, JSON.stringify(users));
}

export async function getBackendAdminUser(): Promise<User | null> {
  try {
    const response = await fetch("/api/auth/me", {
      method: "GET",
      credentials: "include",
    });

    if (!response.ok) {
      return null;
    }

    const data = await response.json();

    if (!data.user) {
      return null;
    }

    return {
      email: data.user.email,
      fullName: data.user.fullName,
      role: "admin",
      adminRole: data.user.adminRole,
    };
  } catch {
    return null;
  }
}

export async function login(
  email: string,
  password: string
): Promise<{ user: User } | { error: string }> {
  const normalizedEmail = email.trim().toLowerCase();

  try {
    const adminResponse = await fetch("/api/auth/admin-login", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      credentials: "include",
      body: JSON.stringify({
        email: normalizedEmail,
        password,
      }),
    });

    if (adminResponse.ok) {
      const data = await adminResponse.json();

      const session: User = {
        email: data.user.email,
        fullName: data.user.fullName,
        role: "admin",
        adminRole: data.user.adminRole,
      };

      storeCurrentUser(session);
      notify();

      return { user: session };
    }
  } catch {
    // If backend admin login fails because the server is unavailable,
    // continue and try customer local login below.
  }

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
    role: "customer",
  };

  storeCurrentUser(session);
  notify();

  return { user: session };
}

export async function signup(
  fullName: string,
  email: string,
  password: string
): Promise<{ user: User } | { error: string }> {
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
    role: "customer",
  };

  storeCurrentUser(session);
  notify();

  return { user: session };
}

export async function logout() {
  if (typeof window === "undefined") return;

  try {
    await fetch("/api/auth/logout", {
      method: "POST",
      credentials: "include",
    });
  } catch {
    // Keep local logout working even if the backend request fails.
  }

  clearCurrentUser();
  notify();
}


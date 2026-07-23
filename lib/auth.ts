"use client";

export type UserRole = "admin" | "customer";

export type User = {
  id: string;
  email: string;
  fullName: string;
  role: UserRole;
  avatarUrl?: string | null;
  adminRole?: string;
};

export async function getBackendAdminUser(): Promise<User | null> {
  try {
    const response = await fetch("/api/auth/me", {
      method: "GET",
      credentials: "include",
    });

    if (!response.ok) return null;

    const data = await response.json();

    if (!data.user) return null;

    return {
      id: String(data.user.id),
      email: String(data.user.email),
      fullName: String(data.user.fullName),
      role: "admin",
      adminRole: String(data.user.adminRole || ""),
    };
  } catch {
    return null;
  }
}

export async function loginAdmin(
  email: string,
  password: string
): Promise<{ user: User } | { error: string }> {
  try {
    const response = await fetch("/api/auth/admin-login", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      credentials: "include",
      body: JSON.stringify({
        email: email.trim().toLowerCase(),
        password,
      }),
    });

    const data = await response.json();

    if (!response.ok || !data.user) {
      return {
        error:
          typeof data.error === "string"
            ? data.error
            : "No pudimos iniciar la sesión administrativa.",
      };
    }

    return {
      user: {
        id: String(data.user.id),
        email: String(data.user.email),
        fullName: String(data.user.fullName),
        role: "admin",
        adminRole: String(data.user.adminRole || ""),
      },
    };
  } catch {
    return { error: "No pudimos conectar con el servidor." };
  }
}

export async function logoutAdmin() {
  try {
    await fetch("/api/auth/logout", {
      method: "POST",
      credentials: "include",
    });
  } catch {
    // The provider still clears its local view of the session.
  }
}

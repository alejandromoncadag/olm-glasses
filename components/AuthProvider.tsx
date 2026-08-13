"use client";

import {
  SessionProvider,
  signOut as signOutCustomer,
  useSession,
} from "next-auth/react";
import { usePathname } from "next/navigation";
import {
  createContext,
  ReactNode,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  getBackendAdminUser,
  logoutAdmin,
  type User,
} from "@/lib/auth";

type AuthContextValue = {
  user: User | null;
  loading: boolean;
  customerAuthConfigured: boolean;
  logout: () => Promise<void>;
  refresh: () => Promise<void>;
};

type CustomerSession = {
  loaded: boolean;
  user: User | null;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

const emptyCustomerSession: CustomerSession = {
  loaded: true,
  user: null,
  signOut: async () => undefined,
};

export default function AuthProvider({
  children,
  customerAuthConfigured,
}: {
  children: ReactNode;
  customerAuthConfigured: boolean;
}) {
  if (!customerAuthConfigured) {
    return (
      <UnifiedAuthState
        customerSession={emptyCustomerSession}
        customerAuthConfigured={false}
      >
        {children}
      </UnifiedAuthState>
    );
  }

  return (
    <SessionProvider>
      <AuthJsBridge>{children}</AuthJsBridge>
    </SessionProvider>
  );
}

function AuthJsBridge({ children }: { children: ReactNode }) {
  const { data: session, status } = useSession();

  const customerUser = useMemo<User | null>(() => {
    if (status !== "authenticated" || !session.user?.email) return null;

    return {
      id: session.user.id,
      email: session.user.email.trim().toLowerCase(),
      fullName: session.user.name?.trim() || "Cliente OLM",
      role: "customer",
      avatarUrl: session.user.image || null,
      emailVerified: session.user.emailVerified
        ? new Date(session.user.emailVerified).toISOString()
        : null,
    };
  }, [session, status]);

  const customerSession = useMemo<CustomerSession>(
    () => ({
      loaded: status !== "loading",
      user: customerUser,
      signOut: async () => {
        await signOutCustomer({ redirectTo: "/" });
      },
    }),
    [customerUser, status]
  );

  return (
    <UnifiedAuthState
      customerSession={customerSession}
      customerAuthConfigured
    >
      {children}
    </UnifiedAuthState>
  );
}

function UnifiedAuthState({
  children,
  customerSession,
  customerAuthConfigured,
}: {
  children: ReactNode;
  customerSession: CustomerSession;
  customerAuthConfigured: boolean;
}) {
  const pathname = usePathname();
  const isAdminRoute = pathname.startsWith("/admin");
  const [adminUser, setAdminUser] = useState<User | null>(null);
  const [adminLoading, setAdminLoading] = useState(true);

  const refreshAdmin = useCallback(async () => {
    if (!customerSession.loaded) {
      setAdminUser(null);
      setAdminLoading(true);
      return;
    }

    setAdminLoading(true);
    setAdminUser(await getBackendAdminUser());
    setAdminLoading(false);
  }, [customerSession.loaded]);

  useEffect(() => {
    window.localStorage.removeItem("olm-users");
    window.localStorage.removeItem("olm-user");

    const timeoutId = window.setTimeout(() => {
      void refreshAdmin();
    }, 0);

    function handleAuthChange() {
      void refreshAdmin();
    }

    window.addEventListener("olm-auth-change", handleAuthChange);

    return () => {
      window.clearTimeout(timeoutId);
      window.removeEventListener("olm-auth-change", handleAuthChange);
    };
  }, [refreshAdmin]);

  const user = isAdminRoute
    ? adminUser
    : customerSession.user || adminUser;
  const loading = !customerSession.loaded || adminLoading;

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      loading,
      customerAuthConfigured,
      refresh: refreshAdmin,
      logout: async () => {
        if (isAdminRoute && adminUser) {
          await logoutAdmin();
          setAdminUser(null);
          window.dispatchEvent(new Event("olm-auth-change"));
          return;
        }

        if (customerSession.user) {
          await customerSession.signOut();
          return;
        }

        await logoutAdmin();
        setAdminUser(null);
        window.dispatchEvent(new Event("olm-auth-change"));
      },
    }),
    [
      adminUser,
      customerAuthConfigured,
      customerSession,
      isAdminRoute,
      loading,
      refreshAdmin,
      user,
    ]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAppAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error("useAppAuth must be used inside AuthProvider");
  }

  return context;
}

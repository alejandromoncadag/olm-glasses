"use client";

import { ClerkProvider, useClerk, useUser } from "@clerk/nextjs";
import { esMX } from "@clerk/localizations";
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
  openProfile: () => void;
  refresh: () => Promise<void>;
};

type CustomerSession = {
  loaded: boolean;
  user: User | null;
  signOut: () => Promise<void>;
  openProfile: () => void;
};

const AuthContext = createContext<AuthContextValue | null>(null);

const emptyCustomerSession: CustomerSession = {
  loaded: true,
  user: null,
  signOut: async () => undefined,
  openProfile: () => undefined,
};

export default function AuthProvider({
  children,
  clerkPublishableKey,
  clerkConfigured,
}: {
  children: ReactNode;
  clerkPublishableKey: string | null;
  clerkConfigured: boolean;
}) {
  if (!clerkConfigured || !clerkPublishableKey) {
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
    <ClerkProvider
      publishableKey={clerkPublishableKey}
      localization={esMX}
      signInUrl="/login"
      signUpUrl="/signup"
    >
      <ClerkAuthBridge>{children}</ClerkAuthBridge>
    </ClerkProvider>
  );
}

function ClerkAuthBridge({ children }: { children: ReactNode }) {
  const { isLoaded, isSignedIn, user } = useUser();
  const clerk = useClerk();

  const customerUser = useMemo<User | null>(() => {
    if (!isLoaded || !isSignedIn || !user) return null;

    const email =
      user.primaryEmailAddress?.emailAddress ||
      user.emailAddresses[0]?.emailAddress ||
      "";

    if (!email) return null;

    return {
      id: user.id,
      email: email.trim().toLowerCase(),
      fullName:
        user.fullName ||
        [user.firstName, user.lastName].filter(Boolean).join(" ") ||
        "Cliente OLM",
      role: "customer",
      avatarUrl: user.imageUrl || null,
    };
  }, [isLoaded, isSignedIn, user]);

  const customerSession = useMemo<CustomerSession>(
    () => ({
      loaded: isLoaded,
      user: customerUser,
      signOut: async () => {
        await clerk.signOut({ redirectUrl: "/" });
      },
      openProfile: () => clerk.openUserProfile(),
    }),
    [clerk, customerUser, isLoaded]
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
  const [adminUser, setAdminUser] = useState<User | null>(null);
  const [adminLoading, setAdminLoading] = useState(true);

  const refreshAdmin = useCallback(async () => {
    if (!customerSession.loaded || customerSession.user) {
      setAdminUser(null);
      setAdminLoading(false);
      return;
    }

    setAdminLoading(true);
    setAdminUser(await getBackendAdminUser());
    setAdminLoading(false);
  }, [customerSession.loaded, customerSession.user]);

  useEffect(() => {
    // Remove credentials left by the retired browser-only customer login.
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

  const user = customerSession.user || adminUser;
  const loading = !customerSession.loaded || adminLoading;

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      loading,
      customerAuthConfigured,
      refresh: refreshAdmin,
      openProfile: customerSession.openProfile,
      logout: async () => {
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
      customerAuthConfigured,
      customerSession,
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

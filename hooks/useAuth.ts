"use client";

import { useAppAuth } from "@/components/AuthProvider";

export function useAuth() {
  return useAppAuth();
}

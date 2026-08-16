import LogoLoadingIndicator from "@/components/LogoLoadingIndicator";

export default function Loading() {
  return (
    <main className="flex min-h-[50vh] flex-1 items-center justify-center bg-white px-6">
      <LogoLoadingIndicator />
    </main>
  );
}

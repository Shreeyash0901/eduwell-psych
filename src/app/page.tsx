"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function Home() {
  const router = useRouter();

  useEffect(() => {
    router.replace("/psychologist/dashboard");
  }, [router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-surface">
      <div className="flex flex-col items-center gap-3">
        <span className="material-symbols-outlined text-primary text-4xl animate-spin">
          progress_activity
        </span>
        <p className="font-body-md text-on-surface-variant">Redirecting to Dashboard...</p>
      </div>
    </div>
  );
}

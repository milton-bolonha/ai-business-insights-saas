import { Suspense } from "react";
import { AdminContainer } from "@/containers/admin/AdminContainer";

function AdminFallback() {
  return (
    <div className="flex min-h-screen items-center justify-center text-slate-600">
      <div className="rounded-3xl border border-slate-200 bg-white px-6 py-4 text-sm shadow-sm">
        Carregando workspace...
      </div>
    </div>
  );
}

import { AdminOnboardingHandler } from "@/components/admin/AdminOnboardingHandler";

import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { db } from "@/lib/db/mongodb";
import { isAdmin } from "@/lib/auth/permissions";

export default async function AdminPage() {
  const { userId } = await auth();
  
  if (!userId) {
    redirect("/");
  }

  // Note: /admin is the main application interface for all users, not just global admins.
  // We don't restrict this route by global role.

  return (
    <Suspense fallback={<AdminFallback />}>
      <AdminOnboardingHandler />
      <AdminContainer />
    </Suspense>
  );
}

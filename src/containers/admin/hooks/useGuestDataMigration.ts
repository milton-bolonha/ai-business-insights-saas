import { useEffect, useRef, useState } from "react";
import { useAuthStore } from "@/lib/stores/authStore";
import { useWorkspaceStore } from "@/lib/stores/workspaceStore";
import { useToast } from "@/lib/state/toast-context";
import { loadWorkspacesWithDashboards } from "@/lib/storage/dashboards-store";

/**
 * Hook to automatically migrate guest data to MongoDB when user becomes a member
 * 
 * This hook:
 * 1. Checks if user is a member
 * 2. Checks if there's localStorage data to migrate
 * 3. Calls the migration API
 * 4. Clears localStorage after successful migration
 */
export function useGuestDataMigration() {
  const { user, isMember } = useAuthStore();
  const { refreshWorkspaces, clearWorkspace } = useWorkspaceStore();
  const { push } = useToast();
  const [isMigrating, setIsMigrating] = useState(false);
  const hasMigratedRef = useRef(false);

  useEffect(() => {
    // Only run migration once per session
    if (hasMigratedRef.current) return;
    
    // Only migrate if user is a member
    if (!isMember || !user) return;

    // Only migrate if we're in the browser (localStorage available)
    if (typeof window === "undefined") return;

    // Check if there's data in localStorage to migrate
    const workspaces = loadWorkspacesWithDashboards();
    if (workspaces.length === 0) {
      console.log("[Migration] ℹ️ No workspaces in localStorage to migrate");
      return;
    }

    // Check if migration was already done (check localStorage flag)
    const migrationFlag = localStorage.getItem("guest_data_migrated");
    if (migrationFlag === "true") {
      console.log("[Migration] ℹ️ Migration already completed (flag found)");
      hasMigratedRef.current = true;
      return;
    }

    // Perform migration
    const performMigration = async () => {
      if (isMigrating) return;
      
      setIsMigrating(true);
      hasMigratedRef.current = true;

      try {
        console.log("[Migration] 🚀 Starting automatic migration of guest data");
        console.log(`[Migration] 📦 Workspaces to migrate: ${workspaces.length}`);

        // Call migration API
        const response = await fetch("/api/migrate-guest-data", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            workspaceData: { workspaces },
          }),
        });

        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.message || "Migration failed");
        }

        const result = await response.json();
        const { stats } = result;

        console.log("[Migration] ✅ Migration completed:", stats);

        // Set migration flag
        localStorage.setItem("guest_data_migrated", "true");

        // Limpar storage local após migração para evitar dados duplicados
        try {
          localStorage.removeItem("insights_workspaces");
          localStorage.removeItem("insights_active_dashboard");
        } catch {
          // Ignorar
        }
        clearWorkspace();

        // Refresh workspaces from MongoDB
        await refreshWorkspaces();

        // Refresh usage info to ensure limits estão atualizados
        try {
          const usageResponse = await fetch("/api/usage");
          if (usageResponse.ok) {
            const usageData = await usageResponse.json();
            console.log("[Migration] ✅ Usage refreshed after upgrade", usageData);
          }
        } catch (usageError) {
          console.warn("[Migration] ⚠️ Failed to refresh usage after migration", usageError);
        }

        // Show success message
        push({
          title: "Data Migration Complete",
          description: `Migrated ${stats.workspacesMigrated} workspaces, ${stats.dashboardsMigrated} dashboards, ${stats.tilesMigrated} tiles, ${stats.contactsMigrated} contacts, and ${stats.notesMigrated} notes to your account.`,
          variant: "success",
        });
      } catch (error) {
        console.error("[Migration] ❌ Migration failed:", error);
        hasMigratedRef.current = false; // Allow retry

        push({
          title: "Migration Failed",
          description: error instanceof Error ? error.message : "Failed to migrate your data. Please try again later.",
          variant: "destructive",
        });
      } finally {
        setIsMigrating(false);
      }
    };

    // Small delay to ensure auth is fully loaded
    const timeoutId = setTimeout(() => {
      performMigration();
    }, 1000);

    return () => clearTimeout(timeoutId);
  }, [isMember, user, isMigrating, refreshWorkspaces, push]);

  return { isMigrating };
}


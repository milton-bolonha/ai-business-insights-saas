"use client";

import { useCallback, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";

import { useToast } from "@/lib/state/toast-context";
import { AdminShellAde } from "@/components/admin/ade/AdminShellAde";
import { AdminHeaderAde } from "@/components/admin/ade/AdminHeaderAde";
// import { AdminSidebar } from "../../components/admin/ade/AdminSidebar";
import { TileGridAde } from "@/containers/admin/ade/TileGridAde";
import { NotesPanelAde } from "@/containers/admin/ade/NotesPanelAde";
import { ContactsPanelAde } from "@/containers/admin/ade/ContactsPanelAde";
import { FilesPlaceholderAde } from "@/containers/admin/ade/FilesPlaceholderAde";
import { EmptyStateAde } from "@/components/ui/EmptyStateAde";
import { AddPromptModal } from "@/components/admin/ade/AddPromptModal";
import { AddContactModal } from "@/components/admin/ade/AddContactModal";
import { CreateBlankDashboardModal } from "@/components/admin/ade/CreateBlankDashboardModal";
import { AddWorkspaceModal } from "@/components/admin/ade/AddWorkspaceModal";
import { UpgradeModal } from "@/components/ui/UpgradeModal";
import { PaymentEmailModal } from "@/components/ui/PaymentEmailModal";
import { TileDetailModal } from "@/components/ui/prompt-tiles/TileDetailModal";
import { ContactDetailModal } from "@/components/admin/ade/ContactDetailModal";
import { WorkspaceDetailModal } from "@/components/admin/ade/WorkspaceDetailModal";
import { BookReaderModal } from "@/components/admin/ade/BookReaderModal";

// Zustand stores
import {
  useUIStore,
  useAuthStore,
  useWorkspaceStore,
  useCurrentWorkspace,
  useCurrentDashboard,
  useWorkspaceActions,
  useContent,
  useIsHydrated,
} from "@/lib/stores";

// Custom hooks
import {
  useModalState,
  useAppearanceManagement,
  usePaymentFlow,
  useGuestDataMigration,
} from "@/containers/admin/hooks";

export function AdminContainer() {
  // SSR-safe hydration
  const hydrated = useIsHydrated();
  const router = useRouter();
  const { push } = useToast();

  // Zustand stores
  const appearance = useUIStore((state) => state.appearance);
  const modals = useUIStore((state) => state.modals);
  const auth = useAuthStore();
  const currentWorkspace = useCurrentWorkspace();
  const currentDashboard = useCurrentDashboard();
  const workspaceActions = useWorkspaceActions();
  const content = useContent();

  // UI Store actions (declaradas abaixo com todas as outras)

  // Custom hooks
  const payment = usePaymentFlow();
  const { handleCustomizeBackground, handleSetBackground } =
    useAppearanceManagement(currentDashboard || undefined);

  // Sequential Writer Logic (Client-Side Orchestration)
  useEffect(() => {
    let isGenerating = false;

    const generateNextTile = async () => {
      // 1. Validate Context
      if (
        !currentWorkspace ||
        currentWorkspace.promptSettings?.templateId !== "template_love_writers" ||
        !currentDashboard
      ) {
        return;
      }

      // 2. Find next empty tile (Draft)
      // Sort by orderIndex to ensure sequence
      const tiles = [...currentDashboard.tiles].sort((a, b) => a.orderIndex - b.orderIndex);
      const nextTile = tiles.find(t => t.content === null || t.content === "");

      if (!nextTile) return; // All done

      if (isGenerating) return; // Already busy
      isGenerating = true;

      try {
        console.log(`[SequentialWriter] Starting generation for tile: ${nextTile.title}`);

        // 3. Prepare Prompt with Context (Previous Arc)
        const previousTile = tiles.find(t => t.orderIndex === nextTile.orderIndex - 1);
        const previousContent = previousTile?.content || "This is the beginning of the story.";

        // Inject context locally
        const contextualizedPrompt = nextTile.prompt.replace(
          "{previous_arc}",
          previousContent
        );

        // 4. Update UI to "Generating..." state
        // We can use a temporary content placeholder or a status field if we added one.
        // For now, let's use a optimistic update or just rely on the API call time.
        // Better: Update the tile with a loading indicator or specific text? 
        // Let's rely on the fact that content is null. UI should show "Writing..." for null content if previous is done.

        // 5. Call API
        const response = await fetch("/api/generate/tile", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            prompt: contextualizedPrompt,
            title: nextTile.title,
            model: "gpt-4o-mini", // Or from settings
            maxTokens: 1000, // Adjust as needed
          }),
        });

        const data = await response.json();

        if (data.success && data.content) {
          // 6. Save Content
          await content.updateTile(nextTile.id, {
            content: data.content,
            // Remove 'pending' status if we added it
          });

          console.log(`[SequentialWriter] Completed tile: ${nextTile.title}`);

          // Trigger next iteration automatically via dependency change? 
          // Updating the store triggers re-render, which triggers useEffect again.
        } else {
          console.error("[SequentialWriter] API Error:", data.error);
        }

      } catch (e) {
        console.error("[SequentialWriter] Loop Error:", e);
      } finally {
        isGenerating = false;
      }
    };

    // Run the loop
    const timer = setTimeout(generateNextTile, 1000); // Small delay to allow UI to settle
    return () => clearTimeout(timer);

  }, [currentWorkspace, currentDashboard, content]); // Dependencies trigger re-run on updates

  // Auto-migrate guest data when user becomes a member
  useGuestDataMigration();

  // UI actions from stores
  const { setBaseColor } = useUIStore();
  const {
    openAddPrompt,
    closeAddPrompt,
    openAddContact,
    closeAddContact,
    openCreateBlankDashboard,
    closeCreateBlankDashboard,
    openAddWorkspace,
    closeAddWorkspace,
    openBulkUpload,
    closeBulkUpload,
    openWorkspaceDetail,
    closeWorkspaceDetail,
    setSelectedTile,
    setSelectedContact,
    openPreview,
    closePreview,
  } = useUIStore();

  // Shared ref for dashboard updates (prevents race conditions)
  const isUpdatingDashboardRef = useRef(false);

  // Dashboard data isolation - no automatic sync needed
  // Each dashboard manages its own data independently

  // Apply dashboard background when current dashboard changes
  useEffect(() => {
    console.log("[DEBUG] AdminContainer background effect triggered:", {
      currentDashboardId: currentDashboard?.id,
      bgColor: currentDashboard?.bgColor,
      hasBgColor: !!currentDashboard?.bgColor,
      currentDashboard: !!currentDashboard,
    });

    if (currentDashboard?.bgColor && typeof window !== "undefined") {
      console.log(
        "[DEBUG] AdminContainer setting background to:",
        currentDashboard.bgColor
      );
      // Ensure UI store is synced with the dashboard's color
      // This updates both the store (for sidebar/theme) and the document.body
      setBaseColor(currentDashboard.bgColor);
    } else {
      console.log(
        "[DEBUG] AdminContainer not setting background - missing bgColor or not in browser"
      );
    }
  }, [currentDashboard, setBaseColor]); // Added setBaseColor to dependencies

  // Force sync on page load/refresh to ensure latest data from localStorage
  useEffect(() => {
    console.log("[AdminContainer] 🚀 Page loaded/refreshed - forcing sync");
    workspaceActions.refreshWorkspaces();

    // Direct read from localStorage to ensure visual consistency immediately
    if (typeof window !== "undefined") {
      try {
        const raw = localStorage.getItem("insights_active_dashboard");
        if (raw) {
          const { workspaceId, dashboardId } = JSON.parse(raw);
          const workspacesRaw = localStorage.getItem("insights_workspaces");
          if (workspacesRaw) {
            const workspaces = JSON.parse(workspacesRaw);
            const workspace = workspaces.find((w: any) => w.id === workspaceId);
            const dashboard = workspace?.dashboards.find(
              (d: any) => d.id === dashboardId
            );

            if (dashboard?.bgColor) {
              console.log(
                "[AdminContainer] 🎨 Applying saved bgColor from localStorage:",
                dashboard.bgColor
              );
              // Update UI store to ensure all components (sidebar, etc.) get the correct tokens
              setBaseColor(dashboard.bgColor);
            }
          }
        }
      } catch (e) {
        console.error(
          "[AdminContainer] Failed to read/apply saved appearance:",
          e
        );
      }
    }
  }, []);

  // Get data from stores
  const workspaces = useWorkspaceStore((state) => state.workspaces);

  // Debug current state
  console.log("[DEBUG] AdminContainer state:", {
    hydrated,
    auth: { isGuest: auth.isGuest, user: auth.user },
    currentWorkspace: currentWorkspace?.id,
    currentDashboard: currentDashboard?.id,
    currentDashboardName: currentDashboard?.name,
    currentDashboardBgColor: currentDashboard?.bgColor,
    workspacesCount: workspaces.length,
    hasContent: !!content,
    contentTiles: content?.tiles?.length || 0,
    contentContacts: content?.contacts?.length || 0,
    contentNotes: content?.notes?.length || 0,
  });

  // Convert workspaces to sidebar format
  const workspacesForSidebar = workspaces.map((ws) => ({
    sessionId: ws.id,
    name: ws.name,
    generatedAt: ws.createdAt,
    tilesCount: ws.dashboards.reduce(
      (sum, d) => sum + (d.tiles?.length || 0),
      0
    ),
    notesCount: ws.dashboards.reduce(
      (sum, d) => sum + (d.notes?.length || 0),
      0
    ),
    contactsCount: ws.dashboards.reduce(
      (sum, d) => sum + (d.contacts?.length || 0),
      0
    ),
    dashboardsCount: ws.dashboards.length,
    isActive: ws.id === currentWorkspace?.id,
  }));

  // Convert dashboards for header
  const dashboardsForHeader =
    currentWorkspace?.dashboards.map((d) => ({
      id: d.id,
      name: d.name,
      isActive: d.id === currentDashboard?.id,
    })) || [];

  // Event handlers
  const handleContactsChanged = useCallback(async () => {
    // Refresh contacts by calling workspace API to get fresh data
    console.log("[AdminContainer] 🔄 Refreshing contacts after change");
    console.log("[AdminContainer] Current dashboard state:", {
      hasCurrentWorkspace: !!currentWorkspace,
      hasCurrentDashboard: !!currentDashboard,
      workspaceId: currentWorkspace?.id,
      dashboardId: currentDashboard?.id,
    });

    try {
      // Load fresh dashboard data directly from localStorage
      const { loadWorkspacesWithDashboards } = await import(
        "@/lib/storage/dashboards-store"
      );
      const workspaces = loadWorkspacesWithDashboards();
      const workspaceEntity = workspaces.find(
        (w) => w.id === currentWorkspace?.id
      );

      if (workspaceEntity && currentWorkspace && currentDashboard) {
        const freshDashboard = workspaceEntity.dashboards.find(
          (d) => d.id === currentDashboard.id
        );

        if (freshDashboard) {
          console.log("[AdminContainer] Fresh dashboard data:", {
            contactsCount: freshDashboard.contacts?.length || 0,
          });

          // Update React state immediately
          workspaceActions.updateDashboard(
            currentWorkspace.id,
            freshDashboard.id,
            freshDashboard
          );

          console.log("[AdminContainer] ✅ Contacts refreshed immediately");
        }
      }
    } catch (error) {
      console.error("[AdminContainer] ❌ Failed to refresh contacts:", error);
    }
  }, [currentWorkspace, currentDashboard, workspaceActions.updateDashboard]);

  const handleNotesChanged = useCallback(async () => {
    // Refresh notes by calling workspace API to get fresh data
    console.log("[AdminContainer] 🔄 Refreshing notes after change");
    console.log("[AdminContainer] Current dashboard state:", {
      hasCurrentWorkspace: !!currentWorkspace,
      hasCurrentDashboard: !!currentDashboard,
      workspaceId: currentWorkspace?.id,
      dashboardId: currentDashboard?.id,
    });

    try {
      // Load fresh dashboard data directly from localStorage
      const { loadWorkspacesWithDashboards } = await import(
        "@/lib/storage/dashboards-store"
      );
      const workspaces = loadWorkspacesWithDashboards();
      const workspaceEntity = workspaces.find(
        (w) => w.id === currentWorkspace?.id
      );

      if (workspaceEntity && currentWorkspace && currentDashboard) {
        const freshDashboard = workspaceEntity.dashboards.find(
          (d) => d.id === currentDashboard.id
        );

        if (freshDashboard) {
          console.log("[AdminContainer] Fresh dashboard data:", {
            notesCount: freshDashboard.notes?.length || 0,
          });

          // Update React state immediately
          workspaceActions.updateDashboard(
            currentWorkspace.id,
            freshDashboard.id,
            freshDashboard
          );

          console.log("[AdminContainer] ✅ Notes refreshed immediately");
        }
      }
    } catch (error) {
      console.error("[AdminContainer] ❌ Failed to refresh notes:", error);
    }
  }, [currentWorkspace, currentDashboard, workspaceActions.updateDashboard]);

  // Handle adding custom prompts
  const handleAddPrompt = useCallback(
    async (promptData: {
      title: string;
      description: string;
      useMaxPrompt: boolean;
      requestSize: "small" | "medium" | "large";
    }) => {
      console.log("[DEBUG] AdminContainer.handleAddPrompt called:", promptData);
      if (!currentWorkspace || !currentDashboard) {
        push({
          title: "No dashboard loaded",
          description: "Please select a dashboard before adding prompts.",
          variant: "destructive",
        });
        return;
      }

      try {
        console.log(
          "[DEBUG] AdminContainer.handleAddPrompt calling content.createSinglePrompt"
        );
        const tile = await content.createSinglePrompt(currentDashboard.id, {
          title: promptData.title,
          prompt: promptData.description,
          useMaxPrompt: promptData.useMaxPrompt,
          requestSize: promptData.requestSize,
        });
        console.log(
          "[DEBUG] AdminContainer.handleAddPrompt tile created:",
          tile
        );

        push({
          title: "Prompt added successfully",
          description: `Generated insight: ${tile.title}`,
          variant: "success",
        });
      } catch (error) {
        console.error("[DEBUG] AdminContainer.handleAddPrompt error:", error);
        push({
          title: "Failed to add prompt",
          description:
            error instanceof Error ? error.message : "Please try again.",
          variant: "destructive",
        });
      }
    },
    [currentWorkspace, currentDashboard, content, push]
  );

  // Determine what to show
  const hasWorkspace = !!currentWorkspace;
  const hasDashboard = !!currentDashboard;
  const hasTiles = content.tiles.length > 0;

  const companyHeading =
    currentWorkspace?.salesRepCompany || currentWorkspace?.name || "Book Project";

  // Get data from current dashboard
  const allTiles = currentDashboard?.tiles || [];
  const allContacts = currentDashboard?.contacts || [];
  const allNotes = currentDashboard?.notes || [];



  // Filter tiles for sequential writer (Love Writers)
  // Hide empty tiles to prevent clutter until they are generated
  const displayedTiles =
    currentWorkspace?.promptSettings?.templateId === "template_love_writers"
      ? allTiles.filter(t => t.content && t.content.trim().length > 0)
      : allTiles;

  return (
    <AdminShellAde
      appearance={appearance}
      // Top Header Props
      onOpenWorkspaceDetail={() => openWorkspaceDetail(currentWorkspace?.id || "")}
      onSetSpecificColor={handleSetBackground}
    >
      {!hasWorkspace ? (
        <EmptyStateAde
          title="No workspace found"
          description="Generate a new workspace from the home page."
          action={{
            label: "Go to Home",
            onClick: () => router.push("/"),
          }}
        />
      ) : !hasDashboard ? (
        <EmptyStateAde
          title="No dashboard selected"
          description="Select or create a dashboard to get started."
          action={{
            label: "Create Dashboard",
            onClick: () =>
              workspaceActions.createDashboard(currentWorkspace?.id || "", {
                name: "Default Dashboard",
              }),
          }}
        />
      ) : (
        <>
          {/* Dashboard Header (Secondary) */}
          {/* AdminHeaderAde moved to Top Header */}

          {/* Main Content Area */}
          <div className="flex-1 flex flex-col min-h-0 relative z-0">

            <main className="flex-1 overflow-y-auto px-6 pb-6 pt-2 scrollbar-thin scrollbar-thumb-gray-200 dark:scrollbar-thumb-gray-800">
              {/* Main content area */}
              <div className="flex-1 overflow-auto">
                <TileGridAde
                  tiles={displayedTiles}
                  onDeleteTile={async (tileId) => {
                    console.log(
                      "[DEBUG] AdminContainer deleteTile called:",
                      tileId
                    );
                    try {
                      await content.deleteTile(tileId);
                      // Refresh tiles from workspace store
                      workspaceActions.refreshWorkspaces();
                      push({
                        title: "Tile deleted",
                        description: "The tile has been removed.",
                        variant: "default",
                      });
                    } catch (error) {
                      console.error(
                        "[DEBUG] AdminContainer deleteTile error:",
                        error
                      );
                      push({
                        title: "Error",
                        description: "Failed to delete tile. Please try again.",
                        variant: "destructive",
                      });
                    }
                  }}
                  onReorderTiles={async (order) => {
                    console.log("[DEBUG] AdminContainer reorderTiles called:", {
                      orderLength: order.length,
                      currentDashboardId: currentDashboard?.id,
                    });
                    if (!currentDashboard?.id) {
                      console.error(
                        "[DEBUG] AdminContainer reorderTiles - No current dashboard"
                      );
                      return;
                    }
                    try {
                      await content.reorderTiles(currentDashboard.id, order);
                      // Refresh tiles from workspace store
                      workspaceActions.refreshWorkspaces();
                      console.log("[DEBUG] AdminContainer reorderTiles success");
                    } catch (error) {
                      console.error(
                        "[DEBUG] AdminContainer reorderTiles error:",
                        error
                      );
                      push({
                        title: "Error",
                        description: "Failed to reorder tiles. Please try again.",
                        variant: "destructive",
                      });
                    }
                  }}
                  onOpenTile={(tile) => {
                    console.log(
                      "[DEBUG] AdminContainer onOpenTile called:",
                      tile.id
                    );
                    setSelectedTile(tile);
                  }}
                  isReordering={false}
                  appearance={appearance}
                  onAddPrompt={openAddPrompt}
                  onBulkUploadPrompts={openBulkUpload}
                  animateEntrance={true}
                  workspaceName={currentWorkspace?.name}

                  // Dashboard Props for Header
                  dashboards={dashboardsForHeader}
                  onSelectDashboard={workspaceActions.setActiveDashboard}
                  onCreateBlankDashboard={openCreateBlankDashboard}
                />
              </div>

              {/* Side panels - Always show to allow adding items */}
              <div className="space-y-8">
                <ContactsPanelAde
                  contacts={allContacts}
                  onAddContact={openAddContact}
                  onOpenContact={setSelectedContact}
                  appearance={appearance}
                />

                <NotesPanelAde
                  notes={content.notes}
                  onAddNote={async (noteData) => {
                    console.log(
                      "[DEBUG] AdminContainer.onAddNote called:",
                      noteData
                    );
                    if (currentDashboard) {
                      await content.createNote(currentDashboard.id, noteData);
                      // Refresh notes from workspace store
                      handleNotesChanged();
                      push({
                        title: "Note created",
                        description: "The note has been added successfully.",
                        variant: "default",
                      });
                    }
                  }}
                  onUpdateNote={async (noteId, updates) => {
                    console.log(
                      "[DEBUG] AdminContainer.onUpdateNote called:",
                      noteId,
                      updates
                    );
                    await content.updateNote(noteId, updates);
                    // Refresh notes from workspace store
                    handleNotesChanged();
                  }}
                  onDeleteNote={async (noteId) => {
                    console.log(
                      "[DEBUG] AdminContainer.onDeleteNote called:",
                      noteId
                    );
                    await content.deleteNote(noteId);
                    // Refresh notes from workspace store
                    handleNotesChanged();
                  }}
                  appearance={appearance}
                />

                {/* Files placeholder */}
                <FilesPlaceholderAde appearance={appearance} />
              </div>
            </main>
          </div>
        </>
      )}

      {/* Modals */}
      {modals.isAddWorkspaceOpen && (
        <AddWorkspaceModal
          open={modals.isAddWorkspaceOpen}
          onClose={closeAddWorkspace}
          onSubmit={async (payload) => {
            console.log(
              "[DEBUG] AdminContainer.createWorkspace onSubmit called:",
              payload
            );
            if (auth.canPerformAction("createWorkspace")) {
              console.log(
                "[DEBUG] AdminContainer.createWorkspace allowance OK"
              );

              try {
                // Generate insights using the same API as home page
                const generateInBackground = async () => {
                  const targetUrl = "/api/generate";
                  const requestPayload = {
                    salesRepCompany: payload.company,
                    salesRepWebsite: payload.companyWebsite,
                    solution: payload.solution,
                    targetCompany: payload.researchTarget,
                    targetWebsite: payload.researchWebsite,
                    templateId: payload.templateId,
                    model: payload.model,
                    promptAgent: payload.promptAgent,
                    responseLength: payload.responseLength,
                    promptVariables: payload.promptVariables || [],
                    bulkPrompts: payload.bulkPrompts || [],
                  };

                  console.log(
                    "[DEBUG] AdminContainer.createWorkspace generating:",
                    requestPayload
                  );

                  const response = await fetch(targetUrl, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(requestPayload),
                  });

                  const data = await response.json().catch(() => null);

                  if (!response.ok) {
                    throw new Error(
                      data?.error || "Failed to generate insights"
                    );
                  }

                  if (data?.workspace) {
                    console.log(
                      "[DEBUG] AdminContainer.createWorkspace initializing workspace"
                    );
                    await workspaceActions.initializeWorkspaceFromHome(
                      data.workspace
                    );
                  }

                  push({
                    title: "Workspace created successfully!",
                    description: `Generated insights for ${payload.researchTarget}`,
                    variant: "success",
                  });

                  console.log(
                    "[DEBUG] AdminContainer.createWorkspace completed"
                  );
                };

                await generateInBackground();
                closeAddWorkspace();
              } catch (error) {
                console.error(
                  "[DEBUG] AdminContainer.createWorkspace error:",
                  error
                );
                push({
                  title: "Failed to create workspace",
                  description:
                    error instanceof Error ? error.message : "Please try again",
                  variant: "destructive",
                });
              }

              auth.consumeUsage("createWorkspace");
            } else {
              console.log(
                "[DEBUG] AdminContainer.createWorkspace allowance DENIED"
              );
              push({
                title: "Workspace limit reached",
                description: "Upgrade your plan to create more workspaces",
                variant: "destructive",
              });
            }
          }}
        />
      )}

      {modals.isAddPromptOpen && (
        <AddPromptModal
          open={modals.isAddPromptOpen}
          onClose={closeAddPrompt}
          onAddPrompt={handleAddPrompt}
        />
      )}

      {modals.isAddContactOpen && (
        <AddContactModal
          open={modals.isAddContactOpen}
          onClose={closeAddContact}
          onSubmit={async (payload) => {
            console.log(
              "[DEBUG] AdminContainer.createContact onSubmit called:",
              payload
            );
            if (payment.ensureAllowance("createContact")) {
              console.log("[DEBUG] AdminContainer.createContact allowance OK");
              if (currentDashboard) {
                console.log(
                  "[DEBUG] AdminContainer.createContact calling content.createContact"
                );
                // Map payload to match API expectations
                const contactData = {
                  name: payload.name,
                  jobTitle: payload.jobTitle, // Correct field name for API
                  linkedinUrl: payload.linkedinUrl,
                };
                await content.createContact(currentDashboard.id, contactData);
                console.log("[DEBUG] AdminContainer.createContact completed");
                // Refresh contacts from workspace store
                handleContactsChanged();
                push({
                  title: "Contact created",
                  description: "The contact has been added successfully.",
                  variant: "default",
                });
              }
              payment.commitUsage("createContact");
            } else {
              console.log(
                "[DEBUG] AdminContainer.createContact allowance DENIED"
              );
            }
          }}
        />
      )}

      {modals.isCreateBlankDashboardOpen && (
        <CreateBlankDashboardModal
          open={modals.isCreateBlankDashboardOpen}
          onClose={closeCreateBlankDashboard}
          onSubmit={async (payload) => {
            if (currentWorkspace) {
              await workspaceActions.createDashboard(currentWorkspace.id, {
                name: payload.dashboardName,
              });
              closeCreateBlankDashboard();
              push({
                title: "Dashboard created",
                variant: "success",
              });
            }
          }}
        />
      )}

      {/* Tile Detail Modal */}
      {/* Tile Detail Modal */}
      {(() => {
        console.log(
          "[DEBUG] AdminContainer rendering modal check:",
          !!modals.selectedTile
        );
        return null;
      })()}
      {modals.selectedTile && (
        <TileDetailModal
          tile={modals.selectedTile}
          onClose={() => setSelectedTile(null)}
          onSubmit={async (payload) => {
            if (auth.canPerformAction("tileChat")) {
              const serializedAttachments = payload.attachments?.map(
                (file) => ({
                  name: file.name,
                  size: file.size,
                  type: file.type,
                  lastModified: file.lastModified,
                })
              );
              await content.chatWithTile(modals.selectedTile!.id, {
                message: payload.message,
                attachments: serializedAttachments,
              });
              auth.consumeUsage("tileChat");
            }
          }}
          isSubmitting={content.chattingTileId === modals.selectedTile?.id}
          isGuest={auth.isGuest}
          allowAttachments={true}
        />
      )}

      {/* Contact Detail Modal */}
      {modals.selectedContact && (
        <ContactDetailModal
          contact={modals.selectedContact}
          onClose={() => setSelectedContact(null)}
          onSubmitChat={async (message) => {
            if (auth.canPerformAction("contactChat")) {
              await content.chatWithContact(
                modals.selectedContact!.id,
                message
              );
              auth.consumeUsage("contactChat");
            }
          }}
          isChatting={content.chattingContactId === modals.selectedContact?.id}
        />
      )}

      {/* Workspace Detail Modal */}
      {modals.isWorkspaceDetailOpen && (
        <WorkspaceDetailModal
          open={modals.isWorkspaceDetailOpen}
          onClose={closeWorkspaceDetail}
          workspaceId={modals.viewingWorkspaceId}
        />
      )}

      {/* Upgrade Modal */}
      <UpgradeModal
        open={payment.isUpgradeModalOpen}
        onClose={() => payment.setUpgradeModalOpen(false)}
        onCheckout={payment.startCheckout}
        onMarkMember={payment.confirmMembership}
        usage={payment.usage}
        limits={payment.limits}
        stripeCheckoutUrl={payment.stripeCheckoutUrl}
      />

      {/* Book Reader Preview */}
      <BookReaderModal
        open={modals.isPreviewOpen}
        onClose={closePreview}
        tiles={allTiles}
        title={currentWorkspace?.name || "Book Preview"}
      />

    </AdminShellAde >
  );
}

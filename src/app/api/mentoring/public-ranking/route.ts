import { NextResponse } from "next/server";
import { db } from "@/lib/db/mongodb";

export async function GET(req: Request) {
  try {
    // Fetch all profiles from mentoring_profiles
    const profiles = await db.find("mentoring_profiles", {});

    // Fetch workspaces, memberships, and sessions to compute stats
    const sanitized = await Promise.all(profiles.map(async (p: any) => {
      let menteesCount = 0;
      let completedProjectsCount = 0;
      let completedSessionsCount = 0;

      if (p.role === "mentor") {
        // Find workspaces owned by mentor
        const workspaces = await db.find("workspaces", { userId: p.userId });
        const workspaceIds = workspaces.map((w: any) => w.sessionId || w._id?.toString());
        
        if (workspaceIds.length > 0) {
          // Find members in those workspaces
          const memberships = await db.find("workspacememberships", {
            workspaceId: { $in: workspaceIds }
          });
          
          const memberUserIds = memberships
            .map((m: any) => m.userId)
            .filter((id: any) => id && id !== p.userId);
            
          if (memberUserIds.length > 0) {
            // Count members who are mentees
            const menteeProfiles = await db.find("mentoring_profiles", {
              userId: { $in: memberUserIds },
              role: "mentee"
            });
            menteesCount = menteeProfiles.length;
          }
        }
      } else {
        // Mentee: projects completed = length of projects array
        completedProjectsCount = p.projects ? p.projects.length : 0;

        // Mentee: completed sessions count in workspaces where they are member
        const memberships = await db.find("workspacememberships", { userId: p.userId });
        const workspaceIds = memberships.map((m: any) => m.workspaceId);
        
        if (workspaceIds.length > 0) {
          const sessions = await db.find("mentoring_sessions", {
            workspaceId: { $in: workspaceIds },
            status: { $ne: "cancelled" }
          });
          
          // A session is completed if status === "completed" or startAt is in the past
          const now = Date.now();
          const completedSessions = sessions.filter((s: any) => {
            if (s.status === "completed") return true;
            const start = s.startAt ? new Date(s.startAt).getTime() : 0;
            return start > 0 && start < now;
          });
          completedSessionsCount = completedSessions.length;
        }
      }

      return {
        userId: p.userId,
        username: p.username || "",
        role: p.role || "mentor",
        name: p.name || "Sem Nome",
        photoUrl: p.photoUrl || "",
        tagline: p.tagline || "",
        xp: p.xp !== undefined ? p.xp : 250,
        projects: p.projects || [],
        // Evaluated Dominant Class for visual flavor in tables
        careerGoal: p.careerGoal || "",
        personalGoal: p.personalGoal || "",
        skillsCount: p.skills ? p.skills.length : 0,
        // Computed stats
        menteesCount,
        completedProjectsCount,
        completedSessionsCount
      };
    }));

    // Sort by XP descending
    sanitized.sort((a, b) => b.xp - a.xp);

    return NextResponse.json({ rankings: sanitized });
  } catch (error) {
    console.error("[API/Mentoring/PublicRanking] GET error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

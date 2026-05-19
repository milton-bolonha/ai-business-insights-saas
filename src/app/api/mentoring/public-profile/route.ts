import { NextResponse } from "next/server";
import { db } from "@/lib/db/mongodb";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const target = searchParams.get("id") || searchParams.get("userId");

    if (!target) {
      return NextResponse.json({ error: "Identifier parameter (id or userId) is required" }, { status: 400 });
    }

    // Load profile from database checking by userId OR username slug!
    const profile = await db.findOne("mentoring_profiles", { 
      $or: [
        { userId: target },
        { username: target }
      ] 
    });
    
    if (!profile) {
      return NextResponse.json({ error: "Profile not found" }, { status: 404 });
    }

    let menteesCount = 0;
    if (profile.role === "mentor") {
      const workspaces = await db.find("workspaces", { userId: profile.userId });
      const workspaceIds = workspaces.map((w: any) => w.sessionId || w._id?.toString());
      if (workspaceIds.length > 0) {
        const memberships = await db.find("workspacememberships", {
          workspaceId: { $in: workspaceIds }
        });
        const memberUserIds = memberships
          .map((m: any) => m.userId)
          .filter((id: any) => id && id !== profile.userId);
        if (memberUserIds.length > 0) {
          const menteeProfiles = await db.find("mentoring_profiles", {
            userId: { $in: memberUserIds },
            role: "mentee"
          });
          menteesCount = menteeProfiles.length;
        }
      }
    }

    // STRICT SANITIZATION: Only expose completely public-facing fields.
    // Absolutely no email, phone, whatsapp, diary logs, cognitive stress index, or private family notes.
    const sanitizedProfile = {
      userId: profile.userId,
      menteesCount,
      username: profile.username || "",
      role: profile.role || "mentor",
      name: profile.name || "",
      photoUrl: profile.photoUrl || "",
      tagline: profile.tagline || "",
      miniBio: profile.miniBio || "",
      skills: profile.skills || [],
      experience: profile.experience || "",
      linkedinUrl: profile.linkedinUrl || "",
      githubUrl: profile.githubUrl || "",
      instagramUrl: profile.instagramUrl || "",
      websiteUrl: profile.websiteUrl || "",
      
      // Gamification parameters (safe for public leaderboards)
      xp: profile.xp !== undefined ? profile.xp : 0,
      genderTerm: profile.genderTerm || "mentorado",
      equippedGear: profile.equippedGear || {
        jacket: "Jaqueta Corta-Vento Minimalist",
        sneakers: "Sneakers Knit Tech",
        backpack: "Mochila Rolltop Slim",
        headset: "Headset Noise-Canceling Matte",
        smartwatch: "Smartwatch AMOLED Stealth",
        glasses: "Óculos Anti-Blue Light Hex",
        aura: "Sem Aura (Padrão)"
      },
      
      // Sanitized career / personal descriptors
      personalGoal: profile.personalGoal || "",
      careerGoal: profile.careerGoal || "",
      attributes: profile.attributes || ["", "", ""],
      achievements: profile.achievements || ["", "", ""],
      greatestAttribute: profile.greatestAttribute || "",
      hobbies: profile.hobbies || "",
      motivationalQuote: profile.motivationalQuote || "",
      mentorshipExpectations: profile.mentorshipExpectations || "",
      shortTermGoals: profile.shortTermGoals || "",
      mediumTermGoals: profile.mediumTermGoals || "",
      professionalDream: profile.professionalDream || ""
    };

    return NextResponse.json({ profile: sanitizedProfile });
  } catch (error) {
    console.error("[API/Mentoring/PublicProfile] GET error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

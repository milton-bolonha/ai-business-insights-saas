import { NextResponse } from "next/server";
import { db } from "@/lib/db/mongodb";
import { getAuth } from "@/lib/auth/get-auth";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const targetUserId = searchParams.get("userId");

    const { userId } = await getAuth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userIdToFetch = targetUserId || userId;

    // Load profile from database
    const profile = await db.findOne("mentoring_profiles", { userId: userIdToFetch });
    let menteesCount = 0;
    if (profile && profile.role === "mentor") {
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
    return NextResponse.json({ 
      profile: profile ? { ...profile, menteesCount } : null 
    });
  } catch (error) {
    console.error("[API/Mentoring/Profile] GET error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { 
      role, 
      name, 
      photoUrl, 
      tagline, 
      miniBio, 
      skills, 
      experience, 
      linkedinUrl, 
      username,
      socialLinks, 
      motivationalQuote,
      genderTerm,
      // Contacts and Socials
      phone,
      email,
      whatsapp,
      githubUrl,
      instagramUrl,
      websiteUrl,
      // Mentee-specific
      personalGoal,
      careerGoal,
      futureVision,
      attributes,
      achievements,
      familyGroup,
      greatestAttribute,
      hobbies,
      mentorshipExpectations,
      shortTermGoals,
      mediumTermGoals,
      professionalDream,
      // Gamification additions
      xp,
      equippedGear,
      diaryLogs,
      cognitiveState
    } = body;

    const { userId } = await getAuth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!role || !name) {
      return NextResponse.json({ error: "Role and Name are required" }, { status: 400 });
    }

    let finalUsername = (username || "").trim().toLowerCase();
    
    // Auto-generate slug from name if username is missing
    if (!finalUsername) {
      finalUsername = name.toLowerCase()
        .replace(/[^a-z0-9]/g, "-")
        .replace(/-+/g, "-")
        .replace(/^-|-$/g, "");
    }

    // Verify uniqueness of username slug
    if (finalUsername) {
      const duplicate = await db.findOne("mentoring_profiles", { 
        username: finalUsername, 
        userId: { $ne: userId } 
      });
      if (duplicate) {
        // Append small random number to keep it unique
        finalUsername = `${finalUsername}-${Math.floor(1000 + Math.random() * 9000)}`;
      }
    }

    const profileData = {
      userId,
      role, // "mentor" | "mentee"
      name,
      photoUrl: photoUrl || "",
      tagline: tagline || "",
      miniBio: miniBio || "",
      skills: skills || [],
      experience: experience || "",
      linkedinUrl: linkedinUrl || "",
      username: finalUsername,
      socialLinks: socialLinks || { instagram: "", website: "", twitter: "" },
      motivationalQuote: motivationalQuote || "",
      genderTerm: genderTerm || "mentorado",
      // Socials and Contacts
      phone: phone || "",
      email: email || "",
      whatsapp: whatsapp || "",
      githubUrl: githubUrl || "",
      instagramUrl: instagramUrl || "",
      websiteUrl: websiteUrl || "",
      // Mentee-specific fields
      personalGoal: personalGoal || "",
      careerGoal: careerGoal || "",
      futureVision: futureVision || "",
      attributes: attributes || ["", "", ""],
      achievements: achievements || ["", "", ""],
      familyGroup: familyGroup || "",
      greatestAttribute: greatestAttribute || "",
      hobbies: hobbies || "",
      mentorshipExpectations: mentorshipExpectations || "",
      shortTermGoals: shortTermGoals || "",
      mediumTermGoals: mediumTermGoals || "",
      professionalDream: professionalDream || "",
      // Gamification attributes saved to DB
      xp: xp !== undefined ? Number(xp) : 0,
      equippedGear: equippedGear || {
        jacket: "Jaqueta Corta-Vento Minimalist",
        sneakers: "Sneakers Knit Tech",
        backpack: "Mochila Rolltop Slim",
        headset: "Headset Noise-Canceling Matte",
        smartwatch: "Smartwatch AMOLED Stealth",
        glasses: "Óculos Anti-Blue Light Hex",
        aura: "Sem Aura (Padrão)"
      },
      diaryLogs: diaryLogs || [],
      cognitiveState: cognitiveState || "Estável",
      updatedAt: new Date()
    };

    const existingProfile = await db.findOne("mentoring_profiles", { userId });

    if (existingProfile) {
      await db.updateOne("mentoring_profiles", { userId }, { $set: profileData });
      return NextResponse.json({ success: true, updated: true });
    } else {
      const newProfile = {
        ...profileData,
        createdAt: new Date()
      };
      await db.insertOne("mentoring_profiles", newProfile);
      return NextResponse.json({ success: true, created: true });
    }
  } catch (error) {
    console.error("[API/Mentoring/Profile] POST error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

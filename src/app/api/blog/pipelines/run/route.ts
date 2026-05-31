import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db/mongodb";
import OpenAI from "openai";

export const maxDuration = 60; // 1 minute timeout

function cleanGeneratedText(text: string): string {
  if (!text) return "";
  let cleaned = text.trim();
  if (cleaned.startsWith("```")) {
    cleaned = cleaned.replace(/^```[a-zA-Z]*\n?/, "");
    cleaned = cleaned.replace(/\n?```$/, "");
  }
  cleaned = cleaned.trim();
  if (
    (cleaned.startsWith('"') && cleaned.endsWith('"')) ||
    (cleaned.startsWith("'") && cleaned.endsWith("'")) ||
    (cleaned.startsWith("`") && cleaned.endsWith("`"))
  ) {
    cleaned = cleaned.substring(1, cleaned.length - 1).trim();
  }
  return cleaned;
}

export async function GET(req: NextRequest) {
  try {
    // Basic verification token (optional, but highly recommended for protection)
    const authHeader = req.headers.get("authorization");
    const cronSecret = process.env.CRON_SECRET;
    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: "Unauthorized Cron Trigger" }, { status: 401 });
    }

    const apiKey = process.env.OPENAI_API_KEY;
    const openai = apiKey ? new OpenAI({ apiKey }) : null;

    if (!openai) {
      return NextResponse.json({ error: "OpenAI is not configured. Cron aborted." }, { status: 500 });
    }

    // 1. Fetch active pipelines
    const pipelines = await db.find("blog_pipelines", { status: "active" });
    if (pipelines.length === 0) {
      return NextResponse.json({ message: "No active pipelines to execute." });
    }

    const now = new Date();
    const currentDayOfWeek = now.getDay(); // 0 = Sunday, 1 = Monday, etc.
    const currentHour = now.getHours();

    let executions = 0;
    const results = [];

    for (const pipe of pipelines) {
      // Check if it's due to run based on frequency
      let isDue = false;

      if (pipe.frequency === "daily") {
        isDue = true;
      } else if (pipe.frequency === "weekly") {
        // Match day of the week (e.g. Wednesday is 3)
        const scheduledDays = pipe.scheduledDays || [];
        if (scheduledDays.includes(currentDayOfWeek)) {
          isDue = true;
        }
      } else if (pipe.frequency === "once") {
        isDue = !pipe.lastRunAt;
      }

      // Check if already executed in the last 20 hours to prevent duplicate triggers
      if (pipe.lastRunAt) {
        const hoursSinceLastRun = (now.getTime() - new Date(pipe.lastRunAt).getTime()) / (1000 * 60 * 60);
        if (hoursSinceLastRun < 20) {
          isDue = false;
        }
      }

      if (isDue) {
        console.log(`[Cron_Runner] Executing AI Pipeline: ${pipe.name} for workspace: ${pipe.workspaceId}`);
        
        try {
          const topic = pipe.sourceValue || "Mindfulness & Tech Productivity";
          
          // Generate Title
          const titleCompletion = await openai.chat.completions.create({
            model: "gpt-4o-mini",
            messages: [
              { role: "system", content: "You are a professional SEO copywriter. Generate a catchy, highly optimized blog post title based on the topic. Return only the title text, with no quotes." },
              { role: "user", content: `Topic: ${topic}` }
            ]
          });
          const generatedTitle = cleanGeneratedText(titleCompletion.choices[0].message.content || topic);

          // Generate Content
          const contentCompletion = await openai.chat.completions.create({
            model: "gpt-4o-mini",
            messages: [
              { role: "system", content: "You are a world-class enterprise AI blog author. Write a comprehensive, long-form, highly structured markdown blog post based on the title. Use clear H2/H3 subheadings, bullet points, and bulleted lists. Return only the markdown body, no other text." },
              { role: "user", content: `Write a post titled: "${generatedTitle}". Prompt Context: ${topic}` }
            ]
          });
          const generatedContent = cleanGeneratedText(contentCompletion.choices[0].message.content || "");

          // Generate Excerpt
          const excerptCompletion = await openai.chat.completions.create({
            model: "gpt-4o-mini",
            messages: [
              { role: "system", content: "You are a professional blog editor. Write a compelling, SEO-friendly 2-sentence excerpt summarizing the article title and content. Return only the summary text, with no quotes." },
              { role: "user", content: `Title: ${generatedTitle}\n\nContent preview: ${generatedContent.substring(0, 1000)}` }
            ]
          });
          const generatedExcerpt = cleanGeneratedText(excerptCompletion.choices[0].message.content || "");

          // Fallback context-aware stock photo keyword building
          const searchTerms = encodeURIComponent(generatedTitle.toLowerCase().replace(/[^a-z0-9]+/g, "-").substring(0, 40));
          const generatedImage = `https://images.unsplash.com/photo-1498050108023-c5249f4df085?auto=format&fit=crop&w=800&q=80&sig=${searchTerms}`;

          const slug = generatedTitle.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)+/g, "");

          if (pipe.target === "post") {
            const newPost = {
              workspaceId: pipe.workspaceId,
              title: generatedTitle,
              slug,
              content: generatedContent,
              excerpt: generatedExcerpt,
              status: "published",
              isFeatured: false,
              categories: ["IA", "Automatizador"],
              tags: ["ai", "automated-posting", "seo"],
              featuredImage: generatedImage,
              seo: { ogImage: generatedImage },
              createdAt: new Date(),
              updatedAt: new Date(),
              publishedAt: new Date()
            };
            await db.insertOne("blog_posts", newPost);
          } else {
            const newPage = {
              workspaceId: pipe.workspaceId,
              title: generatedTitle,
              slug,
              content: generatedContent,
              description: generatedExcerpt,
              status: "published",
              createdAt: new Date(),
              updatedAt: new Date(),
              publishedAt: new Date()
            };
            await db.insertOne("blog_pages", newPage);
          }

          // Mark last run
          await db.updateOne("blog_pipelines", { _id: pipe._id }, {
            $set: {
              lastRunAt: now,
              updatedAt: now
            }
          });

          executions++;
          results.push({ pipeline: pipe.name, status: "success", title: generatedTitle });
        } catch (pipeErr: any) {
          console.error(`Error executing pipeline ${pipe.name}:`, pipeErr);
          results.push({ pipeline: pipe.name, status: "failed", error: pipeErr.message });
        }
      }
    }

    return NextResponse.json({
      message: `Cron completed successfully. Executed ${executions} pipelines.`,
      results
    });
  } catch (error: any) {
    console.error("[CRON_PIPELINES_RUN]", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

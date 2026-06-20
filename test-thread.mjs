import OpenAI from "openai";

async function test() {
  const openai = new OpenAI();
  try {
    const thread = await openai.beta.threads.create({
      messages: [{ role: "user", content: "hello" }]
    });
    console.log("thread =", JSON.stringify(thread, null, 2));
  } catch (e) {
    console.error("error:", e.message);
  }
}
test();

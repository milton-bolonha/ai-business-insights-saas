import OpenAI from "openai";
const openai = new OpenAI();
console.log("createAndRun type:", typeof openai.beta.threads.createAndRun);

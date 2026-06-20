import OpenAI from "openai";

// Inicializa o cliente OpenAI global
export const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

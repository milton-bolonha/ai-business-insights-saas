import OpenAI from "openai";

console.log("Vector Stores paths:");
const o = new OpenAI({ apiKey: "test" });
console.log("o.vectorStores =", !!o.vectorStores);
console.log("o.beta.vectorStores =", !!(o.beta && o.beta.vectorStores));
console.log("o.beta.assistants =", !!(o.beta && o.beta.assistants));
console.log("o.beta.threads =", !!(o.beta && o.beta.threads));

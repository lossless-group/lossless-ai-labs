// Minimal DALL·E 3 API test using OpenAI Node.js SDK v4.94.0
// Place this file in ai-labs/open-ai/ and run with: pnpm exec node ai-labs/open-ai/test-dalle3.cjs

require('dotenv').config();
const { OpenAI } = require('openai');

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

async function testDalle3() {
  try {
    const response = await openai.images.generate({
      model: "dall-e-3",
      prompt: "A cat",
      n: 1,
      size: "1024x1024",
      response_format: "url"
    });
    console.log("SUCCESS:", response);
  } catch (error) {
    console.error("ERROR:", error);
    if (error.response) {
      console.error("RESPONSE DATA:", error.response.data);
    }
  }
}

testDalle3();

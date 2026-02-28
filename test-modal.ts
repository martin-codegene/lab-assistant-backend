import * as dotenv from "dotenv";
dotenv.config();

const apiKey = process.env.AMAZON_NOVA_API_KEY;
if (!apiKey) {
  console.error("AWS_BEARER_TOKEN_BEDROCK is not set in .env");
  process.exit(1);
}

const response = await fetch("https://api.nova.amazon.com/v1/chat/completions", {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    "Authorization": `Bearer ${apiKey}`,
  },
  body: JSON.stringify({
    model: "nova-pro-v1",
    messages: [{ role: "user", content: "Say hello" }],
    max_tokens: 100,
  }),
});

const data = await response.json();

if (!response.ok) {
  console.error("API Error:", response.status, data);
  process.exit(1);
}

console.log("Success:", data.choices?.[0]?.message?.content);
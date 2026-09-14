require("dotenv").config();
const express = require("express");
const cors = require("cors");
const OpenAI = require("openai");

const app = express();
const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

app.use(cors());
app.use(express.json());

const N8N_BOOKING_WEBHOOK_URL =
  "https://nayae-automation.app.n8n.cloud/webhook/5617c410-9482-48c7-8cd3-e2971c56a3e0";

app.post("/api/notify-booking", async (req, res) => {
  try {
    await fetch(N8N_BOOKING_WEBHOOK_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(req.body),
    });
    res.json({ ok: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to notify booking webhook." });
  }
});

app.post("/api/style-advice", async (req, res) => {
  try {
    const { prompt } = req.body;

    const response = await client.chat.completions.create({
      model: "gpt-4.1-mini",
      messages: [
        {
          role: "system",
          content:
            "You are a nail stylist. Reply in 2–3 short sentences with one specific color suggestion and one simple nail art idea. Do not use markdown, lists, or asterisks.Reply with exactly two plain sentences. Do not use Markdown, bullet points, lists, or special characters.",
        },
        {
          role: "user",
          content: prompt,
        },
      ],
    });

    res.json({ advice: response.choices[0].message.content });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Something went wrong." });
  }
});

app.listen(3000, () => console.log("Server running on port 3000"));

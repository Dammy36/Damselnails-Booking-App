require("dotenv").config();
const express = require("express");
const cors = require("cors");

const app = express();

app.use(cors());
app.use(express.json());

const N8N_BOOKING_WEBHOOK_URL =
  "https://nayae-automation.app.n8n.cloud/webhook/5617c410-9482-48c7-8cd3-e2971c56a3e0";
const N8N_CHAT_WEBHOOK_URL =
  "https://nayae-automation.app.n8n.cloud/webhook/d46e3775-c144-4ae5-9622-489ed754ee89";

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

    const question = `As a nail stylist, in 2-3 short plain sentences (no markdown, no bullet points), suggest one specific nail color and one simple nail art idea for: "${prompt}"`;

    const n8nRes = await fetch(N8N_CHAT_WEBHOOK_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ question }),
    });
    if (!n8nRes.ok) throw new Error(`n8n responded ${n8nRes.status}`);

    const data = await n8nRes.json();
    res.json({ advice: data.reply });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Something went wrong." });
  }
});

app.post("/api/chat", async (req, res) => {
  try {
    const { messages } = req.body;
    if (!Array.isArray(messages) || !messages.length) {
      return res.status(400).json({ error: "messages must be a non-empty array." });
    }

    const question = messages[messages.length - 1].content;

    const n8nRes = await fetch(N8N_CHAT_WEBHOOK_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ question }),
    });
    if (!n8nRes.ok) throw new Error(`n8n responded ${n8nRes.status}`);

    const data = await n8nRes.json();
    res.json({ reply: data.reply });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Something went wrong." });
  }
});

app.listen(3000, () => console.log("Server running on port 3000"));

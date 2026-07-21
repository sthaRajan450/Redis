import express from "express";
import { Redis } from "ioredis";

const app = express();
app.use(express.json());

const redis = new Redis(process.env.REDIS_URL || "redis://localhost:6379");
const QUEUE_NAME = "queue:emails";

app.post("/emails", async (req, res) => {
  const { to, subject, body } = req.body;

  if (!to) {
    return res.status(400).json({ error: "Recipient 'to' field is required" });
  }

  const job = {
    id: `email_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    to,
    subject: subject || "No Subject",
    body: body || "No Content",
    createdAt: new Date().toISOString(),
  };

  await redis.lpush(QUEUE_NAME, JSON.stringify(job));
  res.json({ queued: true, job });
});

app.get("/emails/process-one", async (req, res) => {
  const rawJob = await redis.rpop(QUEUE_NAME);

  if (!rawJob) {
    return res.status(200).json({ message: "Queue is empty", job: null });
  }

  const job = JSON.parse(rawJob);

  res.json({
    message: "Email processed",
    job,
  });
});

app.listen(3000, () => {
  console.log("Server running on port 3000");
});

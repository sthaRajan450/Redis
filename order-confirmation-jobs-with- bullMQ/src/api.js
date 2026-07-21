import express from "express";
import { Redis } from "ioredis";
import { emailQueue } from "./queue";

const app = express();
app.use(express.json());

app.post("/welcome-email", async (req, res) => {
  const job = emailQueue.add(
    "send-welcome-email",
    {
      to: req.body.to,
      name: req.body.name || "Leaner",
    },
    {
      attempts: 3,
      backoff: {
        type: "exponential",
        delay: 1000,
      },
    },
  );

  res.json({
    message: "Email job added to queue",
    jobId: job.id,
  });
});

const redis = new Redis(process.env.REDIS_URL || "redis://localhost:6379");

app.listen(3000, () => {
  console.log("Server running on port 3000");
});

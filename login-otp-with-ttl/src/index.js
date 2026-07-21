import express from "express";
import { Redis } from "ioredis";
import crypto from "crypto";

const app = express();
app.use(express.json());

const redis = new Redis(process.env.REDIS_URL || "redis://localhost:6379");

function otpkey(phone) {
  return `otp:${phone}`;
}


function generateOTP() {
  return crypto.randomInt(100000, 1000000).toString();
}

app.post("/otp", async (req, res) => {
  const { phone } = req.body;
  
  if (!phone) {
    return res.status(400).json({ message: "Phone number is required" });
  }

  const otp = generateOTP();
  
  
  await redis.set(otpkey(phone), otp, "EX", 30  );

  // Note: In production, send 'otp' via SMS/Provider, don't return it in JSON
  res.json({ message: "OTP sent successfully", otp });
});

app.post("/otp/verify", async (req, res) => {
  const { phone, otp } = req.body;

  if (!phone || !otp) {
    return res.status(400).json({ message: "Phone and OTP are required" });
  }

  const savedOtp = await redis.get(otpkey(phone));

  if (!savedOtp) {
    return res.status(400).json({ message: "OTP expired or not found" });
  }

  
  if (otp !== savedOtp) {
    return res.status(400).json({ message: "Invalid OTP" });
  }

  await redis.del(otpkey(phone));

  res.json({ message: "OTP verified successfully" });
});


app.get("/otp/:phone/ttl", async (req, res) => {
  const { phone } = req.params;
  
  const ttl = await redis.ttl(otpkey(phone));

  if (ttl < 0) {
    return res.status(404).json({ message: "OTP not found or expired", ttl });
  }

  res.json({ ttl });
});

app.listen(3000, () => {
  console.log("Server is running on port 3000");
});
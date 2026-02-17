import cors from "cors";
import { CLIENT_URL, ALLOWED_ORIGINS } from "./env.js";

const envOrigins = ALLOWED_ORIGINS
  ? ALLOWED_ORIGINS.split(",").map((s) => s.trim()).filter(Boolean)
  : [];

export const allowedOrigins = Array.from(new Set([...envOrigins, CLIENT_URL].filter(Boolean)));

export const corsConfig = cors({
  origin(origin, callback) {
    if (!origin) return callback(null, true);
    if (allowedOrigins.includes(origin)) return callback(null, true);
    return callback(new Error("CORS policy: origin not allowed"));
  },
  credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE"]
});

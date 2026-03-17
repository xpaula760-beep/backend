import cors from "cors";
import { CLIENT_URL, ALLOWED_ORIGINS, NODE_ENV } from "./env.js";

const envOrigins = ALLOWED_ORIGINS
  ? ALLOWED_ORIGINS.split(",").map((s) => s.trim()).filter(Boolean)
  : [];

export const allowedOrigins = Array.from(new Set([...envOrigins, CLIENT_URL].filter(Boolean)));

const isLocalDevOrigin = (origin) => {
  try {
    const { hostname, protocol } = new URL(origin);
    return ["localhost", "127.0.0.1"].includes(hostname) && ["http:", "https:"].includes(protocol);
  } catch {
    return false;
  }
};

export const corsConfig = cors({
  origin(origin, callback) {
    if (!origin) return callback(null, true);
    if (allowedOrigins.includes(origin)) return callback(null, true);
    if (NODE_ENV !== "production" && isLocalDevOrigin(origin)) return callback(null, true);
    return callback(new Error("CORS policy: origin not allowed"));
  },
  credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"]
});

import cors from "cors";
import { CLIENT_URL } from "./env.js";

const allowedOrigins = [CLIENT_URL, "https://deftship.vercel.app"].filter(Boolean);

export const corsConfig = cors({
  origin(origin, callback) {
    if (!origin) return callback(null, true);
    if (allowedOrigins.includes(origin)) return callback(null, true);
    return callback(new Error("CORS policy: origin not allowed"));
  },
  credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE"]
});

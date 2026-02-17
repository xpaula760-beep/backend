 import cors from "cors";
import { CLIENT_URL } from "./env.js";

export const corsConfig = cors({
  origin: CLIENT_URL,
  credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE"]
});

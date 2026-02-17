 import dotenv from "dotenv";

dotenv.config();

export const {
  PORT,
  NODE_ENV,
  MONGO_URI,
  JWT_SECRET,
  JWT_EXPIRES_IN,
  CLOUDINARY_NAME,
  CLOUDINARY_API_KEY,
  CLOUDINARY_API_SECRET,
  CLIENT_URL
} = process.env;
 
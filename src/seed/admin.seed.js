import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import { fileURLToPath } from "url";
import Admin from "../models/Admin.model.js";
import { MONGO_URI } from "../config/env.js";

export const seedAdmin = async (opts = {}) => {
  const email = opts.email || process.env.ADMIN_EMAIL || "admin@consignment.com";
  const password = opts.password || process.env.ADMIN_PASSWORD || "admin123";

  try {
    await mongoose.connect(MONGO_URI);

    const existingAdmin = await Admin.findOne({ email });
    if (existingAdmin) {
      console.log("⚠️ Admin already exists", email);
      return existingAdmin;
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    const admin = await Admin.create({ email, passwordHash });
    console.log("✅ Admin created successfully", email);
    return admin;
  } catch (error) {
    console.error("❌ Seeding failed:", error);
    throw error;
  }
};

// If run directly (node src/seed/admin.seed.js), execute the seeding.
const __filename = fileURLToPath(import.meta.url);
if (process.argv[1] === __filename) {
  seedAdmin()
    .then(() => process.exit(0))
    .catch(() => process.exit(1));
}

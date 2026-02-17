 import mongoose from "mongoose";

const AdminSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true
    },
    passwordHash: {
      type: String,
      required: true
    },
    role: {
      type: String,
      default: "admin"
    }
  },
  { timestamps: true }
);

export default mongoose.model("Admin", AdminSchema);

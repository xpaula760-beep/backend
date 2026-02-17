 import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import Admin from "../models/Admin.model.js";
import { JWT_SECRET, JWT_EXPIRES_IN } from "../config/env.js";

export const loginAdmin = async (req, res) => {
  const { email, password } = req.body;

  const admin = await Admin.findOne({ email });
  if (!admin) {
    return res.status(401).json({ message: "Invalid credentials" });
  }

  const isMatch = await bcrypt.compare(password, admin.passwordHash);
  if (!isMatch) {
    return res.status(401).json({ message: "Invalid credentials" });
  }

  const token = jwt.sign(
    { id: admin._id, role: admin.role },
    JWT_SECRET,
    { expiresIn: JWT_EXPIRES_IN }
  );

  res.cookie("adminToken", token, {
    httpOnly: true,
    sameSite: "strict",
    secure: false // set true in production (HTTPS)
  });

  res.json({ message: "Login successful" });
};

export const logoutAdmin = (req, res) => {
  res.clearCookie("adminToken");
  res.json({ message: "Logged out" });
};

export const getMe = async (req, res) => {
  res.json({ admin: req.admin });
};

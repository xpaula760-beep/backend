 import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import Admin from "../models/Admin.model.js";
import { JWT_SECRET, JWT_EXPIRES_IN, NODE_ENV } from "../config/env.js";

export const loginAdmin = async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ message: "Email and password are required" });
  }

  const normalizedEmail = typeof email === 'string' ? email.toLowerCase() : email;

  const admin = await Admin.findOne({ email: normalizedEmail });
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

  const cookieOptions = {
    httpOnly: true,
    sameSite: NODE_ENV === 'production' ? 'none' : 'lax',
    secure: NODE_ENV === 'production'
  };

  res.cookie("adminToken", token, cookieOptions);

  res.json({ message: "Login successful" });
};

export const logoutAdmin = (req, res) => {
  res.clearCookie("adminToken");
  res.json({ message: "Logged out" });
};

export const getMe = async (req, res) => {
  res.json({ admin: req.admin });
};

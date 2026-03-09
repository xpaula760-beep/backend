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

  // Derive a cookie maxAge from JWT_EXPIRES_IN when possible (e.g. "7d", "12h", "30m")
  const parseExpiresToMs = (s) => {
    if (!s) return undefined;
    try {
      const str = String(s).trim();
      const m = str.match(/^(\d+)(d|h|m|s)$/i);
      if (!m) return undefined;
      const n = Number(m[1]);
      const unit = m[2].toLowerCase();
      if (unit === 'd') return n * 24 * 60 * 60 * 1000;
      if (unit === 'h') return n * 60 * 60 * 1000;
      if (unit === 'm') return n * 60 * 1000;
      if (unit === 's') return n * 1000;
    } catch (e) {
      return undefined;
    }
    return undefined;
  };

  const maxAge = parseExpiresToMs(JWT_EXPIRES_IN);
  if (typeof maxAge === 'number') cookieOptions.maxAge = maxAge;
  cookieOptions.path = '/';

  res.cookie("adminToken", token, cookieOptions);

  res.json({ message: "Login successful" });
};

export const logoutAdmin = (req, res) => {
  // Clear cookie with the same attributes so the browser removes it correctly
  const clearOptions = {
    httpOnly: true,
    sameSite: NODE_ENV === 'production' ? 'none' : 'lax',
    secure: NODE_ENV === 'production',
    path: '/'
  };
  res.clearCookie("adminToken", clearOptions);
  res.json({ message: "Logged out" });
};

export const getMe = async (req, res) => {
  res.json({ admin: req.admin });
};

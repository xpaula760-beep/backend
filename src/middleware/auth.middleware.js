import jwt from "jsonwebtoken";
import { JWT_SECRET, NODE_ENV } from "../config/env.js";

export const requireAdmin = (req, res, next) => {
  const token = req.cookies && req.cookies.adminToken;

  if (!token) {
    const log = {
      time: new Date().toISOString(),
      level: 'warn',
      event: 'missing_admin_token',
      url: req.originalUrl,
      method: req.method,
      ip: req.ip,
      origin: req.headers.origin,
      cookieKeys: req.cookies ? Object.keys(req.cookies) : []
    };
    // In non-production, also include cookie values to aid debugging
    if (NODE_ENV !== 'production' && req.cookies) log.cookies = req.cookies;
    console.warn(JSON.stringify(log, null, 2));

    return res.status(401).json({ message: "Unauthorized" });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.admin = decoded;
    next();
  } catch (err) {
    const log = {
      time: new Date().toISOString(),
      level: 'error',
      event: 'invalid_admin_token',
      url: req.originalUrl,
      method: req.method,
      ip: req.ip,
      origin: req.headers.origin,
      error: err && err.message ? err.message : String(err)
    };
    if (NODE_ENV !== 'production' && req.cookies) log.cookies = req.cookies;
    console.error(JSON.stringify(log, null, 2));

    res.status(401).json({ message: "Invalid token" });
  }
};

import jwt from "jsonwebtoken";
import { JWT_SECRET, NODE_ENV } from "../config/env.js";

export const requireAdmin = (req, res, next) => {
  const cookieToken = req.cookies && req.cookies.adminToken;
  const authHeader = req.headers.authorization || req.headers.Authorization;
  const headerToken = typeof authHeader === "string" && authHeader.startsWith("Bearer ")
    ? authHeader.slice(7).trim()
    : undefined;
  const token = cookieToken || headerToken;

  if (!token) {
    const log = {
      time: new Date().toISOString(),
      level: 'warn',
      event: 'missing_admin_token',
      url: req.originalUrl,
      method: req.method,
      ip: req.ip,
      origin: req.headers.origin,
      cookieKeys: req.cookies ? Object.keys(req.cookies) : [],
      hasAuthorizationHeader: Boolean(authHeader)
    };
    // In non-production, also include cookie values to aid debugging
    if (NODE_ENV !== 'production' && req.cookies) log.cookies = req.cookies;
    console.warn(JSON.stringify(log, null, 2));

    return res.status(401).json({ message: "Unauthorized" });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.admin = decoded;
    req.authSource = cookieToken ? 'cookie' : 'authorization-header';
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
      authSource: cookieToken ? 'cookie' : 'authorization-header',
      error: err && err.message ? err.message : String(err)
    };
    if (NODE_ENV !== 'production' && req.cookies) log.cookies = req.cookies;
    console.error(JSON.stringify(log, null, 2));

    res.status(401).json({ message: "Invalid token" });
  }
};

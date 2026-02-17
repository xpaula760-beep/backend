import { Router } from "express";
import { loginAdmin, logoutAdmin, getMe } from "../controllers/auth.controller.js";
import { validate } from "../middleware/validate.middleware.js";
import { loginSchema } from "../validators/auth.schema.js";
import { requireAdmin } from "../middleware/auth.middleware.js";

const router = Router();

router.post("/login", validate(loginSchema), loginAdmin);
router.post("/logout", logoutAdmin);
router.get("/me", requireAdmin, getMe);

export default router;

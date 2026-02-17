import { Router } from "express";
import { updatePassword } from "../controllers/admin.controller.js";
import { requireAdmin } from "../middleware/auth.middleware.js";

const router = Router();

router.put("/password", requireAdmin, updatePassword);

export default router;

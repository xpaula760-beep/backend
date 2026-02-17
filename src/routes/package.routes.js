import { Router } from "express";
import {
  createPackage,
  getPackages,
  getPackageByTrackingNumber,
  getPackageById,
  updateStatus,
  updateLocation,
  clearLocation,
  deletePackage,
  updatePackage
} from "../controllers/package.controller.js";

import { requireAdmin } from "../middleware/auth.middleware.js";
import { upload } from "../middleware/upload.middleware.js";
import { validate } from "../middleware/validate.middleware.js";
import {
  createPackageSchema,
  updateStatusSchema,
  updateLocationSchema,
  updatePackageSchema
} from "../validators/package.schema.js";

const router = Router();

router.get('/', getPackages);

// public tracking endpoint by tracking number
router.get('/track/:trackingNumber', getPackageByTrackingNumber);

router.post(
  "/",
  requireAdmin,
  upload.any(),
  validate(createPackageSchema),
  createPackage
);

router.put(
  "/:id",
  requireAdmin,
  upload.any(),
  validate(updatePackageSchema),
  updatePackage
);

router.get("/:id", getPackageById);

router.put(
  "/:id/status",
  requireAdmin,
  validate(updateStatusSchema),
  updateStatus
);

router.put(
  "/:id/location",
  requireAdmin,
  validate(updateLocationSchema),
  updateLocation
);

router.delete("/:id/location", requireAdmin, clearLocation);

router.delete("/:id", requireAdmin, deletePackage);

export default router;

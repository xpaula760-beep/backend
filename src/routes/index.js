import express from 'express';
import authRoutes from './auth.routes.js';
import packageRoutes from './package.routes.js';
import adminRoutes from './admin.routes.js';

const router = express.Router();

router.use('/auth', authRoutes);
router.use('/packages', packageRoutes);
router.use('/admins', adminRoutes);

export default router;

import express from 'express';
import { protect } from '../middleware/auth.js';
import {
    getTasksByStatus,
    getCompletionTrends,
    getTasksByPriority,
    getOverdueTasks
} from '../controllers/analytics.controller.js';

const router = express.Router();

// Protect all routes
router.use(protect);

router.get('/status', getTasksByStatus);
router.get('/trends', getCompletionTrends);
router.get('/priority', getTasksByPriority);
router.get('/overdue', getOverdueTasks);

export const analyticsRouter = router;

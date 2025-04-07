import express from 'express';
const router = express.Router();
import { check } from 'express-validator';
import { getSubTasks, createSubtask, deleteSubTask, updateSubTask } from '../controllers/subtask.controller.js'
import { protect } from '../middleware/auth.js';

router.use(protect);

router.route('/')
  .get(getSubTasks)
  .post([
    check('title', 'Title is required').not().isEmpty()
  ], createSubtask);

router.route('/:id')
  .delete(deleteSubTask)
  .put(updateSubTask);

export const subtaskRouter = router;
  
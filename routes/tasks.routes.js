import express from 'express'
import { check } from 'express-validator';
import { getTasks, createTasks, updateTask, getTask, deleteTask } from '../controllers/task.controller.js';
import { protect } from '../middleware/auth.js';
import upload from '../middleware/fileUpload.js';

const router = express.Router();

router.use(protect);

router.route('/')
  .get(getTasks)
  .post(
    upload.array('attachments', 5), // Allow up to 5 file uploads
    [
      check('title', 'Title is required').not().isEmpty()
    ],
    createTasks
  );

router.route('/:id')
  .get(getTask)
  .put(updateTask)
  .delete(deleteTask);

export const taskRouter = router;
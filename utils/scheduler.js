import cron from 'node-cron';
import Task from '../models/task.js';
import { sendTaskReminder } from './email.js';

const sendTaskReminders = async () => {
  const now = new Date(); // Current time: 07:16 AM WAT
  const nowUTC = new Date(now.getTime() - 1 * 60 * 60 * 1000); // Convert to UTC: 06:16 AM UTC
  const fiveMinutesFromNowUTC = new Date(nowUTC.getTime() + 5 * 60 * 1000); // 06:21 AM UTC

  try {
    // Log all tasks for debugging
    const allTasks = await Task.find({ status: { $ne: 'done' } }).populate('user');
    console.log('All tasks (not done):', allTasks.map(t => ({
      id: t._id,
      dueDate: t.dueDate,
      dueTime: t.dueTime,
      reminderSent: t.reminderSent,
      userEmail: t.user?.email
    })));

    const tasks = await Task.find({
      status: { $ne: 'done' },
      reminderSent: false,
      dueDate: {
        $gte: new Date('2025-05-28T00:00:00Z'),
        $lte: new Date('2025-05-28T23:59:59Z')
      },
      dueTime: {
        $gte: now.toTimeString().slice(0, 5), // e.g., "07:16"
        $lte: new Date(now.getTime() + 5 * 60 * 1000).toTimeString().slice(0, 5) // e.g., "07:21"
      }
    }).populate('user');

    console.log(`Found ${tasks.length} tasks due in the next 5 minutes (WAT: ${now.toISOString()} to ${new Date(now.getTime() + 5 * 60 * 1000).toISOString()})`);
    console.log('Tasks:', tasks.map(t => ({
      id: t._id,
      dueDate: t.dueDate,
      dueTime: t.dueTime,
      reminderSent: t.reminderSent,
      userEmail: t.user?.email
    })));

    for (const task of tasks) {
      if (task.user?.preferences?.emailNotifications) {
        await sendTaskReminder(task.user, task);
        await Task.updateOne({ _id: task._id }, { reminderSent: true });
      }
    }
  } catch (err) {
    console.error('Error sending task reminders:', err);
  }
};

export const initScheduler = () => {
  if (!cron.getTasks().has('taskReminder')) {
    cron.schedule('*/1 * * * *', async () => {
      console.log('Checking for tasks due soon...');
      await sendTaskReminders();
    }, { name: 'taskReminder' });
    console.log('Task scheduler initialized');
  }
};
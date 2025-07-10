import cron from 'node-cron';
import Task from '../models/task.js';
import { sendTaskReminder } from './email.js';

const sendTaskReminders = async () => {
  // Explicitly set WAT (UTC+1) time
  const now = new Date();
  // Adjust to WAT by adding 1 hour to UTC if server is in UTC
  const nowWAT = new Date(now.getTime() + 1 * 60 * 60 * 1000);
  const nowUTC = new Date(nowWAT.getTime() - 1 * 60 * 60 * 1000); // Convert WAT to UTC
  const fiveMinutesFromNowUTC = new Date(nowUTC.getTime() + 5 * 60 * 1000);

  console.log(`Current time (WAT): ${nowWAT.toISOString()} (UTC: ${nowUTC.toISOString()})`);

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

    // Fetch all non-done tasks
    const tasks = await Task.find({
      status: { $ne: 'done' },
      reminderSent: false,
    }).populate('user');

    // Filter tasks within the 5-minute window
    const tasksDueSoon = tasks.filter(task => {
      // Combine dueDate and dueTime into a UTC Date object (assuming dueTime is in WAT)
      const [hours, minutes] = task.dueTime.split(':').map(Number);
      const taskDueDateTimeUTC = new Date(task.dueDate);
      taskDueDateTimeUTC.setUTCHours(hours - 1, minutes, 0, 0); // Convert WAT dueTime to UTC

      // Log task due time for debugging
      console.log(`Task ${task._id} due at (UTC): ${taskDueDateTimeUTC.toISOString()}`);

      // Check if task is due within the next 5 minutes
      return taskDueDateTimeUTC >= nowUTC && taskDueDateTimeUTC <= fiveMinutesFromNowUTC;
    });

    console.log(`Found ${tasksDueSoon.length} tasks due in the next 5 minutes (WAT: ${nowWAT.toISOString()} to ${new Date(nowWAT.getTime() + 5 * 60 * 1000).toISOString()})`);
    console.log('Tasks:', tasksDueSoon.map(t => ({
      id: t._id,
      dueDate: t.dueDate,
      dueTime: t.dueTime,
      reminderSent: t.reminderSent,
      userEmail: t.user?.email
    })));

    for (const task of tasksDueSoon) {
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
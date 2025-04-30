import cron from 'node-cron'
import Task from '../models/task.js';
import { sendTaskReminder } from './email.js';

// Send task reminders
const sendTaskReminders = async () => {
    const now = new Date();
    const fiveMinutesFromNow = new Date(now);
    fiveMinutesFromNow.setMinutes(now.getMinutes() + 5);
    
    try {
      // Find tasks due in 5 minutes
      const tasks = await Task.find({
        dueDate: now.toDateString(),
        dueTime: {
          $gte: now.toTimeString(),
          $lt: fiveMinutesFromNow.toTimeString()
        },
        status: { $ne: 'done' }
      }).populate('user');
      
      console.log(`Sending reminders for ${tasks.length} tasks due in 5 minutes`);
      
      for (const task of tasks) {
        if (task.user?.preferences?.emailNotifications) {
          await sendTaskReminder(task.user, task);
        }
      }
    } catch (err) {
      console.error('Error sending task reminders:', err);
    }
};
  
// Initialize the scheduler
export const initScheduler = () => {
    // Check for due tasks every minute
    cron.schedule('*/1 * * * *', async () => {
      console.log('Checking for tasks due soon...');
      await sendTaskReminders();
    });
    
    console.log('Task scheduler initialized');
};


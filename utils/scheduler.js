import cron from 'node-cron';
import Task from '../models/task.js';
import { sendTaskReminder } from './email.js';

const sendTaskReminders = async () => {
  const now = new Date();
  const fiveMinutesFromNow = new Date(now.getTime() + 5 * 60 * 1000);
  
  try {
    const tasks = await Task.find({
      status: { $ne: 'done' },
      reminderSent: false, // Only select tasks where reminder hasn't been sent
      $expr: {
        $and: [
          {
            $eq: [
              { $dateTrunc: { date: '$dueDate', unit: 'day' } },
              { $dateTrunc: { date: now, unit: 'day' } }
            ]
          },
          {
            $and: [
              {
                $gte: [
                  {
                    $dateFromString: {
                      dateString: {
                        $concat: [
                          { $dateToString: { format: '%Y-%m-%d', date: '$dueDate' } },
                          'T',
                          '$dueTime',
                          ':00'
                        ]
                      }
                    }
                  },
                  now
                ]
              },
              {
                $lt: [
                  {
                    $dateFromString: {
                      dateString: {
                        $concat: [
                          { $dateToString: { format: '%Y-%m-%d', date: '$dueDate' } },
                          'T',
                          '$dueTime',
                          ':00'
                        ]
                      }
                    }
                  },
                  fiveMinutesFromNow
                ]
              }
            ]
          }
        ]
      }
    }).populate('user');

    console.log(`Found ${tasks.length} tasks due in the next 5 minutes`);

    for (const task of tasks) {
      if (task.user?.preferences?.emailNotifications) {
        await sendTaskReminder(task.user, task);
        // Update task to mark reminder as sent
        await Task.updateOne({ _id: task._id }, { reminderSent: true });
      }
    }
  } catch (err) {
    console.error('Error sending task reminders:', err);
  }
};

export const initScheduler = () => {
  cron.schedule('*/1 * * * *', async () => {
    console.log('Checking for tasks due soon...');
    await sendTaskReminders();
  });
  console.log('Task scheduler initialized');
};
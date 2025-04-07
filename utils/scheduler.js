import cron from 'node-cron'
import Task from '../models/task.js';
import { sendTaskReminder } from './email.js';

// Helper function to determine if dates are the same day
const isSameDay = (date1, date2) => {
  return date1.getFullYear() === date2.getFullYear() &&
         date1.getMonth() === date2.getMonth() &&
         date1.getDate() === date2.getDate();
};

// Calculate next due date for recurring tasks
const calculateNextDueDate = (task) => {
  const lastDueDate = new Date(task.dueDate);
  let nextDueDate = new Date(lastDueDate);
  
  switch (task.recurrencePattern.frequency) {
    case 'daily':
      nextDueDate.setDate(lastDueDate.getDate() + (1 * task.recurrencePattern.interval));
      break;
    case 'weekly':
      nextDueDate.setDate(lastDueDate.getDate() + (7 * task.recurrencePattern.interval));
      break;
    case 'monthly':
      nextDueDate.setMonth(lastDueDate.getMonth() + (1 * task.recurrencePattern.interval));
      break;
    case 'custom':
      // For custom recurrence, we need to find the next valid day of week
      if (task.recurrencePattern.daysOfWeek && task.recurrencePattern.daysOfWeek.length > 0) {
        let foundNextDay = false;
        let daysToAdd = 1;
        
        while (!foundNextDay && daysToAdd < 14) { // Limit to 2 weeks of searching
          const testDate = new Date(lastDueDate);
          testDate.setDate(testDate.getDate() + daysToAdd);
          
          if (task.recurrencePattern.daysOfWeek.includes(testDate.getDay())) {
            nextDueDate = testDate;
            foundNextDay = true;
          }
          
          daysToAdd++;
        }
      }
      break;
  }
  
  // Check if the next due date is past the end date
  if (task.recurrencePattern.endDate && nextDueDate > new Date(task.recurrencePattern.endDate)) {
    return null;
  }
  
  return nextDueDate;
};

// Process recurring tasks
const processRecurringTasks = async () => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  try {
    // Find all recurring tasks
    const recurringTasks = await Task.find({ 
      isRecurring: true,
      'recurrencePattern.endDate': { $gte: today }
    });
    
    console.log(`Processing ${recurringTasks.length} recurring tasks`);
    
    for (const task of recurringTasks) {
      const nextDueDate = calculateNextDueDate(task);
      
      if (nextDueDate && isSameDay(today, nextDueDate)) {
        // Create a new instance of the recurring task
        const newTask = new Task({
          title: task.title,
          description: task.description,
          user: task.user,
          priority: task.priority,
          status: 'todo',
          dueDate: nextDueDate,
          dueTime: task.dueTime,
          tags: task.tags,
          category: task.category,
          customFields: task.customFields
        });
        
        await newTask.save();
        console.log(`Created new recurring task: ${newTask.title}`);
      }
    }
  } catch (err) {
    console.error('Error processing recurring tasks:', err);
  }
};

// Send task reminders
const sendTaskReminders = async () => {
    const now = new Date();
    const oneHourFromNow = new Date(now);
    oneHourFromNow.setHours(now.getHours() + 1);
    
    try {
      // Find tasks due within the next hour
      const tasks = await Task.find({
        dueDate: now.toDateString(),
        dueTime: {
          $gte: now.toTimeString(),
          $lt: oneHourFromNow.toTimeString()
        },
        status: { $ne: 'done' }
      }).populate('user');
      
      console.log(`Sending reminders for ${tasks.length} tasks due in the next hour`);
      
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
    // Run daily at midnight for recurring tasks
    cron.schedule('0 0 * * *', async () => {
      console.log('Processing recurring tasks...');
      await processRecurringTasks();
    });
    
    // Check for due tasks every 30 minutes
    cron.schedule('*/30 * * * *', async () => {
      console.log('Checking for tasks due soon...');
      await sendTaskReminders();
    });
    
    console.log('Task scheduler initialized');
  };


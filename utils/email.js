import nodemailer from 'nodemailer'

// Create reusable transporter
const transporter = nodemailer.createTransport({
    host: 'smtp.gmail.com',
    port: 465,
    secure: true,
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASSWORD
    }
});

/**
 * Send task reminder email
 * @param {Object} user - User object with email and username
 * @param {Object} task - Task object with details
 */

export const sendTaskReminder = async (user, task) => {
    try {
        //Format due Time
        const dueDate = new Date(task.dueDate).toLocaleDateString();
        const dueTime = task.dueTime || 'end of day';

        // Email options
        const mailOptions = {
          from: `Task Manager <${process.env.EMAIL_USER}>`,
          to: user.email,
          subject: `Reminder: Task "${task.title}" is due soon`,
          html: `
           <h1>Task Reminder</h1>
           <p>Hello ${user.username},</p>
           <p>This is a reminder that your task "${task.title}" is due on ${dueDate} at ${dueTime}.</p>
           <p>Task details:</p>
           <ul>
            <li><strong>Priority:</strong> ${task.priority}</li>
            <li><strong>Status:</strong> ${task.status}</li>
            <li><strong>Description:</strong> ${task.description || 'No description provided'}</li>
           </ul>
           <p>Click <a href="${process.env.FRONTEND_URL}/tasks/${task._id}">here</a> to view the task.</p>
           <p>Thank you,<br>Task Management App</p>
           `
        };

        //send email
        await transporter.sendMail(mailOptions);

        console.log(`Reminder email sent to ${user.email}`);
        return true;
    } catch (error) {
        console.error('Email send error:', err);
        return false;
    }
};

export const sendEmail = async (options) => {
    try {
        const mailOptions = {
            from: `Task Manager <${process.env.EMAIL_USER}>`,
            to: options.email,
            subject: options.subject,
            html: options.html
        };

        await transporter.sendMail(mailOptions);
        console.log(`Email sent to ${options.email}`);
        return true;
    } catch (error) {
        console.error('Email send error:', error);
        return false;
    }
};
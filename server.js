import express from 'express'
import cors from 'cors'
import connectDB from './config/db.js'
import { authRouter } from './routes/auth.routes.js';
import { taskRouter } from './routes/tasks.routes.js';
import { analyticsRouter } from './routes/analytics.routes.js';
import { subtaskRouter } from './routes/subtasks.routes.js';
import { errorHandler } from './middleware/error.js';
import { initScheduler } from './utils/scheduler.js';

const PORT = process.env.PORT || 5000;

//Initialize app
const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

//Connect to database
connectDB();

app.use(cors());

// Use routes
app.use('/api/auth', authRouter);
app.use('/api/tasks', taskRouter);
app.use('/api/analytics', analyticsRouter);
app.use('/api/subtasks', subtaskRouter);

//Error middleware
app.use(errorHandler);

// Start server and initialize scheduler
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
    initScheduler();
    console.log('Task scheduler initialized');
});
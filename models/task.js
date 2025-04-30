import mongoose from "mongoose";

const TaskSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Please add a task title'],
    trim: true
  },
  description: {
    type: String,
    trim: true
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  priority: {
    type: String,
    enum: ['low', 'medium', 'high'],
    default: 'medium'
  },
  status: {
    type: String,
    enum: ['todo', 'in_progress', 'done'],
    default: 'todo'
  },
  dueDate: {
    type: Date
  },
  dueTime: {
    type: String
  },
  reminderSent: {
    type: Boolean,
    default: false
  },
  tags: [{
    type: String
  }],
  category: {
    type: String
  },
  attachments: [{
    name: { type: String },
    path: { type: String },
    type: { type: String },
    size: { type: Number }
  }],
  timeTracking: {
    totalTime: { 
      type: Number,
      default: 0 // in seconds
    },
    timeEntries: [{
      startTime: { type: Date },
      endTime: { type: Date },
      duration: { type: Number } // in seconds
    }]
  },
  customFields: {
    type: Map,
    of: mongoose.Schema.Types.Mixed
  },
  collaborators: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  isRecurring: {
    type: Boolean,
    default: false
  },
  recurrencePattern: {
    frequency: {
      type: String,
      enum: ['daily', 'weekly', 'monthly', 'custom']
    },
    interval: {
      type: Number,
      default: 1 // e.g., every 2 weeks
    },
    daysOfWeek: [{ 
      type: Number // 0-6, Sunday to Saturday
    }],
    endDate: { 
      type: Date 
    }
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Indexes for better query performance
TaskSchema.index({ user: 1, dueDate: 1 });
TaskSchema.index({ user: 1, status: 1 });
TaskSchema.index({ user: 1, category: 1 });

const Task = mongoose.model('Task', TaskSchema);

export default Task;
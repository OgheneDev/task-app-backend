import mongoose from "mongoose";

const SubtaskSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Please add a subtask title'],
    trim: true
  },
  parentTask: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Task',
    required: true
  },
  isCompleted: {
    type: Boolean,
    default: false
  },
  order: {
    type: Number,
    default: 0
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

const Subtask = mongoose.model('Subtask', SubtaskSchema);

export default Subtask;
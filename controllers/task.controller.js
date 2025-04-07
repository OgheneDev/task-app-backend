import Task from '../models/task.js'
import { validationResult } from 'express-validator'

// @desc    Get all tasks for logged in user
// @route   GET /api/tasks
// @access  Private

export const getTasks = async (req, res, next) => {
    try {
        //Pagination
        const page = parseInt(req.query.page, 10) || 1;
        const limit = parseInt(req.query.limit, 10) || 10;
        const startIndex = (page - 1) * limit;

        //Build query
        let query = { user: req.user.id };

        // Filter by status
       if (req.query.status) {
         query.status = req.query.status;
        }
      
        // Filter by priority
        if (req.query.priority) {
         query.priority = req.query.priority;
        }
      
        // Filter by category
        if (req.query.category) {
          query.category = req.query.category;
        }

        // Filter by tag
        if (req.query.tag) {
          query.tags = { $in: [req.query.tag] };
        }
      
        // Filter by due date
        if (req.query.dueDate) {
         const date = new Date(req.query.dueDate);
         const nextDay = new Date(date);
         nextDay.setDate(date.getDate() + 1);
        
         query.dueDate = {
           $gte: date,
           $lt: nextDay
         };
        }
      
        // Sort
        let sort = {};
        if (req.query.sort) {
         const parts = req.query.sort.split('_');
         sort[parts[0]] = parts[1] === 'desc' ? -1 : 1;
        } else {
          sort = { createdAt: -1 };
        }
      
        const tasks = await Task.find(query)
        .sort(sort)
        .skip(startIndex)
        .limit(limit);
      
        // Get total documents
        const total = await Task.countDocuments(query);
      
        res.status(200).json({
         success: true,
         count: tasks.length,
         total,
         totalPages: Math.ceil(total / limit),
         currentPage: page,
         data: tasks
        });
    } catch (error) {
        next(error);
    }
}

// @desc Create tasks
// @route POST /api/tasks
// @access Private

export const createTasks = async (req, res, next) => {
  try {
    // Validate request
    const errors =  validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    //Add the user to the request body
    req.body.user = req.user.id

    const task = await Task.create(req.body);

    res.status(201).json({
      success: true,
      data: task
    });
  } catch (error) {
    next(error);
  }
}

// @desc Get a specific task
// @route GET /api/tasks/:id
// @access Private

export const getTask = async (req, res, next) => {
  try {
    const task = await Task.findById(req.params.id).populate('collaborators', 'username avatar');

    if (!task) {
      return res.status(404).json({
        success: false,
        error: 'Task not found'
      });
    }

    // Make sure user owns task or is a collaborator
    if (task.user.toString() !== req.user.id && 
        !task.collaborators.some(collab => collab._id.toString() === req.user.id)) {
      return res.status(401).json({
        success: false,
        error: 'Not authorized to access this task'
      });
    }

    res.status(200).json({
      success: true,
      data: task
    });
  } catch (error) {
     next(error);
  }
}

// @desc Update Task
// @route PUT /api/tasks/:id
// @access Private

export const updateTask = async (req, res, next) => {
  try {
    let task = await Task.findById(req.params.id);

    if (!task) {
      return res.status(404).json({
        success: false,
        error: 'Task not found'
      });
    }

    // Make sure user owns task
    if (task.user.toString() !== req.user.id) {
      return res.status(401).json({
        success: false,
        error: 'Not authorized to update this task'
      });
    }

    // Update the updatedAt field
    req.body.updatedAt = Date.now();
    
    task = await Task.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true
    });

    res.status(200).json({
      success: true,
      data: task
    });

  } catch (error) {
    next(error);
  }
}

// @desc Delete Task
// @route DELETE /api/tasks/:id
// @access Private

export const deleteTask = async (req, res, next) => {
  try {
    let task = await Task.findById(req.params.id);

    if (!task) {
      return res.status(404).json({
        success: false,
        error: 'Task not found'
      });
    }

    // Make sure user owns task
    if (task.user.toString() !== req.user.id) {
      return res.status(401).json({
        success: false,
        error: 'Not authorized to delete this task'
      });
    }

    await Task.deleteOne({ _id: req.params.id });

    res.status(200).json({
      success: true,
      data: {}
    });
  } catch (error) {
     next(error);
  }
}



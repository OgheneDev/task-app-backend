import Task from "../models/task.js";
import Subtask from "../models/subtask.js";
import { validationResult } from "express-validator";

// @desc Get subtask for logged in user
// route /api/subtasks
// @access Private

export const getSubTasks = async (req, res, next) => {
    try {
        //Pagination
        const page = parseInt(req.query.page, 10) || 1;
        const limit = parseInt(req.query.limit, 10) || 10;
        const startIndex = (page - 1) * limit;

        //Build Query
        let query = { };

        // If parentTask ID is provided, filter by it
        if (req.query.parentTask) {
            query.parentTask = req.query.parentTask;
        }

        // Filter by completion status
        if (req.query.isCompleted !== undefined) {
            query.isCompleted = req.query.isCompleted === 'true';
        }

        // Sort options
        let sort = {};
        if (req.query.sort) {
            const parts = req.query.sort.split('_');
            sort[parts[0]] = parts[1] === 'desc' ? -1 : 1;
        } else {
            // Default sort by order and creation date
            sort = { order: 1, createdAt: -1 };
        }

        // Execute query with pagination
        const subtasks = await Subtask.find(query)
            .populate('parentTask', 'title') // Populate parent task details
            .sort(sort)
            .skip(startIndex)
            .limit(limit);

        // Get total count for pagination
        const total = await Subtask.countDocuments(query);

        res.status(200).json({
            success: true,
            count: subtasks.length,
            total,
            totalPages: Math.ceil(total / limit),
            currentPage: page,
            data: subtasks
        });

    } catch (error) {
        next(error);
    }
};

// @desc Create a subtask
// route POST /api/subtasks
// access Private

export const createSubtask = async (req, res, next) => {
    try {
       // Validate request
        const errors =  validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        //Check if parent task exists
        const parentTask = await Task.findById(req.body.parentTask);
        if (!parentTask) {
            return res.status(404).json({
                success: false,
                error: 'Parent task not found'
            });
        }

        //Make sure user owns the parent task
        if (parentTask.user.toString() !== req.user.id) {
            return res.status(401).json({
                success: false,
                error: 'Not authorized to add subtasks to this task'
            })
        }

        // Get the highest order number of existing subtasks
        const highestOrder = await Subtask.findOne({ parentTask: req.body.parentTask })
            .sort({ order: -1 })
            .select('order');

        // Create the subtask
        const subtask = await Subtask.create({
            ...req.body,
            order: highestOrder ? highestOrder.order + 1 : 0
        });

        res.status(201).json({
            success: true,
            data: subtask
        });
    } catch (error) {
        next(error);
    }
}

// @desc Delete a Subtask
// route /api/subtasks/:id
// access Private

export const deleteSubTask = async (req, res, next) => {
    try {
        let subtask = await Subtask.findById(req.params.id)
            .populate('parentTask');

        if (!subtask) {
            return res.status(404).json({
                success: false,
                error: 'Subtask not found'
            });
        }

        // Check ownership through parent task
        if (subtask.parentTask.user.toString() !== req.user.id) {
            return res.status(401).json({
                success: false,
                error: 'Not authorized to delete this subtask'
            });
        }

        await Subtask.deleteOne({ _id: req.params.id });

        res.status(200).json({
            success: true,
            data: {}
        });
    } catch (error) {
        next(error);
    }
};

// @desc Update a subtask
// @route /api/subtasks/:id
// access Private

export const updateSubTask = async (req, res, next) => {
    try {
        let subtask = await Subtask.findById(req.params.id)
            .populate('parentTask');

        if (!subtask) {
            return res.status(404).json({
                success: false,
                error: 'Subtask not found'
            });
        }

        // Check ownership through parent task
        if (subtask.parentTask.user.toString() !== req.user.id) {
            return res.status(401).json({
                success: false,
                error: 'Not authorized to update this subtask'
            });
        }

        // Create update object with existing body and new updatedAt
        const updateData = {
            ...req.body,
            updatedAt: Date.now()
        };

        subtask = await Subtask.findByIdAndUpdate(
            req.params.id, 
            updateData,
            {
                new: true,
                runValidators: true
            }
        );

        res.status(200).json({
            success: true,
            data: subtask
        });
    } catch (error) {
        next(error);
    }
};
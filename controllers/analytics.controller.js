import Task from '../models/task.js';

// @desc    Get task statistics by status
// @route   GET /api/analytics/status
// @access  Private
export const getTasksByStatus = async (req, res, next) => {
    try {
        const stats = await Task.aggregate([
            { $match: { user: req.user._id } },
            { $group: {
                _id: '$status',
                count: { $sum: 1 }
            }},
            { $sort: { count: -1 } }
        ]);

        res.status(200).json({
            success: true,
            data: stats
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Get task completion trends over time
// @route   GET /api/analytics/trends
// @access  Private
export const getCompletionTrends = async (req, res, next) => {
    try {
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

        const trends = await Task.aggregate([
            { 
                $match: { 
                    user: req.user._id,
                    status: 'done',
                    updatedAt: { $gte: thirtyDaysAgo }
                }
            },
            {
                $group: {
                    _id: { $dateToString: { format: "%Y-%m-%d", date: "$updatedAt" } },
                    completed: { $sum: 1 }
                }
            },
            { $sort: { _id: 1 } }
        ]);

        res.status(200).json({
            success: true,
            data: trends
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Get task statistics by priority
// @route   GET /api/analytics/priority
// @access  Private
export const getTasksByPriority = async (req, res, next) => {
    try {
        const stats = await Task.aggregate([
            { $match: { user: req.user._id } },
            { $group: {
                _id: '$priority',
                count: { $sum: 1 },
                completed: { 
                    $sum: { $cond: [{ $eq: ['$status', 'done'] }, 1, 0] }
                }
            }},
            { $sort: { count: -1 } }
        ]);

        res.status(200).json({
            success: true,
            data: stats
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Get overdue tasks analysis
// @route   GET /api/analytics/overdue
// @access  Private
export const getOverdueTasks = async (req, res, next) => {
    try {
        const now = new Date();
        const overdue = await Task.aggregate([
            { 
                $match: { 
                    user: req.user._id,
                    dueDate: { $lt: now },
                    status: { $ne: 'done' }
                }
            },
            { 
                $group: {
                    _id: '$priority',
                    count: { $sum: 1 },
                    tasks: { $push: { id: '$_id', title: '$title', dueDate: '$dueDate' } }
                }
            }
        ]);

        res.status(200).json({
            success: true,
            data: overdue
        });
    } catch (error) {
        next(error);
    }
};

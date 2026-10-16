import { Notification } from "../models/notification.models.js";

/**
 * GET /api/v1/notifications
 * Retrieves notifications for the authenticated user.
 */
export const getUserNotifications = async (req, res) => {
    try {
        const userId = req.id;
        const { unreadOnly, page = 1, limit = 20 } = req.query;

        const pageNum = Math.max(1, parseInt(page, 10) || 1);
        const limitNum = Math.min(50, Math.max(1, parseInt(limit, 10) || 20));
        const skip = (pageNum - 1) * limitNum;

        const query = { recipient: userId };
        if (unreadOnly === "true") {
            query.isRead = false;
        }

        const total = await Notification.countDocuments(query);
        const unreadCount = await Notification.countDocuments({ recipient: userId, isRead: false });

        const notifications = await Notification.find(query)
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limitNum)
            .populate("sender", "fullname email profile.profilePhoto")
            .populate("interview", "round roundNumber scheduledDate status interviewType meetingUrl venue")
            .populate("job", "title location");

        return res.status(200).json({
            message: "Notifications retrieved successfully",
            count: notifications.length,
            total,
            unreadCount,
            pagination: {
                page: pageNum,
                limit: limitNum,
                totalPages: Math.ceil(total / limitNum) || 1,
            },
            notifications,
            success: true,
        });
    } catch (error) {
        console.error("Error fetching notifications:", error);
        return res.status(500).json({
            message: error.message || "Failed to fetch notifications",
            success: false,
        });
    }
};

/**
 * GET /api/v1/notifications/unread-count
 * Quick lightweight query for the unread badge count.
 */
export const getUnreadCount = async (req, res) => {
    try {
        const userId = req.id;
        const count = await Notification.countDocuments({ recipient: userId, isRead: false });

        return res.status(200).json({
            unreadCount: count,
            success: true,
        });
    } catch (error) {
        console.error("Error fetching unread count:", error);
        return res.status(500).json({
            message: error.message || "Failed to fetch unread count",
            success: false,
        });
    }
};

/**
 * PATCH /api/v1/notifications/:id/read
 * Marks a specific notification as read after verifying ownership.
 */
export const markNotificationAsRead = async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.id;

        const notification = await Notification.findById(id);
        if (!notification) {
            return res.status(404).json({
                message: "Notification not found",
                success: false,
            });
        }

        // Prevent unauthorized access: only the recipient can mark as read
        if (notification.recipient.toString() !== userId.toString()) {
            return res.status(403).json({
                message: "You are not authorized to modify this notification",
                success: false,
            });
        }

        notification.isRead = true;
        notification.readAt = new Date();
        await notification.save();

        return res.status(200).json({
            message: "Notification marked as read",
            notification,
            success: true,
        });
    } catch (error) {
        console.error("Error marking notification as read:", error);
        return res.status(500).json({
            message: error.message || "Failed to mark notification as read",
            success: false,
        });
    }
};

/**
 * PATCH /api/v1/notifications/mark-all-read
 * Marks all notifications for the authenticated user as read.
 */
export const markAllNotificationsAsRead = async (req, res) => {
    try {
        const userId = req.id;

        const result = await Notification.updateMany(
            { recipient: userId, isRead: false },
            { $set: { isRead: true, readAt: new Date() } }
        );

        return res.status(200).json({
            message: "All notifications marked as read",
            updatedCount: result.modifiedCount,
            success: true,
        });
    } catch (error) {
        console.error("Error marking all notifications as read:", error);
        return res.status(500).json({
            message: error.message || "Failed to mark all notifications as read",
            success: false,
        });
    }
};

/**
 * DELETE /api/v1/notifications/:id
 * Removes a notification after verifying ownership.
 */
export const deleteNotification = async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.id;

        const notification = await Notification.findById(id);
        if (!notification) {
            return res.status(404).json({
                message: "Notification not found",
                success: false,
            });
        }

        if (notification.recipient.toString() !== userId.toString()) {
            return res.status(403).json({
                message: "You are not authorized to delete this notification",
                success: false,
            });
        }

        await Notification.findByIdAndDelete(id);

        return res.status(200).json({
            message: "Notification deleted successfully",
            success: true,
        });
    } catch (error) {
        console.error("Error deleting notification:", error);
        return res.status(500).json({
            message: error.message || "Failed to delete notification",
            success: false,
        });
    }
};

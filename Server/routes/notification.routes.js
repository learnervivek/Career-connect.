import express from "express";
import {
    getUserNotifications,
    getUnreadCount,
    markNotificationAsRead,
    markAllNotificationsAsRead,
    deleteNotification,
} from "../controllers/notification.controllers.js";
import authUser from "../middlewares/authUser.js";

const notificationRouter = express.Router();

notificationRouter.get("/", authUser, getUserNotifications);
notificationRouter.get("/unread-count", authUser, getUnreadCount);
notificationRouter.patch("/mark-all-read", authUser, markAllNotificationsAsRead);
notificationRouter.patch("/:id/read", authUser, markNotificationAsRead);
notificationRouter.delete("/:id", authUser, deleteNotification);

export default notificationRouter;

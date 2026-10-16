import { User } from "../models/user.model.js";

/**
 * Middleware factory to authorize specific user roles.
 * Must be used AFTER authUser middleware which sets req.id.
 * 
 * @param  {...string} allowedRoles - 'recruiter', 'student'
 */
export const authorizeRole = (...allowedRoles) => {
    return async (req, res, next) => {
        try {
            if (!req.id) {
                return res.status(401).json({
                    message: "User not authenticated",
                    success: false,
                });
            }

            const user = await User.findById(req.id).select("role fullname email");
            if (!user) {
                return res.status(404).json({
                    message: "User not found",
                    success: false,
                });
            }

            if (!allowedRoles.includes(user.role)) {
                return res.status(403).json({
                    message: `Access denied. Role '${user.role}' is not authorized to perform this action.`,
                    success: false,
                });
            }

            req.user = user;
            req.role = user.role;
            next();
        } catch (error) {
            console.error("Role authorization error:", error.message);
            return res.status(500).json({
                message: "Internal server error during role authorization",
                success: false,
            });
        }
    };
};

export const isRecruiter = authorizeRole("recruiter", "admin");
export const isCandidate = authorizeRole("student");
export const isAdmin = authorizeRole("admin", "recruiter");

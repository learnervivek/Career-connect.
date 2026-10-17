import express from "express";
import {
    applyJob,
    getApplicants,
    getAppliedJobs,
    getApplicationById,
    getApplicationHistory,
    updateStatus,
    withdrawApplication,
} from "../controllers/application.controllers.js";
import authUser from "../middlewares/authUser.js";

const applicantionRouter = express.Router();

// Candidate endpoints
applicantionRouter.post("/apply/:id", authUser, applyJob);
applicantionRouter.get("/get", authUser, getAppliedJobs);
applicantionRouter.get("/my-applications", authUser, getAppliedJobs);
applicantionRouter.post("/:id/withdraw", authUser, withdrawApplication);

// Application details & timeline (candidate, recruiter, or admin)
applicantionRouter.get("/:id/history", authUser, getApplicationHistory);
applicantionRouter.get("/:id", authUser, getApplicationById);

// Recruiter applicant management & status updates
applicantionRouter.get("/:id/applicants", authUser, getApplicants);
applicantionRouter.post("/status/:id/update", authUser, updateStatus);
applicantionRouter.patch("/:id/status", authUser, updateStatus);

export default applicantionRouter;

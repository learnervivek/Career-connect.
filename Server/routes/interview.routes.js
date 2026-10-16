import express from "express";
import {
    scheduleInterview,
    getCandidateInterviews,
    getRecruiterInterviews,
    getInterviewById,
    confirmInterview,
    requestReschedule,
    rescheduleInterview,
    cancelInterview,
    completeInterview,
    getInterviewsByApplication,
} from "../controllers/interview.controllers.js";
import authUser from "../middlewares/authUser.js";
import { isRecruiter, isCandidate } from "../middlewares/checkRole.js";

const interviewRouter = express.Router();

// ─── Core REST API Endpoints ───────────────────────────────────────────────

// POST /api/v1/interviews — recruiter schedules an interview
interviewRouter.post("/", authUser, isRecruiter, scheduleInterview);
interviewRouter.post("/schedule", authUser, isRecruiter, scheduleInterview); // backward-compatible alias

// GET /api/v1/interviews/candidate — authenticated candidate retrieves their interviews
interviewRouter.get("/candidate", authUser, isCandidate, getCandidateInterviews);
interviewRouter.get("/my-interviews", authUser, isCandidate, getCandidateInterviews); // convenience alias

// GET /api/v1/interviews/recruiter — authenticated recruiter retrieves interviews they manage
interviewRouter.get("/recruiter", authUser, isRecruiter, getRecruiterInterviews);

// GET /api/v1/interviews/application/:applicationId — get all rounds for an application
interviewRouter.get("/application/:applicationId", authUser, getInterviewsByApplication);

// GET /api/v1/interviews/:id — retrieve interview details after verifying access
interviewRouter.get("/:id", authUser, getInterviewById);

// PATCH /api/v1/interviews/:id/confirm — candidate confirms an invitation
interviewRouter.patch("/:id/confirm", authUser, isCandidate, confirmInterview);
interviewRouter.post("/:id/confirm", authUser, isCandidate, confirmInterview); // client POST support

// PATCH /api/v1/interviews/:id/reschedule-request — candidate requests rescheduling
interviewRouter.patch("/:id/reschedule-request", authUser, isCandidate, requestReschedule);
interviewRouter.post("/:id/reschedule-request", authUser, isCandidate, requestReschedule);

// PATCH /api/v1/interviews/:id/reschedule — recruiter reschedules an interview
interviewRouter.patch("/:id/reschedule", authUser, isRecruiter, rescheduleInterview);
interviewRouter.post("/:id/reschedule", authUser, isRecruiter, rescheduleInterview);

// PATCH /api/v1/interviews/:id/cancel — authorized user cancels an interview
interviewRouter.patch("/:id/cancel", authUser, cancelInterview);
interviewRouter.post("/:id/cancel", authUser, cancelInterview);
interviewRouter.delete("/:id", authUser, cancelInterview);

// PATCH /api/v1/interviews/:id/complete — authorized recruiter marks an interview completed
interviewRouter.patch("/:id/complete", authUser, isRecruiter, completeInterview);
interviewRouter.post("/:id/complete", authUser, isRecruiter, completeInterview);

export default interviewRouter;

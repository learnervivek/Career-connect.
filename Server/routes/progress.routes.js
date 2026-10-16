import express from "express";
import authUser from "../middlewares/authUser.js";
import {
    getRoadmapProgress,
    startRoadmap,
    updateTopicProgress,
    getMyPreparation,
    addOrUpdateTargetCompany,
    removeTargetCompany,
    saveTopicNote,
} from "../controllers/progress.controllers.js";

const router = express.Router();

// Progress routes
router.route("/progress/:roadmapId").get(authUser, getRoadmapProgress);
router.route("/progress/:roadmapId/start").post(authUser, startRoadmap);
router
    .route("/progress/:roadmapId/topics/:topicId")
    .put(authUser, updateTopicProgress)
    .post(authUser, updateTopicProgress);

router
    .route("/progress/:roadmapId/topics/:topicId/note")
    .put(authUser, saveTopicNote)
    .post(authUser, saveTopicNote);

// Personal preparation dashboard
router.route("/my-preparation").get(authUser, getMyPreparation);

// Target companies management
router.route("/my-target-companies").post(authUser, addOrUpdateTargetCompany);
router.route("/my-target-companies/:companyId").delete(authUser, removeTargetCompany);

export default router;

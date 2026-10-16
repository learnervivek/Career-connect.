import express from "express";
import authUser, { optionalAuthUser } from "../middlewares/authUser.js";
import {
    getPreparationCompanies,
    getCompanyPreparationDetails,
    getRoadmapDetails,
    toggleTopicProgress,
    toggleTargetCompany,
    getUserTargetCompanies,
    toggleResourceBookmark,
    getUserResourceBookmarks,
    getPreparationResources,
    getContinuePreparation,
} from "../controllers/preparation.controllers.js";
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

// Public catalog routes (with optional auth to provide personalized progress & target badges if logged in)
router.route("/companies").get(optionalAuthUser, getPreparationCompanies);
router.route("/companies/:slugOrId").get(optionalAuthUser, getCompanyPreparationDetails);
router.route("/roadmaps/:slugOrId").get(optionalAuthUser, getRoadmapDetails);
router.route("/resources").get(optionalAuthUser, getPreparationResources);

// Bookmarking & Structured Resources for Authenticated Candidates
router.route("/resources/:resourceId/bookmark").post(authUser, toggleResourceBookmark);
router.route("/my-resource-bookmarks").get(authUser, getUserResourceBookmarks);
router.route("/continue").get(authUser, getContinuePreparation);

// Candidate progress, notes & personal preparation routes
router.route("/my-preparation").get(authUser, getMyPreparation);
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

router
    .route("/roadmaps/:roadmapId/topics/:topicId/note")
    .put(authUser, saveTopicNote)
    .post(authUser, saveTopicNote);

router.route("/roadmaps/:roadmapId/progress").post(authUser, updateTopicProgress);
router.route("/targets").get(authUser, getUserTargetCompanies);
router.route("/targets/:companyId").post(authUser, toggleTargetCompany).delete(authUser, removeTargetCompany);
router.route("/my-target-companies").post(authUser, addOrUpdateTargetCompany);
router.route("/my-target-companies/:companyId").delete(authUser, removeTargetCompany);

export default router;

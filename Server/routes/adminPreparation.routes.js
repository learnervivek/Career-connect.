import express from "express";
import authUser from "../middlewares/authUser.js";
import { isAdmin } from "../middlewares/checkRole.js";
import {
    getAllAdminCompanies,
    createAdminCompany,
    updateAdminCompany,
    checkCompanyArchiveWarning,
    toggleCompanyStatus,
    getAllAdminRoadmaps,
    getAdminRoadmapById,
    createAdminRoadmap,
    updateAdminRoadmap,
    toggleRoadmapPublicationStatus,
    deleteAdminRoadmap,
    getAllAdminResources,
    createAdminResource,
    updateAdminResource,
    toggleAdminResourceStatus,
    verifyAdminResource,
} from "../controllers/adminPreparation.controllers.js";

const router = express.Router();

// Apply authUser and isAdmin to all admin preparation routes
router.use(authUser, isAdmin);

// Companies Management
router.route("/companies").get(getAllAdminCompanies).post(createAdminCompany);
router.route("/companies/:id").put(updateAdminCompany);
router.route("/companies/:id/check-archive").get(checkCompanyArchiveWarning);
router.route("/companies/:id/archive-warning").get(checkCompanyArchiveWarning);
router.route("/companies/:id/status").patch(toggleCompanyStatus);

// Roadmaps Management
router.route("/roadmaps").get(getAllAdminRoadmaps).post(createAdminRoadmap);
router
    .route("/roadmaps/:id")
    .get(getAdminRoadmapById)
    .put(updateAdminRoadmap)
    .delete(deleteAdminRoadmap);
router.route("/roadmaps/:id/status").patch(toggleRoadmapPublicationStatus);

// Resources Management
router.route("/resources").get(getAllAdminResources).post(createAdminResource);
router.route("/resources/:id").put(updateAdminResource);
router.route("/resources/:id/status").patch(toggleAdminResourceStatus);
router.route("/resources/:id/verify").patch(verifyAdminResource);

export default router;

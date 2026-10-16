import mongoose from "mongoose";
import { Company } from "../models/company.models.js";
import { Roadmap } from "../models/roadmap.models.js";
import {
    PreparationResource,
    RESOURCE_CATEGORIES,
    RESOURCE_TYPES,
    RESOURCE_SOURCE_TYPES,
    RESOURCE_DIFFICULTIES,
    RESOURCE_STATUSES,
} from "../models/preparationResource.models.js";
import { UserRoadmapProgress } from "../models/userRoadmapProgress.models.js";

// Helper to sanitize strings
const sanitize = (str) => (typeof str === "string" ? str.trim() : str);

// Helper to validate external URLs
const isValidUrl = (url) => {
    if (!url || typeof url !== "string") return false;
    return /^https?:\/\/.+/i.test(url.trim());
};

// Helper to generate a clean URL-friendly slug
const generateSlug = (text) => {
    return text
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/(^-|-$)+/g, "");
};

// Helper to normalize topic difficulty to supported enum ("Easy", "Medium", "Hard")
const normalizeTopicDifficulty = (diff) => {
    if (!diff) return "Medium";
    const d = String(diff).trim().toLowerCase();
    if (d === "easy" || d === "beginner") return "Easy";
    if (d === "hard" || d === "advanced" || d === "comprehensive") return "Hard";
    return "Medium";
};

// Helper to normalize roadmap difficulty to supported enum ("Beginner", "Intermediate", "Advanced", "Comprehensive")
const normalizeRoadmapDifficulty = (diff) => {
    if (!diff) return "Intermediate";
    const d = String(diff).trim().toLowerCase();
    if (d === "easy" || d === "beginner") return "Beginner";
    if (d === "hard" || d === "advanced") return "Advanced";
    if (d === "comprehensive") return "Comprehensive";
    return "Intermediate";
};

// ==============================================================================
// 1. COMPANY MANAGEMENT
// ==============================================================================

/**
 * GET /api/v1/admin/preparation/companies
 * Retrieves all companies (active & archived) with roadmap counts and filters
 */
export const getAllAdminCompanies = async (req, res) => {
    try {
        const { search, category, status } = req.query;

        const filter = {};

        if (status === "active") {
            filter.isPreparationHubActive = true;
        } else if (status === "archived") {
            filter.isPreparationHubActive = false;
        }

        if (category && category !== "All") {
            filter.category = category;
        }

        if (search && search.trim()) {
            const queryRegex = new RegExp(search.trim(), "i");
            filter.$or = [
                { companyName: queryRegex },
                { slug: queryRegex },
                { description: queryRegex },
                { hiringTracks: queryRegex },
            ];
        }

        const companies = await Company.find(filter)
            .sort({ companyName: 1 })
            .lean();

        // Aggregate roadmap counts for each company
        const roadmapStats = await Roadmap.aggregate([
            {
                $group: {
                    _id: "$company",
                    totalRoadmaps: { $sum: 1 },
                    publishedRoadmaps: {
                        $sum: { $cond: [{ $eq: ["$publicationStatus", "Published"] }, 1, 0] },
                    },
                    draftRoadmaps: {
                        $sum: { $cond: [{ $eq: ["$publicationStatus", "Draft"] }, 1, 0] },
                    },
                    archivedRoadmaps: {
                        $sum: { $cond: [{ $eq: ["$publicationStatus", "Archived"] }, 1, 0] },
                    },
                },
            },
        ]);

        const statsMap = new Map();
        roadmapStats.forEach((stat) => {
            statsMap.set(String(stat._id), stat);
        });

        const enrichedCompanies = companies.map((c) => {
            const stats = statsMap.get(String(c._id)) || {
                totalRoadmaps: 0,
                publishedRoadmaps: 0,
                draftRoadmaps: 0,
                archivedRoadmaps: 0,
            };
            return {
                ...c,
                stats,
            };
        });

        return res.status(200).json({
            success: true,
            count: enrichedCompanies.length,
            companies: enrichedCompanies,
        });
    } catch (error) {
        console.error("Error in getAllAdminCompanies:", error);
        return res.status(500).json({
            success: false,
            message: "Failed to retrieve companies",
            error: error.message,
        });
    }
};

/**
 * POST /api/v1/admin/preparation/companies
 * Creates a new company for the Preparation Hub
 */
export const createAdminCompany = async (req, res) => {
    try {
        const {
            companyName: rawCompanyName,
            name: aliasName,
            slug,
            category,
            tier = "MNC",
            description,
            website,
            careersUrl,
            officialCareersUrl,
            location,
            logo,
            hiringTracks = [],
            isPreparationHubActive = true,
        } = req.body;

        const companyName = rawCompanyName || aliasName;

        if (!companyName || !sanitize(companyName)) {
            return res.status(400).json({
                success: false,
                message: "Company name is required",
            });
        }

        if (!category || !sanitize(category)) {
            return res.status(400).json({
                success: false,
                message: "Company category is required",
            });
        }

        const finalSlug = slug && sanitize(slug) ? generateSlug(slug) : generateSlug(companyName);

        // Check for duplicate company name or slug
        const existing = await Company.findOne({
            $or: [{ companyName: sanitize(companyName) }, { slug: finalSlug }],
        });

        if (existing) {
            return res.status(400).json({
                success: false,
                message: `A company with name '${companyName}' or slug '${finalSlug}' already exists.`,
            });
        }

        // Validate URLs if supplied
        if (website && !isValidUrl(website)) {
            return res.status(400).json({
                success: false,
                message: "Website URL must start with http:// or https://",
            });
        }

        if (careersUrl && !isValidUrl(careersUrl)) {
            return res.status(400).json({
                success: false,
                message: "Careers URL must start with http:// or https://",
            });
        }

        if (officialCareersUrl && !isValidUrl(officialCareersUrl)) {
            return res.status(400).json({
                success: false,
                message: "Official careers URL must start with http:// or https://",
            });
        }

        const cleanedTracks = Array.isArray(hiringTracks)
            ? hiringTracks.map(sanitize).filter(Boolean)
            : typeof hiringTracks === "string"
            ? hiringTracks.split(",").map(sanitize).filter(Boolean)
            : [];

        const newCompany = await Company.create({
            companyName: sanitize(companyName),
            slug: finalSlug,
            category: sanitize(category),
            tier: sanitize(tier),
            description: sanitize(description) || "",
            website: sanitize(website) || "",
            careersUrl: sanitize(careersUrl) || "",
            officialCareersUrl: sanitize(officialCareersUrl) || sanitize(careersUrl) || "",
            location: sanitize(location) || "",
            logo: sanitize(logo) || "",
            hiringTracks: cleanedTracks,
            isPreparationHubActive: !!isPreparationHubActive,
            lastVerifiedDate: new Date(),
        });

        return res.status(201).json({
            success: true,
            message: `Company '${newCompany.companyName}' created successfully!`,
            company: newCompany,
        });
    } catch (error) {
        console.error("Error in createAdminCompany:", error);
        return res.status(500).json({
            success: false,
            message: "Failed to create company",
            error: error.message,
        });
    }
};

/**
 * PUT /api/v1/admin/preparation/companies/:id
 * Updates an existing company's details
 */
export const updateAdminCompany = async (req, res) => {
    try {
        const { id } = req.params;
        const {
            companyName: rawCompanyName,
            name: aliasName,
            slug,
            category,
            tier,
            description,
            website,
            careersUrl,
            officialCareersUrl,
            location,
            logo,
            hiringTracks,
            isPreparationHubActive,
        } = req.body;

        const companyName = rawCompanyName || aliasName;

        const company = await Company.findById(id);
        if (!company) {
            return res.status(404).json({
                success: false,
                message: "Company not found",
            });
        }

        if (companyName && sanitize(companyName) !== company.companyName) {
            const duplicateName = await Company.findOne({
                _id: { $ne: company._id },
                companyName: sanitize(companyName),
            });
            if (duplicateName) {
                return res.status(400).json({
                    success: false,
                    message: `Another company already uses the name '${companyName}'`,
                });
            }
            company.companyName = sanitize(companyName);
        }

        if (slug && sanitize(slug) !== company.slug) {
            const cleanSlug = generateSlug(slug);
            const duplicateSlug = await Company.findOne({
                _id: { $ne: company._id },
                slug: cleanSlug,
            });
            if (duplicateSlug) {
                return res.status(400).json({
                    success: false,
                    message: `Another company already uses the slug '${cleanSlug}'`,
                });
            }
            company.slug = cleanSlug;
        }

        if (category) company.category = sanitize(category);
        if (tier) company.tier = sanitize(tier);
        if (description !== undefined) company.description = sanitize(description);
        if (location !== undefined) company.location = sanitize(location);
        if (logo !== undefined) company.logo = sanitize(logo);

        if (website !== undefined) {
            if (website && !isValidUrl(website)) {
                return res.status(400).json({ success: false, message: "Invalid website URL format" });
            }
            company.website = sanitize(website);
        }

        if (careersUrl !== undefined) {
            if (careersUrl && !isValidUrl(careersUrl)) {
                return res.status(400).json({ success: false, message: "Invalid careers URL format" });
            }
            company.careersUrl = sanitize(careersUrl);
        }

        if (officialCareersUrl !== undefined) {
            if (officialCareersUrl && !isValidUrl(officialCareersUrl)) {
                return res.status(400).json({ success: false, message: "Invalid official careers URL format" });
            }
            company.officialCareersUrl = sanitize(officialCareersUrl);
        }

        if (hiringTracks !== undefined) {
            company.hiringTracks = Array.isArray(hiringTracks)
                ? hiringTracks.map(sanitize).filter(Boolean)
                : typeof hiringTracks === "string"
                ? hiringTracks.split(",").map(sanitize).filter(Boolean)
                : [];
        }

        if (isPreparationHubActive !== undefined) {
            company.isPreparationHubActive = !!isPreparationHubActive;
        }

        company.lastVerifiedDate = new Date();
        await company.save();

        return res.status(200).json({
            success: true,
            message: `Company '${company.companyName}' updated successfully!`,
            company,
        });
    } catch (error) {
        console.error("Error in updateAdminCompany:", error);
        return res.status(500).json({
            success: false,
            message: "Failed to update company",
            error: error.message,
        });
    }
};

/**
 * GET /api/v1/admin/preparation/companies/:id/check-archive
 * Inspects active roadmaps before archiving a company to warn administrator
 */
export const checkCompanyArchiveWarning = async (req, res) => {
    try {
        const { id } = req.params;
        const company = await Company.findById(id);
        if (!company) {
            return res.status(404).json({ success: false, message: "Company not found" });
        }

        const activeRoadmaps = await Roadmap.find({
            company: company._id,
            publicationStatus: { $ne: "Archived" },
        })
            .select("title slug role publicationStatus")
            .lean();

        return res.status(200).json({
            success: true,
            companyName: company.companyName,
            isCurrentlyActive: company.isPreparationHubActive,
            hasActiveRoadmaps: activeRoadmaps.length > 0,
            activeRoadmapsCount: activeRoadmaps.length,
            activeRoadmapCount: activeRoadmaps.length,
            activeRoadmaps,
            roadmaps: activeRoadmaps,
        });
    } catch (error) {
        console.error("Error in checkCompanyArchiveWarning:", error);
        return res.status(500).json({
            success: false,
            message: "Failed to inspect company roadmaps",
            error: error.message,
        });
    }
};

/**
 * PATCH /api/v1/admin/preparation/companies/:id/status
 * Archives or restores a company
 */
export const toggleCompanyStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const { isPreparationHubActive, status } = req.body;

        const company = await Company.findById(id);
        if (!company) {
            return res.status(404).json({ success: false, message: "Company not found" });
        }

        let newStatus = true;
        if (typeof isPreparationHubActive === "boolean") {
            newStatus = isPreparationHubActive;
        } else if (status) {
            newStatus = String(status).trim().toLowerCase() !== "archived";
        } else {
            newStatus = !company.isPreparationHubActive;
        }

        company.isPreparationHubActive = newStatus;
        await company.save();

        const companyData = company.toObject ? company.toObject() : company;
        companyData.status = newStatus ? "Active" : "Archived";

        return res.status(200).json({
            success: true,
            message: newStatus
                ? `Company '${company.companyName}' restored successfully!`
                : `Company '${company.companyName}' archived from public catalog.`,
            company: companyData,
        });
    } catch (error) {
        console.error("Error in toggleCompanyStatus:", error);
        return res.status(500).json({
            success: false,
            message: "Failed to update company status",
            error: error.message,
        });
    }
};

// ==============================================================================
// 2. ROADMAP MANAGEMENT
// ==============================================================================

/**
 * GET /api/v1/admin/preparation/roadmaps
 * Retrieves roadmaps with filters for company, status, and role
 */
export const getAllAdminRoadmaps = async (req, res) => {
    try {
        const { companyId, status, search } = req.query;

        const filter = {};

        if (companyId && companyId !== "All") {
            filter.company = companyId;
        }

        if (status && status !== "All") {
            filter.publicationStatus = status;
        }

        if (search && search.trim()) {
            const queryRegex = new RegExp(search.trim(), "i");
            filter.$or = [
                { title: queryRegex },
                { role: queryRegex },
                { hiringTrack: queryRegex },
                { slug: queryRegex },
            ];
        }

        const roadmaps = await Roadmap.find(filter)
            .populate("company", "companyName slug logo category tier isPreparationHubActive")
            .sort({ createdAt: -1 })
            .lean();

        // Enrich with stage and topic counts
        const enriched = roadmaps.map((r) => {
            const stagesCount = r.stages ? r.stages.length : 0;
            const topicsCount = r.stages
                ? r.stages.reduce((acc, s) => acc + (s.topics ? s.topics.length : 0), 0)
                : 0;
            return {
                ...r,
                stagesCount,
                topicsCount,
            };
        });

        return res.status(200).json({
            success: true,
            count: enriched.length,
            roadmaps: enriched,
        });
    } catch (error) {
        console.error("Error in getAllAdminRoadmaps:", error);
        return res.status(500).json({
            success: false,
            message: "Failed to retrieve roadmaps",
            error: error.message,
        });
    }
};

/**
 * GET /api/v1/admin/preparation/roadmaps/:id
 * Retrieves complete roadmap for editing
 */
export const getAdminRoadmapById = async (req, res) => {
    try {
        const { id } = req.params;
        const roadmap = await Roadmap.findById(id)
            .populate("company", "companyName slug logo category tier")
            .populate("stages.topics.resources");

        if (!roadmap) {
            return res.status(404).json({ success: false, message: "Roadmap not found" });
        }

        return res.status(200).json({
            success: true,
            roadmap,
        });
    } catch (error) {
        console.error("Error in getAdminRoadmapById:", error);
        return res.status(500).json({
            success: false,
            message: "Failed to retrieve roadmap",
            error: error.message,
        });
    }
};

/**
 * POST /api/v1/admin/preparation/roadmaps
 * Creates a new roadmap for a company with stable stage and topic IDs
 */
export const createAdminRoadmap = async (req, res) => {
    try {
        const {
            company: reqCompany,
            companyId: rawCompanyId,
            title,
            slug,
            role,
            hiringTrack = "General / Fresher",
            description,
            estimatedDuration = "8-10 Weeks",
            difficulty = "Intermediate",
            publicationStatus = "Draft",
            isIndicativeNotice = true,
            indicativeNoticeText,
            stages = [],
            version = 1,
        } = req.body;

        const companyId = reqCompany || rawCompanyId;

        if (!companyId) {
            return res.status(400).json({ success: false, message: "Target company is required" });
        }

        const companyDoc = await Company.findById(companyId);
        if (!companyDoc) {
            return res.status(404).json({ success: false, message: "Specified company does not exist" });
        }

        if (!title || !sanitize(title)) {
            return res.status(400).json({ success: false, message: "Roadmap title is required" });
        }

        if (!role || !sanitize(role)) {
            return res.status(400).json({ success: false, message: "Target role is required" });
        }

        if (!description || !sanitize(description)) {
            return res.status(400).json({ success: false, message: "Roadmap description is required" });
        }

        const finalSlug = slug && sanitize(slug) ? generateSlug(slug) : generateSlug(title);

        // Check duplicate slug
        const duplicate = await Roadmap.findOne({ slug: finalSlug });
        if (duplicate) {
            return res.status(400).json({
                success: false,
                message: `A roadmap with slug '${finalSlug}' already exists. Please choose a unique slug.`,
            });
        }

        // Process stages and assign deterministic, stable stageId and topicId
        const processedStages = (stages || []).map((stg, stgIdx) => {
            const stageId =
                stg.stageId && sanitize(stg.stageId)
                    ? sanitize(stg.stageId)
                    : `stg_${Date.now()}_${stgIdx + 1}_${Math.random().toString(36).substring(2, 6)}`;

            const processedTopics = (stg.topics || []).map((top, topIdx) => {
                const topicId =
                    top.topicId && sanitize(top.topicId)
                        ? sanitize(top.topicId)
                        : (top._id ? String(top._id) : `top_${Date.now()}_${stgIdx + 1}_${topIdx + 1}_${Math.random().toString(36).substring(2, 6)}`);

                const topicObj = {
                    topicId,
                    title: sanitize(top.title) || `Topic ${topIdx + 1}`,
                    order: top.order || topIdx + 1,
                    description: sanitize(top.description) || "",
                    difficulty: normalizeTopicDifficulty(top.difficulty),
                    importance: top.importance || "Core / Must Know",
                    estimatedHours: top.estimatedHours || 4,
                    resources: Array.isArray(top.resources) ? top.resources : [],
                    practiceProblems: Array.isArray(top.practiceProblems) ? top.practiceProblems : [],
                };
                if (top._id) {
                    topicObj._id = top._id;
                }
                return topicObj;
            });

            return {
                stageId,
                title: sanitize(stg.title) || `Stage ${stgIdx + 1}`,
                order: stg.order || stgIdx + 1,
                description: sanitize(stg.description) || "",
                estimatedWeeks: stg.estimatedWeeks || 2,
                topics: processedTopics,
            };
        });

        const newRoadmap = await Roadmap.create({
            company: companyDoc._id,
            title: sanitize(title),
            slug: finalSlug,
            role: sanitize(role),
            hiringTrack: sanitize(hiringTrack),
            description: sanitize(description),
            estimatedDuration: sanitize(estimatedDuration),
            difficulty: normalizeRoadmapDifficulty(difficulty),
            publicationStatus,
            isIndicativeNotice: isIndicativeNotice !== undefined ? isIndicativeNotice : true,
            indicativeNoticeText: sanitize(indicativeNoticeText) || "This roadmap reflects standard entry-level technical patterns and candidate interview experience.",
            stages: processedStages,
            version: version || 1,
            lastVerifiedDate: new Date(),
        });

        return res.status(201).json({
            success: true,
            message: `Roadmap '${newRoadmap.title}' created successfully!`,
            roadmap: newRoadmap,
        });
    } catch (error) {
        console.error("Error in createAdminRoadmap:", error);
        return res.status(500).json({
            success: false,
            message: "Failed to create roadmap",
            error: error.message,
        });
    }
};

/**
 * PUT /api/v1/admin/preparation/roadmaps/:id
 * Updates roadmap with SAFE topic preservation ensuring existing candidate progress is never broken
 */
export const updateAdminRoadmap = async (req, res) => {
    try {
        const { id } = req.params;
        const {
            title,
            slug,
            role,
            hiringTrack,
            description,
            estimatedDuration,
            difficulty,
            publicationStatus,
            isIndicativeNotice,
            indicativeNoticeText,
            stages,
            version,
        } = req.body;

        const roadmap = await Roadmap.findById(id);
        if (!roadmap) {
            return res.status(404).json({ success: false, message: "Roadmap not found" });
        }

        if (slug && sanitize(slug) !== roadmap.slug) {
            const cleanSlug = generateSlug(slug);
            const duplicateSlug = await Roadmap.findOne({
                _id: { $ne: roadmap._id },
                slug: cleanSlug,
            });
            if (duplicateSlug) {
                return res.status(400).json({
                    success: false,
                    message: `Another roadmap already uses slug '${cleanSlug}'`,
                });
            }
            roadmap.slug = cleanSlug;
        }

        if (title) roadmap.title = sanitize(title);
        if (role) roadmap.role = sanitize(role);
        if (hiringTrack !== undefined) roadmap.hiringTrack = sanitize(hiringTrack);
        if (description) roadmap.description = sanitize(description);
        if (estimatedDuration) roadmap.estimatedDuration = sanitize(estimatedDuration);
        if (difficulty) roadmap.difficulty = normalizeRoadmapDifficulty(difficulty);
        if (publicationStatus) roadmap.publicationStatus = publicationStatus;
        if (isIndicativeNotice !== undefined) roadmap.isIndicativeNotice = isIndicativeNotice;
        if (indicativeNoticeText !== undefined) roadmap.indicativeNoticeText = sanitize(indicativeNoticeText);

        // Safe topic and stage preservation:
        // Build a map of existing topics to retain their stable topicId even when renamed/reordered
        if (Array.isArray(stages)) {
            const existingTopicMap = new Map();
            (roadmap.stages || []).forEach((stg) => {
                (stg.topics || []).forEach((top) => {
                    if (top.topicId) {
                        existingTopicMap.set(top.topicId, top);
                    }
                });
            });

            const processedStages = stages.map((stg, stgIdx) => {
                const stageId =
                    stg.stageId && sanitize(stg.stageId)
                        ? sanitize(stg.stageId)
                        : `stg_${Date.now()}_${stgIdx + 1}_${Math.random().toString(36).substring(2, 6)}`;

                const processedTopics = (stg.topics || []).map((top, topIdx) => {
                    // Critical invariant: preserve existing topicId if supplied or matched
                    const topicId =
                        top.topicId && sanitize(top.topicId)
                            ? sanitize(top.topicId)
                            : (top._id ? String(top._id) : `top_${Date.now()}_${stgIdx + 1}_${topIdx + 1}_${Math.random().toString(36).substring(2, 6)}`);

                    const topicObj = {
                        topicId,
                        title: sanitize(top.title) || `Topic ${topIdx + 1}`,
                        order: top.order || topIdx + 1,
                        description: sanitize(top.description) || "",
                        difficulty: normalizeTopicDifficulty(top.difficulty),
                        importance: top.importance || "Core / Must Know",
                        estimatedHours: top.estimatedHours || 4,
                        resources: Array.isArray(top.resources) ? top.resources : [],
                        practiceProblems: Array.isArray(top.practiceProblems) ? top.practiceProblems : [],
                    };
                    if (top._id) {
                        topicObj._id = top._id;
                    }
                    return topicObj;
                });

                return {
                    stageId,
                    title: sanitize(stg.title) || `Stage ${stgIdx + 1}`,
                    order: stg.order || stgIdx + 1,
                    description: sanitize(stg.description) || "",
                    estimatedWeeks: stg.estimatedWeeks || 2,
                    topics: processedTopics,
                };
            });

            roadmap.stages = processedStages;
        }

        if (version !== undefined && version !== null) {
            roadmap.version = Number(version);
        } else {
            roadmap.version = (roadmap.version || 1) + 1;
        }

        roadmap.lastVerifiedDate = new Date();
        await roadmap.save();

        return res.status(200).json({
            success: true,
            message: `Roadmap '${roadmap.title}' updated successfully!`,
            roadmap,
        });
    } catch (error) {
        console.error("Error in updateAdminRoadmap:", error);
        return res.status(500).json({
            success: false,
            message: "Failed to update roadmap",
            error: error.message,
        });
    }
};

/**
 * PATCH /api/v1/admin/preparation/roadmaps/:id/status
 * Updates publication status (Draft, Published, Archived)
 */
export const toggleRoadmapPublicationStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const { publicationStatus } = req.body;

        if (!["Draft", "Published", "Archived"].includes(publicationStatus)) {
            return res.status(400).json({
                success: false,
                message: "Status must be 'Draft', 'Published', or 'Archived'",
            });
        }

        const roadmap = await Roadmap.findById(id);
        if (!roadmap) {
            return res.status(404).json({ success: false, message: "Roadmap not found" });
        }

        roadmap.publicationStatus = publicationStatus;
        roadmap.lastVerifiedDate = new Date();
        await roadmap.save();

        return res.status(200).json({
            success: true,
            message: `Roadmap '${roadmap.title}' status changed to '${publicationStatus}'.`,
            roadmap,
        });
    } catch (error) {
        console.error("Error in toggleRoadmapPublicationStatus:", error);
        return res.status(500).json({
            success: false,
            message: "Failed to update roadmap status",
            error: error.message,
        });
    }
};

/**
 * DELETE /api/v1/admin/preparation/roadmaps/:id
 * Safely archives roadmap without deleting candidate progress
 */
export const deleteAdminRoadmap = async (req, res) => {
    try {
        const { id } = req.params;
        const roadmap = await Roadmap.findById(id);
        if (!roadmap) {
            return res.status(404).json({ success: false, message: "Roadmap not found" });
        }

        roadmap.publicationStatus = "Archived";
        await roadmap.save();

        return res.status(200).json({
            success: true,
            message: `Roadmap '${roadmap.title}' has been safely archived.`,
        });
    } catch (error) {
        console.error("Error in deleteAdminRoadmap:", error);
        return res.status(500).json({
            success: false,
            message: "Failed to archive roadmap",
            error: error.message,
        });
    }
};

// ==============================================================================
// 3. LEARNING RESOURCES
// ==============================================================================

/**
 * GET /api/v1/admin/preparation/resources
 * Retrieves all curated learning resources
 */
export const getAllAdminResources = async (req, res) => {
    try {
        const resources = await PreparationResource.find().sort({ title: 1 }).lean();
        return res.status(200).json({
            success: true,
            count: resources.length,
            resources,
        });
    } catch (error) {
        console.error("Error in getAllAdminResources:", error);
        return res.status(500).json({
            success: false,
            message: "Failed to retrieve learning resources",
            error: error.message,
        });
    }
};

/**
 * POST /api/v1/admin/preparation/resources
 * Adds a new learning resource to catalog
 */
export const createAdminResource = async (req, res) => {
    try {
        const {
            title,
            url,
            category = "Core CS",
            type = "Article",
            sourceType = "External Platform",
            isOfficial = false,
            provider,
            isFree = true,
            difficulty = "All Levels",
            estimatedTimeMinutes = 30,
            description = "",
            tags = [],
            status = "Active",
        } = req.body;

        if (!title || !url) {
            return res.status(400).json({
                success: false,
                message: "Title and URL are required",
            });
        }

        if (!isValidUrl(url)) {
            return res.status(400).json({
                success: false,
                message: "Resource URL must start with http:// or https://",
            });
        }

        const existing = await PreparationResource.findOne({ url: sanitize(url) });
        if (existing) {
            return res.status(400).json({
                success: false,
                message: "A resource with this URL already exists",
            });
        }

        const matchedCategory = RESOURCE_CATEGORIES.find(
            (c) => c.toLowerCase() === (category || "").trim().toLowerCase()
        ) || "Core CS";

        const matchedType = RESOURCE_TYPES.find(
            (t) => t.toLowerCase() === (type || "").trim().toLowerCase()
        ) || "Article";

        const matchedSourceType = RESOURCE_SOURCE_TYPES.find(
            (s) => s.toLowerCase() === (sourceType || "").trim().toLowerCase()
        ) || (isOfficial ? "Official Company" : "External Platform");

        const matchedDiff = RESOURCE_DIFFICULTIES.find(
            (d) => d.toLowerCase() === (difficulty || "").trim().toLowerCase()
        ) || "All Levels";

        const matchedStatus = RESOURCE_STATUSES.find(
            (s) => s.toLowerCase() === (status || "").trim().toLowerCase()
        ) || "Active";

        const parsedTags = Array.isArray(tags)
            ? tags.map((t) => sanitize(t)).filter(Boolean)
            : typeof tags === "string"
            ? tags.split(",").map((t) => sanitize(t)).filter(Boolean)
            : [];

        const resource = await PreparationResource.create({
            title: sanitize(title),
            url: sanitize(url),
            category: matchedCategory,
            type: matchedType,
            sourceType: matchedSourceType,
            isOfficial: !!isOfficial || matchedSourceType === "Official Company",
            provider: sanitize(provider) || (matchedSourceType === "Official Company" ? "Official" : "Curated Platform"),
            isFree: isFree !== undefined ? !!isFree : true,
            difficulty: matchedDiff,
            estimatedTimeMinutes: Number(estimatedTimeMinutes) || 30,
            description: sanitize(description) || "",
            tags: parsedTags,
            status: matchedStatus,
            lastVerifiedDate: new Date(),
            addedBy: req.id,
        });

        return res.status(201).json({
            success: true,
            message: "Learning resource created successfully",
            resource,
        });
    } catch (error) {
        console.error("Error in createAdminResource:", error);
        return res.status(500).json({
            success: false,
            message: "Failed to create resource",
            error: error.message,
        });
    }
};

/**
 * PUT /api/v1/admin/preparation/resources/:id
 * Updates an existing learning resource
 */
export const updateAdminResource = async (req, res) => {
    try {
        const { id } = req.params;
        const {
            title,
            url,
            category,
            type,
            sourceType,
            isOfficial,
            provider,
            isFree,
            difficulty,
            estimatedTimeMinutes,
            description,
            tags,
            status,
        } = req.body;

        const resource = await PreparationResource.findById(id);
        if (!resource) {
            return res.status(404).json({ success: false, message: "Resource not found" });
        }

        if (url && url !== resource.url) {
            if (!isValidUrl(url)) {
                return res.status(400).json({
                    success: false,
                    message: "Resource URL must start with http:// or https://",
                });
            }
            const duplicate = await PreparationResource.findOne({ url: sanitize(url), _id: { $ne: id } });
            if (duplicate) {
                return res.status(400).json({
                    success: false,
                    message: "Another resource with this URL already exists",
                });
            }
            resource.url = sanitize(url);
        }

        if (title !== undefined) resource.title = sanitize(title);
        if (category) {
            const matchedCategory = RESOURCE_CATEGORIES.find(
                (c) => c.toLowerCase() === category.trim().toLowerCase()
            );
            if (matchedCategory) resource.category = matchedCategory;
        }
        if (type) {
            const matchedType = RESOURCE_TYPES.find(
                (t) => t.toLowerCase() === type.trim().toLowerCase()
            );
            if (matchedType) resource.type = matchedType;
        }
        if (sourceType) {
            const matchedSource = RESOURCE_SOURCE_TYPES.find(
                (s) => s.toLowerCase() === sourceType.trim().toLowerCase()
            );
            if (matchedSource) resource.sourceType = matchedSource;
        }
        if (isOfficial !== undefined) {
            resource.isOfficial = !!isOfficial;
            if (resource.isOfficial && resource.sourceType !== "Official Company") {
                resource.sourceType = "Official Company";
            }
        }
        if (provider !== undefined) resource.provider = sanitize(provider);
        if (isFree !== undefined) resource.isFree = !!isFree;
        if (difficulty) {
            const matchedDiff = RESOURCE_DIFFICULTIES.find(
                (d) => d.toLowerCase() === difficulty.trim().toLowerCase()
            );
            if (matchedDiff) resource.difficulty = matchedDiff;
        }
        if (estimatedTimeMinutes !== undefined) {
            resource.estimatedTimeMinutes = Math.max(1, Number(estimatedTimeMinutes) || 30);
        }
        if (description !== undefined) resource.description = sanitize(description);
        if (tags !== undefined) {
            resource.tags = Array.isArray(tags)
                ? tags.map((t) => sanitize(t)).filter(Boolean)
                : typeof tags === "string"
                ? tags.split(",").map((t) => sanitize(t)).filter(Boolean)
                : [];
        }
        if (status) {
            const matchedStatus = RESOURCE_STATUSES.find(
                (s) => s.toLowerCase() === status.trim().toLowerCase()
            );
            if (matchedStatus) resource.status = matchedStatus;
        }

        resource.lastVerifiedDate = new Date();
        await resource.save();

        return res.status(200).json({
            success: true,
            message: `Resource '${resource.title}' updated successfully!`,
            resource,
        });
    } catch (error) {
        console.error("Error in updateAdminResource:", error);
        return res.status(500).json({
            success: false,
            message: "Failed to update resource",
            error: error.message,
        });
    }
};

/**
 * PATCH /api/v1/admin/preparation/resources/:id/status
 * Marks resource Obsolete, Active, or Deprecated
 */
export const toggleAdminResourceStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const { status } = req.body;

        const resource = await PreparationResource.findById(id);
        if (!resource) {
            return res.status(404).json({ success: false, message: "Resource not found" });
        }

        let newStatus = status;
        if (!newStatus) {
            newStatus = resource.status === "Obsolete" ? "Active" : "Obsolete";
        } else {
            const matched = RESOURCE_STATUSES.find(
                (s) => s.toLowerCase() === newStatus.trim().toLowerCase()
            );
            if (!matched) {
                return res.status(400).json({
                    success: false,
                    message: `Invalid status. Valid statuses: ${RESOURCE_STATUSES.join(", ")}`,
                });
            }
            newStatus = matched;
        }

        resource.status = newStatus;
        resource.lastVerifiedDate = new Date();
        await resource.save();

        return res.status(200).json({
            success: true,
            message: `Resource '${resource.title}' status marked as '${newStatus}'.`,
            resource,
        });
    } catch (error) {
        console.error("Error in toggleAdminResourceStatus:", error);
        return res.status(500).json({
            success: false,
            message: "Failed to change resource status",
            error: error.message,
        });
    }
};

/**
 * PATCH /api/v1/admin/preparation/resources/:id/verify
 * Refreshes the last-verified date and confirms resource is Active
 */
export const verifyAdminResource = async (req, res) => {
    try {
        const { id } = req.params;
        const resource = await PreparationResource.findById(id);
        if (!resource) {
            return res.status(404).json({ success: false, message: "Resource not found" });
        }

        resource.lastVerifiedDate = new Date();
        if (resource.status === "Obsolete" || resource.status === "Deprecated") {
            resource.status = "Active";
        }
        await resource.save();

        return res.status(200).json({
            success: true,
            message: `Resource '${resource.title}' verified on ${new Date().toLocaleDateString()}!`,
            resource,
        });
    } catch (error) {
        console.error("Error in verifyAdminResource:", error);
        return res.status(500).json({
            success: false,
            message: "Failed to verify resource",
            error: error.message,
        });
    }
};

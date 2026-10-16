import mongoose from "mongoose";
import { Company } from "../models/company.models.js";
import { Roadmap } from "../models/roadmap.models.js";
import { PreparationResource } from "../models/preparationResource.models.js";
import { UserRoadmapProgress } from "../models/userRoadmapProgress.models.js";
import { UserTargetCompany } from "../models/userTargetCompany.models.js";
import { UserResourceBookmark } from "../models/userResourceBookmark.models.js";

/**
 * GET /api/v1/preparation/companies
 * Fetches all preparation companies with search, category filtering, and roadmap summary
 */
export const getPreparationCompanies = async (req, res) => {
    try {
        const { search, category, tier } = req.query;

        const filter = {
            isPreparationHubActive: true,
        };

        if (category && category !== "All") {
            filter.category = category;
        }

        if (tier && tier !== "All") {
            filter.tier = tier;
        }

        if (search && search.trim()) {
            const queryRegex = new RegExp(search.trim(), "i");
            filter.$or = [
                { companyName: queryRegex },
                { description: queryRegex },
                { hiringTracks: queryRegex },
            ];
        }

        const companies = await Company.find(filter)
            .select("companyName slug logo category tier description careersUrl officialCareersUrl hiringTracks location website createdAt")
            .sort({ companyName: 1 })
            .lean();

        // Aggregate roadmap counts and role previews for each company
        const roadmapStats = await Roadmap.aggregate([
            { $match: { publicationStatus: { $ne: "Archived" } } },
            {
                $group: {
                    _id: "$company",
                    roadmapsCount: { $sum: 1 },
                    roles: { $addToSet: "$role" },
                    roadmaps: {
                        $push: {
                            _id: "$_id",
                            title: "$title",
                            slug: "$slug",
                            role: "$role",
                            hiringTrack: "$hiringTrack",
                            difficulty: "$difficulty",
                            estimatedDuration: "$estimatedDuration",
                        },
                    },
                },
            },
        ]);

        const statsMap = new Map();
        roadmapStats.forEach((stat) => {
            statsMap.set(String(stat._id), stat);
        });

        // User target companies if user is logged in
        let userTargetCompanyIds = new Set();
        if (req.id) {
            const targets = await UserTargetCompany.find({ user: req.id }).select("company").lean();
            userTargetCompanyIds = new Set(targets.map((t) => String(t.company)));
        }

        const enrichedCompanies = companies.map((comp) => {
            const stats = statsMap.get(String(comp._id));
            return {
                ...comp,
                roadmapsCount: stats ? stats.roadmapsCount : 0,
                roles: stats ? stats.roles : [],
                roadmaps: stats ? stats.roadmaps : [],
                isTargetCompany: userTargetCompanyIds.has(String(comp._id)),
            };
        });

        return res.status(200).json({
            success: true,
            count: enrichedCompanies.length,
            companies: enrichedCompanies,
        });
    } catch (error) {
        console.error("Error in getPreparationCompanies:", error);
        return res.status(500).json({
            success: false,
            message: "Failed to retrieve preparation companies",
            error: error.message,
        });
    }
};

/**
 * GET /api/v1/preparation/companies/:slugOrId
 * Fetches company details and all active roadmaps for the company
 */
export const getCompanyPreparationDetails = async (req, res) => {
    try {
        const { slugOrId } = req.params;

        const isObjectId = mongoose.Types.ObjectId.isValid(slugOrId);
        const query = isObjectId
            ? { $or: [{ _id: slugOrId }, { slug: slugOrId.toLowerCase() }] }
            : { slug: slugOrId.toLowerCase() };

        query.isPreparationHubActive = true;

        const company = await Company.findOne(query).lean();
        if (!company) {
            return res.status(404).json({
                success: false,
                message: "Company not found in preparation hub",
            });
        }

        // Fetch active roadmaps for this company
        const roadmaps = await Roadmap.find({ company: company._id, publicationStatus: { $ne: "Archived" } })
            .select("title slug role hiringTrack description estimatedDuration difficulty isIndicativeNotice indicativeNoticeText stages version createdAt")
            .sort({ createdAt: 1 })
            .lean();

        // Enhance roadmaps with stage and topic counts
        const enhancedRoadmaps = roadmaps.map((r) => {
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

        // User target status & progress if authenticated
        let isTargetCompany = false;
        let userProgressMap = {};
        if (req.id) {
            const target = await UserTargetCompany.findOne({ user: req.id, company: company._id });
            isTargetCompany = !!target;

            const roadmapIds = roadmaps.map((r) => r._id);
            const userProgressList = await UserRoadmapProgress.find({
                user: req.id,
                roadmap: { $in: roadmapIds },
            }).lean();

            userProgressList.forEach((p) => {
                userProgressMap[String(p.roadmap)] = {
                    status: p.status,
                    completionPercentage: p.completionPercentage,
                    completedTopicsCount: p.completedTopics?.length || 0,
                };
            });
        }

        const finalRoadmaps = enhancedRoadmaps.map((r) => ({
            ...r,
            userProgress: userProgressMap[String(r._id)] || null,
        }));

        return res.status(200).json({
            success: true,
            company: {
                ...company,
                isTargetCompany,
            },
            roadmaps: finalRoadmaps,
        });
    } catch (error) {
        console.error("Error in getCompanyPreparationDetails:", error);
        return res.status(500).json({
            success: false,
            message: "Failed to retrieve company preparation details",
            error: error.message,
        });
    }
};

/**
 * GET /api/v1/preparation/roadmaps/:slugOrId
 * Fetches full roadmap details with populated company and learning resources
 */
export const getRoadmapDetails = async (req, res) => {
    try {
        const { slugOrId } = req.params;

        const isObjectId = mongoose.Types.ObjectId.isValid(slugOrId);
        const query = isObjectId
            ? { $or: [{ _id: slugOrId }, { slug: slugOrId.toLowerCase() }] }
            : { slug: slugOrId.toLowerCase() };

        query.publicationStatus = { $ne: "Archived" };

        const roadmap = await Roadmap.findOne(query)
            .populate({
                path: "company",
                select: "companyName slug logo category tier careersUrl officialCareersUrl description location website",
            })
            .populate({
                path: "stages.topics.resources",
                select: "title url category type sourceType isOfficial isFree estimatedTimeMinutes description difficulty status lastVerifiedDate provider",
            });

        if (!roadmap) {
            return res.status(404).json({
                success: false,
                message: "Preparation roadmap not found",
            });
        }

        // Fetch user progress, notes, and bookmarked resources if authenticated
        let userProgress = null;
        let userBookmarkedResourceIds = [];
        let topicNotes = {};

        if (req.id) {
            const [progress, bookmarks] = await Promise.all([
                UserRoadmapProgress.findOne({
                    user: req.id,
                    roadmap: roadmap._id,
                }).lean(),
                UserResourceBookmark.find({ user: req.id }).select("resource").lean(),
            ]);

            userBookmarkedResourceIds = (bookmarks || []).map((b) => String(b.resource));

            if (progress) {
                userProgress = {
                    status: progress.status,
                    completionPercentage: progress.completionPercentage || progress.overallProgressPercentage || 0,
                    overallProgressPercentage: progress.overallProgressPercentage || progress.completionPercentage || 0,
                    completedTopicIds: (progress.completedTopics || []).map((t) => t.topicId),
                    startedAt: progress.startedAt,
                    lastStudiedAt: progress.lastStudiedAt,
                };

                // Map topic notes
                if (Array.isArray(progress.topicNotes)) {
                    progress.topicNotes.forEach((tn) => {
                        if (tn.topicId) topicNotes[tn.topicId] = tn.note || "";
                    });
                }
                if (Array.isArray(progress.completedTopics)) {
                    progress.completedTopics.forEach((ct) => {
                        if (ct.topicId && ct.notes && !topicNotes[ct.topicId]) {
                            topicNotes[ct.topicId] = ct.notes;
                        }
                    });
                }
            }
        }

        const roadmapObj = roadmap.toObject ? roadmap.toObject() : roadmap;
        if (req.id && roadmapObj.stages) {
            roadmapObj.stages = roadmapObj.stages.map((stage) => ({
                ...stage,
                topics: (stage.topics || []).map((t) => ({
                    ...t,
                    userNote: topicNotes[t.topicId] || "",
                })),
            }));
        }

        return res.status(200).json({
            success: true,
            roadmap: roadmapObj,
            userProgress,
            userBookmarkedResourceIds,
            topicNotes,
        });
    } catch (error) {
        console.error("Error in getRoadmapDetails:", error);
        return res.status(500).json({
            success: false,
            message: "Failed to retrieve roadmap details",
            error: error.message,
        });
    }
};

/**
 * POST /api/v1/preparation/roadmaps/:roadmapId/progress
 * Toggle completion of a topic for the authenticated user
 */
export const toggleTopicProgress = async (req, res) => {
    try {
        const { roadmapId } = req.params;
        const { topicId, completed, confidenceLevel, notes } = req.body;

        if (!topicId) {
            return res.status(400).json({
                success: false,
                message: "Stable topicId is required",
            });
        }

        const roadmap = await Roadmap.findById(roadmapId);
        if (!roadmap) {
            return res.status(404).json({
                success: false,
                message: "Roadmap not found",
            });
        }

        let progress = await UserRoadmapProgress.findOne({
            user: req.id,
            roadmap: roadmap._id,
        });

        if (!progress) {
            progress = new UserRoadmapProgress({
                user: req.id,
                roadmap: roadmap._id,
                roadmapVersion: roadmap.version,
                completedTopics: [],
            });
        }

        const existingIndex = progress.completedTopics.findIndex((t) => t.topicId === topicId);

        if (completed) {
            if (existingIndex === -1) {
                progress.completedTopics.push({
                    topicId,
                    completedAt: new Date(),
                    confidenceLevel: confidenceLevel || "Confident",
                    notes: notes || "",
                });
            } else {
                if (confidenceLevel) progress.completedTopics[existingIndex].confidenceLevel = confidenceLevel;
                if (notes !== undefined) progress.completedTopics[existingIndex].notes = notes;
            }
        } else {
            if (existingIndex !== -1) {
                progress.completedTopics.splice(existingIndex, 1);
            }
        }

        await progress.syncWithRoadmap(roadmap);

        return res.status(200).json({
            success: true,
            message: completed ? "Topic marked as completed" : "Topic marked as incomplete",
            userProgress: {
                status: progress.status,
                completionPercentage: progress.completionPercentage,
                completedTopicIds: progress.completedTopics.map((t) => t.topicId),
                lastActiveAt: progress.lastActiveAt,
            },
        });
    } catch (error) {
        console.error("Error in toggleTopicProgress:", error);
        return res.status(500).json({
            success: false,
            message: "Failed to update topic progress",
            error: error.message,
        });
    }
};

/**
 * POST /api/v1/preparation/targets/:companyId
 * Toggle company target bookmark for authenticated user
 */
export const toggleTargetCompany = async (req, res) => {
    try {
        const { companyId } = req.params;
        const { priority, targetRole, notes } = req.body || {};

        const company = await Company.findById(companyId);
        if (!company) {
            return res.status(404).json({
                success: false,
                message: "Company not found",
            });
        }

        const existing = await UserTargetCompany.findOne({
            user: req.id,
            company: company._id,
        });

        if (existing) {
            await UserTargetCompany.findByIdAndDelete(existing._id);
            return res.status(200).json({
                success: true,
                isTargetCompany: false,
                message: `${company.companyName} removed from your target companies`,
            });
        }

        await UserTargetCompany.create({
            user: req.id,
            company: company._id,
            priority: priority || "Primary",
            targetRole: targetRole || "Software Engineer",
            notes: notes || "",
        });

        return res.status(201).json({
            success: true,
            isTargetCompany: true,
            message: `${company.companyName} added to your target companies!`,
        });
    } catch (error) {
        console.error("Error in toggleTargetCompany:", error);
        return res.status(500).json({
            success: false,
            message: "Failed to toggle target company",
            error: error.message,
        });
    }
};

/**
 * GET /api/v1/preparation/targets
 * Get list of target companies for authenticated candidate
 */
export const getUserTargetCompanies = async (req, res) => {
    try {
        const targets = await UserTargetCompany.find({ user: req.id })
            .populate({
                path: "company",
                select: "companyName slug logo category tier careersUrl officialCareersUrl description",
            })
            .sort({ priority: 1, createdAt: -1 });

        return res.status(200).json({
            success: true,
            targets,
        });
    } catch (error) {
        console.error("Error in getUserTargetCompanies:", error);
        return res.status(500).json({
            success: false,
            message: "Failed to retrieve target companies",
            error: error.message,
        });
    }
};

/**
 * POST /api/v1/preparation/resources/:resourceId/bookmark
 * Toggles a learning resource bookmark for the authenticated user
 */
export const toggleResourceBookmark = async (req, res) => {
    try {
        const { resourceId } = req.params;
        const { notes = "" } = req.body || {};

        if (!mongoose.Types.ObjectId.isValid(resourceId)) {
            return res.status(400).json({ success: false, message: "Invalid resource ID" });
        }

        const resource = await PreparationResource.findById(resourceId);
        if (!resource) {
            return res.status(404).json({ success: false, message: "Learning resource not found" });
        }

        const existing = await UserResourceBookmark.findOne({
            user: req.id,
            resource: resource._id,
        });

        if (existing) {
            await UserResourceBookmark.findByIdAndDelete(existing._id);
            return res.status(200).json({
                success: true,
                isBookmarked: false,
                message: `'${resource.title}' removed from your bookmarks`,
                resourceId: resource._id,
            });
        }

        const newBookmark = await UserResourceBookmark.create({
            user: req.id,
            resource: resource._id,
            notes: typeof notes === "string" ? notes.trim() : "",
        });

        return res.status(201).json({
            success: true,
            isBookmarked: true,
            message: `'${resource.title}' saved to your bookmarks!`,
            bookmark: newBookmark,
            resourceId: resource._id,
        });
    } catch (error) {
        console.error("Error in toggleResourceBookmark:", error);
        return res.status(500).json({
            success: false,
            message: "Failed to toggle resource bookmark",
            error: error.message,
        });
    }
};

/**
 * GET /api/v1/preparation/my-resource-bookmarks
 * Retrieves all bookmarked learning resources for the authenticated user
 */
export const getUserResourceBookmarks = async (req, res) => {
    try {
        const { category, type, search } = req.query;

        const bookmarks = await UserResourceBookmark.find({ user: req.id })
            .populate({
                path: "resource",
                select: "title url category type sourceType isOfficial isFree estimatedTimeMinutes description tags difficulty status lastVerifiedDate provider",
            })
            .sort({ createdAt: -1 })
            .lean();

        let filtered = bookmarks.filter((b) => b.resource);

        if (category && category !== "All") {
            filtered = filtered.filter((b) => b.resource.category === category);
        }

        if (type && type !== "All") {
            filtered = filtered.filter((b) => b.resource.type === type);
        }

        if (search && search.trim()) {
            const queryRegex = new RegExp(search.trim(), "i");
            filtered = filtered.filter(
                (b) =>
                    queryRegex.test(b.resource.title) ||
                    queryRegex.test(b.resource.description) ||
                    (b.resource.tags && b.resource.tags.some((t) => queryRegex.test(t))) ||
                    (b.notes && queryRegex.test(b.notes))
            );
        }

        return res.status(200).json({
            success: true,
            count: filtered.length,
            bookmarks: filtered,
        });
    } catch (error) {
        console.error("Error in getUserResourceBookmarks:", error);
        return res.status(500).json({
            success: false,
            message: "Failed to retrieve bookmarked resources",
            error: error.message,
        });
    }
};

/**
 * GET /api/v1/preparation/resources
 * Public directory of learning resources with multi-attribute filtering
 */
export const getPreparationResources = async (req, res) => {
    try {
        const { category, type, difficulty, sourceType, search } = req.query;

        const filter = {
            status: { $ne: "Obsolete" },
        };

        if (category && category !== "All") {
            filter.category = category;
        }

        if (type && type !== "All") {
            filter.type = type;
        }

        if (difficulty && difficulty !== "All") {
            filter.difficulty = difficulty;
        }

        if (sourceType && sourceType !== "All") {
            filter.sourceType = sourceType;
        }

        if (search && search.trim()) {
            const queryRegex = new RegExp(search.trim(), "i");
            filter.$or = [
                { title: queryRegex },
                { description: queryRegex },
                { provider: queryRegex },
                { tags: queryRegex },
            ];
        }

        const resources = await PreparationResource.find(filter)
            .sort({ category: 1, title: 1 })
            .lean();

        let userBookmarkedIds = [];
        if (req.id) {
            const userBookmarks = await UserResourceBookmark.find({ user: req.id })
                .select("resource")
                .lean();
            userBookmarkedIds = userBookmarks.map((b) => String(b.resource));
        }

        return res.status(200).json({
            success: true,
            count: resources.length,
            resources,
            userBookmarkedIds,
        });
    } catch (error) {
        console.error("Error in getPreparationResources:", error);
        return res.status(500).json({
            success: false,
            message: "Failed to retrieve preparation resources",
            error: error.message,
        });
    }
};

/**
 * GET /api/v1/preparation/continue
 * Retrieves the user's last active roadmap and upcoming incomplete topics for instant resumption
 */
export const getContinuePreparation = async (req, res) => {
    try {
        const userId = req.id;

        const progressList = await UserRoadmapProgress.find({ user: userId })
            .populate({
                path: "roadmap",
                select: "title slug role hiringTrack description estimatedDuration difficulty company stages publicationStatus",
                populate: {
                    path: "company",
                    select: "companyName slug logo category tier",
                },
            })
            .sort({ lastStudiedAt: -1 })
            .lean();

        const activeProgress =
            progressList.find(
                (p) => p.roadmap && p.roadmap.publicationStatus !== "Archived" && p.status !== "Completed"
            ) ||
            progressList.find(
                (p) => p.roadmap && p.roadmap.publicationStatus !== "Archived"
            );

        if (!activeProgress || !activeProgress.roadmap) {
            return res.status(200).json({
                success: true,
                hasActivePreparation: false,
                continuePreparation: null,
            });
        }

        const completedSet = new Set(
            (activeProgress.completedTopics || []).map((t) => t.topicId)
        );

        const incompleteTopics = [];
        for (const stage of activeProgress.roadmap.stages || []) {
            for (const topic of stage.topics || []) {
                if (!topic.isDeprecated && !completedSet.has(topic.topicId)) {
                    incompleteTopics.push({
                        topicId: topic.topicId,
                        title: topic.title,
                        stageTitle: stage.title,
                        order: topic.order,
                        difficulty: topic.difficulty,
                        importance: topic.importance,
                        estimatedHours: topic.estimatedHours,
                        resourcesCount: topic.resources ? topic.resources.length : 0,
                    });
                }
            }
        }

        const continuePreparation = {
            roadmapId: activeProgress.roadmap._id,
            roadmapSlug: activeProgress.roadmap.slug,
            roadmapTitle: activeProgress.roadmap.title,
            role: activeProgress.roadmap.role,
            hiringTrack: activeProgress.roadmap.hiringTrack,
            difficulty: activeProgress.roadmap.difficulty,
            company: activeProgress.roadmap.company,
            completionPercentage: activeProgress.overallProgressPercentage || 0,
            completedTopicsCount: activeProgress.completedTopicsCount || (activeProgress.completedTopics?.length || 0),
            totalTopicsCount: activeProgress.totalTopicsCount || 0,
            lastActiveTopicId: activeProgress.lastActiveTopicId || null,
            lastStudiedAt: activeProgress.lastStudiedAt,
            nextTopic: incompleteTopics[0] || null,
            incompleteTopics: incompleteTopics.slice(0, 6),
            totalIncompleteTopics: incompleteTopics.length,
        };

        return res.status(200).json({
            success: true,
            hasActivePreparation: true,
            continuePreparation,
        });
    } catch (error) {
        console.error("Error in getContinuePreparation:", error);
        return res.status(500).json({
            success: false,
            message: "Failed to retrieve continue preparation state",
            error: error.message,
        });
    }
};

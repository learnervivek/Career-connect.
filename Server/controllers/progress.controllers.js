import mongoose from "mongoose";
import { UserRoadmapProgress } from "../models/userRoadmapProgress.models.js";
import { UserTargetCompany } from "../models/userTargetCompany.models.js";
import { Roadmap } from "../models/roadmap.models.js";
import { Company } from "../models/company.models.js";
import { UserResourceBookmark } from "../models/userResourceBookmark.models.js";

/**
 * Helper to resolve Roadmap by either ObjectId or unique slug.
 */
const resolveRoadmap = async (roadmapIdOrSlug) => {
    if (!roadmapIdOrSlug) return null;
    const isObjectId = mongoose.Types.ObjectId.isValid(roadmapIdOrSlug);
    const query = isObjectId
        ? { $or: [{ _id: roadmapIdOrSlug }, { slug: String(roadmapIdOrSlug).toLowerCase() }] }
        : { slug: String(roadmapIdOrSlug).toLowerCase() };

    return await Roadmap.findOne({
        ...query,
        publicationStatus: { $ne: "Archived" },
    });
};

/**
 * Helper to compute detailed stage-level and overall progress for a roadmap.
 */
const computeDetailedProgress = (roadmap, progressDoc) => {
    const completedSet = new Set(
        (progressDoc?.completedTopics || []).map((t) => t.topicId)
    );

    const stagesProgress = (roadmap.stages || []).map((stage) => {
        const stageTopics = (stage.topics || []).filter((t) => !t.isDeprecated && t.topicId);
        const totalInStage = stageTopics.length;
        const completedInStage = stageTopics.filter((t) => completedSet.has(t.topicId)).length;
        const remainingInStage = Math.max(0, totalInStage - completedInStage);
        const stagePercentage =
            totalInStage > 0 ? Math.round((completedInStage / totalInStage) * 100) : 0;

        return {
            stageId: stage.stageId,
            title: stage.title,
            order: stage.order,
            description: stage.description,
            estimatedWeeks: stage.estimatedWeeks,
            totalTopics: totalInStage,
            completedTopics: completedInStage,
            remainingTopics: remainingInStage,
            percentage: stagePercentage,
            isCompleted: totalInStage > 0 && completedInStage === totalInStage,
            topics: stageTopics.map((t) => ({
                topicId: t.topicId,
                title: t.title,
                order: t.order,
                difficulty: t.difficulty,
                importance: t.importance,
                isCompleted: completedSet.has(t.topicId),
            })),
        };
    });

    const allActiveTopicIds = roadmap.getAllTopicIds ? roadmap.getAllTopicIds() : [];
    const totalTopicsCount = allActiveTopicIds.length;
    const completedTopicsCount = allActiveTopicIds.filter((id) => completedSet.has(id)).length;
    const remainingTopicsCount = Math.max(0, totalTopicsCount - completedTopicsCount);
    const overallProgressPercentage =
        totalTopicsCount > 0 ? Math.round((completedTopicsCount / totalTopicsCount) * 100) : 0;

    const completedStagesCount = stagesProgress.filter((s) => s.isCompleted).length;
    const totalStagesCount = stagesProgress.length;

    return {
        isEnrolled: !!progressDoc,
        status: progressDoc?.status || "Not Started",
        overallProgressPercentage,
        completionPercentage: overallProgressPercentage,
        totalTopicsCount,
        completedTopicsCount,
        remainingTopicsCount,
        totalStagesCount,
        completedStagesCount,
        completedTopicIds: Array.from(completedSet),
        completedStages: stagesProgress.filter((s) => s.isCompleted).map((s) => s.stageId),
        startedAt: progressDoc?.startedAt || null,
        lastStudiedAt: progressDoc?.lastStudiedAt || null,
        completedAt: progressDoc?.completedAt || null,
        stagesProgress,
    };
};

/**
 * GET /api/v1/progress/:roadmapId
 * Retrieves authenticated user's progress on a roadmap including stage breakdowns.
 */
export const getRoadmapProgress = async (req, res) => {
    try {
        const { roadmapId } = req.params;
        const roadmap = await resolveRoadmap(roadmapId);

        if (!roadmap) {
            return res.status(404).json({
                success: false,
                message: "Preparation roadmap not found or is currently archived",
            });
        }

        const progressDoc = await UserRoadmapProgress.findOne({
            user: req.id,
            roadmap: roadmap._id,
        });

        const detailedProgress = computeDetailedProgress(roadmap, progressDoc);

        return res.status(200).json({
            success: true,
            roadmapId: roadmap._id,
            roadmapSlug: roadmap.slug,
            roadmapTitle: roadmap.title,
            progress: detailedProgress,
        });
    } catch (error) {
        console.error("Error in getRoadmapProgress:", error);
        return res.status(500).json({
            success: false,
            message: "Failed to retrieve roadmap progress",
            error: error.message,
        });
    }
};

/**
 * POST /api/v1/progress/:roadmapId/start
 * Explicitly enrolls/starts a roadmap for the authenticated user.
 */
export const startRoadmap = async (req, res) => {
    try {
        const { roadmapId } = req.params;
        const roadmap = await resolveRoadmap(roadmapId);

        if (!roadmap) {
            return res.status(404).json({
                success: false,
                message: "Roadmap not found or is archived",
            });
        }

        let progressDoc = await UserRoadmapProgress.findOne({
            user: req.id,
            roadmap: roadmap._id,
        });

        if (!progressDoc) {
            progressDoc = new UserRoadmapProgress({
                user: req.id,
                roadmap: roadmap._id,
                roadmapVersion: roadmap.version || 1,
                completedTopics: [],
                status: "In Progress",
                startedAt: new Date(),
                lastStudiedAt: new Date(),
            });
        } else if (progressDoc.status === "Paused" || progressDoc.status === "Not Started") {
            progressDoc.status = "In Progress";
            progressDoc.lastStudiedAt = new Date();
        }

        progressDoc.recalculateProgress(roadmap);
        await progressDoc.save();

        const detailedProgress = computeDetailedProgress(roadmap, progressDoc);

        return res.status(200).json({
            success: true,
            message: "Roadmap started successfully! Your progress is now being tracked.",
            progress: detailedProgress,
        });
    } catch (error) {
        console.error("Error in startRoadmap:", error);
        return res.status(500).json({
            success: false,
            message: "Failed to start roadmap",
            error: error.message,
        });
    }
};

/**
 * PUT /api/v1/progress/:roadmapId/topics/:topicId
 * Marks a topic complete or incomplete for the authenticated user.
 */
export const updateTopicProgress = async (req, res) => {
    try {
        const { roadmapId, topicId } = req.params;
        const { completed, isCompleted, confidenceLevel, notes } = req.body || {};
        const isDone = completed !== undefined ? completed : (isCompleted !== undefined ? isCompleted : true);

        if (!topicId || typeof topicId !== "string") {
            return res.status(400).json({
                success: false,
                message: "A valid stable topicId is required",
            });
        }

        const roadmap = await resolveRoadmap(roadmapId);
        if (!roadmap) {
            return res.status(404).json({
                success: false,
                message: "Roadmap not found",
            });
        }

        // Validate that topic belongs to this roadmap (support either stable topicId or MongoDB _id)
        let resolvedTopicId = topicId;
        let matchedTopic = null;
        for (const stage of roadmap.stages || []) {
            for (const top of stage.topics || []) {
                if (top.topicId === topicId || String(top._id) === topicId) {
                    matchedTopic = top;
                    resolvedTopicId = top.topicId;
                    break;
                }
            }
            if (matchedTopic) break;
        }

        if (!matchedTopic) {
            return res.status(400).json({
                success: false,
                message: `Topic '${topicId}' does not belong to roadmap '${roadmap.title}'`,
            });
        }

        let progressDoc = await UserRoadmapProgress.findOne({
            user: req.id,
            roadmap: roadmap._id,
        });

        if (!progressDoc) {
            progressDoc = new UserRoadmapProgress({
                user: req.id,
                roadmap: roadmap._id,
                roadmapVersion: roadmap.version || 1,
                completedTopics: [],
                status: "In Progress",
                startedAt: new Date(),
            });
        }

        const existingIndex = progressDoc.completedTopics.findIndex(
            (t) => t.topicId === resolvedTopicId || (matchedTopic._id && t.topicId === String(matchedTopic._id))
        );

        if (isDone) {
            if (existingIndex === -1) {
                progressDoc.completedTopics.push({
                    topicId: resolvedTopicId,
                    completedAt: new Date(),
                    confidenceLevel: confidenceLevel || "Confident",
                    notes: notes || "",
                });
            } else {
                if (confidenceLevel) progressDoc.completedTopics[existingIndex].confidenceLevel = confidenceLevel;
                if (notes !== undefined) progressDoc.completedTopics[existingIndex].notes = notes;
            }
        } else {
            if (existingIndex !== -1) {
                progressDoc.completedTopics.splice(existingIndex, 1);
            }
        }

        progressDoc.lastActiveTopicId = resolvedTopicId;
        progressDoc.recalculateProgress(roadmap);
        await progressDoc.save();

        const detailedProgress = computeDetailedProgress(roadmap, progressDoc);

        return res.status(200).json({
            success: true,
            message: isDone
                ? "Topic marked as complete"
                : "Topic marked as incomplete",
            topicId: resolvedTopicId,
            completed: isDone,
            progress: detailedProgress,
        });
    } catch (error) {
        console.error("Error in updateTopicProgress:", error);
        return res.status(500).json({
            success: false,
            message: "Failed to update topic progress",
            error: error.message,
        });
    }
};

/**
 * GET /api/v1/my-preparation
 * Returns personal preparation dashboard metrics: target companies and active roadmaps.
 */
export const getMyPreparation = async (req, res) => {
    try {
        const userId = req.id;

        // 1. Fetch Target Companies for this user
        const targetCompanies = await UserTargetCompany.find({ user: userId })
            .populate({
                path: "company",
                select: "companyName slug logo category tier location careersUrl officialCareersUrl description",
            })
            .populate({
                path: "activeRoadmap",
                select: "title slug role estimatedDuration difficulty",
            })
            .sort({ priority: 1, createdAt: -1 })
            .lean();

        // 2. Fetch User Roadmap Progress for this user
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

        // Filter and enrich active roadmaps
        const activeRoadmaps = progressList
            .filter((p) => p.roadmap && p.roadmap.publicationStatus !== "Archived")
            .map((p) => {
                const totalTopics = p.totalTopicsCount || (p.roadmap?.stages
                    ? p.roadmap.stages.reduce((acc, s) => acc + (s.topics?.length || 0), 0)
                    : 0);
                const completedTopics = p.completedTopicsCount || (p.completedTopics?.length || 0);
                const remainingTopics = Math.max(0, totalTopics - completedTopics);

                return {
                    _id: p._id,
                    roadmapId: p.roadmap._id,
                    title: p.roadmap.title,
                    slug: p.roadmap.slug,
                    role: p.roadmap.role,
                    hiringTrack: p.roadmap.hiringTrack,
                    difficulty: p.roadmap.difficulty,
                    estimatedDuration: p.roadmap.estimatedDuration,
                    company: p.roadmap.company,
                    status: p.status,
                    overallProgressPercentage: p.overallProgressPercentage || 0,
                    completionPercentage: p.overallProgressPercentage || 0,
                    completedTopicsCount: completedTopics,
                    totalTopicsCount: totalTopics,
                    remainingTopicsCount: remainingTopics,
                    completedStagesCount: p.completedStages?.length || 0,
                    totalStagesCount: p.roadmap.stages?.length || 0,
                    startedAt: p.startedAt,
                    lastStudiedAt: p.lastStudiedAt,
                    completedAt: p.completedAt,
                };
            });

        // 3. Compute Continue Preparation Data
        const lastActiveProgress =
            progressList.find(
                (p) => p.roadmap && p.roadmap.publicationStatus !== "Archived" && p.status !== "Completed"
            ) ||
            progressList.find(
                (p) => p.roadmap && p.roadmap.publicationStatus !== "Archived"
            );

        let continuePreparation = null;
        if (lastActiveProgress && lastActiveProgress.roadmap) {
            const completedSet = new Set(
                (lastActiveProgress.completedTopics || []).map((t) => t.topicId)
            );

            const incompleteTopics = [];
            for (const stage of lastActiveProgress.roadmap.stages || []) {
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

            continuePreparation = {
                roadmapId: lastActiveProgress.roadmap._id,
                roadmapSlug: lastActiveProgress.roadmap.slug,
                roadmapTitle: lastActiveProgress.roadmap.title,
                role: lastActiveProgress.roadmap.role,
                hiringTrack: lastActiveProgress.roadmap.hiringTrack,
                difficulty: lastActiveProgress.roadmap.difficulty,
                company: lastActiveProgress.roadmap.company,
                completionPercentage: lastActiveProgress.overallProgressPercentage || 0,
                completedTopicsCount: lastActiveProgress.completedTopicsCount || (lastActiveProgress.completedTopics?.length || 0),
                totalTopicsCount: lastActiveProgress.totalTopicsCount || 0,
                lastActiveTopicId: lastActiveProgress.lastActiveTopicId || null,
                lastStudiedAt: lastActiveProgress.lastStudiedAt,
                nextTopic: incompleteTopics[0] || null,
                incompleteTopics: incompleteTopics.slice(0, 6),
                totalIncompleteTopics: incompleteTopics.length,
            };
        }

        const bookmarkedResourcesCount = await UserResourceBookmark.countDocuments({ user: userId });

        // 4. Compute Summary Statistics
        const completedRoadmapsCount = activeRoadmaps.filter((r) => r.status === "Completed").length;
        const totalTopicsCompleted = activeRoadmaps.reduce(
            (acc, r) => acc + (r.completedTopicsCount || 0),
            0
        );

        const averageProgress =
            activeRoadmaps.length > 0
                ? Math.round(
                      activeRoadmaps.reduce((acc, r) => acc + r.overallProgressPercentage, 0) /
                          activeRoadmaps.length
                  )
                : 0;

        return res.status(200).json({
            success: true,
            summary: {
                totalTargetCompanies: targetCompanies.length,
                activeRoadmapsCount: activeRoadmaps.length,
                completedRoadmapsCount,
                totalTopicsCompleted,
                averageProgress,
                bookmarkedResourcesCount,
            },
            continuePreparation,
            targetCompanies: targetCompanies.filter((tc) => tc.company),
            activeRoadmaps,
        });
    } catch (error) {
        console.error("Error in getMyPreparation:", error);
        return res.status(500).json({
            success: false,
            message: "Failed to retrieve personal preparation dashboard",
            error: error.message,
        });
    }
};

/**
 * PUT /api/v1/progress/:roadmapId/topics/:topicId/note
 * Saves or updates personal preparation notes on a topic for the authenticated candidate
 */
export const saveTopicNote = async (req, res) => {
    try {
        const { roadmapId, topicId } = req.params;
        const { note = "" } = req.body || {};

        const roadmap = await resolveRoadmap(roadmapId);
        if (!roadmap) {
            return res.status(404).json({ success: false, message: "Roadmap not found" });
        }

        // Validate that topic belongs to this roadmap
        let resolvedTopicId = topicId;
        let matchedTopic = null;
        for (const stage of roadmap.stages || []) {
            for (const top of stage.topics || []) {
                if (top.topicId === topicId || String(top._id) === topicId) {
                    matchedTopic = top;
                    resolvedTopicId = top.topicId;
                    break;
                }
            }
            if (matchedTopic) break;
        }

        if (!matchedTopic) {
            return res.status(400).json({
                success: false,
                message: `Topic '${topicId}' does not belong to roadmap '${roadmap.title}'`,
            });
        }

        let progressDoc = await UserRoadmapProgress.findOne({
            user: req.id,
            roadmap: roadmap._id,
        });

        if (!progressDoc) {
            progressDoc = new UserRoadmapProgress({
                user: req.id,
                roadmap: roadmap._id,
                roadmapVersion: roadmap.version || 1,
                completedTopics: [],
                topicNotes: [],
                status: "In Progress",
                startedAt: new Date(),
            });
        }

        if (!Array.isArray(progressDoc.topicNotes)) {
            progressDoc.topicNotes = [];
        }

        const noteIndex = progressDoc.topicNotes.findIndex((n) => n.topicId === resolvedTopicId);
        if (noteIndex === -1) {
            progressDoc.topicNotes.push({
                topicId: resolvedTopicId,
                note: typeof note === "string" ? note.trim() : "",
                updatedAt: new Date(),
            });
        } else {
            progressDoc.topicNotes[noteIndex].note = typeof note === "string" ? note.trim() : "";
            progressDoc.topicNotes[noteIndex].updatedAt = new Date();
        }

        // Also sync note on completedTopics entry if present
        const completedIndex = progressDoc.completedTopics.findIndex((t) => t.topicId === resolvedTopicId);
        if (completedIndex !== -1) {
            progressDoc.completedTopics[completedIndex].notes = typeof note === "string" ? note.trim() : "";
        }

        progressDoc.lastActiveTopicId = resolvedTopicId;
        progressDoc.lastStudiedAt = new Date();
        await progressDoc.save();

        return res.status(200).json({
            success: true,
            message: "Personal preparation note saved successfully",
            topicId: resolvedTopicId,
            note: typeof note === "string" ? note.trim() : "",
            updatedAt: new Date(),
        });
    } catch (error) {
        console.error("Error in saveTopicNote:", error);
        return res.status(500).json({
            success: false,
            message: "Failed to save topic note",
            error: error.message,
        });
    }
};

/**
 * POST /api/v1/my-target-companies
 * Adds or updates a company in the user's personal target list.
 */
export const addOrUpdateTargetCompany = async (req, res) => {
    try {
        const {
            companyId,
            priority = "Target",
            targetRole = "Software Engineer",
            targetHiringTrack = "General",
            preparationStatus = "Actively Preparing",
            targetDate,
            activeRoadmap,
            notes = "",
        } = req.body || {};

        if (!companyId) {
            return res.status(400).json({
                success: false,
                message: "Company ID or slug is required",
            });
        }

        // Resolve company by ID or slug
        const isObjectId = mongoose.Types.ObjectId.isValid(companyId);
        const company = isObjectId
            ? await Company.findById(companyId)
            : await Company.findOne({ slug: String(companyId).toLowerCase() });

        if (!company) {
            return res.status(404).json({
                success: false,
                message: "Company not found",
            });
        }

        // Validate optional activeRoadmap if provided
        let validRoadmapId = null;
        if (activeRoadmap) {
            const rm = await resolveRoadmap(activeRoadmap);
            if (rm) validRoadmapId = rm._id;
        }

        // Idempotent find or create
        let targetDoc = await UserTargetCompany.findOne({
            user: req.id,
            company: company._id,
        });

        let isCreated = false;
        if (!targetDoc) {
            targetDoc = new UserTargetCompany({
                user: req.id,
                company: company._id,
            });
            isCreated = true;
        }

        targetDoc.priority = priority;
        targetDoc.targetRole = targetRole;
        targetDoc.targetHiringTrack = targetHiringTrack;
        targetDoc.preparationStatus = preparationStatus;
        if (targetDate) targetDoc.targetDate = new Date(targetDate);
        if (validRoadmapId) targetDoc.activeRoadmap = validRoadmapId;
        if (notes !== undefined) targetDoc.notes = notes;

        await targetDoc.save();

        const populated = await UserTargetCompany.findById(targetDoc._id)
            .populate("company", "companyName slug logo category tier location careersUrl officialCareersUrl description")
            .populate("activeRoadmap", "title slug role estimatedDuration difficulty");

        return res.status(isCreated ? 201 : 200).json({
            success: true,
            isTargetCompany: true,
            message: isCreated
                ? `${company.companyName} added to your target companies!`
                : `${company.companyName} target preferences updated!`,
            targetCompany: populated,
        });
    } catch (error) {
        console.error("Error in addOrUpdateTargetCompany:", error);
        return res.status(500).json({
            success: false,
            message: "Failed to add or update target company",
            error: error.message,
        });
    }
};

/**
 * DELETE /api/v1/my-target-companies/:companyId
 * Removes a company from user's target list.
 */
export const removeTargetCompany = async (req, res) => {
    try {
        const { companyId } = req.params;

        if (!companyId) {
            return res.status(400).json({
                success: false,
                message: "Company ID is required",
            });
        }

        // Can match by company ObjectId, target company document ID, or company slug
        let targetCompanyId = null;
        if (mongoose.Types.ObjectId.isValid(companyId)) {
            targetCompanyId = companyId;
        } else {
            const comp = await Company.findOne({ slug: String(companyId).toLowerCase() });
            if (comp) targetCompanyId = comp._id;
        }

        const query = {
            user: req.id,
            $or: [
                { company: targetCompanyId || companyId },
                { _id: mongoose.Types.ObjectId.isValid(companyId) ? companyId : null },
            ].filter(Boolean),
        };

        const deleted = await UserTargetCompany.findOneAndDelete(query);

        if (!deleted) {
            return res.status(404).json({
                success: false,
                isTargetCompany: false,
                message: "Target company entry not found in your target list",
            });
        }

        return res.status(200).json({
            success: true,
            isTargetCompany: false,
            message: "Company successfully removed from your target list",
        });
    } catch (error) {
        console.error("Error in removeTargetCompany:", error);
        return res.status(500).json({
            success: false,
            message: "Failed to remove target company",
            error: error.message,
        });
    }
};

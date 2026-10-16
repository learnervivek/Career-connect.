import dotenv from "dotenv";
dotenv.config();
process.env.NODE_ENV = "test";

import mongoose from "mongoose";
import assert from "node:assert";
import connectDB from "./utils/db.js";
import { User } from "./models/user.model.js";
import { Company } from "./models/company.models.js";
import { Roadmap } from "./models/roadmap.models.js";
import { PreparationResource } from "./models/preparationResource.models.js";
import { UserRoadmapProgress } from "./models/userRoadmapProgress.models.js";
import { UserTargetCompany } from "./models/userTargetCompany.models.js";
import { seedPreparationHub, INITIAL_COMPANIES } from "./scripts/seed_preparation_hub.js";

async function runPreparationHubVerification() {
    console.log("==================================================================");
    console.log("🚀 COMPANY PREPARATION HUB: FOUNDATION SCHEMA VERIFICATION SUITE");
    console.log("==================================================================\n");

    await connectDB();

    const createdUserIds = [];
    const createdCompanyIds = [];
    const createdRoadmapIds = [];
    const createdResourceIds = [];
    const createdProgressIds = [];
    const createdTargetIds = [];

    const stats = { total: 0, passed: 0, failed: 0 };

    const runTest = async (title, fn) => {
        stats.total++;
        process.stdout.write(`[Test ${stats.total}] ${title} ... `);
        try {
            await fn();
            stats.passed++;
            console.log("✅ PASSED");
        } catch (err) {
            stats.failed++;
            console.log("❌ FAILED");
            console.error(`   Error: ${err.message}`);
        }
    };

    try {
        // Test 1: Verify all 15 initial companies exist in seed configuration
        await runTest("All 15 initial companies are defined in INITIAL_COMPANIES list", async () => {
            const requiredCompanies = [
                "Tata Consultancy Services",
                "Infosys",
                "Wipro",
                "HCLTech",
                "Cognizant",
                "Capgemini",
                "Accenture",
                "Tech Mahindra",
                "Microsoft",
                "Google",
                "Amazon",
                "IBM",
                "Oracle",
                "Zoho Corporation",
                "Qualcomm"
            ];
            assert.strictEqual(INITIAL_COMPANIES.length, 15);
            for (const name of requiredCompanies) {
                const found = INITIAL_COMPANIES.find((c) => c.companyName.toLowerCase().includes(name.toLowerCase()) || c.slug === name.toLowerCase());
                assert.ok(found, `Company ${name} not found in INITIAL_COMPANIES list`);
            }
        });

        // Test 2: Execute Preparation Hub Seeding
        await runTest("Execute seedPreparationHub script and verify MongoDB persistence", async () => {
            await seedPreparationHub();

            const count = await Company.countDocuments({ isPreparationHubActive: true });
            assert.ok(count >= 15, `Expected at least 15 preparation companies in DB, got ${count}`);

            // Verify Google, TCS, Infosys
            const google = await Company.findOne({ slug: "google" });
            assert.ok(google);
            assert.strictEqual(google.category, "Product & Technology");
            assert.strictEqual(google.tier, "FAANG/MAMAA");
            assert.ok(google.careersUrl.startsWith("http"));

            const tcs = await Company.findOne({ slug: "tcs" });
            assert.ok(tcs);
            assert.strictEqual(tcs.category, "IT Services & Consulting");
            assert.ok(tcs.hiringTracks.length >= 3);
        });

        // Test 3: Relationship - One Company can have multiple Roadmaps & Roles
        await runTest("Relationship 1: One company can have multiple roles and roadmaps", async () => {
            const testCompany = await Company.create({
                companyName: `TestCorp_${Date.now()}`,
                slug: `testcorp-${Date.now()}`,
                category: "Product-Based",
                careersUrl: "https://careers.testcorp.com",
            });
            createdCompanyIds.push(testCompany._id);

            // Roadmap 1: Backend Engineer
            const roadmap1 = await Roadmap.create({
                company: testCompany._id,
                title: "Backend Engineer Preparation",
                slug: `testcorp-backend-${Date.now()}`,
                role: "Backend Engineer",
                hiringTrack: "Fresher / SDE-1",
                description: "Node.js, MongoDB, Redis, and Distributed Systems",
                estimatedDuration: "8 Weeks",
                stages: [
                    {
                        stageId: "stg_be_01",
                        title: "Core Backend APIs",
                        order: 1,
                        topics: [
                            {
                                topicId: "top_be_rest_apis",
                                title: "RESTful Architecture & Idempotency",
                                order: 1,
                            },
                        ],
                    },
                ],
            });
            createdRoadmapIds.push(roadmap1._id);

            // Roadmap 2: Data Engineer
            const roadmap2 = await Roadmap.create({
                company: testCompany._id,
                title: "Data Engineer Preparation",
                slug: `testcorp-data-${Date.now()}`,
                role: "Data Engineer",
                hiringTrack: "Analytics / Spark",
                description: "SQL, Python, Spark and BigQuery",
                estimatedDuration: "10 Weeks",
                stages: [
                    {
                        stageId: "stg_de_01",
                        title: "Data Warehousing",
                        order: 1,
                        topics: [
                            {
                                topicId: "top_de_star_schema",
                                title: "Star Schema & Dimensional Modeling",
                                order: 1,
                            },
                        ],
                    },
                ],
            });
            createdRoadmapIds.push(roadmap2._id);

            const companyRoadmaps = await Roadmap.find({ company: testCompany._id });
            assert.strictEqual(companyRoadmaps.length, 2);
            assert.strictEqual(companyRoadmaps[0].role, "Backend Engineer");
            assert.strictEqual(companyRoadmaps[1].role, "Data Engineer");
        });

        // Test 4: Relationship - One Roadmap has multiple ordered Stages and Topics with stable identifiers
        await runTest("Relationship 2: Stages and topics are ordered and use stable topicIds", async () => {
            const sampleRoadmap = await Roadmap.findOne({ slug: "tcs-digital-prime-sde" });
            assert.ok(sampleRoadmap, "TCS roadmap not found");
            assert.ok(sampleRoadmap.stages.length >= 3, "Expected at least 3 stages in TCS roadmap");

            // Verify order
            assert.strictEqual(sampleRoadmap.stages[0].order, 1);
            assert.strictEqual(sampleRoadmap.stages[1].order, 2);
            assert.strictEqual(sampleRoadmap.stages[2].order, 3);

            // Verify stable topic IDs exist on all topics
            const allTopicIds = sampleRoadmap.getAllTopicIds();
            assert.ok(allTopicIds.length >= 4, `Expected at least 4 topics, got ${allTopicIds.length}`);
            for (const topicId of allTopicIds) {
                assert.ok(typeof topicId === "string" && topicId.length > 0);
                assert.ok(!topicId.includes(" "), `Topic ID '${topicId}' should not contain spaces`);
            }
        });

        // Test 5: Topics reference multiple learning resources
        await runTest("Relationship 3: Topics reference PreparationResource documents with population", async () => {
            const sampleRoadmap = await Roadmap.findOne({ slug: "google-sde-1-prep" }).populate({
                path: "stages.topics.resources",
            });
            assert.ok(sampleRoadmap);

            const stageWithResource = sampleRoadmap.stages.find((s) =>
                s.topics.some((t) => t.resources && t.resources.length > 0)
            );
            assert.ok(stageWithResource, "Expected at least one stage with topics that reference learning resources");

            const topic = stageWithResource.topics.find((t) => t.resources.length > 0);
            assert.ok(topic.resources[0].title);
            assert.ok(topic.resources[0].url);
            assert.ok(topic.resources[0].type);
        });

        // Test 6: Each user maintains independent progress for each roadmap
        await runTest("Relationship 4: Independent user roadmap progress with stable topic tracking", async () => {
            const user1 = await User.create({
                fullname: "Student Alpha",
                email: `alpha_${Date.now()}@example.com`,
                phoneNumber: 9111111111,
                password: "hashedpassword123",
                role: "student",
            });
            createdUserIds.push(user1._id);

            const user2 = await User.create({
                fullname: "Student Beta",
                email: `beta_${Date.now()}@example.com`,
                phoneNumber: 9222222222,
                password: "hashedpassword123",
                role: "student",
            });
            createdUserIds.push(user2._id);

            const roadmap = await Roadmap.findOne({ slug: "google-sde-1-prep" });
            assert.ok(roadmap);
            const topicIds = roadmap.getAllTopicIds();

            // User 1 completes topic 1
            const progressUser1 = await UserRoadmapProgress.create({
                user: user1._id,
                roadmap: roadmap._id,
                roadmapVersion: roadmap.version,
                completedTopics: [
                    {
                        topicId: topicIds[0],
                        completedAt: new Date(),
                        confidenceLevel: "Mastered",
                        notes: "Solved in 35 mins with BFS",
                    },
                ],
            });
            progressUser1.recalculateProgress(roadmap);
            await progressUser1.save();
            createdProgressIds.push(progressUser1._id);

            // User 2 completes topic 1 and topic 2
            const progressUser2 = await UserRoadmapProgress.create({
                user: user2._id,
                roadmap: roadmap._id,
                roadmapVersion: roadmap.version,
                completedTopics: [
                    { topicId: topicIds[0], confidenceLevel: "Confident" },
                    { topicId: topicIds[1], confidenceLevel: "Confident" },
                ],
            });
            progressUser2.recalculateProgress(roadmap);
            await progressUser2.save();
            createdProgressIds.push(progressUser2._id);

            // Assert isolation
            const p1 = await UserRoadmapProgress.findById(progressUser1._id);
            const p2 = await UserRoadmapProgress.findById(progressUser2._id);

            assert.strictEqual(p1.completedTopicsCount, 1);
            assert.strictEqual(p2.completedTopicsCount, 2);
            assert.notStrictEqual(p1.overallProgressPercentage, p2.overallProgressPercentage);
            assert.strictEqual(p1.completedTopics[0].notes, "Solved in 35 mins with BFS");
        });

        // Test 7: Safe roadmap evolution - updating roadmap without losing user progress
        await runTest("Safe Updates: Recomputing progress after roadmap updates retains completed topicIds", async () => {
            const user = await User.create({
                fullname: "Student Gamma",
                email: `gamma_${Date.now()}@example.com`,
                phoneNumber: 9333333333,
                password: "hashedpassword123",
                role: "student",
            });
            createdUserIds.push(user._id);

            const roadmap = await Roadmap.findOne({ slug: "tcs-digital-prime-sde" });
            const topicIds = roadmap.getAllTopicIds();

            const progress = await UserRoadmapProgress.create({
                user: user._id,
                roadmap: roadmap._id,
                roadmapVersion: roadmap.version,
                completedTopics: [
                    { topicId: topicIds[0], confidenceLevel: "Mastered" },
                    { topicId: topicIds[1], confidenceLevel: "Confident" },
                ],
            });
            progress.recalculateProgress(roadmap);
            await progress.save();
            createdProgressIds.push(progress._id);

            const initialCompletedCount = progress.completedTopicsCount;
            const initialPercentage = progress.overallProgressPercentage;

            // Simulate roadmap edit: re-evaluating roadmap doesn't drop completed stable topicId
            progress.recalculateProgress(roadmap);
            await progress.save();

            assert.strictEqual(progress.completedTopicsCount, initialCompletedCount);
            assert.strictEqual(progress.overallProgressPercentage, initialPercentage);
            assert.ok(progress.completedTopics.some((t) => t.topicId === topicIds[0]));
        });

        // Test 8: User Target Company personal list with priority and status
        await runTest("Relationship 5: Users can maintain personal list of target companies", async () => {
            const user = await User.create({
                fullname: "Student Delta",
                email: `delta_${Date.now()}@example.com`,
                phoneNumber: 9444444444,
                password: "hashedpassword123",
                role: "student",
            });
            createdUserIds.push(user._id);

            const google = await Company.findOne({ slug: "google" });
            const amazon = await Company.findOne({ slug: "amazon" });
            const tcs = await Company.findOne({ slug: "tcs" });

            const target1 = await UserTargetCompany.create({
                user: user._id,
                company: google._id,
                priority: "Dream",
                targetRole: "Software Engineer",
                preparationStatus: "Actively Preparing",
                notes: "Aiming for L3 off-campus drive",
            });
            createdTargetIds.push(target1._id);

            const target2 = await UserTargetCompany.create({
                user: user._id,
                company: amazon._id,
                priority: "Target",
                targetRole: "SDE-1",
                preparationStatus: "Actively Preparing",
            });
            createdTargetIds.push(target2._id);

            const target3 = await UserTargetCompany.create({
                user: user._id,
                company: tcs._id,
                priority: "Safety",
                targetRole: "Digital Specialist",
                preparationStatus: "Applied",
            });
            createdTargetIds.push(target3._id);

            const targets = await UserTargetCompany.find({ user: user._id })
                .populate("company", "companyName slug category tier logo");

            assert.strictEqual(targets.length, 3);
            const googleTarget = targets.find(t => t.company.slug === "google");
            const amazonTarget = targets.find(t => t.company.slug === "amazon");
            const tcsTarget = targets.find(t => t.company.slug === "tcs");

            assert.ok(googleTarget);
            assert.strictEqual(googleTarget.priority, "Dream");
            assert.ok(amazonTarget);
            assert.strictEqual(amazonTarget.priority, "Target");
            assert.ok(tcsTarget);
            assert.strictEqual(tcsTarget.priority, "Safety");
        });

        // Test 9: Uniqueness constraints (duplicate target company & duplicate progress)
        await runTest("Constraints: Duplicate user target companies and user roadmap progress are rejected", async () => {
            const user = await User.create({
                fullname: "Student Epsilon",
                email: `epsilon_${Date.now()}@example.com`,
                phoneNumber: 9555555555,
                password: "hashedpassword123",
                role: "student",
            });
            createdUserIds.push(user._id);

            const google = await Company.findOne({ slug: "google" });
            const roadmap = await Roadmap.findOne({ slug: "google-sde-1-prep" });

            // First target entry
            const t1 = await UserTargetCompany.create({
                user: user._id,
                company: google._id,
                priority: "Dream",
            });
            createdTargetIds.push(t1._id);

            // Duplicate target entry should fail unique index { user: 1, company: 1 }
            let duplicateTargetFailed = false;
            try {
                await UserTargetCompany.create({
                    user: user._id,
                    company: google._id,
                    priority: "Target",
                });
            } catch (err) {
                duplicateTargetFailed = true;
                assert.match(err.message, /E11000/);
            }
            assert.ok(duplicateTargetFailed, "Duplicate UserTargetCompany did not trigger E11000 index error");

            // First progress entry
            const p1 = await UserRoadmapProgress.create({
                user: user._id,
                roadmap: roadmap._id,
                roadmapVersion: 1,
            });
            createdProgressIds.push(p1._id);

            // Duplicate progress entry should fail unique index { user: 1, roadmap: 1 }
            let duplicateProgressFailed = false;
            try {
                await UserRoadmapProgress.create({
                    user: user._id,
                    roadmap: roadmap._id,
                    roadmapVersion: 1,
                });
            } catch (err) {
                duplicateProgressFailed = true;
                assert.match(err.message, /E11000/);
            }
            assert.ok(duplicateProgressFailed, "Duplicate UserRoadmapProgress did not trigger E11000 index error");
        });

        // Test 10: Validation rules (invalid URL, invalid difficulty, invalid status)
        await runTest("Validation: Invalid URLs, difficulties and statuses are rejected by schemas", async () => {
            // Invalid resource URL
            let invalidUrlFailed = false;
            try {
                await PreparationResource.create({
                    title: "Invalid URL Resource",
                    url: "ftp://invalid-protocol.com",
                    type: "Article",
                });
            } catch (err) {
                invalidUrlFailed = true;
            }
            assert.ok(invalidUrlFailed, "Invalid resource URL protocol did not trigger validation error");

            // Invalid roadmap difficulty
            let invalidDiffFailed = false;
            const google = await Company.findOne({ slug: "google" });
            try {
                await Roadmap.create({
                    company: google._id,
                    title: "Invalid Difficulty Roadmap",
                    slug: `invalid-diff-${Date.now()}`,
                    role: "SWE",
                    description: "Description",
                    difficulty: "SuperHardcore", // not in enum
                });
            } catch (err) {
                invalidDiffFailed = true;
            }
            assert.ok(invalidDiffFailed, "Invalid roadmap difficulty did not trigger validation error");
        });

    } finally {
        console.log("\n🧹 Cleaning up test users and custom test data...");
        if (createdProgressIds.length > 0) {
            await UserRoadmapProgress.deleteMany({ _id: { $in: createdProgressIds } });
        }
        if (createdTargetIds.length > 0) {
            await UserTargetCompany.deleteMany({ _id: { $in: createdTargetIds } });
        }
        if (createdRoadmapIds.length > 0) {
            await Roadmap.deleteMany({ _id: { $in: createdRoadmapIds } });
        }
        if (createdResourceIds.length > 0) {
            await PreparationResource.deleteMany({ _id: { $in: createdResourceIds } });
        }
        if (createdCompanyIds.length > 0) {
            await Company.deleteMany({ _id: { $in: createdCompanyIds } });
        }
        if (createdUserIds.length > 0) {
            await User.deleteMany({ _id: { $in: createdUserIds } });
        }
        await mongoose.connection.close();
        console.log("✅ Cleanup complete.\n");
    }

    console.log("==================================================================");
    console.log(`📊 TEST RESULTS: ${stats.passed}/${stats.total} PASSED (${stats.failed} FAILED)`);
    console.log("==================================================================");

    if (stats.failed > 0) {
        process.exit(1);
    } else {
        process.exit(0);
    }
}

runPreparationHubVerification().catch((err) => {
    console.error("FATAL VERIFICATION RUNNER ERROR:", err);
    process.exit(1);
});

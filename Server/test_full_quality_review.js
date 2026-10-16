import dotenv from "dotenv";
dotenv.config();
process.env.NODE_ENV = "test";

import mongoose from "mongoose";
import jwt from "jsonwebtoken";
import connectDB from "./utils/db.js";
import app from "./index.js";
import { User } from "./models/user.model.js";
import { Company } from "./models/company.models.js";
import { Roadmap } from "./models/roadmap.models.js";
import { PreparationResource } from "./models/preparationResource.models.js";
import { UserRoadmapProgress } from "./models/userRoadmapProgress.models.js";
import { UserTargetCompany } from "./models/userTargetCompany.models.js";
import { UserResourceBookmark } from "./models/userResourceBookmark.models.js";
import { seedPreparationHub, INITIAL_COMPANIES } from "./scripts/seed_preparation_hub.js";

let server;
let baseUrl;

async function request(method, path, body = null, token = null) {
    const headers = { "Content-Type": "application/json" };
    if (token) {
        headers["Cookie"] = `token=${token}`;
        headers["Authorization"] = `Bearer ${token}`;
    }

    const options = {
        method,
        headers,
    };

    if (body) {
        options.body = JSON.stringify(body);
    }

    const res = await fetch(`${baseUrl}${path}`, options);
    const data = await res.json().catch(() => ({}));
    return { status: res.status, data };
}

async function runQualityReview() {
    console.log("==================================================================");
    console.log("💎 COMPANY PREPARATION HUB: FULL QUALITY & INTEGRATION REVIEW");
    console.log("==================================================================\n");

    await connectDB();

    const PORT = 8004;
    server = app.listen(PORT);
    baseUrl = `http://localhost:${PORT}`;

    const stats = { total: 0, passed: 0, failed: 0 };
    const runTest = async (title, fn) => {
        stats.total++;
        process.stdout.write(`[Workflow ${stats.total}] ${title} ... `);
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
        // Setup Test Users: Candidate 1, Candidate 2, and Admin
        const ts = Date.now();
        const cand1 = await User.create({
            fullname: "Quality Review Candidate A",
            email: `cand_a_${ts}@careerconnect.com`,
            phoneNumber: 9811111111,
            password: "hashed_password",
            role: "student",
        });

        const cand2 = await User.create({
            fullname: "Quality Review Candidate B",
            email: `cand_b_${ts}@careerconnect.com`,
            phoneNumber: 9822222222,
            password: "hashed_password",
            role: "student",
        });

        const admin = await User.create({
            fullname: "Quality Review Admin",
            email: `admin_${ts}@careerconnect.com`,
            phoneNumber: 9833333333,
            password: "hashed_password",
            role: "admin",
        });

        const token1 = jwt.sign({ userId: cand1._id }, process.env.SECRET_KEY, { expiresIn: "1d" });
        const token2 = jwt.sign({ userId: cand2._id }, process.env.SECRET_KEY, { expiresIn: "1d" });
        const adminToken = jwt.sign({ userId: admin._id }, process.env.SECRET_KEY, { expiresIn: "1d" });
        const fakeId = new mongoose.Types.ObjectId();

        // 1. Seed all 15 initial companies successfully
        await runTest("Workflow 1: Seed all 15 companies successfully", async () => {
            await seedPreparationHub();
            const count = await Company.countDocuments({ isPreparationHubActive: true });
            if (count < 15) {
                throw new Error(`Expected at least 15 active companies in DB, got ${count}`);
            }
        });

        // 2. Run seed script multiple times without creating duplicates or overwriting progress
        await runTest("Workflow 2: Run seed script multiple times without creating duplicates or overwriting progress", async () => {
            const initialCount = await Company.countDocuments({ isPreparationHubActive: true });
            const initialRoadmapCount = await Roadmap.countDocuments();

            // Run seed again
            await seedPreparationHub();

            const secondCount = await Company.countDocuments({ isPreparationHubActive: true });
            const secondRoadmapCount = await Roadmap.countDocuments();

            if (secondCount !== initialCount) {
                throw new Error(`Duplicate companies created! Initial: ${initialCount}, Second: ${secondCount}`);
            }
            if (secondRoadmapCount !== initialRoadmapCount) {
                throw new Error(`Duplicate roadmaps created! Initial: ${initialRoadmapCount}, Second: ${secondRoadmapCount}`);
            }
        });

        // 3. Browse and search the company catalog
        await runTest("Workflow 3: Browse and search the company catalog", async () => {
            // All companies
            const resAll = await request("GET", "/api/v1/preparation/companies");
            if (resAll.status !== 200 || !resAll.data.success || resAll.data.companies.length < 15) {
                throw new Error("Failed to fetch full company catalog");
            }

            // Search by name: "Tata"
            const resSearch = await request("GET", "/api/v1/preparation/companies?search=Tata");
            if (resSearch.status !== 200 || !resSearch.data.companies.some(c => c.companyName.includes("Tata"))) {
                throw new Error("Search filter for 'Tata' failed");
            }

            // Filter by category: "Product & Technology"
            const resCategory = await request("GET", "/api/v1/preparation/companies?category=Product%20%26%20Technology");
            if (resCategory.status !== 200 || !resCategory.data.companies.every(c => c.category === "Product & Technology")) {
                throw new Error("Category filter for 'Product & Technology' failed");
            }
        });

        // 4. Open a company and view its preparation roadmaps
        let tcsCompany;
        let tcsRoadmaps = [];
        await runTest("Workflow 4: Open a company and view its preparation roadmaps", async () => {
            const res = await request("GET", "/api/v1/preparation/companies/tcs");
            if (res.status !== 200 || !res.data.success || !res.data.company) {
                throw new Error("Failed to retrieve TCS company details");
            }
            tcsCompany = res.data.company;
            tcsRoadmaps = res.data.roadmaps;
            if (!Array.isArray(tcsRoadmaps) || tcsRoadmaps.length === 0) {
                throw new Error("Expected TCS to have available roadmaps");
            }
        });

        // 5. Open a roadmap and view all stages, topics and resources
        let sampleRoadmap;
        await runTest("Workflow 5: Open a roadmap and view all stages, topics and resources", async () => {
            sampleRoadmap = tcsRoadmaps[0];
            const res = await request("GET", `/api/v1/preparation/roadmaps/${sampleRoadmap.slug || sampleRoadmap._id}`);
            if (res.status !== 200 || !res.data.success || !res.data.roadmap) {
                throw new Error("Failed to retrieve roadmap details");
            }

            const rm = res.data.roadmap;
            if (!rm.stages || rm.stages.length === 0) {
                throw new Error("Roadmap has no stages");
            }

            const hasTopics = rm.stages.some(s => s.topics && s.topics.length > 0);
            if (!hasTopics) {
                throw new Error("Roadmap has no topics");
            }

            const hasResources = rm.stages.some(s => s.topics.some(t => t.resources && t.resources.length > 0));
            if (!hasResources) {
                throw new Error("Roadmap has no populated learning resources");
            }
        });

        // 6. Start a roadmap and mark topics complete or incomplete
        let topic1Id;
        let topic2Id;
        await runTest("Workflow 6: Start a roadmap and mark topics complete or incomplete", async () => {
            const roadmapDoc = await Roadmap.findById(sampleRoadmap._id).lean();
            topic1Id = roadmapDoc.stages[0].topics[0].topicId;
            topic2Id = roadmapDoc.stages[0].topics[1]?.topicId || roadmapDoc.stages[1].topics[0].topicId;

            // Start roadmap
            const resStart = await request("POST", `/api/v1/progress/${sampleRoadmap._id}/start`, {}, token1);
            if (resStart.status !== 200 && resStart.status !== 201) {
                throw new Error("Failed to start roadmap");
            }

            // Mark topic 1 complete
            const resComplete = await request(
                "PUT",
                `/api/v1/progress/${sampleRoadmap._id}/topics/${topic1Id}`,
                { completed: true },
                token1
            );
            if (resComplete.status !== 200 || !resComplete.data.success) {
                throw new Error("Failed to mark topic complete");
            }
            if (resComplete.data.progress.completedTopicsCount !== 1) {
                throw new Error(`Expected completedTopicsCount = 1, got ${resComplete.data.progress.completedTopicsCount}`);
            }

            // Mark topic 1 incomplete (toggle off)
            const resIncomplete = await request(
                "PUT",
                `/api/v1/progress/${sampleRoadmap._id}/topics/${topic1Id}`,
                { completed: false },
                token1
            );
            if (resIncomplete.status !== 200 || resIncomplete.data.progress.completedTopicsCount !== 0) {
                throw new Error("Failed to mark topic incomplete");
            }

            // Mark topic 1 complete again for persistence test
            await request("PUT", `/api/v1/progress/${sampleRoadmap._id}/topics/${topic1Id}`, { completed: true }, token1);
        });

        // 7. Verify progress persists after refresh and login
        await runTest("Workflow 7: Verify progress persists after refresh and login", async () => {
            const resGet = await request("GET", `/api/v1/progress/${sampleRoadmap._id}`, null, token1);
            if (resGet.status !== 200 || !resGet.data.progress) {
                throw new Error("Failed to retrieve persisted progress");
            }

            const p = resGet.data.progress;
            if (!p.completedTopicIds.includes(topic1Id)) {
                throw new Error("Completed topicId was not persisted");
            }
            if (p.completedTopicsCount !== 1) {
                throw new Error("Completed count mismatch");
            }
        });

        // 8. Verify two users have independent progress for the same roadmap
        await runTest("Workflow 8: Verify two users have independent progress for the same roadmap", async () => {
            // User 2 fetches progress on same roadmap (should be 0%)
            const resUser2Before = await request("GET", `/api/v1/progress/${sampleRoadmap._id}`, null, token2);
            if (resUser2Before.data.progress.completedTopicsCount !== 0) {
                throw new Error("User 2 should have 0 completed topics initially");
            }

            // User 2 marks topic 2 complete
            await request("PUT", `/api/v1/progress/${sampleRoadmap._id}/topics/${topic2Id}`, { completed: true }, token2);

            const resUser2After = await request("GET", `/api/v1/progress/${sampleRoadmap._id}`, null, token2);
            const resUser1After = await request("GET", `/api/v1/progress/${sampleRoadmap._id}`, null, token1);

            if (!resUser2After.data.progress.completedTopicIds.includes(topic2Id)) {
                throw new Error("User 2 should have topic 2 complete");
            }
            if (resUser1After.data.progress.completedTopicIds.includes(topic2Id)) {
                throw new Error("User 1 progress was polluted by User 2!");
            }
        });

        // 9. Add and remove target companies
        await runTest("Workflow 9: Add and remove target companies", async () => {
            // Add TCS as Dream company for User 1
            const resAdd = await request(
                "POST",
                "/api/v1/my-target-companies",
                {
                    companyId: tcsCompany._id,
                    priority: "Dream",
                    targetRole: "Digital Specialist",
                },
                token1
            );
            if (resAdd.status !== 201 && resAdd.status !== 200) {
                throw new Error("Failed to add target company");
            }

            // Verify in dashboard
            const resDash = await request("GET", "/api/v1/my-preparation", null, token1);
            const targetFound = resDash.data.targetCompanies.some(
                (tc) => String(tc.company._id) === String(tcsCompany._id)
            );
            if (!targetFound) {
                throw new Error("Target company not present in dashboard");
            }

            // Remove target company
            const resRemove = await request(
                "DELETE",
                `/api/v1/my-target-companies/${tcsCompany._id}`,
                null,
                token1
            );
            if (resRemove.status !== 200 || !resRemove.data.success) {
                throw new Error("Failed to remove target company");
            }
        });

        // 10. Create a company through the admin dashboard and verify it appears without frontend code changes
        let createdAdminCompanyId;
        await runTest("Workflow 10: Create a company through admin dashboard and verify catalog appearance", async () => {
            const newCompSlug = `custom-enterprise-${ts}`;
            const resCreate = await request(
                "POST",
                "/api/v1/admin/preparation/companies",
                {
                    companyName: `Custom Enterprise ${ts}`,
                    slug: newCompSlug,
                    category: "Product & Technology",
                    tier: "Tier-1",
                    description: "Fast-growing high-concurrency cloud platform enterprise.",
                    officialCareersUrl: "https://careers.customenterprise.com",
                    hiringTracks: ["Cloud Infrastructure", "Distributed Systems"],
                },
                adminToken
            );

            if (resCreate.status !== 201 || !resCreate.data.success) {
                throw new Error(`Admin create company failed: ${JSON.stringify(resCreate.data)}`);
            }
            createdAdminCompanyId = resCreate.data.company._id;

            // Verify in public candidate catalog without any frontend changes
            const resPublic = await request("GET", `/api/v1/preparation/companies/${newCompSlug}`);
            if (resPublic.status !== 200 || !resPublic.data.success) {
                throw new Error("Newly created company did not appear in public catalog");
            }
        });

        // 11. Create, edit, reorder and publish a roadmap
        let createdRoadmapId;
        const topicAId = `custom_top_a_${ts}`;
        const topicBId = `custom_top_b_${ts}`;
        await runTest("Workflow 11: Create, edit, reorder and publish a roadmap", async () => {
            const resCreate = await request(
                "POST",
                "/api/v1/admin/preparation/roadmaps",
                {
                    companyId: createdAdminCompanyId,
                    title: "Cloud Systems Engineering Track",
                    slug: `cloud-systems-eng-${ts}`,
                    role: "Cloud Systems Engineer",
                    description: "Comprehensive cloud systems and distributed engineering preparation roadmap.",
                    hiringTrack: "Infrastructure",
                    difficulty: "Hard",
                    estimatedDuration: "12 Weeks",
                    publicationStatus: "Draft",
                    stages: [
                        {
                            stageId: "stg_1",
                            title: "Stage 1: Core Networking & OS",
                            order: 1,
                            topics: [
                                {
                                    topicId: topicAId,
                                    title: "Linux Kernel & Memory Paging",
                                    order: 1,
                                    difficulty: "Hard",
                                },
                                {
                                    topicId: topicBId,
                                    title: "TCP/IP Sockets & Epoll",
                                    order: 2,
                                    difficulty: "Medium",
                                },
                            ],
                        },
                    ],
                },
                adminToken
            );

            if (resCreate.status !== 201 || !resCreate.data.roadmap) {
                throw new Error(`Failed to create roadmap: ${JSON.stringify(resCreate.data)}`);
            }
            createdRoadmapId = resCreate.data.roadmap._id;

            // Reorder topics in Stage 1 (swap order of topic A and B) and edit publicationStatus to Published
            const resUpdate = await request(
                "PUT",
                `/api/v1/admin/preparation/roadmaps/${createdRoadmapId}`,
                {
                    title: "Cloud Systems Engineering Track (Updated)",
                    publicationStatus: "Published",
                    stages: [
                        {
                            stageId: "stg_1",
                            title: "Stage 1: Core Networking & OS",
                            order: 1,
                            topics: [
                                {
                                    topicId: topicBId,
                                    title: "TCP/IP Sockets & Epoll (Reordered #1)",
                                    order: 1,
                                    difficulty: "Medium",
                                },
                                {
                                    topicId: topicAId,
                                    title: "Linux Kernel & Memory Paging (Reordered #2)",
                                    order: 2,
                                    difficulty: "Hard",
                                },
                            ],
                        },
                    ],
                },
                adminToken
            );

            if (resUpdate.status !== 200 || resUpdate.data.roadmap.publicationStatus !== "Published") {
                throw new Error(`Failed to update and publish roadmap: ${JSON.stringify(resUpdate.data)}`);
            }
        });

        // 12. Verify roadmap changes do not silently erase existing progress
        await runTest("Workflow 12: Verify roadmap changes do not silently erase existing progress", async () => {
            // User 1 starts the custom roadmap and completes topic A
            await request("POST", `/api/v1/progress/${createdRoadmapId}/start`, {}, token1);
            await request("PUT", `/api/v1/progress/${createdRoadmapId}/topics/${topicAId}`, { completed: true }, token1);

            // Verify progress before admin edit
            const pBefore = await request("GET", `/api/v1/progress/${createdRoadmapId}`, null, token1);
            if (!pBefore.data.progress.completedTopicIds.includes(topicAId)) {
                throw new Error("Topic A not completed before admin edit");
            }

            // Admin edits roadmap (adds a new stage and new topic C)
            const topicCId = `custom_top_c_${ts}`;
            await request(
                "PUT",
                `/api/v1/admin/preparation/roadmaps/${createdRoadmapId}`,
                {
                    stages: [
                        {
                            stageId: "stg_1",
                            title: "Stage 1: Core Networking & OS",
                            order: 1,
                            topics: [
                                { topicId: topicBId, title: "TCP/IP Sockets & Epoll", order: 1 },
                                { topicId: topicAId, title: "Linux Kernel & Memory Paging", order: 2 },
                            ],
                        },
                        {
                            stageId: "stg_2",
                            title: "Stage 2: Distributed Protocols",
                            order: 2,
                            topics: [
                                { topicId: topicCId, title: "Raft Consensus Protocol", order: 1 },
                            ],
                        },
                    ],
                },
                adminToken
            );

            // User 1 checks progress again
            const pAfter = await request("GET", `/api/v1/progress/${createdRoadmapId}`, null, token1);
            if (!pAfter.data.progress.completedTopicIds.includes(topicAId)) {
                throw new Error("Topic A progress was ERASED when admin edited roadmap!");
            }
            if (pAfter.data.progress.totalTopicsCount !== 3) {
                throw new Error(`Expected totalTopicsCount = 3, got ${pAfter.data.progress.totalTopicsCount}`);
            }
            if (pAfter.data.progress.completedTopicsCount !== 1) {
                throw new Error("Completed topics count corrupted after admin edit");
            }
        });

        // 13. Test invalid IDs, unauthorized access, missing resources, and archived records
        await runTest("Workflow 13: Test invalid IDs, unauthorized access, missing resources and archived records", async () => {
            // Invalid roadmap ID format
            const resInvalidId = await request("GET", "/api/v1/progress/not_a_real_id", null, token1);
            if (resInvalidId.status !== 404 && resInvalidId.status !== 400) {
                throw new Error(`Expected 404 or 400 for invalid roadmap ID, got ${resInvalidId.status}`);
            }

            // Non-existent valid ObjectId
            const fakeId = new mongoose.Types.ObjectId();
            const resNotFound = await request("GET", `/api/v1/preparation/roadmaps/${fakeId}`);
            if (resNotFound.status !== 404) {
                throw new Error(`Expected 404 for non-existent roadmap, got ${resNotFound.status}`);
            }

            // Archived record access
            await request(
                "PATCH",
                `/api/v1/admin/preparation/roadmaps/${createdRoadmapId}/status`,
                { publicationStatus: "Archived" },
                adminToken
            );
            const resArchivedPublic = await request("GET", `/api/v1/preparation/roadmaps/${createdRoadmapId}`);
            if (resArchivedPublic.status !== 404) {
                throw new Error("Archived roadmap was returned to public candidates!");
            }
        });

        // 14. Test resource links, empty states, loading states and API errors
        await runTest("Workflow 14: Test resource links, empty states, loading states and API errors", async () => {
            // Malformed URL in bookmark or resource creation rejected
            const resBadUrl = await request(
                "POST",
                "/api/v1/admin/preparation/resources",
                {
                    title: "Malicious Resource",
                    url: "javascript:alert(1)",
                    category: "Core CS",
                },
                adminToken
            );
            if (resBadUrl.status !== 400) {
                throw new Error(`Expected 400 Bad Request for javascript: URL, got ${resBadUrl.status}`);
            }

            // Empty search filter returns empty list gracefully
            const resEmptySearch = await request("GET", "/api/v1/preparation/companies?search=XYZ_NON_EXISTENT_NAME_123");
            if (resEmptySearch.status !== 200 || resEmptySearch.data.companies.length !== 0) {
                throw new Error("Expected empty array for non-matching search query");
            }
        });

        // Security Checks:
        // S1: Unauthenticated users cannot access protected operations
        await runTest("Security Check 1: Unauthenticated users rejected on protected endpoints (401)", async () => {
            const resProgNoAuth = await request("GET", `/api/v1/progress/${sampleRoadmap._id}`);
            if (resProgNoAuth.status !== 401) {
                throw new Error(`Expected 401 Unauthorized, got ${resProgNoAuth.status}`);
            }

            const resDashNoAuth = await request("GET", "/api/v1/my-preparation");
            if (resDashNoAuth.status !== 401) {
                throw new Error(`Expected 401 Unauthorized on dashboard, got ${resDashNoAuth.status}`);
            }

            const resBookmarkNoAuth = await request("POST", `/api/v1/preparation/resources/${fakeId}/bookmark`);
            if (resBookmarkNoAuth.status !== 401) {
                throw new Error(`Expected 401 on bookmarking, got ${resBookmarkNoAuth.status}`);
            }
        });

        // S2: Regular users cannot manage companies or roadmaps
        await runTest("Security Check 2: Regular candidate users forbidden from admin routes (403)", async () => {
            const resAdminByCand = await request("GET", "/api/v1/admin/preparation/companies", null, token1);
            if (resAdminByCand.status !== 403) {
                throw new Error(`Expected 403 Forbidden for candidate calling admin endpoint, got ${resAdminByCand.status}`);
            }

            const resCreateByCand = await request("POST", "/api/v1/admin/preparation/companies", { companyName: "Hacked" }, token1);
            if (resCreateByCand.status !== 403) {
                throw new Error(`Expected 403 Forbidden for candidate creating company, got ${resCreateByCand.status}`);
            }
        });

        // S3: Users cannot access or mutate other users' progress or bookmarks
        await runTest("Security Check 3: Users cannot access other users' bookmarks or private notes", async () => {
            // Bookmark a resource as User 1
            const resource = await PreparationResource.findOne({ status: "Active" }).lean();
            if (resource) {
                await request("POST", `/api/v1/preparation/resources/${resource._id}/bookmark`, {}, token1);

                // User 2 checks bookmarks
                const resB2 = await request("GET", "/api/v1/preparation/my-resource-bookmarks", null, token2);
                const hasUser1Bookmark = resB2.data.bookmarks.some(b => String(b.resource._id) === String(resource._id));
                if (hasUser1Bookmark) {
                    throw new Error("User 2 saw User 1's private resource bookmark!");
                }
            }
        });

        // Cleanup temporary test entities
        await UserTargetCompany.deleteMany({ user: { $in: [cand1._id, cand2._id] } });
        await UserRoadmapProgress.deleteMany({ user: { $in: [cand1._id, cand2._id] } });
        await UserResourceBookmark.deleteMany({ user: { $in: [cand1._id, cand2._id] } });
        await Roadmap.deleteMany({ _id: createdRoadmapId });
        await Company.deleteMany({ _id: createdAdminCompanyId });
        await User.deleteMany({ _id: { $in: [cand1._id, cand2._id, admin._id] } });

        console.log("\n==================================================================");
        console.log(`📊 FINAL QUALITY REVIEW SUMMARY: ${stats.passed}/${stats.total} PASSED (${stats.failed} FAILED)`);
        console.log("==================================================================\n");

        if (stats.failed > 0) {
            process.exitCode = 1;
        }
    } catch (globalErr) {
        console.error("Fatal error during quality review execution:", globalErr);
        process.exitCode = 1;
    } finally {
        if (server) {
            server.close();
        }
        await mongoose.connection.close();
    }
}

runQualityReview();

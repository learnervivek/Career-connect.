import dotenv from "dotenv";
dotenv.config();
process.env.NODE_ENV = "test";

import mongoose from "mongoose";
import assert from "node:assert";
import jwt from "jsonwebtoken";
import connectDB from "./utils/db.js";
import { User } from "./models/user.model.js";
import { Company } from "./models/company.models.js";
import { Roadmap } from "./models/roadmap.models.js";
import { UserRoadmapProgress } from "./models/userRoadmapProgress.models.js";
import { PreparationResource } from "./models/preparationResource.models.js";
import app from "./index.js";

async function runAdminPreparationTests() {
    console.log("==================================================================");
    console.log("🛡️  ADMIN PREPARATION HUB MANAGEMENT INTEGRATION TESTS");
    console.log("==================================================================\n");

    await connectDB();

    const createdUserIds = [];
    const createdCompanyIds = [];
    const createdRoadmapIds = [];
    const createdResourceIds = [];
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

    const makeToken = (userId) => {
        return jwt.sign({ userId }, process.env.SECRET_KEY || "secretKey", { expiresIn: "1d" });
    };

    const server = app.listen(0);
    const port = server.address().port;
    const baseUrl = `http://127.0.0.1:${port}/api/v1/admin/preparation`;

    try {
        const timestamp = Date.now();

        // 1. Candidate student user (unauthorized for admin endpoints)
        const studentUser = await User.create({
            fullname: `Student Candidate ${timestamp}`,
            email: `student_${timestamp}@example.com`,
            phoneNumber: 9112233441,
            password: "hashedpassword123",
            role: "student",
        });
        createdUserIds.push(studentUser._id);
        const studentToken = makeToken(studentUser._id);

        // 2. Recruiter user (authorized via isAdmin)
        const recruiterUser = await User.create({
            fullname: `Recruiter Admin ${timestamp}`,
            email: `recruiter_${timestamp}@example.com`,
            phoneNumber: 9112233442,
            password: "hashedpassword123",
            role: "recruiter",
        });
        createdUserIds.push(recruiterUser._id);
        const recruiterToken = makeToken(recruiterUser._id);

        // 3. Admin user (authorized)
        const adminUser = await User.create({
            fullname: `Super Admin ${timestamp}`,
            email: `admin_${timestamp}@example.com`,
            phoneNumber: 9112233443,
            password: "hashedpassword123",
            role: "admin",
        });
        createdUserIds.push(adminUser._id);
        const adminToken = makeToken(adminUser._id);

        // --- TEST 1: Unauthenticated request rejected ---
        await runTest("Unauthenticated request to admin preparation returns 401", async () => {
            const res = await fetch(`${baseUrl}/companies`);
            assert.strictEqual(res.status, 401, "Expected 401 Unauthorized without token");
        });

        // --- TEST 2: Student (candidate) rejected with 403 ---
        await runTest("Student candidate attempting admin preparation returns 403 Forbidden", async () => {
            const res = await fetch(`${baseUrl}/companies`, {
                headers: {
                    Cookie: `token=${studentToken}`,
                    Authorization: `Bearer ${studentToken}`
                }
            });
            assert.strictEqual(res.status, 403, "Expected 403 Forbidden for candidate role");
        });

        // --- TEST 3: Admin / Recruiter can list all companies ---
        await runTest("Recruiter/Admin can access admin preparation companies list", async () => {
            const res = await fetch(`${baseUrl}/companies`, {
                headers: {
                    Cookie: `token=${recruiterToken}`,
                    Authorization: `Bearer ${recruiterToken}`
                }
            });
            assert.strictEqual(res.status, 200);
            const data = await res.json();
            assert.strictEqual(data.success, true);
            assert.ok(Array.isArray(data.companies), "Should return companies array");
        });

        // --- TEST 4: URL Validation on Company Creation ---
        await runTest("Reject invalid official careers URL with 400", async () => {
            const res = await fetch(`${baseUrl}/companies`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Cookie: `token=${adminToken}`,
                    Authorization: `Bearer ${adminToken}`
                },
                body: JSON.stringify({
                    name: `Invalid URL Co ${timestamp}`,
                    slug: `invalid-url-co-${timestamp}`,
                    category: "Product & Technology",
                    description: "A company with invalid URL",
                    officialCareersUrl: "not-a-valid-http-url"
                })
            });
            assert.strictEqual(res.status, 400);
            const data = await res.json();
            assert.strictEqual(data.success, false);
            assert.match(data.message, /(?:valid URL|http:\/\/ or https:\/\/)/i);
        });

        // --- TEST 5: Create Company successfully ---
        let testCompanyId = null;
        const testCompanySlug = `test-enterprise-${timestamp}`;
        await runTest("Admin creates a new company with valid payload", async () => {
            const res = await fetch(`${baseUrl}/companies`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Cookie: `token=${adminToken}`,
                    Authorization: `Bearer ${adminToken}`
                },
                body: JSON.stringify({
                    name: `Test Enterprise ${timestamp}`,
                    slug: testCompanySlug,
                    category: "Product & Technology",
                    description: "Leading enterprise technology provider.",
                    officialCareersUrl: "https://careers.enterprise-example.com/jobs",
                    logo: "https://enterprise-example.com/logo.png"
                })
            });
            assert.strictEqual(res.status, 201);
            const data = await res.json();
            assert.strictEqual(data.success, true);
            assert.ok(data.company._id);
            assert.strictEqual(data.company.slug, testCompanySlug);
            testCompanyId = data.company._id;
            createdCompanyIds.push(testCompanyId);
        });

        // --- TEST 6: Prevent duplicate slug ---
        await runTest("Reject duplicate company slug with 400", async () => {
            const res = await fetch(`${baseUrl}/companies`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Cookie: `token=${adminToken}`,
                    Authorization: `Bearer ${adminToken}`
                },
                body: JSON.stringify({
                    name: `Another Company Name`,
                    slug: testCompanySlug, // same slug
                    category: "IT Services & Consulting",
                    description: "Duplicate slug test company.",
                    officialCareersUrl: "https://careers.example.com"
                })
            });
            assert.strictEqual(res.status, 400);
            const data = await res.json();
            assert.strictEqual(data.success, false);
            assert.match(data.message, /(?:already exists|already in use)/i);
        });

        // --- TEST 7: Update company details ---
        await runTest("Admin can edit company details", async () => {
            const res = await fetch(`${baseUrl}/companies/${testCompanyId}`, {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json",
                    Cookie: `token=${adminToken}`,
                    Authorization: `Bearer ${adminToken}`
                },
                body: JSON.stringify({
                    name: `Updated Enterprise ${timestamp}`,
                    slug: `updated-slug-${timestamp}`,
                    category: "IT Services & Consulting",
                    description: "Updated premier IT services.",
                    officialCareersUrl: "https://careers.updated-enterprise.com"
                })
            });
            assert.strictEqual(res.status, 200);
            const data = await res.json();
            assert.strictEqual(data.success, true);
            assert.strictEqual(data.company.companyName || data.company.name, `Updated Enterprise ${timestamp}`);
            assert.strictEqual(data.company.slug, `updated-slug-${timestamp}`);
        });

        // --- TEST 8: Create Roadmap with Stages & Topics ---
        let testRoadmapId = null;
        let originalTopicAId = null;
        let originalTopicAObjId = null;
        let originalTopicBId = null;
        let originalTopicBObjId = null;

        await runTest("Admin creates a roadmap for company with structured stages and topics", async () => {
            const payload = {
                company: testCompanyId,
                title: "Core Software Engineering Preparation Track",
                role: "Software Development Engineer",
                hiringTrack: "On-Campus & Off-Campus Freshers",
                description: "Complete preparation track covering Data Structures, System Design, and CS Fundamentals.",
                estimatedDuration: "6 weeks",
                difficulty: "Intermediate",
                publicationStatus: "Draft",
                stages: [
                    {
                        title: "Stage 1: CS Fundamentals",
                        order: 1,
                        topics: [
                            {
                                title: "Operating Systems & Concurrency",
                                description: "Processes, threads, locks, and deadlocks.",
                                estimatedTime: "8 hours",
                                difficulty: "Intermediate",
                                isVerified: true,
                                resources: []
                            },
                            {
                                title: "Database Systems & Indexing",
                                description: "B-Trees, transactions, isolation levels.",
                                estimatedTime: "10 hours",
                                difficulty: "Intermediate",
                                isVerified: true,
                                resources: []
                            }
                        ]
                    }
                ]
            };

            const res = await fetch(`${baseUrl}/roadmaps`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Cookie: `token=${adminToken}`,
                    Authorization: `Bearer ${adminToken}`
                },
                body: JSON.stringify(payload)
            });

            assert.strictEqual(res.status, 201);
            const data = await res.json();
            assert.strictEqual(data.success, true);
            assert.ok(data.roadmap._id);
            testRoadmapId = data.roadmap._id;
            createdRoadmapIds.push(testRoadmapId);

            assert.strictEqual(data.roadmap.stages.length, 1);
            assert.strictEqual(data.roadmap.stages[0].topics.length, 2);

            originalTopicAId = data.roadmap.stages[0].topics[0].topicId;
            originalTopicAObjId = data.roadmap.stages[0].topics[0]._id.toString();
            originalTopicBId = data.roadmap.stages[0].topics[1].topicId;
            originalTopicBObjId = data.roadmap.stages[0].topics[1]._id.toString();
            assert.ok(originalTopicAId, "Topic A must have stable topicId");
            assert.ok(originalTopicBId, "Topic B must have stable topicId");
        });

        // --- TEST 9: Warn before archiving company with active roadmaps ---
        await runTest("Check archive warning detects active roadmap", async () => {
            // First publish roadmap
            await Roadmap.findByIdAndUpdate(testRoadmapId, { publicationStatus: "Published" });

            const res = await fetch(`${baseUrl}/companies/${testCompanyId}/archive-warning`, {
                headers: {
                    Cookie: `token=${adminToken}`,
                    Authorization: `Bearer ${adminToken}`
                }
            });
            assert.strictEqual(res.status, 200);
            const data = await res.json();
            assert.strictEqual(data.success, true);
            assert.strictEqual(data.hasActiveRoadmaps, true);
            assert.strictEqual(data.activeRoadmapCount, 1);
            assert.ok(data.activeRoadmaps.length > 0);
        });

        // --- TEST 10: Toggle Company Status (Archive & Restore) ---
        await runTest("Toggle company status between Active and Archived", async () => {
            // Archive
            const res1 = await fetch(`${baseUrl}/companies/${testCompanyId}/status`, {
                method: "PATCH",
                headers: {
                    "Content-Type": "application/json",
                    Cookie: `token=${adminToken}`,
                    Authorization: `Bearer ${adminToken}`
                },
                body: JSON.stringify({ status: "Archived" })
            });
            assert.strictEqual(res1.status, 200);
            const data1 = await res1.json();
            assert.strictEqual(data1.company.status, "Archived");

            // Restore
            const res2 = await fetch(`${baseUrl}/companies/${testCompanyId}/status`, {
                method: "PATCH",
                headers: {
                    "Content-Type": "application/json",
                    Cookie: `token=${adminToken}`,
                    Authorization: `Bearer ${adminToken}`
                },
                body: JSON.stringify({ status: "Active" })
            });
            assert.strictEqual(res2.status, 200);
            const data2 = await res2.json();
            assert.strictEqual(data2.company.status, "Active");
        });

        // --- TEST 11: Progress Preservation during Topic Editing & Reordering ---
        await runTest("Preserve candidate user progress when topics are edited and reordered", async () => {
            // Student Alice marks originalTopicA as completed
            const candidateBaseUrl = `http://127.0.0.1:${port}/api/v1`;
            const checkRes = await fetch(`${candidateBaseUrl}/progress/${testRoadmapId}/topics/${originalTopicAId}`, {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json",
                    Cookie: `token=${studentToken}`,
                    Authorization: `Bearer ${studentToken}`
                },
                body: JSON.stringify({ isCompleted: true })
            });
            assert.strictEqual(checkRes.status, 200);

            // Verify progress has 1 topic completed
            let progressRecord = await UserRoadmapProgress.findOne({
                user: studentUser._id,
                roadmap: testRoadmapId
            });
            assert.strictEqual(progressRecord.completedTopics.length, 1);
            assert.strictEqual(progressRecord.completedTopics[0].topicId.toString(), originalTopicAId);

            // Now, Admin updates roadmap:
            // - Edits Title of Topic A
            // - Swaps order of Topic A and Topic B
            // - Adds a new Topic C
            // The existing topicId & _id for Topic A and B are passed in the payload!
            const updatePayload = {
                title: "Core Software Engineering Preparation Track (v2)",
                role: "Software Development Engineer",
                hiringTrack: "On-Campus & Off-Campus Freshers",
                description: "Updated description with modern topics.",
                estimatedDuration: "7 weeks",
                difficulty: "Hard",
                publicationStatus: "Published",
                stages: [
                    {
                        title: "Stage 1: Advanced CS & Storage",
                        order: 1,
                        topics: [
                            {
                                _id: originalTopicBObjId,
                                topicId: originalTopicBId, // Swapped to position 1
                                title: "Database Systems & Distributed Indexing",
                                description: "LSM trees, Raft, and distributed transactions.",
                                estimatedTime: "12 hours",
                                difficulty: "Hard",
                                isVerified: true,
                                resources: []
                            },
                            {
                                _id: originalTopicAObjId,
                                topicId: originalTopicAId, // Preserved ID in position 2!
                                title: "Operating Systems, Concurrency & Kernel Internals",
                                description: "Deep dive into epoll, memory paging, and locks.",
                                estimatedTime: "10 hours",
                                difficulty: "Intermediate",
                                isVerified: true,
                                resources: []
                            },
                            {
                                // Brand new topic C without existing _id
                                title: "Cloud Native Architecture",
                                description: "Microservices and Kubernetes fundamentals.",
                                estimatedTime: "6 hours",
                                difficulty: "Easy",
                                isVerified: false,
                                resources: []
                            }
                        ]
                    }
                ]
            };

            const updateRes = await fetch(`${baseUrl}/roadmaps/${testRoadmapId}`, {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json",
                    Cookie: `token=${adminToken}`,
                    Authorization: `Bearer ${adminToken}`
                },
                body: JSON.stringify(updatePayload)
            });

            assert.strictEqual(updateRes.status, 200);
            const updateData = await updateRes.json();
            assert.strictEqual(updateData.success, true);
            assert.strictEqual(updateData.roadmap.version, 2, "Roadmap version should increment");

            // Check that Topic A kept its original topicId
            const updatedStage = updateData.roadmap.stages[0];
            const topicAFound = updatedStage.topics.find(t => t.topicId === originalTopicAId);
            assert.ok(topicAFound, "Topic A must maintain its exact topicId");
            assert.strictEqual(topicAFound.title, "Operating Systems, Concurrency & Kernel Internals");

            // Now, fetch student's progress from the candidate API!
            const fetchProgressRes = await fetch(`${candidateBaseUrl}/progress/${testRoadmapId}`, {
                headers: {
                    Cookie: `token=${studentToken}`,
                    Authorization: `Bearer ${studentToken}`
                }
            });
            assert.strictEqual(fetchProgressRes.status, 200);
            const studentProgressData = await fetchProgressRes.json();
            assert.strictEqual(studentProgressData.success, true);
            // Completed count should still be 1 (Topic A remains completed!)
            assert.strictEqual(studentProgressData.progress.completedTopicsCount, 1);
            assert.strictEqual(studentProgressData.progress.totalTopicsCount, 3);
            assert.strictEqual(studentProgressData.progress.completedTopicIds.includes(originalTopicAId), true);
        });

        // --- TEST 12: Admin Learning Resource Management ---
        await runTest("Admin can create preparation resource and retrieve it", async () => {
            const res = await fetch(`${baseUrl}/resources`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Cookie: `token=${adminToken}`,
                    Authorization: `Bearer ${adminToken}`
                },
                body: JSON.stringify({
                    title: `System Design Primer ${timestamp}`,
                    url: `https://github.com/example/system-design-primer-${timestamp}`,
                    type: "article",
                    platform: "GitHub",
                    isFree: true,
                    description: "Learn how to build large-scale systems.",
                    estimatedReadTime: "20 hours"
                })
            });
            assert.strictEqual(res.status, 201);
            const data = await res.json();
            assert.strictEqual(data.success, true);
            assert.ok(data.resource._id);
            createdResourceIds.push(data.resource._id);

            // Fetch resources list
            const listRes = await fetch(`${baseUrl}/resources`, {
                headers: {
                    Cookie: `token=${adminToken}`,
                    Authorization: `Bearer ${adminToken}`
                }
            });
            assert.strictEqual(listRes.status, 200);
            const listData = await listRes.json();
            assert.strictEqual(listData.success, true);
            assert.ok(listData.resources.some(r => r._id === data.resource._id));
        });

        // --- TEST 13: Roadmap Status Toggle (Draft / Published / Archived) ---
        await runTest("Toggle roadmap publication status", async () => {
            const res = await fetch(`${baseUrl}/roadmaps/${testRoadmapId}/status`, {
                method: "PATCH",
                headers: {
                    "Content-Type": "application/json",
                    Cookie: `token=${adminToken}`,
                    Authorization: `Bearer ${adminToken}`
                },
                body: JSON.stringify({ publicationStatus: "Archived" })
            });
            assert.strictEqual(res.status, 200);
            const data = await res.json();
            assert.strictEqual(data.roadmap.publicationStatus, "Archived");
        });

    } finally {
        // Cleanup test data
        if (createdCompanyIds.length > 0) {
            await Company.deleteMany({ _id: { $in: createdCompanyIds } });
        }
        if (createdRoadmapIds.length > 0) {
            await Roadmap.deleteMany({ _id: { $in: createdRoadmapIds } });
            await UserRoadmapProgress.deleteMany({ roadmap: { $in: createdRoadmapIds } });
        }
        if (createdResourceIds.length > 0) {
            await PreparationResource.deleteMany({ _id: { $in: createdResourceIds } });
        }
        if (createdUserIds.length > 0) {
            await User.deleteMany({ _id: { $in: createdUserIds } });
        }

        server.close();
        await mongoose.connection.close();
    }

    console.log("\n==================================================================");
    console.log(`📊 TEST SUMMARY: Total: ${stats.total} | Passed: ${stats.passed} | Failed: ${stats.failed}`);
    console.log("==================================================================\n");

    if (stats.failed > 0) {
        process.exit(1);
    }
}

runAdminPreparationTests().catch((err) => {
    console.error("Test execution failed:", err);
    process.exit(1);
});

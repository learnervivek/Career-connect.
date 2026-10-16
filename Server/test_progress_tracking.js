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
import { UserTargetCompany } from "./models/userTargetCompany.models.js";
import app from "./index.js";

async function runProgressTrackingTests() {
    console.log("==================================================================");
    console.log("🚀 ROADMAP PROGRESS TRACKING & TARGET COMPANIES INTEGRATION TESTS");
    console.log("==================================================================\n");

    await connectDB();

    const createdUserIds = [];
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

    // Helper to generate a valid test token
    const makeToken = (userId) => {
        return jwt.sign({ userId }, process.env.SECRET_KEY || "secretKey", { expiresIn: "1d" });
    };

    // Start a temporary test server
    const server = app.listen(0);
    const port = server.address().port;
    const baseUrl = `http://127.0.0.1:${port}/api/v1`;

    try {
        // Setup Test Users
        const timestamp = Date.now();
        const userA = await User.create({
            fullname: `Student Alice ${timestamp}`,
            email: `alice_${timestamp}@example.com`,
            phoneNumber: 9112233440,
            password: "hashedpassword123",
            role: "student",
        });
        createdUserIds.push(userA._id);

        const userB = await User.create({
            fullname: `Student Bob ${timestamp}`,
            email: `bob_${timestamp}@example.com`,
            phoneNumber: 9112233441,
            password: "hashedpassword123",
            role: "student",
        });
        createdUserIds.push(userB._id);

        const tokenA = makeToken(userA._id);
        const tokenB = makeToken(userB._id);

        // Find a seeded roadmap with multiple stages and topics (e.g. Qualcomm or TCS)
        const qualcommRoadmap = await Roadmap.findOne({ slug: "qualcomm-software-engineering-embedded" });
        assert.ok(qualcommRoadmap, "Qualcomm roadmap should exist from seeding");
        const allQualcommTopics = qualcommRoadmap.getAllTopicIds();
        assert.ok(allQualcommTopics.length >= 4, "Qualcomm roadmap should have at least 4 topics");

        const tcsRoadmap = await Roadmap.findOne({ slug: "tcs-digital-prime-sde" });
        assert.ok(tcsRoadmap, "TCS Digital & Prime roadmap should exist from seeding");

        const qualcommCompany = await Company.findOne({ slug: "qualcomm" });
        const tcsCompany = await Company.findOne({ slug: "tcs" });

        // Test 1: Unauthenticated requests are rejected with 401
        await runTest("Security: Unauthenticated progress requests return 401 Unauthorized", async () => {
            const res = await fetch(`${baseUrl}/progress/${qualcommRoadmap._id}`);
            assert.strictEqual(res.status, 401);
            const data = await res.json();
            assert.strictEqual(data.success, false);
        });

        // Test 2: User A fetches initial progress for Qualcomm roadmap (Not Started)
        await runTest("User A fetches initial progress (returns 'Not Started' with 0% completion)", async () => {
            const res = await fetch(`${baseUrl}/progress/${qualcommRoadmap.slug}`, {
                headers: { Authorization: `Bearer ${tokenA}` },
            });
            assert.strictEqual(res.status, 200);
            const data = await res.json();
            assert.strictEqual(data.success, true);
            assert.strictEqual(data.progress.isEnrolled, false);
            assert.strictEqual(data.progress.status, "Not Started");
            assert.strictEqual(data.progress.overallProgressPercentage, 0);
            assert.strictEqual(data.progress.completedTopicsCount, 0);
            assert.strictEqual(data.progress.remainingTopicsCount, allQualcommTopics.length);
            assert.strictEqual(data.progress.stagesProgress.length, qualcommRoadmap.stages.length);
        });

        // Test 3: User A starts the roadmap
        await runTest("User A explicitly starts the roadmap (status transitions to 'In Progress')", async () => {
            const res = await fetch(`${baseUrl}/progress/${qualcommRoadmap._id}/start`, {
                method: "POST",
                headers: { Authorization: `Bearer ${tokenA}` },
            });
            assert.strictEqual(res.status, 200);
            const data = await res.json();
            assert.strictEqual(data.success, true);
            assert.strictEqual(data.progress.isEnrolled, true);
            assert.strictEqual(data.progress.status, "In Progress");

            // Verify in MongoDB
            const doc = await UserRoadmapProgress.findOne({ user: userA._id, roadmap: qualcommRoadmap._id });
            assert.ok(doc);
            assert.strictEqual(doc.status, "In Progress");
        });

        // Test 4: User A marks the first 2 topics complete
        const topic1 = allQualcommTopics[0];
        const topic2 = allQualcommTopics[1];

        await runTest("User A marks topics complete (progress percentage and stage metrics recalculate)", async () => {
            // Mark topic 1 complete
            const res1 = await fetch(`${baseUrl}/progress/${qualcommRoadmap._id}/topics/${topic1}`, {
                method: "PUT",
                headers: {
                    Authorization: `Bearer ${tokenA}`,
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ completed: true }),
            });
            assert.strictEqual(res1.status, 200);
            const data1 = await res1.json();
            assert.strictEqual(data1.success, true);
            assert.strictEqual(data1.progress.completedTopicsCount, 1);
            assert.ok(data1.progress.completedTopicIds.includes(topic1));

            // Mark topic 2 complete (completing stage 1)
            const res2 = await fetch(`${baseUrl}/progress/${qualcommRoadmap._id}/topics/${topic2}`, {
                method: "PUT",
                headers: {
                    Authorization: `Bearer ${tokenA}`,
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ completed: true }),
            });
            assert.strictEqual(res2.status, 200);
            const data2 = await res2.json();
            assert.strictEqual(data2.progress.completedTopicsCount, 2);
            assert.strictEqual(data2.progress.remainingTopicsCount, allQualcommTopics.length - 2);
            assert.strictEqual(data2.progress.overallProgressPercentage, 50); // 2 out of 4 is 50%

            // Stage 1 is fully complete
            const stage1Progress = data2.progress.stagesProgress[0];
            assert.strictEqual(stage1Progress.isCompleted, true);
            assert.strictEqual(stage1Progress.percentage, 100);
            assert.strictEqual(data2.progress.completedStagesCount, 1);
        });

        // Test 5: Verify User B has independent progress on the same roadmap
        await runTest("User B has completely independent progress on the exact same roadmap", async () => {
            // User B progress should still be 0% and Not Started
            const resB = await fetch(`${baseUrl}/progress/${qualcommRoadmap._id}`, {
                headers: { Authorization: `Bearer ${tokenB}` },
            });
            assert.strictEqual(resB.status, 200);
            const dataB = await resB.json();
            assert.strictEqual(dataB.progress.completedTopicsCount, 0);
            assert.strictEqual(dataB.progress.overallProgressPercentage, 0);
            assert.strictEqual(dataB.progress.isEnrolled, false);

            // User B marks topic 3 (from stage 2) complete
            const topic3 = allQualcommTopics[2];
            const updateB = await fetch(`${baseUrl}/progress/${qualcommRoadmap._id}/topics/${topic3}`, {
                method: "PUT",
                headers: {
                    Authorization: `Bearer ${tokenB}`,
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ completed: true }),
            });
            const updateDataB = await updateB.json();
            assert.strictEqual(updateDataB.progress.completedTopicsCount, 1);
            assert.ok(updateDataB.progress.completedTopicIds.includes(topic3));
            assert.ok(!updateDataB.progress.completedTopicIds.includes(topic1));

            // User A progress is unchanged (still 2 completed topics: topic1, topic2)
            const checkA = await fetch(`${baseUrl}/progress/${qualcommRoadmap._id}`, {
                headers: { Authorization: `Bearer ${tokenA}` },
            });
            const checkDataA = await checkA.json();
            assert.strictEqual(checkDataA.progress.completedTopicsCount, 2);
            assert.ok(checkDataA.progress.completedTopicIds.includes(topic1));
            assert.ok(checkDataA.progress.completedTopicIds.includes(topic2));
            assert.ok(!checkDataA.progress.completedTopicIds.includes(topic3));
        });

        // Test 6: User A marks a topic incomplete (unchecking)
        await runTest("User A unchecks a topic (progress decreases and stage completion updates)", async () => {
            const res = await fetch(`${baseUrl}/progress/${qualcommRoadmap._id}/topics/${topic2}`, {
                method: "PUT",
                headers: {
                    Authorization: `Bearer ${tokenA}`,
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ completed: false }),
            });
            assert.strictEqual(res.status, 200);
            const data = await res.json();
            assert.strictEqual(data.progress.completedTopicsCount, 1);
            assert.strictEqual(data.progress.overallProgressPercentage, 25);
            assert.ok(!data.progress.completedTopicIds.includes(topic2));

            // Stage 1 is no longer fully complete
            assert.strictEqual(data.progress.stagesProgress[0].isCompleted, false);
            assert.strictEqual(data.progress.completedStagesCount, 0);
        });

        // Test 7: Validation: Topic ID that does not belong to roadmap is rejected with 400
        await runTest("Validation: Non-existent or mismatched topicId is rejected with 400", async () => {
            const res = await fetch(`${baseUrl}/progress/${qualcommRoadmap._id}/topics/fake_invalid_topic_id`, {
                method: "PUT",
                headers: {
                    Authorization: `Bearer ${tokenA}`,
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ completed: true }),
            });
            assert.strictEqual(res.status, 400);
            const data = await res.json();
            assert.strictEqual(data.success, false);
        });

        // Test 8: Target Companies Management: Add, update, and prevent duplicate entries
        await runTest("Target Companies: Add and update company in personal target list", async () => {
            // Add Qualcomm as Dream target
            const addRes = await fetch(`${baseUrl}/my-target-companies`, {
                method: "POST",
                headers: {
                    Authorization: `Bearer ${tokenA}`,
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    companyId: qualcommCompany._id,
                    priority: "Dream",
                    targetRole: "Embedded Software Engineer",
                    notes: "Aiming for campus placement drive",
                }),
            });
            assert.strictEqual(addRes.status, 201);
            const addData = await addRes.json();
            assert.strictEqual(addData.success, true);
            assert.strictEqual(addData.targetCompany.priority, "Dream");

            // Adding same company again updates idempotently without duplicate error
            const updateRes = await fetch(`${baseUrl}/my-target-companies`, {
                method: "POST",
                headers: {
                    Authorization: `Bearer ${tokenA}`,
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    companyId: qualcommCompany.slug,
                    priority: "Target",
                    notes: "Updated priority to Target",
                }),
            });
            assert.strictEqual(updateRes.status, 200);
            const updateData = await updateRes.json();
            assert.strictEqual(updateData.targetCompany.priority, "Target");

            // Verify only 1 record exists in DB for (userA, qualcomm)
            const count = await UserTargetCompany.countDocuments({ user: userA._id, company: qualcommCompany._id });
            assert.strictEqual(count, 1);
        });

        // Test 9: Personal Preparation Dashboard API returns all metrics and enrolled roadmaps
        await runTest("Personal Dashboard (GET /api/v1/my-preparation) returns target companies and active roadmaps", async () => {
            // User A also starts TCS roadmap
            await fetch(`${baseUrl}/progress/${tcsRoadmap._id}/start`, {
                method: "POST",
                headers: { Authorization: `Bearer ${tokenA}` },
            });

            const res = await fetch(`${baseUrl}/my-preparation`, {
                headers: { Authorization: `Bearer ${tokenA}` },
            });
            assert.strictEqual(res.status, 200);
            const data = await res.json();
            assert.strictEqual(data.success, true);

            // Summary metrics
            assert.strictEqual(data.summary.totalTargetCompanies, 1);
            assert.strictEqual(data.summary.activeRoadmapsCount, 2);
            assert.ok(data.targetCompanies.length >= 1);
            assert.strictEqual(data.targetCompanies[0].company.slug, "qualcomm");

            // Enrolled roadmaps
            assert.strictEqual(data.activeRoadmaps.length, 2);
            const qualcommEntry = data.activeRoadmaps.find((r) => r.slug === qualcommRoadmap.slug);
            assert.ok(qualcommEntry);
            assert.strictEqual(qualcommEntry.completedTopicsCount, 1);
        });

        // Test 10: Target Companies: Delete target company
        await runTest("Target Companies: Remove company from target list (DELETE /api/v1/my-target-companies/:id)", async () => {
            const delRes = await fetch(`${baseUrl}/my-target-companies/${qualcommCompany.slug}`, {
                method: "DELETE",
                headers: { Authorization: `Bearer ${tokenA}` },
            });
            assert.strictEqual(delRes.status, 200);
            const delData = await delRes.json();
            assert.strictEqual(delData.success, true);
            assert.strictEqual(delData.isTargetCompany, false);

            // Verify removed from DB
            const exists = await UserTargetCompany.findOne({ user: userA._id, company: qualcommCompany._id });
            assert.strictEqual(exists, null);
        });

    } finally {
        server.close();
        // Cleanup test users and progress
        for (const uid of createdUserIds) {
            await User.findByIdAndDelete(uid);
            await UserRoadmapProgress.deleteMany({ user: uid });
            await UserTargetCompany.deleteMany({ user: uid });
        }
    }

    console.log("\n==================================================================");
    console.log(`📊 TEST RESULTS: ${stats.passed}/${stats.total} PASSED (${stats.failed} FAILED)`);
    console.log("==================================================================\n");

    if (stats.failed > 0) process.exit(1);
}

runProgressTrackingTests().catch((err) => {
    console.error("Test execution failed:", err);
    process.exit(1);
});

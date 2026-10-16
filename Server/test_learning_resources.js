import dotenv from "dotenv";
dotenv.config();
process.env.NODE_ENV = "test";

import mongoose from "mongoose";
import jwt from "jsonwebtoken";
import connectDB from "./utils/db.js";
import app from "./index.js";
import { User } from "./models/user.model.js";
import { PreparationResource } from "./models/preparationResource.models.js";
import { UserResourceBookmark } from "./models/userResourceBookmark.models.js";
import { Roadmap } from "./models/roadmap.models.js";
import { UserRoadmapProgress } from "./models/userRoadmapProgress.models.js";

dotenv.config();

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

async function runTests() {
    console.log("🚀 Starting Learning Resources Integration Tests...\n");
    await connectDB();

    const PORT = 8003;
    server = app.listen(PORT);
    baseUrl = `http://localhost:${PORT}`;

    try {
        // 1. Setup Test Users
        const candidateEmail = `test_candidate_resources_${Date.now()}@careerconnect.com`;
        const candidateUser = await User.create({
            fullname: "Resource Candidate",
            email: candidateEmail,
            phoneNumber: 9876543220,
            password: "hashedPassword123",
            role: "student",
        });

        const adminEmail = `test_admin_resources_${Date.now()}@careerconnect.com`;
        const adminUser = await User.create({
            fullname: "Resource Admin",
            email: adminEmail,
            phoneNumber: 9876543221,
            password: "hashedPassword123",
            role: "admin",
        });

        const candidateToken = jwt.sign({ userId: candidateUser._id }, process.env.SECRET_KEY, { expiresIn: "1d" });
        const adminToken = jwt.sign({ userId: adminUser._id }, process.env.SECRET_KEY, { expiresIn: "1d" });

        console.log("✅ Created test candidate and admin users.");

        // 2. Test GET /api/v1/preparation/resources (Public catalog with filters)
        console.log("\n--- Testing Public Resources Directory ---");
        const resAll = await request("GET", "/api/v1/preparation/resources");
        if (resAll.status !== 200 || !resAll.data.success || !Array.isArray(resAll.data.resources)) {
            throw new Error(`Failed to fetch public resources: ${JSON.stringify(resAll.data)}`);
        }
        console.log(`✅ Fetched all resources: ${resAll.data.count} found.`);

        // Test filtering by category: DSA
        const resDSA = await request("GET", "/api/v1/preparation/resources?category=DSA");
        if (resDSA.status !== 200 || !resDSA.data.resources.every(r => r.category === "DSA")) {
            throw new Error(`DSA category filter failed: ${JSON.stringify(resDSA.data)}`);
        }
        console.log(`✅ Category filter (DSA) verified: ${resDSA.data.count} resources found.`);

        // Test filtering by sourceType: Official Company
        const resOfficial = await request("GET", "/api/v1/preparation/resources?sourceType=Official%20Company");
        if (resOfficial.status !== 200 || !resOfficial.data.resources.every(r => r.sourceType === "Official Company")) {
            throw new Error(`SourceType filter failed: ${JSON.stringify(resOfficial.data)}`);
        }
        console.log(`✅ SourceType filter (Official Company) verified: ${resOfficial.data.count} resources found.`);

        // 3. Test Resource Bookmarking
        console.log("\n--- Testing Candidate Resource Bookmarking ---");
        const targetResource = resAll.data.resources[0];
        if (!targetResource) {
            throw new Error("No seeded resources available to test bookmarking");
        }

        // Toggle bookmark ON
        const resBookmarkOn = await request("POST", `/api/v1/preparation/resources/${targetResource._id}/bookmark`, {
            notes: "Important study sheet for upcoming technical round",
        }, candidateToken);

        if (resBookmarkOn.status !== 201 || !resBookmarkOn.data.isBookmarked) {
            throw new Error(`Failed to bookmark resource: ${JSON.stringify(resBookmarkOn.data)}`);
        }
        console.log(`✅ Resource bookmarked successfully: '${targetResource.title}'`);

        // Check user bookmarks listing
        const resMyBookmarks = await request("GET", "/api/v1/preparation/my-resource-bookmarks", null, candidateToken);
        if (resMyBookmarks.status !== 200 || resMyBookmarks.data.count !== 1 || resMyBookmarks.data.bookmarks[0].resource._id !== targetResource._id) {
            throw new Error(`My bookmarks list verification failed: ${JSON.stringify(resMyBookmarks.data)}`);
        }
        console.log(`✅ User bookmarks listing verified: ${resMyBookmarks.data.count} bookmark retrieved.`);

        // Toggle bookmark OFF
        const resBookmarkOff = await request("POST", `/api/v1/preparation/resources/${targetResource._id}/bookmark`, {}, candidateToken);
        if (resBookmarkOff.status !== 200 || resBookmarkOff.data.isBookmarked !== false) {
            throw new Error(`Failed to unbookmark resource: ${JSON.stringify(resBookmarkOff.data)}`);
        }
        console.log(`✅ Resource unbookmarked successfully.`);

        // Re-bookmark for subsequent dashboard tests
        await request("POST", `/api/v1/preparation/resources/${targetResource._id}/bookmark`, {}, candidateToken);

        // 4. Test Topic Personal Notes
        console.log("\n--- Testing Topic Personal Notes ---");
        const roadmap = await Roadmap.findOne({ publicationStatus: "Published" }).lean();
        if (!roadmap || !roadmap.stages?.[0]?.topics?.[0]) {
            throw new Error("No active roadmap with topics available to test notes");
        }
        const sampleTopic = roadmap.stages[0].topics[0];

        const noteText = "Remember time complexity for QuickSort is O(N log N) average and O(N^2) worst case.";
        const resNote = await request(
            "PUT",
            `/api/v1/progress/${roadmap._id}/topics/${sampleTopic.topicId}/note`,
            { note: noteText },
            candidateToken
        );

        if (resNote.status !== 200 || !resNote.data.success || resNote.data.note !== noteText) {
            throw new Error(`Failed to save topic note: ${JSON.stringify(resNote.data)}`);
        }
        console.log(`✅ Saved personal note for topic '${sampleTopic.title}'.`);

        // Verify that topic note is populated in roadmap details
        const resRoadmap = await request("GET", `/api/v1/preparation/roadmaps/${roadmap.slug || roadmap._id}`, null, candidateToken);
        if (resRoadmap.status !== 200 || !resRoadmap.data.roadmap) {
            throw new Error(`Failed to get roadmap details: ${JSON.stringify(resRoadmap.data)}`);
        }
        const stage0 = resRoadmap.data.roadmap.stages[0];
        const topicWithNote = stage0.topics.find(t => t.topicId === sampleTopic.topicId);
        if (!topicWithNote || topicWithNote.userNote !== noteText) {
            throw new Error(`Topic userNote was not populated in roadmap details: ${JSON.stringify(topicWithNote)}`);
        }
        console.log(`✅ Verified personal note is returned in roadmap details for authenticated candidate.`);

        // 5. Test "Continue Preparation" section
        console.log("\n--- Testing Continue Preparation Flow ---");
        const resContinue = await request("GET", "/api/v1/preparation/continue", null, candidateToken);
        if (resContinue.status !== 200 || !resContinue.data.hasActivePreparation || !resContinue.data.continuePreparation) {
            throw new Error(`Continue preparation failed: ${JSON.stringify(resContinue.data)}`);
        }
        const cont = resContinue.data.continuePreparation;
        console.log(`✅ Continue preparation returned active roadmap: '${cont.roadmapTitle}' with next topic: '${cont.nextTopic?.title}'`);

        // 6. Test Admin Resource Management: Update, Status & Last-Verified Date
        console.log("\n--- Testing Admin Resource Lifecycle & Obsolete Marking ---");
        const resUpdate = await request(
            "PUT",
            `/api/v1/admin/preparation/resources/${targetResource._id}`,
            {
                category: "DSA",
                type: "Practice Sheet",
                sourceType: "External Platform",
                estimatedTimeMinutes: 45,
                description: "Updated curated practice sheet",
            },
            adminToken
        );
        if (resUpdate.status !== 200 || !resUpdate.data.success) {
            throw new Error(`Failed to update admin resource: ${JSON.stringify(resUpdate.data)}`);
        }
        console.log(`✅ Admin updated resource fields and refreshed lastVerifiedDate.`);

        // Mark Obsolete
        const resObsolete = await request(
            "PATCH",
            `/api/v1/admin/preparation/resources/${targetResource._id}/status`,
            { status: "Obsolete" },
            adminToken
        );
        if (resObsolete.status !== 200 || resObsolete.data.resource.status !== "Obsolete") {
            throw new Error(`Failed to mark resource obsolete: ${JSON.stringify(resObsolete.data)}`);
        }
        console.log(`✅ Marked resource as 'Obsolete'.`);

        // Verify obsolete resource is excluded from public directory
        const resPublicAfterObsolete = await request("GET", "/api/v1/preparation/resources");
        const isStillInPublic = resPublicAfterObsolete.data.resources.some(r => r._id === targetResource._id);
        if (isStillInPublic) {
            throw new Error("Obsolete resource was still returned in public resources catalog!");
        }
        console.log(`✅ Confirmed obsolete resource is excluded from public catalog.`);

        // Verify resource back to Active
        const resVerify = await request(
            "PATCH",
            `/api/v1/admin/preparation/resources/${targetResource._id}/verify`,
            {},
            adminToken
        );
        if (resVerify.status !== 200 || resVerify.data.resource.status !== "Active") {
            throw new Error(`Failed to verify resource: ${JSON.stringify(resVerify.data)}`);
        }
        console.log(`✅ Verified resource restored to Active with updated lastVerifiedDate.`);

        // Cleanup test data
        await UserResourceBookmark.deleteMany({ user: candidateUser._id });
        await UserRoadmapProgress.deleteMany({ user: candidateUser._id });
        await User.deleteMany({ _id: { $in: [candidateUser._id, adminUser._id] } });

        console.log("\n🎉 ALL LEARNING RESOURCE TESTS PASSED SUCCESSFULLY! 🎉\n");
    } catch (err) {
        console.error("❌ Test failed:", err);
        process.exitCode = 1;
    } finally {
        if (server) {
            server.close();
        }
        await mongoose.connection.close();
    }
}

runTests();

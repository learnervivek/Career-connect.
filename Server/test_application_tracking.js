import dotenv from "dotenv";
dotenv.config();
process.env.NODE_ENV = "test";

import mongoose from "mongoose";
import jwt from "jsonwebtoken";
import assert from "node:assert";
import connectDB from "./utils/db.js";
import { User } from "./models/user.model.js";
import { Company } from "./models/company.models.js";
import { Job } from "./models/job.models.js";
import { Application } from "./models/application.models.js";
import { Interview } from "./models/interview.models.js";
import { Notification } from "./models/notification.models.js";
import app from "./index.js";
import http from "node:http";

let server;
let baseUrl;

const startServer = () => {
    return new Promise((resolve) => {
        server = http.createServer(app);
        server.listen(0, "127.0.0.1", () => {
            const port = server.address().port;
            baseUrl = `http://127.0.0.1:${port}`;
            console.log(`Application tracking test server running at ${baseUrl}`);
            resolve();
        });
    });
};

const stopServer = () => {
    return new Promise((resolve) => {
        if (server) {
            server.close(resolve);
        } else {
            resolve();
        }
    });
};

const request = async (endpoint, { method = "GET", token = null, body = null } = {}) => {
    const headers = {};
    if (token) {
        headers["Authorization"] = `Bearer ${token}`;
        headers["Cookie"] = `token=${token}`;
    }
    if (body) {
        headers["Content-Type"] = "application/json";
    }

    const res = await fetch(`${baseUrl}${endpoint}`, {
        method,
        headers,
        body: body ? JSON.stringify(body) : undefined,
    });

    let data;
    try {
        data = await res.json();
    } catch {
        data = null;
    }

    return { status: res.status, data };
};

const createToken = (userId) => {
    return jwt.sign({ userId }, process.env.SECRET_KEY || "testsecret", { expiresIn: "1d" });
};

async function runTestSuite() {
    console.log("==================================================================");
    console.log("🎯 JOB APPLICATION TRACKING & NOTIFICATIONS TEST SUITE");
    console.log("==================================================================\n");

    await connectDB();
    await startServer();

    let candidateA, candidateB, recruiterA, recruiterB;
    let tokenCandidateA, tokenCandidateB, tokenRecruiterA, tokenRecruiterB;
    let companyA, jobA, jobB;
    let createdApplicationId;

    try {
        // Setup mock users
        const testRunId = Date.now().toString(36);

        candidateA = await User.create({
            fullname: `Candidate Alpha ${testRunId}`,
            email: `candidate.alpha.${testRunId}@test.com`,
            phoneNumber: 9876543210,
            password: "hashedpassword123",
            role: "student",
        });
        tokenCandidateA = createToken(candidateA._id);

        candidateB = await User.create({
            fullname: `Candidate Beta ${testRunId}`,
            email: `candidate.beta.${testRunId}@test.com`,
            phoneNumber: 9876543211,
            password: "hashedpassword123",
            role: "student",
        });
        tokenCandidateB = createToken(candidateB._id);

        recruiterA = await User.create({
            fullname: `Recruiter Alice ${testRunId}`,
            email: `recruiter.alice.${testRunId}@test.com`,
            phoneNumber: 9876543212,
            password: "hashedpassword123",
            role: "recruiter",
        });
        tokenRecruiterA = createToken(recruiterA._id);

        recruiterB = await User.create({
            fullname: `Recruiter Bob ${testRunId}`,
            email: `recruiter.bob.${testRunId}@test.com`,
            phoneNumber: 9876543213,
            password: "hashedpassword123",
            role: "recruiter",
        });
        tokenRecruiterB = createToken(recruiterB._id);

        companyA = await Company.create({
            companyName: `TechCorp Solutions ${testRunId}`,
            description: "Leading technology firm",
            userId: recruiterA._id,
        });

        jobA = await Job.create({
            title: "Senior Full Stack Engineer",
            description: "Build scalable web applications",
            requirements: ["React", "Node.js", "MongoDB"],
            salary: 140000,
            location: "San Francisco, CA",
            jobType: "Full-Time",
            experienceLevel: 4,
            position: 2,
            company: companyA._id,
            created_by: recruiterA._id,
        });

        jobB = await Job.create({
            title: "DevOps Engineer",
            description: "Cloud infrastructure",
            requirements: ["AWS", "Docker", "Kubernetes"],
            salary: 130000,
            location: "Remote",
            jobType: "Full-Time",
            experienceLevel: 3,
            position: 1,
            company: companyA._id,
            created_by: recruiterB._id, // owned by Recruiter B
        });

        // ────────────────────────────────────────────────────────────────
        // Test 1: Candidate applies for a job and receives in-app confirmation
        // ────────────────────────────────────────────────────────────────
        process.stdout.write("[Test 1] Candidate applies for a job -> application created with ref & history ... ");
        const applyRes = await request(`/api/v1/application/apply/${jobA._id}`, {
            method: "POST",
            token: tokenCandidateA,
        });
        assert.strictEqual(applyRes.status, 201);
        assert.strictEqual(applyRes.data.success, true);
        assert.ok(applyRes.data.application._id);
        assert.strictEqual(applyRes.data.application.status, "applied");
        assert.ok(applyRes.data.application.applicationRef);
        assert.strictEqual(applyRes.data.application.statusHistory.length, 1);
        assert.strictEqual(applyRes.data.application.statusHistory[0].status, "applied");
        createdApplicationId = applyRes.data.application._id;
        console.log("✅ PASSED");

        // ────────────────────────────────────────────────────────────────
        // Test 2: Prevent duplicate application submission
        // ────────────────────────────────────────────────────────────────
        process.stdout.write("[Test 2] Prevent duplicate application submission ... ");
        const dupRes = await request(`/api/v1/application/apply/${jobA._id}`, {
            method: "POST",
            token: tokenCandidateA,
        });
        assert.strictEqual(dupRes.status, 400);
        assert.match(dupRes.data.message, /already applied/i);
        console.log("✅ PASSED");

        // ────────────────────────────────────────────────────────────────
        // Test 3: Application appears in Candidate's "My Applications" API
        // ────────────────────────────────────────────────────────────────
        process.stdout.write("[Test 3] Application appears in candidate's My Applications with full details ... ");
        const myAppsRes = await request("/api/v1/application/my-applications", {
            method: "GET",
            token: tokenCandidateA,
        });
        assert.strictEqual(myAppsRes.status, 200);
        assert.strictEqual(myAppsRes.data.success, true);
        assert.ok(Array.isArray(myAppsRes.data.application));
        const found = myAppsRes.data.application.find((a) => a._id.toString() === createdApplicationId.toString());
        assert.ok(found);
        assert.strictEqual(found.job.title, "Senior Full Stack Engineer");
        assert.strictEqual(found.job.company.companyName, companyA.companyName);
        console.log("✅ PASSED");

        // ────────────────────────────────────────────────────────────────
        // Test 4: Single application details & timeline endpoint
        // ────────────────────────────────────────────────────────────────
        process.stdout.write("[Test 4] Candidate fetches single application details & timeline ... ");
        const appRes = await request(`/api/v1/application/${createdApplicationId}`, {
            method: "GET",
            token: tokenCandidateA,
        });
        assert.strictEqual(appRes.status, 200);
        assert.strictEqual(appRes.data.application.applicationRef, found.applicationRef);
        assert.ok(appRes.data.application.statusHistory.length >= 1);

        const historyRes = await request(`/api/v1/application/${createdApplicationId}/history`, {
            method: "GET",
            token: tokenCandidateA,
        });
        assert.strictEqual(historyRes.status, 200);
        assert.ok(Array.isArray(historyRes.data.statusHistory));
        assert.strictEqual(historyRes.data.statusHistory[0].status, "applied");
        console.log("✅ PASSED");

        // ────────────────────────────────────────────────────────────────
        // Test 5: Recruiter changes status to "under review"
        // ────────────────────────────────────────────────────────────────
        process.stdout.write("[Test 5] Recruiter updates status to 'under review' with recruiter message ... ");
        const reviewRes = await request(`/api/v1/application/${createdApplicationId}/status`, {
            method: "PATCH",
            token: tokenRecruiterA,
            body: {
                status: "under review",
                message: "Resume passed preliminary screening and is under technical review.",
            },
        });
        assert.strictEqual(reviewRes.status, 200);
        assert.strictEqual(reviewRes.data.application.status, "under review");
        assert.strictEqual(reviewRes.data.application.statusHistory.length, 2);
        assert.strictEqual(reviewRes.data.application.statusHistory[1].status, "under review");
        console.log("✅ PASSED");

        // ────────────────────────────────────────────────────────────────
        // Test 6: Recruiter shortlists the applicant
        // ────────────────────────────────────────────────────────────────
        process.stdout.write("[Test 6] Recruiter shortlists applicant ... ");
        const shortlistRes = await request(`/api/v1/application/${createdApplicationId}/status`, {
            method: "PATCH",
            token: tokenRecruiterA,
            body: {
                status: "shortlisted",
                message: "Congratulations! You have been shortlisted for technical interview rounds.",
            },
        });
        assert.strictEqual(shortlistRes.status, 200);
        assert.strictEqual(shortlistRes.data.application.status, "shortlisted");
        assert.strictEqual(shortlistRes.data.application.statusHistory.length, 3);
        console.log("✅ PASSED");

        // ────────────────────────────────────────────────────────────────
        // Test 7: Recruiter schedules an interview and application links it
        // ────────────────────────────────────────────────────────────────
        process.stdout.write("[Test 7] Recruiter schedules interview for shortlisted applicant ... ");
        const futureDate = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();
        const schedRes = await request("/api/v1/interviews", {
            method: "POST",
            token: tokenRecruiterA,
            body: {
                applicationId: createdApplicationId.toString(),
                round: "Technical",
                interviewType: "Online",
                scheduledDate: futureDate,
                duration: 60,
                meetingUrl: "https://meet.google.com/xyz-career-connect",
            },
        });
        assert.strictEqual(schedRes.status, 201);
        assert.ok(schedRes.data.interview);

        // Fetch application again and verify interview appears in candidate's view
        const appAfterSched = await request(`/api/v1/application/${createdApplicationId}`, {
            method: "GET",
            token: tokenCandidateA,
        });
        assert.strictEqual(appAfterSched.status, 200);
        assert.ok(appAfterSched.data.application.interviews.length >= 1);
        assert.strictEqual(appAfterSched.data.application.interviews[0].round, "Technical");
        console.log("✅ PASSED");

        // ────────────────────────────────────────────────────────────────
        // Test 8: Repeated status update with no change does not create duplicate history
        // ────────────────────────────────────────────────────────────────
        process.stdout.write("[Test 8] Repeated status update without change does not add duplicate history ... ");
        const repeatRes = await request(`/api/v1/application/${createdApplicationId}/status`, {
            method: "PATCH",
            token: tokenRecruiterA,
            body: {
                status: "shortlisted",
            },
        });
        assert.strictEqual(repeatRes.status, 200);
        const appAfterRepeat = await request(`/api/v1/application/${createdApplicationId}`, {
            method: "GET",
            token: tokenCandidateA,
        });
        // statusHistory length should remain 3
        assert.strictEqual(appAfterRepeat.data.application.statusHistory.length, 3);
        console.log("✅ PASSED");

        // ────────────────────────────────────────────────────────────────
        // Test 9: Recruiter selects the candidate
        // ────────────────────────────────────────────────────────────────
        process.stdout.write("[Test 9] Recruiter marks applicant as 'selected' ... ");
        const selectRes = await request(`/api/v1/application/${createdApplicationId}/status`, {
            method: "PATCH",
            token: tokenRecruiterA,
            body: {
                status: "selected",
                message: "You cleared all interview rounds! Formal offer letter attached in dashboard.",
            },
        });
        assert.strictEqual(selectRes.status, 200);
        assert.strictEqual(selectRes.data.application.status, "selected");
        assert.strictEqual(selectRes.data.application.statusHistory.length, 4);
        console.log("✅ PASSED");

        // ────────────────────────────────────────────────────────────────
        // Test 10: Timeline displays all recorded status changes in chronological order
        // ────────────────────────────────────────────────────────────────
        process.stdout.write("[Test 10] Application timeline displays all recorded status events chronologically ... ");
        const finalHistory = await request(`/api/v1/application/${createdApplicationId}/history`, {
            method: "GET",
            token: tokenCandidateA,
        });
        assert.strictEqual(finalHistory.status, 200);
        const statuses = finalHistory.data.statusHistory.map((h) => h.status);
        assert.deepStrictEqual(statuses, ["applied", "under review", "shortlisted", "selected"]);
        console.log("✅ PASSED");

        // ────────────────────────────────────────────────────────────────
        // Test 11: Security - Unauthorized candidate cannot access another candidate's application
        // ────────────────────────────────────────────────────────────────
        process.stdout.write("[Test 11] Security: Candidate B cannot view Candidate A's application (403) ... ");
        const hackCandidateRes = await request(`/api/v1/application/${createdApplicationId}`, {
            method: "GET",
            token: tokenCandidateB,
        });
        assert.strictEqual(hackCandidateRes.status, 403);
        console.log("✅ PASSED");

        // ────────────────────────────────────────────────────────────────
        // Test 12: Security - Recruiter B cannot update status for Recruiter A's job application
        // ────────────────────────────────────────────────────────────────
        process.stdout.write("[Test 12] Security: Recruiter B cannot update status for Recruiter A's job (403) ... ");
        const hackRecruiterRes = await request(`/api/v1/application/${createdApplicationId}/status`, {
            method: "PATCH",
            token: tokenRecruiterB,
            body: {
                status: "rejected",
            },
        });
        assert.strictEqual(hackRecruiterRes.status, 403);
        console.log("✅ PASSED");

        // ────────────────────────────────────────────────────────────────
        // Test 13: Candidate withdrawal workflow
        // ────────────────────────────────────────────────────────────────
        process.stdout.write("[Test 13] Candidate creates new application and withdraws it ... ");
        // Candidate B applies to Job B
        const applyBRes = await request(`/api/v1/application/apply/${jobB._id}`, {
            method: "POST",
            token: tokenCandidateB,
        });
        assert.strictEqual(applyBRes.status, 201);
        const appBId = applyBRes.data.application._id;

        const withdrawRes = await request(`/api/v1/application/${appBId}/withdraw`, {
            method: "POST",
            token: tokenCandidateB,
            body: { reason: "Accepted another offer" },
        });
        assert.strictEqual(withdrawRes.status, 200);
        assert.strictEqual(withdrawRes.data.application.status, "withdrawn");

        // Recruiter cannot update a withdrawn application
        const updateWithdrawnRes = await request(`/api/v1/application/${appBId}/status`, {
            method: "PATCH",
            token: tokenRecruiterB,
            body: { status: "under review" },
        });
        assert.strictEqual(updateWithdrawnRes.status, 400);
        console.log("✅ PASSED");

        // ────────────────────────────────────────────────────────────────
        // Test 14: In-app notification creation verification
        // ────────────────────────────────────────────────────────────────
        process.stdout.write("[Test 14] In-app notifications generated for candidate on status changes ... ");
        const notifs = await Notification.find({ recipient: candidateA._id });
        assert.ok(notifs.length >= 2, `Expected at least 2 notifications, got ${notifs.length}`);
        const types = notifs.map((n) => n.type);
        assert.ok(types.includes("APPLICATION_SUBMITTED"));
        assert.ok(types.includes("APPLICATION_SHORTLISTED") || types.includes("APPLICATION_SELECTED"));
        console.log("✅ PASSED");

        console.log("\n==================================================================");
        console.log("🎉 ALL APPLICATION TRACKING TESTS PASSED (14/14)");
        console.log("==================================================================\n");
    } finally {
        console.log("🧹 Cleaning up test artifacts...");
        if (candidateA) await User.deleteOne({ _id: candidateA._id });
        if (candidateB) await User.deleteOne({ _id: candidateB._id });
        if (recruiterA) await User.deleteOne({ _id: recruiterA._id });
        if (recruiterB) await User.deleteOne({ _id: recruiterB._id });
        if (companyA) await Company.deleteOne({ _id: companyA._id });
        if (jobA) await Job.deleteOne({ _id: jobA._id });
        if (jobB) await Job.deleteOne({ _id: jobB._id });
        if (createdApplicationId) {
            await Application.deleteOne({ _id: createdApplicationId });
            await Interview.deleteMany({ application: createdApplicationId });
            await Notification.deleteMany({ application: createdApplicationId });
        }
        await stopServer();
        await mongoose.disconnect();
        process.exit(0);
    }
}

runTestSuite().catch((err) => {
    console.error("Test failed with error:", err);
    process.exit(1);
});

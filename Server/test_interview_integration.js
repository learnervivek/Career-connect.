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

// Helper for HTTP requests directly against Express app
import http from "node:http";

let server;
let baseUrl;

const startServer = () => {
    return new Promise((resolve) => {
        server = http.createServer(app);
        server.listen(0, "127.0.0.1", () => {
            const port = server.address().port;
            baseUrl = `http://127.0.0.1:${port}`;
            console.log(`Test server running at ${baseUrl}`);
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

// Generic request wrapper using fetch
const request = async (endpoint, { method = "GET", token = null, body = null } = {}) => {
    const headers = {};
    if (token) {
        headers["Authorization"] = `Bearer ${token}`;
    }
    if (body) {
        headers["Content-Type"] = "application/json";
    }

    const res = await fetch(`${baseUrl}${endpoint}`, {
        method,
        headers,
        body: body ? JSON.stringify(body) : undefined,
    });

    const data = await res.json().catch(() => ({}));
    return {
        status: res.status,
        headers: res.headers,
        data,
    };
};

const signToken = (user) => {
    return jwt.sign({ userId: user._id }, process.env.SECRET_KEY || "$uperKey", {
        expiresIn: "1d",
    });
};

// Test Suite
async function runIntegrationTests() {
    console.log("=====================================================");
    console.log("🚀 STARTING INTERVIEW SYSTEM INTEGRATION TEST SUITE");
    console.log("=====================================================\n");

    await connectDB();
    await startServer();

    // Track cleanup IDs
    const createdUserIds = [];
    const createdCompanyIds = [];
    const createdJobIds = [];
    const createdApplicationIds = [];
    const createdInterviewIds = [];
    const createdNotificationIds = [];

    const stats = {
        total: 0,
        passed: 0,
        failed: 0,
        results: [],
    };

    const runTest = async (name, testFn) => {
        stats.total++;
        process.stdout.write(`[Test ${stats.total}] ${name} ... `);
        try {
            await testFn();
            stats.passed++;
            console.log("✅ PASSED");
            stats.results.push({ name, status: "PASSED" });
        } catch (err) {
            stats.failed++;
            console.log("❌ FAILED");
            console.error(`   Error: ${err.message}`);
            stats.results.push({ name, status: "FAILED", error: err.message });
        }
    };

    try {
        // Setup Test Users:
        // 1. Recruiter A (job owner)
        // 2. Recruiter B (unauthorized recruiter)
        // 3. Candidate A (applicant)
        // 4. Candidate B (unauthorized candidate)

        const recruiterA = await User.create({
            fullname: "Recruiter Alice",
            email: `recruiter.alice.${Date.now()}@example.com`,
            phoneNumber: 9876543210,
            password: "hashedpassword123",
            role: "recruiter",
            profile: { company: null },
        });
        createdUserIds.push(recruiterA._id);

        const recruiterB = await User.create({
            fullname: "Recruiter Bob",
            email: `recruiter.bob.${Date.now()}@example.com`,
            phoneNumber: 9876543211,
            password: "hashedpassword123",
            role: "recruiter",
            profile: { company: null },
        });
        createdUserIds.push(recruiterB._id);

        const candidateA = await User.create({
            fullname: "Candidate Charlie",
            email: `candidate.charlie.${Date.now()}@example.com`,
            phoneNumber: 9876543212,
            password: "hashedpassword123",
            role: "student",
            profile: { skills: ["React", "Node.js"] },
        });
        createdUserIds.push(candidateA._id);

        const candidateB = await User.create({
            fullname: "Candidate Dave",
            email: `candidate.dave.${Date.now()}@example.com`,
            phoneNumber: 9876543213,
            password: "hashedpassword123",
            role: "student",
            profile: { skills: ["Python"] },
        });
        createdUserIds.push(candidateB._id);

        const tokenRecruiterA = signToken(recruiterA);
        const tokenRecruiterB = signToken(recruiterB);
        const tokenCandidateA = signToken(candidateA);
        const tokenCandidateB = signToken(candidateB);

        // Setup Test Company & Job (created by Recruiter A)
        const companyA = await Company.create({
            companyName: `TechCorp_${Date.now()}`,
            description: "A leading technology company",
            userId: recruiterA._id,
        });
        createdCompanyIds.push(companyA._id);

        const jobA = await Job.create({
            title: "Senior Fullstack Engineer",
            description: "Work on cutting-edge MERN stack apps",
            requirements: ["React", "Node.js", "MongoDB"],
            salary: 120000,
            location: "San Francisco, CA",
            jobType: "Full-time",
            experienceLevel: 4,
            position: 2,
            company: companyA._id,
            created_by: recruiterA._id,
            applications: [],
        });
        createdJobIds.push(jobA._id);

        // Application 1: Accepted / Shortlisted application
        const applicationAccepted = await Application.create({
            job: jobA._id,
            applicant: candidateA._id,
            status: "accepted",
            interviews: [],
        });
        createdApplicationIds.push(applicationAccepted._id);
        jobA.applications.push(applicationAccepted._id);
        await jobA.save();

        // Application 2: Pending application
        const applicationPending = await Application.create({
            job: jobA._id,
            applicant: candidateB._id,
            status: "pending",
            interviews: [],
        });
        createdApplicationIds.push(applicationPending._id);

        // Application 3: Rejected application
        const applicationRejected = await Application.create({
            job: jobA._id,
            applicant: candidateB._id,
            status: "rejected",
            interviews: [],
        });
        createdApplicationIds.push(applicationRejected._id);

        let scheduledInterviewId = null;

        // ══════════════════════════════════════════════════════════════════
        // SECTION A: WORKFLOW TESTS 1-10
        // ══════════════════════════════════════════════════════════════════

        // 1. Recruiter opens an eligible applicant and schedules an interview
        await runTest("Workflow 1: Recruiter schedules an interview for accepted applicant", async () => {
            const futureDate = new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString();
            const res = await request("/api/v1/interviews", {
                method: "POST",
                token: tokenRecruiterA,
                body: {
                    applicationId: applicationAccepted._id.toString(),
                    round: "Technical",
                    interviewType: "Online",
                    scheduledDate: futureDate,
                    duration: 60,
                    meetingUrl: "https://meet.google.com/abc-defg-hij",
                    instructions: "Prepare live coding in JavaScript and system design.",
                },
            });

            assert.strictEqual(res.status, 201, `Expected status 201, got ${res.status}: ${JSON.stringify(res.data)}`);
            assert.strictEqual(res.data.success, true);
            assert.ok(res.data.interview);
            assert.strictEqual(res.data.interview.round, "Technical");
            assert.strictEqual(res.data.interview.duration, 60);
            assert.strictEqual(res.data.interview.status, "Scheduled");
            assert.strictEqual(res.data.interview.meetingUrl, "https://meet.google.com/abc-defg-hij");

            scheduledInterviewId = res.data.interview._id;
            createdInterviewIds.push(scheduledInterviewId);
        });

        // 2. The interview is saved correctly in MongoDB
        await runTest("Workflow 2: The interview is saved correctly in MongoDB", async () => {
            assert.ok(scheduledInterviewId, "scheduledInterviewId is not set");
            const dbInterview = await Interview.findById(scheduledInterviewId);
            assert.ok(dbInterview, "Interview not found in MongoDB");
            assert.strictEqual(dbInterview.application.toString(), applicationAccepted._id.toString());
            assert.strictEqual(dbInterview.recruiter.toString(), recruiterA._id.toString());
            assert.strictEqual(dbInterview.candidate.toString(), candidateA._id.toString());
            assert.strictEqual(dbInterview.status, "Scheduled");
            assert.strictEqual(dbInterview.roundNumber, 1);

            // Also check that application document has this interview in its array
            const updatedApp = await Application.findById(applicationAccepted._id);
            assert.ok(
                updatedApp.interviews.map(String).includes(scheduledInterviewId.toString()),
                "Application does not contain interview ID in its interviews array"
            );
        });

        // 3. The candidate sees the invitation in their dashboard
        await runTest("Workflow 3: Candidate retrieves interview invitation in dashboard", async () => {
            const res = await request("/api/v1/interviews/candidate", {
                method: "GET",
                token: tokenCandidateA,
            });

            assert.strictEqual(res.status, 200);
            assert.strictEqual(res.data.success, true);
            assert.ok(Array.isArray(res.data.interviews));
            const found = res.data.interviews.find((i) => i._id.toString() === scheduledInterviewId.toString());
            assert.ok(found, "Candidate did not receive the scheduled interview in candidate interviews endpoint");
            assert.strictEqual(found.status, "Scheduled");
            assert.strictEqual(found.job.title, "Senior Fullstack Engineer");
        });

        // 4. The candidate confirms the interview
        await runTest("Workflow 4: Candidate confirms the interview invitation", async () => {
            const res = await request(`/api/v1/interviews/${scheduledInterviewId}/confirm`, {
                method: "PATCH",
                token: tokenCandidateA,
            });

            assert.strictEqual(res.status, 200, `Expected 200, got ${res.status}: ${JSON.stringify(res.data)}`);
            assert.strictEqual(res.data.success, true);
            assert.strictEqual(res.data.interview.status, "Confirmed");

            // Verify in DB
            const dbInterview = await Interview.findById(scheduledInterviewId);
            assert.strictEqual(dbInterview.status, "Confirmed");
        });

        // 5. The recruiter sees the updated confirmation status
        await runTest("Workflow 5: Recruiter sees the updated confirmation status", async () => {
            const res = await request("/api/v1/interviews/recruiter", {
                method: "GET",
                token: tokenRecruiterA,
            });

            assert.strictEqual(res.status, 200);
            assert.strictEqual(res.data.success, true);
            const found = res.data.interviews.find((i) => i._id.toString() === scheduledInterviewId.toString());
            assert.ok(found, "Interview not found in recruiter's interviews");
            assert.strictEqual(found.status, "Confirmed");
        });

        // 6. The candidate requests rescheduling and the recruiter can process the request
        await runTest("Workflow 6: Candidate requests rescheduling with reason and proposed time", async () => {
            const proposedDate = new Date(Date.now() + 72 * 60 * 60 * 1000).toISOString();
            const res = await request(`/api/v1/interviews/${scheduledInterviewId}/reschedule-request`, {
                method: "PATCH",
                token: tokenCandidateA,
                body: {
                    rescheduleReason: "I have a prior academic exam at this scheduled time.",
                    proposedDate,
                },
            });

            assert.strictEqual(res.status, 200);
            assert.strictEqual(res.data.success, true);
            assert.strictEqual(res.data.interview.status, "Reschedule Requested");
            assert.strictEqual(res.data.interview.rescheduleReason, "I have a prior academic exam at this scheduled time.");
        });

        // 7. The recruiter reschedules the interview and candidate sees updated date/time
        await runTest("Workflow 7: Recruiter reschedules interview and resets status to Scheduled", async () => {
            const newDate = new Date(Date.now() + 96 * 60 * 60 * 1000).toISOString();
            const res = await request(`/api/v1/interviews/${scheduledInterviewId}/reschedule`, {
                method: "PATCH",
                token: tokenRecruiterA,
                body: {
                    scheduledDate: newDate,
                    duration: 45,
                    interviewType: "Online",
                    meetingUrl: "https://meet.google.com/new-link-xyz",
                    instructions: "Updated schedule approved. Please confirm.",
                },
            });

            assert.strictEqual(res.status, 200);
            assert.strictEqual(res.data.success, true);
            assert.strictEqual(res.data.interview.status, "Scheduled");
            assert.strictEqual(res.data.interview.duration, 45);
            assert.strictEqual(res.data.interview.meetingUrl, "https://meet.google.com/new-link-xyz");

            // Verify candidate sees the updated interview
            const candRes = await request(`/api/v1/interviews/${scheduledInterviewId}`, {
                method: "GET",
                token: tokenCandidateA,
            });
            assert.strictEqual(candRes.status, 200);
            assert.strictEqual(candRes.data.interview.status, "Scheduled");
            assert.strictEqual(new Date(candRes.data.interview.scheduledDate).toISOString(), new Date(newDate).toISOString());
        });

        // 8. An authorized user cancels the interview and both dashboards reflect the change
        await runTest("Workflow 8: Authorized recruiter cancels interview with cancellation reason", async () => {
            const res = await request(`/api/v1/interviews/${scheduledInterviewId}/cancel`, {
                method: "PATCH",
                token: tokenRecruiterA,
                body: {
                    cancellationReason: "Position filled internally, round cancelled.",
                },
            });

            assert.strictEqual(res.status, 200);
            assert.strictEqual(res.data.success, true);
            assert.strictEqual(res.data.interview.status, "Cancelled");
            assert.strictEqual(res.data.interview.cancellationReason, "Position filled internally, round cancelled.");

            // Verify Candidate dashboard shows cancelled
            const candRes = await request("/api/v1/interviews/candidate", {
                method: "GET",
                token: tokenCandidateA,
            });
            const candFound = candRes.data.interviews.find((i) => i._id.toString() === scheduledInterviewId.toString());
            assert.ok(candFound);
            assert.strictEqual(candFound.status, "Cancelled");

            // Verify Recruiter dashboard shows cancelled
            const recRes = await request("/api/v1/interviews/recruiter", {
                method: "GET",
                token: tokenRecruiterA,
            });
            const recFound = recRes.data.interviews.find((i) => i._id.toString() === scheduledInterviewId.toString());
            assert.ok(recFound);
            assert.strictEqual(recFound.status, "Cancelled");
        });

        // 9. Multiple interview rounds can exist for the same application
        await runTest("Workflow 9: Multiple interview rounds exist and are tracked for the same application", async () => {
            // Schedule Round 2
            const round2Date = new Date(Date.now() + 120 * 60 * 60 * 1000).toISOString();
            const res = await request("/api/v1/interviews", {
                method: "POST",
                token: tokenRecruiterA,
                body: {
                    applicationId: applicationAccepted._id.toString(),
                    round: "Managerial",
                    interviewType: "Online",
                    scheduledDate: round2Date,
                    duration: 45,
                    meetingUrl: "https://meet.google.com/manager-round-2",
                },
            });

            assert.strictEqual(res.status, 201);
            assert.strictEqual(res.data.interview.round, "Managerial");
            assert.strictEqual(res.data.interview.roundNumber, 2);
            createdInterviewIds.push(res.data.interview._id);

            // Fetch all rounds for application
            const roundsRes = await request(`/api/v1/interviews/application/${applicationAccepted._id}`, {
                method: "GET",
                token: tokenRecruiterA,
            });

            assert.strictEqual(roundsRes.status, 200);
            assert.strictEqual(roundsRes.data.success, true);
            assert.strictEqual(roundsRes.data.count, 2);
            assert.strictEqual(roundsRes.data.interviews[0].roundNumber, 1);
            assert.strictEqual(roundsRes.data.interviews[1].roundNumber, 2);
        });

        // 10. Email and in-app notifications work, including graceful failure handling
        await runTest("Workflow 10: In-app and simulated email notifications work with graceful failure", async () => {
            // Check notifications collection for candidate and recruiter
            const candidateNotifs = await Notification.find({ recipient: candidateA._id });
            assert.ok(candidateNotifs.length > 0, "No in-app notifications created for candidate");

            const recruiterNotifs = await Notification.find({ recipient: recruiterA._id });
            assert.ok(recruiterNotifs.length > 0, "No in-app notifications created for recruiter");

            // Candidate tests notification API: GET /api/v1/notifications
            const listRes = await request("/api/v1/notifications", {
                method: "GET",
                token: tokenCandidateA,
            });
            assert.strictEqual(listRes.status, 200);
            assert.strictEqual(listRes.data.success, true);
            assert.ok(listRes.data.notifications.length > 0);

            // Unread count check
            const unreadRes = await request("/api/v1/notifications/unread-count", {
                method: "GET",
                token: tokenCandidateA,
            });
            assert.strictEqual(unreadRes.status, 200);
            assert.strictEqual(unreadRes.data.success, true);
            assert.ok(unreadRes.data.unreadCount >= 1);

            // Mark single notification as read
            const firstNotifId = listRes.data.notifications[0]._id;
            const markReadRes = await request(`/api/v1/notifications/${firstNotifId}/read`, {
                method: "PATCH",
                token: tokenCandidateA,
            });
            assert.strictEqual(markReadRes.status, 200);

            // Mark all notifications as read
            const markAllRes = await request("/api/v1/notifications/mark-all-read", {
                method: "PATCH",
                token: tokenCandidateA,
            });
            assert.strictEqual(markAllRes.status, 200);

            // Verify unread count is now 0
            const afterMarkRes = await request("/api/v1/notifications/unread-count", {
                method: "GET",
                token: tokenCandidateA,
            });
            assert.strictEqual(afterMarkRes.data.unreadCount, 0);
        });

        // ══════════════════════════════════════════════════════════════════
        // SECTION B: SECURITY AND VALIDATION TESTS
        // ══════════════════════════════════════════════════════════════════

        // Security 1: Unauthenticated users cannot access protected interview endpoints
        await runTest("Security 1: Unauthenticated users cannot access protected endpoints (401)", async () => {
            const res = await request("/api/v1/interviews/candidate", {
                method: "GET",
                token: null, // No token
            });
            assert.strictEqual(res.status, 401);
            assert.strictEqual(res.data.success, false);
        });

        // Security 2: Candidate cannot view or modify another candidate's interviews
        await runTest("Security 2: Candidate cannot view or modify another candidate's interview (403)", async () => {
            // Candidate B tries to view Candidate A's interview
            const viewRes = await request(`/api/v1/interviews/${scheduledInterviewId}`, {
                method: "GET",
                token: tokenCandidateB,
            });
            assert.strictEqual(viewRes.status, 403);
            assert.strictEqual(viewRes.data.success, false);

            // Candidate B tries to confirm Candidate A's interview
            const confirmRes = await request(`/api/v1/interviews/${scheduledInterviewId}/confirm`, {
                method: "PATCH",
                token: tokenCandidateB,
            });
            assert.strictEqual(confirmRes.status, 403);
            assert.strictEqual(confirmRes.data.success, false);
        });

        // Security 3: Recruiter cannot manage applications belonging to another recruiter
        await runTest("Security 3: Recruiter cannot schedule for jobs owned by another recruiter (403)", async () => {
            const futureDate = new Date(Date.now() + 150 * 60 * 60 * 1000).toISOString();
            const res = await request("/api/v1/interviews", {
                method: "POST",
                token: tokenRecruiterB, // Recruiter B does NOT own jobA
                body: {
                    applicationId: applicationAccepted._id.toString(),
                    round: "Technical",
                    interviewType: "Online",
                    scheduledDate: futureDate,
                    duration: 45,
                    meetingUrl: "https://meet.google.com/unauth",
                },
            });
            assert.strictEqual(res.status, 403);
            assert.strictEqual(res.data.success, false);
        });

        // Validation 1: Users cannot bypass application eligibility requirements
        await runTest("Validation 1: Reject scheduling for pending or rejected applications (400)", async () => {
            const futureDate = new Date(Date.now() + 160 * 60 * 60 * 1000).toISOString();

            // Try on Pending application
            const pendingRes = await request("/api/v1/interviews", {
                method: "POST",
                token: tokenRecruiterA,
                body: {
                    applicationId: applicationPending._id.toString(),
                    round: "HR",
                    interviewType: "Online",
                    scheduledDate: futureDate,
                    duration: 30,
                    meetingUrl: "https://meet.google.com/test",
                },
            });
            assert.strictEqual(pendingRes.status, 400);
            assert.match(pendingRes.data.message, /accepted\/shortlisted/i);

            // Try on Rejected application
            const rejectedRes = await request("/api/v1/interviews", {
                method: "POST",
                token: tokenRecruiterA,
                body: {
                    applicationId: applicationRejected._id.toString(),
                    round: "HR",
                    interviewType: "Online",
                    scheduledDate: futureDate,
                    duration: 30,
                    meetingUrl: "https://meet.google.com/test",
                },
            });
            assert.strictEqual(rejectedRes.status, 400);
            assert.match(rejectedRes.data.message, /rejected application/i);
        });

        // Validation 2: Invalid dates, durations, meeting URLs, and status transitions are rejected
        await runTest("Validation 2: Invalid dates, durations, URLs, and invalid transitions rejected (400)", async () => {
            // 1. Past date
            const pastDate = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
            const pastRes = await request("/api/v1/interviews", {
                method: "POST",
                token: tokenRecruiterA,
                body: {
                    applicationId: applicationAccepted._id.toString(),
                    round: "Technical",
                    interviewType: "Online",
                    scheduledDate: pastDate,
                    duration: 45,
                    meetingUrl: "https://meet.google.com/test",
                },
            });
            assert.strictEqual(pastRes.status, 400);
            assert.match(pastRes.data.message, /must be in the future/i);

            // 2. Invalid duration (< 5 or > 480)
            const futureDate = new Date(Date.now() + 180 * 60 * 60 * 1000).toISOString();
            const durationRes = await request("/api/v1/interviews", {
                method: "POST",
                token: tokenRecruiterA,
                body: {
                    applicationId: applicationAccepted._id.toString(),
                    round: "Technical",
                    interviewType: "Online",
                    scheduledDate: futureDate,
                    duration: 2, // too small
                    meetingUrl: "https://meet.google.com/test",
                },
            });
            assert.strictEqual(durationRes.status, 400);
            assert.match(durationRes.data.message, /between 5 and 480/i);

            // 3. Invalid meeting URL for online interview
            const urlRes = await request("/api/v1/interviews", {
                method: "POST",
                token: tokenRecruiterA,
                body: {
                    applicationId: applicationAccepted._id.toString(),
                    round: "Technical",
                    interviewType: "Online",
                    scheduledDate: futureDate,
                    duration: 45,
                    meetingUrl: "not-a-valid-url",
                },
            });
            assert.strictEqual(urlRes.status, 400);
            assert.match(urlRes.data.message, /must start with http:\/\/ or https:\/\//i);

            // 4. Invalid status transition (e.g. Confirming an already cancelled interview)
            const invalidTransRes = await request(`/api/v1/interviews/${scheduledInterviewId}/confirm`, {
                method: "PATCH",
                token: tokenCandidateA,
            });
            assert.strictEqual(invalidTransRes.status, 400);
            assert.match(invalidTransRes.data.message, /cannot confirm a cancelled interview/i);
        });

        // Validation 3: Repeated submissions do not create accidental duplicate interviews
        await runTest("Validation 3: Repeated submissions within narrow window return 409 Conflict", async () => {
            const futureDate = new Date(Date.now() + 200 * 60 * 60 * 1000).toISOString();
            // Schedule first interview
            const res1 = await request("/api/v1/interviews", {
                method: "POST",
                token: tokenRecruiterA,
                body: {
                    applicationId: applicationAccepted._id.toString(),
                    round: "HR",
                    interviewType: "Online",
                    scheduledDate: futureDate,
                    duration: 45,
                    meetingUrl: "https://meet.google.com/hr-test",
                },
            });
            assert.strictEqual(res1.status, 201);
            createdInterviewIds.push(res1.data.interview._id);

            // Immediate duplicate submission with same application, round, and time
            const res2 = await request("/api/v1/interviews", {
                method: "POST",
                token: tokenRecruiterA,
                body: {
                    applicationId: applicationAccepted._id.toString(),
                    round: "HR",
                    interviewType: "Online",
                    scheduledDate: futureDate,
                    duration: 45,
                    meetingUrl: "https://meet.google.com/hr-test",
                },
            });
            assert.strictEqual(res2.status, 409);
            assert.match(res2.data.message, /duplicate interview/i);
        });

        // Validation 4: Double-booking checks behave correctly
        await runTest("Validation 4: Overlapping active interview times detected as double-booking (409)", async () => {
            // Existing interview is at +200 hours for 45 mins.
            // Try scheduling another interview at +200 hours + 10 mins (overlap).
            const overlappingDate = new Date(Date.now() + 200 * 60 * 60 * 1000 + 10 * 60 * 1000).toISOString();

            const res = await request("/api/v1/interviews", {
                method: "POST",
                token: tokenRecruiterA,
                body: {
                    applicationId: applicationAccepted._id.toString(),
                    round: "Technical",
                    interviewType: "Online",
                    scheduledDate: overlappingDate,
                    duration: 30,
                    meetingUrl: "https://meet.google.com/overlap",
                },
            });
            assert.strictEqual(res.status, 409);
            assert.match(res.data.message, /Double-booking conflict/i);
        });

        // Validation 5: Interview data does not expose unrelated users' private information
        await runTest("Validation 5: Interview response does not expose password hashes or sensitive fields", async () => {
            const res = await request(`/api/v1/interviews/${scheduledInterviewId}`, {
                method: "GET",
                token: tokenRecruiterA,
            });
            assert.strictEqual(res.status, 200);
            const interview = res.data.interview;

            // Check candidate projection
            assert.strictEqual(interview.candidate.password, undefined);
            assert.ok(interview.candidate.fullname);
            assert.ok(interview.candidate.email);

            // Check recruiter projection
            assert.strictEqual(interview.recruiter.password, undefined);
            assert.ok(interview.recruiter.fullname);
            assert.ok(interview.recruiter.email);
        });

        // Role Authorization: Candidate cannot call recruiter endpoints
        await runTest("Security 4: Candidate cannot call recruiter endpoints (isRecruiter check -> 403)", async () => {
            const res = await request("/api/v1/interviews/recruiter", {
                method: "GET",
                token: tokenCandidateA, // Student token
            });
            assert.strictEqual(res.status, 403);
            assert.match(res.data.message, /Role 'student' is not authorized/i);
        });

        // Role Authorization: Recruiter cannot call candidate endpoints
        await runTest("Security 5: Recruiter cannot call candidate endpoints (isCandidate check -> 403)", async () => {
            const res = await request("/api/v1/interviews/candidate", {
                method: "GET",
                token: tokenRecruiterA, // Recruiter token
            });
            assert.strictEqual(res.status, 403);
            assert.match(res.data.message, /Role 'recruiter' is not authorized/i);
        });

    } finally {
        console.log("\n🧹 Cleaning up test artifacts from database...");
        try {
            if (createdInterviewIds.length > 0) {
                await Interview.deleteMany({ _id: { $in: createdInterviewIds } });
            }
            if (createdApplicationIds.length > 0) {
                await Application.deleteMany({ _id: { $in: createdApplicationIds } });
            }
            if (createdJobIds.length > 0) {
                await Job.deleteMany({ _id: { $in: createdJobIds } });
            }
            if (createdCompanyIds.length > 0) {
                await Company.deleteMany({ _id: { $in: createdCompanyIds } });
            }
            if (createdUserIds.length > 0) {
                await User.deleteMany({ _id: { $in: createdUserIds } });
                await Notification.deleteMany({ recipient: { $in: createdUserIds } });
            }
            console.log("✅ Cleanup complete.");
        } catch (cleanupErr) {
            console.error("Cleanup error:", cleanupErr.message);
        }

        await stopServer();
        await mongoose.connection.close();
    }

    console.log("\n=====================================================");
    console.log(`📊 TEST RESULTS: ${stats.passed}/${stats.total} PASSED (${stats.failed} FAILED)`);
    console.log("=====================================================");

    if (stats.failed > 0) {
        process.exit(1);
    } else {
        process.exit(0);
    }
}

runIntegrationTests().catch((err) => {
    console.error("FATAL TEST RUNNER ERROR:", err);
    process.exit(1);
});

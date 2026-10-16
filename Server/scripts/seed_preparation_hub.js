import dotenv from "dotenv";
dotenv.config();

import mongoose from "mongoose";
import connectDB from "../utils/db.js";
import { Company } from "../models/company.models.js";
import { Roadmap } from "../models/roadmap.models.js";
import { PreparationResource } from "../models/preparationResource.models.js";

// General indicative notice used across catalog to avoid making fabricated claims
const INDICATIVE_NOTICE =
    "Preparation topics and curriculum are indicative recommendations curated from industry best practices and common syllabus benchmarks. Recruitment formats, assessment rounds, and eligibility criteria vary by college campus, hiring season, and recruitment cycle.";

// ─── 1. INITIAL 15 COMPANIES ───────────────────────────────────────────────
export const INITIAL_COMPANIES = [
    // ── IT Services & Consulting Category ──
    {
        companyName: "Tata Consultancy Services",
        slug: "tcs",
        category: "IT Services & Consulting",
        tier: "MNC",
        industry: "IT Services & Business Consulting",
        description: "Global leader in IT services, consulting, and digital solutions. Known for the TCS National Qualifier Test (NQT) and specialized hiring cadres (Ninja, Digital, Prime).",
        website: "https://www.tcs.com",
        careersUrl: "https://www.tcs.com/careers",
        location: "Mumbai, India",
        headquarters: "Mumbai, Maharashtra, India",
        hiringTracks: ["Ninja (Foundation)", "Digital (Advanced Coding)", "Prime (Systems & High-Order Coding)"],
        isPreparationHubActive: true,
        logo: "https://logo.clearbit.com/tcs.com",
    },
    {
        companyName: "Infosys",
        slug: "infosys",
        category: "IT Services & Consulting",
        tier: "MNC",
        industry: "Digital Services & Consulting",
        description: "Global digital services and enterprise consulting multinational hiring through national campus drives, InfyTQ, and HackWithInfy competitions.",
        website: "https://www.infosys.com",
        careersUrl: "https://www.infosys.com/careers/",
        location: "Bengaluru, India",
        headquarters: "Bengaluru, Karnataka, India",
        hiringTracks: ["Systems Engineer (SE)", "Digital Specialist Engineer (DSE)", "Specialist Programmer (SP)"],
        isPreparationHubActive: true,
        logo: "https://logo.clearbit.com/infosys.com",
    },
    {
        companyName: "Wipro",
        slug: "wipro",
        category: "IT Services & Consulting",
        tier: "MNC",
        industry: "IT, Consulting & Business Process Services",
        description: "Leading technology services and consulting enterprise focused on cloud solutions, cybersecurity, enterprise transformation, and digital operations.",
        website: "https://www.wipro.com",
        careersUrl: "https://careers.wipro.com/",
        location: "Bengaluru, India",
        headquarters: "Bengaluru, Karnataka, India",
        hiringTracks: ["Wipro Elite (National Talent Hunt)", "Wipro Turbo", "Wipro Velocity"],
        isPreparationHubActive: true,
        logo: "https://logo.clearbit.com/wipro.com",
    },
    {
        companyName: "HCLTech",
        slug: "hcltech",
        category: "IT Services & Consulting",
        tier: "MNC",
        industry: "Technology & Engineering Services",
        description: "Global technology enterprise delivering digital, engineering, cloud, and AI solutions across 60 countries with strong engineering DNA.",
        website: "https://www.hcltech.com",
        careersUrl: "https://www.hcltech.com/careers",
        location: "Noida, India",
        headquarters: "Noida, Uttar Pradesh, India",
        hiringTracks: ["Graduate Engineer Trainee (GET)", "Software Engineer", "Lead Engineer"],
        isPreparationHubActive: true,
        logo: "https://logo.clearbit.com/hcltech.com",
    },
    {
        companyName: "Cognizant",
        slug: "cognizant",
        category: "IT Services & Consulting",
        tier: "MNC",
        industry: "IT Consulting & Digital Business Operations",
        description: "Engineers modern businesses to improve everyday lives through application modernization, cloud migration, and intelligent enterprise systems.",
        website: "https://www.cognizant.com",
        careersUrl: "https://careers.cognizant.com/",
        location: "Teaneck, NJ / Chennai, India",
        headquarters: "Teaneck, New Jersey, USA",
        hiringTracks: ["GenC (Foundational)", "GenC Elevate (Enhanced Coding)", "GenC Next (Digital Specialists)", "GenC Pro"],
        isPreparationHubActive: true,
        logo: "https://logo.clearbit.com/cognizant.com",
    },
    {
        companyName: "Capgemini",
        slug: "capgemini",
        category: "IT Services & Consulting",
        tier: "MNC",
        industry: "Consulting, Digital Transformation & Engineering",
        description: "Global consulting and technology leader guiding enterprise clients through cloud architecture, intelligent engineering, and business sustainability.",
        website: "https://www.capgemini.com",
        careersUrl: "https://www.capgemini.com/careers/",
        location: "Paris, France / Mumbai, India",
        headquarters: "Paris, France",
        hiringTracks: ["Analyst", "Senior Analyst", "Software Engineer"],
        isPreparationHubActive: true,
        logo: "https://logo.clearbit.com/capgemini.com",
    },
    {
        companyName: "Accenture",
        slug: "accenture",
        category: "IT Services & Consulting",
        tier: "MNC",
        industry: "Strategy, Management & Technology Consulting",
        description: "Global professional services company with leading digital, cloud, security, and generative AI transformation capabilities across dozens of industries.",
        website: "https://www.accenture.com",
        careersUrl: "https://www.accenture.com/in-en/careers",
        location: "Dublin, Ireland / Bengaluru, India",
        headquarters: "Dublin, Ireland",
        hiringTracks: ["Associate Software Engineer (ASE)", "Advanced Associate Software Engineer (AASE)"],
        isPreparationHubActive: true,
        logo: "https://logo.clearbit.com/accenture.com",
    },
    {
        companyName: "Tech Mahindra",
        slug: "tech-mahindra",
        category: "IT Services & Consulting",
        tier: "MNC",
        industry: "Telecom, Networks & IT Services",
        description: "Part of the Mahindra Group, specializing in telecommunication systems, 5G enterprise solutions, network engineering, and business consulting.",
        website: "https://www.techmahindra.com",
        careersUrl: "https://careers.techmahindra.com/",
        location: "Pune, India",
        headquarters: "Pune, Maharashtra, India",
        hiringTracks: ["Associate Software Engineer", "Digital Engineer", "Network Solutions Specialist"],
        isPreparationHubActive: true,
        logo: "https://logo.clearbit.com/techmahindra.com",
    },

    // ── Product & Technology Category ──
    {
        companyName: "Microsoft",
        slug: "microsoft",
        category: "Product & Technology",
        tier: "FAANG/MAMAA",
        industry: "Software, Cloud Computing, Devices & AI",
        description: "Global technology leader empowering every person and organization on the planet to achieve more with Windows, Azure, GitHub, and Copilot AI.",
        website: "https://www.microsoft.com",
        careersUrl: "https://careers.microsoft.com/",
        location: "Redmond, WA / Hyderabad, India",
        headquarters: "Redmond, Washington, USA",
        hiringTracks: ["Software Engineer (SWE)", "Site Reliability Engineer (SRE)", "Data & Applied Scientist"],
        isPreparationHubActive: true,
        logo: "https://logo.clearbit.com/microsoft.com",
    },
    {
        companyName: "Google",
        slug: "google",
        category: "Product & Technology",
        tier: "FAANG/MAMAA",
        industry: "Consumer Internet, Cloud & Artificial Intelligence",
        description: "World leader in search, consumer web services, cloud infrastructure, hardware, and deep learning, evaluating code quality, algorithm design, and Googleyness.",
        website: "https://www.google.com",
        careersUrl: "https://careers.google.com/",
        location: "Mountain View, CA / Bengaluru, India",
        headquarters: "Mountain View, California, USA",
        hiringTracks: ["Software Engineer (L3 / University Graduate)", "Software Engineer (L4 / Mid-Level)", "Site Reliability Engineer"],
        isPreparationHubActive: true,
        logo: "https://logo.clearbit.com/google.com",
    },
    {
        companyName: "Amazon",
        slug: "amazon",
        category: "Product & Technology",
        tier: "FAANG/MAMAA",
        industry: "E-commerce, Cloud Computing & Streaming",
        description: "Customer-obsessed technology pioneer known for high-scale distributed systems (AWS), algorithmic interviews, and the 16 Amazon Leadership Principles.",
        website: "https://www.amazon.com",
        careersUrl: "https://www.amazon.jobs/",
        location: "Seattle, WA / Hyderabad, India",
        headquarters: "Seattle, Washington, USA",
        hiringTracks: ["Software Development Engineer I (SDE-1)", "Software Development Engineer II (SDE-2)", "Quality Assurance Engineer (QAE)"],
        isPreparationHubActive: true,
        logo: "https://logo.clearbit.com/amazon.com",
    },
    {
        companyName: "IBM",
        slug: "ibm",
        category: "Product & Technology",
        tier: "MNC",
        industry: "Hybrid Cloud, AI & Enterprise Infrastructure",
        description: "Pioneering technology institution transforming enterprise workloads with Red Hat OpenShift, IBM Cloud, quantum computing research, and watsonx AI.",
        website: "https://www.ibm.com",
        careersUrl: "https://www.ibm.com/careers",
        location: "Armonk, NY / Bengaluru, India",
        headquarters: "Armonk, New York, USA",
        hiringTracks: ["Software Developer", "Associate System Engineer", "Cloud Software Engineer"],
        isPreparationHubActive: true,
        logo: "https://logo.clearbit.com/ibm.com",
    },
    {
        companyName: "Oracle",
        slug: "oracle",
        category: "Product & Technology",
        tier: "Tier-1",
        industry: "Enterprise Database Systems & Cloud Infrastructure",
        description: "Global cloud technology leader providing database engines, Autonomous Cloud Infrastructure (OCI), Java development platforms, and enterprise software.",
        website: "https://www.oracle.com",
        careersUrl: "https://www.oracle.com/corporate/careers/",
        location: "Austin, TX / Bengaluru, India",
        headquarters: "Austin, Texas, USA",
        hiringTracks: ["Member Technical Staff (MTS)", "Associate Applications Engineer", "Cloud Infrastructure Software Engineer"],
        isPreparationHubActive: true,
        logo: "https://logo.clearbit.com/oracle.com",
    },
    {
        companyName: "Zoho Corporation",
        slug: "zoho",
        category: "Product & Technology",
        tier: "Tier-1",
        industry: "SaaS & Enterprise Business Applications",
        description: "Bootstrapped Indian SaaS powerhouse renowned for in-house engineering, zero-framework architecture, and multi-round hands-on programming interviews.",
        website: "https://www.zoho.com",
        careersUrl: "https://www.zoho.com/careers/",
        location: "Chennai, Tamil Nadu, India",
        headquarters: "Chennai, Tamil Nadu, India",
        hiringTracks: ["Software Developer (Level 1 & 2)", "Member Technical Staff", "QA Automation Engineer"],
        isPreparationHubActive: true,
        logo: "https://logo.clearbit.com/zoho.com",
    },
    {
        companyName: "Qualcomm",
        slug: "qualcomm",
        category: "Product & Technology",
        tier: "Tier-1",
        industry: "Wireless Communications & Semiconductor Design",
        description: "World leader in mobile processors (Snapdragon), 5G wireless modems, embedded firmware, computer architecture, and low-level Linux systems programming.",
        website: "https://www.qualcomm.com",
        careersUrl: "https://www.qualcomm.com/company/careers",
        location: "San Diego, CA / Hyderabad, India",
        headquarters: "San Diego, California, USA",
        hiringTracks: ["Embedded Software Engineer", "Systems Software Engineer", "Modem Software Developer"],
        isPreparationHubActive: true,
        logo: "https://logo.clearbit.com/qualcomm.com",
    },
];

// ─── 2. VERIFIED LEARNING RESOURCES ────────────────────────────────────────
export const INITIAL_RESOURCES = [
    {
        title: "Striver's A2Z DSA Sheet",
        url: "https://takeuforward.org/strivers-a2z-dsa-course/strivers-a2z-dsa-course-sheet-2/",
        category: "DSA",
        type: "Practice Sheet",
        sourceType: "External Platform",
        isOfficial: false,
        provider: "takeUforward",
        isFree: true,
        estimatedTimeMinutes: 120,
        description: "Comprehensive step-by-step curriculum covering fundamental data structures up to advanced dynamic programming and graph algorithms.",
        tags: ["DSA", "Arrays", "Graphs", "DP", "Trees"],
        difficulty: "All Levels",
        status: "Active",
    },
    {
        title: "NeetCode 150 Practice Roadmap",
        url: "https://neetcode.io/practice",
        category: "DSA",
        type: "External Coding Platform",
        sourceType: "External Platform",
        isOfficial: false,
        provider: "NeetCode",
        isFree: true,
        estimatedTimeMinutes: 90,
        description: "Curated collection of 150 high-frequency coding interview problems categorized by algorithmic pattern.",
        tags: ["LeetCode", "Patterns", "Interview Prep"],
        difficulty: "Intermediate",
        status: "Active",
    },
    {
        title: "LeetCode Top Interview 150",
        url: "https://leetcode.com/studyplan/top-interview-150/",
        category: "DSA",
        type: "External Coding Platform",
        sourceType: "External Platform",
        isOfficial: false,
        provider: "LeetCode",
        isFree: true,
        estimatedTimeMinutes: 120,
        description: "Classic top interview questions curated by LeetCode for technical screening and on-site rounds.",
        tags: ["LeetCode", "DSA", "Problem Solving"],
        difficulty: "Intermediate",
        status: "Active",
    },
    {
        title: "System Design Primer by Donne Martin",
        url: "https://github.com/donnemartin/system-design-primer",
        category: "System Design",
        type: "Documentation",
        sourceType: "Community Contributed",
        isOfficial: false,
        provider: "Open Source / GitHub",
        isFree: true,
        estimatedTimeMinutes: 180,
        description: "Open-source guide to building scalable, fault-tolerant, high-concurrency distributed systems.",
        tags: ["System Design", "Scalability", "Databases", "Caching"],
        difficulty: "Advanced",
        status: "Active",
    },
    {
        title: "GeeksforGeeks C/C++ Pointers & Memory Management Guide",
        url: "https://www.geeksforgeeks.org/pointers-in-c-and-c-multiple-choice-questions/",
        category: "Programming",
        type: "Article",
        sourceType: "External Platform",
        isOfficial: false,
        provider: "GeeksforGeeks",
        isFree: true,
        estimatedTimeMinutes: 45,
        description: "Essential guide to pointer arithmetic, memory allocation, structure alignment, and double pointers.",
        tags: ["C", "C++", "Pointers", "Memory", "Embedded"],
        difficulty: "Intermediate",
        status: "Active",
    },
    {
        title: "GeeksforGeeks Embedded Systems & Bit Manipulation Tutorial",
        url: "https://www.geeksforgeeks.org/bitwise-operators-in-c-cpp/",
        category: "Programming",
        type: "Article",
        sourceType: "External Platform",
        isOfficial: false,
        provider: "GeeksforGeeks",
        isFree: true,
        estimatedTimeMinutes: 40,
        description: "Practical guide to bitwise operators, masking, setting/clearing bits, and hardware registers.",
        tags: ["Bit Manipulation", "Embedded", "Qualcomm", "C"],
        difficulty: "Intermediate",
        status: "Active",
    },
    {
        title: "Amazon 16 Leadership Principles & STAR Interview Technique",
        url: "https://www.amazon.jobs/content/en/our-workplace/leadership-principles",
        category: "HR Preparation",
        type: "Documentation",
        sourceType: "Official Company",
        isOfficial: true,
        provider: "Amazon",
        isFree: true,
        estimatedTimeMinutes: 40,
        description: "Official guide to preparing behavioral interview examples aligned with Amazon's core Leadership Principles.",
        tags: ["Behavioral", "Amazon", "Leadership Principles", "HR"],
        difficulty: "All Levels",
        status: "Active",
    },
    {
        title: "Top 25 HR Interview Questions & STAR Answers",
        url: "https://www.ambitionbox.com/interviews/hr-interview-questions",
        category: "HR Preparation",
        type: "Article",
        sourceType: "External Platform",
        isOfficial: false,
        provider: "AmbitionBox",
        isFree: true,
        estimatedTimeMinutes: 35,
        description: "Frequently asked behavioral and fit interview questions with structured STAR technique response models.",
        tags: ["HR", "Behavioral", "Interviews", "STAR Method"],
        difficulty: "Beginner",
        status: "Active",
    },
    {
        title: "CS Fundamentals: OS, DBMS & Computer Networks Cheatsheet",
        url: "https://www.interviewbit.com/technical-interview-questions/",
        category: "Core CS",
        type: "Cheatsheet",
        sourceType: "External Platform",
        isOfficial: false,
        provider: "InterviewBit",
        isFree: true,
        estimatedTimeMinutes: 60,
        description: "High-yield interview question summary covering processes, threads, virtual memory, ACID properties, indexing, and TCP/IP.",
        tags: ["OS", "DBMS", "Networks", "Core CS"],
        difficulty: "Beginner",
        status: "Active",
    },
    {
        title: "IndiaBIX Quantitative Aptitude & Verbal Reasoning Practice",
        url: "https://www.indiabix.com/aptitude/questions-and-answers/",
        category: "Aptitude",
        type: "Practice Sheet",
        sourceType: "External Platform",
        isOfficial: false,
        provider: "IndiaBIX",
        isFree: true,
        estimatedTimeMinutes: 60,
        description: "Standard practice tests for quantitative aptitude, logical reasoning, and English comprehension tested in campus drives.",
        tags: ["Aptitude", "Reasoning", "Verbal", "NQT"],
        difficulty: "Beginner",
        status: "Active",
    },
    {
        title: "Google Tech Dev Guide - Foundational CS Concepts",
        url: "https://techdevguide.withgoogle.com/",
        category: "Core CS",
        type: "Course",
        sourceType: "Official Company",
        isOfficial: true,
        provider: "Google for Education",
        isFree: true,
        estimatedTimeMinutes: 90,
        description: "Official Google curriculum for university candidates preparing for technical internships and full-time roles.",
        tags: ["Google", "Data Structures", "Algorithms", "CS Fundamentals"],
        difficulty: "Intermediate",
        status: "Active",
    },
    {
        title: "GeeksforGeeks SQL Practice & Database Normalization",
        url: "https://www.geeksforgeeks.org/sql-tutorial/",
        category: "SQL",
        type: "Article",
        sourceType: "External Platform",
        isOfficial: false,
        provider: "GeeksforGeeks",
        isFree: true,
        estimatedTimeMinutes: 50,
        description: "Comprehensive tutorial on SQL joins, grouping, subqueries, indexing, and 1NF/2NF/3NF normalization.",
        tags: ["SQL", "DBMS", "Database", "Queries"],
        difficulty: "Beginner",
        status: "Active",
    },
    {
        title: "LeetCode SQL 50 Study Plan",
        url: "https://leetcode.com/studyplan/top-sql-50/",
        category: "SQL",
        type: "External Coding Platform",
        sourceType: "External Platform",
        isOfficial: false,
        provider: "LeetCode",
        isFree: true,
        estimatedTimeMinutes: 75,
        description: "Essential 50 SQL problems covering aggregate functions, joins, window functions, and subqueries.",
        tags: ["SQL", "Queries", "Database"],
        difficulty: "Intermediate",
        status: "Active",
    },
    {
        title: "Gate Smashers DBMS Complete Video Series",
        url: "https://www.youtube.com/playlist?list=PLxCzCOWd7aiFAN6I8C9azFiBrz5xDkUTn",
        category: "DBMS",
        type: "Video",
        sourceType: "Community Contributed",
        isOfficial: false,
        provider: "Gate Smashers / YouTube",
        isFree: true,
        estimatedTimeMinutes: 150,
        description: "Visual video explanations of relational models, transactions, concurrency control, B+ trees, and ER diagrams.",
        tags: ["DBMS", "Video", "Gate Smashers", "Transactions"],
        difficulty: "Beginner",
        status: "Active",
    },
    {
        title: "GeeksforGeeks Operating Systems Tutorial & Memory Management",
        url: "https://www.geeksforgeeks.org/operating-systems/",
        category: "Operating Systems",
        type: "Documentation",
        sourceType: "External Platform",
        isOfficial: false,
        provider: "GeeksforGeeks",
        isFree: true,
        estimatedTimeMinutes: 80,
        description: "In-depth reference for process scheduling, deadlocks, paging, segmentation, virtual memory, and file systems.",
        tags: ["Operating Systems", "Memory", "Paging", "Deadlocks"],
        difficulty: "Intermediate",
        status: "Active",
    },
    {
        title: "Gate Smashers Operating Systems Video Lectures",
        url: "https://www.youtube.com/playlist?list=PLxCzCOWd7aiGz9donHRrE9I3Mwn6XdP8p",
        category: "Operating Systems",
        type: "Video",
        sourceType: "Community Contributed",
        isOfficial: false,
        provider: "Gate Smashers / YouTube",
        isFree: true,
        estimatedTimeMinutes: 120,
        description: "Comprehensive visual walk-throughs of semaphore synchronization, CPU scheduling algorithms, and memory management.",
        tags: ["OS", "Video", "Concurrency", "Semaphores"],
        difficulty: "Intermediate",
        status: "Active",
    },
    {
        title: "Computer Networks Top 50 Interview Questions",
        url: "https://www.geeksforgeeks.org/top-50-computer-network-interview-questions-and-answers/",
        category: "Computer Networks",
        type: "Article",
        sourceType: "External Platform",
        isOfficial: false,
        provider: "GeeksforGeeks",
        isFree: true,
        estimatedTimeMinutes: 60,
        description: "Essential networking interview answers: OSI vs TCP/IP, DNS, HTTP/HTTPS, TCP 3-way handshake, routing, and subnets.",
        tags: ["Computer Networks", "TCP/IP", "DNS", "HTTP"],
        difficulty: "Intermediate",
        status: "Active",
    },
];

// Helper to assemble preparation roadmaps for all 15 companies
function buildRoadmapDefinitions(companyMap, resourceMap) {
    const dsaSheetId = resourceMap.get("Striver's A2Z DSA Sheet")?._id;
    const neetcodeId = resourceMap.get("NeetCode 150 Practice Roadmap")?._id;
    const sysDesignId = resourceMap.get("System Design Primer by Donne Martin")?._id;
    const cPointersId = resourceMap.get("GeeksforGeeks C/C++ Pointers & Memory Management Guide")?._id;
    const bitManipId = resourceMap.get("GeeksforGeeks Embedded Systems & Bit Manipulation Tutorial")?._id;
    const amazonLpId = resourceMap.get("Amazon 16 Leadership Principles & STAR Interview Technique")?._id;
    const csFundId = resourceMap.get("CS Fundamentals: OS, DBMS & Computer Networks Cheatsheet")?._id;
    const aptitudeId = resourceMap.get("IndiaBIX Quantitative Aptitude & Verbal Reasoning Practice")?._id;
    const googleGuideId = resourceMap.get("Google Tech Dev Guide - Foundational CS Concepts")?._id;
    const sqlTutorialId = resourceMap.get("GeeksforGeeks SQL Practice & Database Normalization")?._id;

    const roadmaps = [];

    // ─────────────────────────────────────────────────────────────────────────
    // 1. TCS: NQT Foundation & Digital/Prime Track
    // ─────────────────────────────────────────────────────────────────────────
    const tcsCompany = companyMap.get("tcs");
    if (tcsCompany) {
        roadmaps.push({
            company: tcsCompany._id,
            title: "TCS National Qualifier Test (NQT) & Foundation Preparation",
            slug: "tcs-nqt-foundation-prep",
            role: "Systems Engineer (Ninja Track)",
            hiringTrack: "TCS NQT Ninja (3.36 - 3.6 LPA)",
            description: `Structured foundation roadmap covering numerical ability, verbal analysis, logical reasoning, and basic coding constructs evaluated in the TCS NQT foundation assessment. ${INDICATIVE_NOTICE}`,
            estimatedDuration: "6-8 Weeks",
            estimatedDurationWeeks: 8,
            difficulty: "Beginner",
            publicationStatus: "Published",
            version: 1,
            stages: [
                {
                    stageId: "tcs_nqt_stg_01_cognitive",
                    title: "Stage 1: Cognitive Section (Numerical & Logical Ability)",
                    order: 1,
                    description: "High-frequency quantitative aptitude and logical reasoning topics tested in the NQT Foundation section.",
                    estimatedWeeks: 3,
                    topics: [
                        {
                            topicId: "tcs_nqt_top_arithmetic",
                            title: "Percentages, Ratios, Profit & Loss, Time and Work",
                            order: 1,
                            description: "Fundamental arithmetic problem solving required for standard NQT cognitive tests.",
                            difficulty: "Easy",
                            importance: "Core / Must Know",
                            estimatedHours: 12,
                            resources: aptitudeId ? [aptitudeId] : [],
                        },
                        {
                            topicId: "tcs_nqt_top_logical_reasoning",
                            title: "Deductive Reasoning, Syllogisms & Seating Arrangements",
                            order: 2,
                            description: "Analytical reasoning and pattern classification.",
                            difficulty: "Easy",
                            importance: "Core / Must Know",
                            estimatedHours: 10,
                            resources: aptitudeId ? [aptitudeId] : [],
                        },
                    ],
                },
                {
                    stageId: "tcs_nqt_stg_02_foundation_coding",
                    title: "Stage 2: Hands-on Programming & Coding Logic",
                    order: 2,
                    description: "Fundamental programming logic in C, C++, Java, or Python (loops, conditions, arrays, strings).",
                    estimatedWeeks: 4,
                    topics: [
                        {
                            topicId: "tcs_nqt_top_array_string_problems",
                            title: "Arrays, Number Series & String Manipulations",
                            order: 1,
                            description: "Palindromes, prime numbers, gcd, array rotations, and character frequencies.",
                            difficulty: "Easy",
                            importance: "Core / Must Know",
                            estimatedHours: 16,
                            resources: dsaSheetId ? [dsaSheetId] : [],
                            practiceProblems: [
                                { title: "Two Sum", url: "https://leetcode.com/problems/two-sum/", platform: "LeetCode", difficulty: "Easy" },
                                { title: "Valid Palindrome", url: "https://leetcode.com/problems/valid-palindrome/", platform: "LeetCode", difficulty: "Easy" },
                            ],
                        },
                    ],
                },
            ],
        });

        roadmaps.push({
            company: tcsCompany._id,
            title: "TCS Digital & Prime Software Development Preparation",
            slug: "tcs-digital-prime-sde",
            role: "Software Development Engineer (Digital / Prime)",
            hiringTrack: "Digital & Prime (7.0 - 11.5 LPA)",
            description: `Advanced preparation track designed for TCS Digital and Prime coding rounds, focusing on intermediate data structures, SQL queries, and core CS interview technical questions. ${INDICATIVE_NOTICE}`,
            estimatedDuration: "8-10 Weeks",
            estimatedDurationWeeks: 10,
            difficulty: "Intermediate",
            publicationStatus: "Published",
            version: 1,
            stages: [
                {
                    stageId: "tcs_dp_stg_01_advanced_dsa",
                    title: "Stage 1: Advanced Data Structures & Dynamic Programming",
                    order: 1,
                    description: "Intermediate algorithmic challenges evaluated in the Digital and Prime coding rounds.",
                    estimatedWeeks: 5,
                    topics: [
                        {
                            topicId: "tcs_dp_top_sliding_window_hashing",
                            title: "Two Pointers, Sliding Window & Frequency Hashing",
                            order: 1,
                            description: "Subarray sums, anagrams, and frequency count patterns.",
                            difficulty: "Medium",
                            importance: "Core / Must Know",
                            estimatedHours: 16,
                            resources: dsaSheetId ? [dsaSheetId] : [],
                            practiceProblems: [
                                { title: "Subarray Sum Equals K", url: "https://leetcode.com/problems/subarray-sum-equals-k/", platform: "LeetCode", difficulty: "Medium" },
                            ],
                        },
                        {
                            topicId: "tcs_dp_top_dp_and_greedy",
                            title: "Dynamic Programming & Greedy Algorithms",
                            order: 2,
                            description: "Coin change, knapsack variants, and subsequence problems required for high-package Prime evaluations.",
                            difficulty: "Hard",
                            importance: "High Frequency",
                            estimatedHours: 18,
                            resources: dsaSheetId ? [dsaSheetId] : [],
                            practiceProblems: [
                                { title: "Coin Change", url: "https://leetcode.com/problems/coin-change/", platform: "LeetCode", difficulty: "Medium" },
                            ],
                        },
                    ],
                },
                {
                    stageId: "tcs_dp_stg_02_technical_interview",
                    title: "Stage 2: Core CS Technical Interview & Database Systems",
                    order: 2,
                    description: "Review of Relational Databases, SQL Joins, OOPs Principles, and Operating Systems.",
                    estimatedWeeks: 3,
                    topics: [
                        {
                            topicId: "tcs_dp_top_dbms_sql",
                            title: "SQL Joins, Indexing & Database Normalization",
                            order: 1,
                            description: "Hands-on SQL querying and normalization principles.",
                            difficulty: "Medium",
                            importance: "Core / Must Know",
                            estimatedHours: 12,
                            resources: sqlTutorialId ? [sqlTutorialId] : [],
                        },
                    ],
                },
                {
                    stageId: "tcs_dp_stg_03_system_architecture",
                    title: "Stage 3: System Architecture & Low-Level Design (Prime Track)",
                    order: 3,
                    description: "Object-oriented modeling, caching fundamentals, clean architecture, and technical interview scenarios.",
                    estimatedWeeks: 2,
                    topics: [
                        {
                            topicId: "tcs_dp_top_lld_modeling",
                            title: "Class Design, Design Patterns & API Architectures",
                            order: 1,
                            description: "Creating extensible, maintainable classes for real-world software modules.",
                            difficulty: "Hard",
                            importance: "High Frequency",
                            estimatedHours: 14,
                            resources: sysDesignId ? [sysDesignId] : [],
                        },
                    ],
                },
            ],
        });
    }

    // ─────────────────────────────────────────────────────────────────────────
    // 2. INFOSYS: Systems Engineer & Specialist Programmer
    // ─────────────────────────────────────────────────────────────────────────
    const infosysCompany = companyMap.get("infosys");
    if (infosysCompany) {
        roadmaps.push({
            company: infosysCompany._id,
            title: "Infosys Entry-Level Software Engineering (SE Track)",
            slug: "infosys-software-engineer-se",
            role: "Systems Engineer",
            hiringTrack: "Systems Engineer (SE - 3.6 LPA)",
            description: `Comprehensive beginner track covering mathematical reasoning, pseudocode debugging, verbal ability, and standard coding. ${INDICATIVE_NOTICE}`,
            estimatedDuration: "6-8 Weeks",
            estimatedDurationWeeks: 8,
            difficulty: "Beginner",
            publicationStatus: "Published",
            version: 1,
            stages: [
                {
                    stageId: "infy_se_stg_01_aptitude_pseudo",
                    title: "Stage 1: Mathematical Ability & Pseudocode Interpretation",
                    order: 1,
                    description: "Logical deduction, permutation/combination, probability, and tracing algorithmic pseudocode.",
                    estimatedWeeks: 3,
                    topics: [
                        {
                            topicId: "infy_se_top_pseudocode",
                            title: "Pseudocode Tracing & Logic Analysis",
                            order: 1,
                            description: "Bitwise operators, recursion tracing, and nested loop execution tracing.",
                            difficulty: "Medium",
                            importance: "Core / Must Know",
                            estimatedHours: 14,
                            resources: aptitudeId ? [aptitudeId] : [],
                        },
                    ],
                },
            ],
        });

        roadmaps.push({
            company: infosysCompany._id,
            title: "Infosys Specialist Programmer (SP) & DSE Preparation",
            slug: "infosys-specialist-programmer-sp",
            role: "Specialist Programmer / Digital Specialist Engineer",
            hiringTrack: "Specialist Programmer (SP - 9.5 LPA)",
            description: `High-order algorithmic problem-solving track modeled after HackWithInfy and SP hiring assessments. ${INDICATIVE_NOTICE}`,
            estimatedDuration: "10-12 Weeks",
            estimatedDurationWeeks: 12,
            difficulty: "Advanced",
            publicationStatus: "Published",
            version: 1,
            stages: [
                {
                    stageId: "infy_sp_stg_01_advanced_dsa",
                    title: "Stage 1: Advanced Algorithms & Graph Theory",
                    order: 1,
                    description: "Tree traversals, binary search trees, and dynamic programming.",
                    estimatedWeeks: 6,
                    topics: [
                        {
                            topicId: "infy_sp_top_dp_graphs",
                            title: "Dynamic Programming on Trees and Graphs",
                            order: 1,
                            description: "Dijkstra, DFS/BFS, minimum spanning trees, and memoized recursion.",
                            difficulty: "Hard",
                            importance: "Core / Must Know",
                            estimatedHours: 24,
                            resources: dsaSheetId ? [dsaSheetId] : [],
                            practiceProblems: [
                                { title: "Course Schedule", url: "https://leetcode.com/problems/course-schedule/", platform: "LeetCode", difficulty: "Medium" },
                            ],
                        },
                    ],
                },
            ],
        });
    }

    // ─────────────────────────────────────────────────────────────────────────
    // 3. WIPRO: Entry-Level Technology Recruitment
    // ─────────────────────────────────────────────────────────────────────────
    const wiproCompany = companyMap.get("wipro");
    if (wiproCompany) {
        roadmaps.push({
            company: wiproCompany._id,
            title: "Wipro Entry-Level Technology Recruitment Preparation",
            slug: "wipro-entry-level-technology-prep",
            role: "Project Engineer",
            hiringTrack: "Wipro Elite National Talent Hunt",
            description: `Targeted preparation roadmap for Wipro campus drives covering quantitative aptitude, logical reasoning, written communication, and hands-on coding. ${INDICATIVE_NOTICE}`,
            estimatedDuration: "6-8 Weeks",
            estimatedDurationWeeks: 8,
            difficulty: "Beginner",
            publicationStatus: "Published",
            version: 1,
            stages: [
                {
                    stageId: "wipro_stg_01_aptitude_verbal",
                    title: "Stage 1: Quantitative, Logical & Written Communication",
                    order: 1,
                    description: "Percentages, speed & distance, syllogisms, and written communication evaluation.",
                    estimatedWeeks: 3,
                    topics: [
                        {
                            topicId: "wipro_top_quant_verbal",
                            title: "Quantitative Ability & Sentence Correction",
                            order: 1,
                            description: "Core aptitude questions and grammar analysis.",
                            difficulty: "Easy",
                            importance: "Core / Must Know",
                            estimatedHours: 12,
                            resources: aptitudeId ? [aptitudeId] : [],
                        },
                    ],
                },
                {
                    stageId: "wipro_stg_02_coding_fundamentals",
                    title: "Stage 2: Programming Fundamentals & Core CS",
                    order: 2,
                    description: "Basic programming in C, C++, Java, or Python, plus OOPs concepts and basic data structures.",
                    estimatedWeeks: 4,
                    topics: [
                        {
                            topicId: "wipro_top_array_strings_oops",
                            title: "Arrays, Strings & Object-Oriented Principles",
                            order: 1,
                            description: "Matrix operations, string reversals, inheritance, and encapsulation.",
                            difficulty: "Easy",
                            importance: "Core / Must Know",
                            estimatedHours: 14,
                            resources: dsaSheetId ? [dsaSheetId] : [],
                            practiceProblems: [
                                { title: "Valid Anagram", url: "https://leetcode.com/problems/valid-anagram/", platform: "LeetCode", difficulty: "Easy" },
                            ],
                        },
                    ],
                },
            ],
        });
    }

    // ─────────────────────────────────────────────────────────────────────────
    // 4. HCLTECH: Entry-Level Technology Recruitment
    // ─────────────────────────────────────────────────────────────────────────
    const hclCompany = companyMap.get("hcltech");
    if (hclCompany) {
        roadmaps.push({
            company: hclCompany._id,
            title: "HCLTech Entry-Level Technology Recruitment Preparation",
            slug: "hcltech-entry-level-technology-prep",
            role: "Graduate Engineer Trainee (GET)",
            hiringTrack: "HCLTech Campus / Off-Campus Hiring",
            description: `Preparatory curriculum focused on technical aptitude, coding logic, computer network fundamentals, and database concepts. ${INDICATIVE_NOTICE}`,
            estimatedDuration: "6-8 Weeks",
            estimatedDurationWeeks: 8,
            difficulty: "Beginner",
            publicationStatus: "Published",
            version: 1,
            stages: [
                {
                    stageId: "hcl_stg_01_tech_aptitude",
                    title: "Stage 1: Technical Aptitude & Core Programming Logic",
                    order: 1,
                    description: "Problem solving, loop execution, time complexity estimation, and basic data structures.",
                    estimatedWeeks: 4,
                    topics: [
                        {
                            topicId: "hcl_top_coding_basics",
                            title: "Data Types, Arrays, Pointers & Recursion Basics",
                            order: 1,
                            description: "Programming syntax and foundational algorithmic problem solving.",
                            difficulty: "Easy",
                            importance: "Core / Must Know",
                            estimatedHours: 14,
                            resources: dsaSheetId ? [dsaSheetId] : [],
                        },
                    ],
                },
                {
                    stageId: "hcl_stg_02_os_networks",
                    title: "Stage 2: Operating Systems & Computer Networking Essentials",
                    order: 2,
                    description: "Memory hierarchy, process scheduling, OSI 7-layer model, and TCP/IP protocol stack.",
                    estimatedWeeks: 3,
                    topics: [
                        {
                            topicId: "hcl_top_networks_os",
                            title: "Networking Protocols, Routing & OS Memory Management",
                            order: 1,
                            description: "Standard theoretical interview questions asked in technical panel interviews.",
                            difficulty: "Medium",
                            importance: "Core / Must Know",
                            estimatedHours: 10,
                            resources: csFundId ? [csFundId] : [],
                        },
                    ],
                },
            ],
        });
    }

    // ─────────────────────────────────────────────────────────────────────────
    // 5. COGNIZANT: GenC & GenC Elevate Track
    // ─────────────────────────────────────────────────────────────────────────
    const cognizantCompany = companyMap.get("cognizant");
    if (cognizantCompany) {
        roadmaps.push({
            company: cognizantCompany._id,
            title: "Cognizant GenC & GenC Elevate Recruitment Preparation",
            slug: "cognizant-genc-elevate-prep",
            role: "Programmer Analyst Trainee",
            hiringTrack: "Cognizant GenC & GenC Elevate",
            description: `Comprehensive study track covering analytical reasoning, pseudocode debugging, relational database queries, and intermediate coding. ${INDICATIVE_NOTICE}`,
            estimatedDuration: "7-9 Weeks",
            estimatedDurationWeeks: 8,
            difficulty: "Intermediate",
            publicationStatus: "Published",
            version: 1,
            stages: [
                {
                    stageId: "cts_stg_01_reasoning_pseudo",
                    title: "Stage 1: Analytical Ability & Pseudocode Analysis",
                    order: 1,
                    description: "Syntax-independent logic evaluation, condition branches, and operator precedence.",
                    estimatedWeeks: 3,
                    topics: [
                        {
                            topicId: "cts_top_pseudocode_debugging",
                            title: "Pseudocode Tracing & Time Complexity Evaluation",
                            order: 1,
                            description: "Tracing recursive functions and identifying logical bugs.",
                            difficulty: "Medium",
                            importance: "Core / Must Know",
                            estimatedHours: 12,
                            resources: aptitudeId ? [aptitudeId] : [],
                        },
                    ],
                },
                {
                    stageId: "cts_stg_02_hands_on_coding",
                    title: "Stage 2: Hands-On Data Structures & SQL Mastery",
                    order: 2,
                    description: "Intermediate array challenges, hash maps, linked lists, and SQL aggregate queries.",
                    estimatedWeeks: 4,
                    topics: [
                        {
                            topicId: "cts_top_arrays_linked_lists",
                            title: "Linked Lists, Stack Operations & Hash Maps",
                            order: 1,
                            description: "Reversing linked lists, cycle detection, and balanced parentheses.",
                            difficulty: "Medium",
                            importance: "Core / Must Know",
                            estimatedHours: 16,
                            resources: dsaSheetId ? [dsaSheetId] : [],
                            practiceProblems: [
                                { title: "Reverse Linked List", url: "https://leetcode.com/problems/reverse-linked-list/", platform: "LeetCode", difficulty: "Easy" },
                                { title: "Valid Parentheses", url: "https://leetcode.com/problems/valid-parentheses/", platform: "LeetCode", difficulty: "Easy" },
                            ],
                        },
                    ],
                },
            ],
        });
    }

    // ─────────────────────────────────────────────────────────────────────────
    // 6. CAPGEMINI: Entry-Level Technology Recruitment
    // ─────────────────────────────────────────────────────────────────────────
    const capgeminiCompany = companyMap.get("capgemini");
    if (capgeminiCompany) {
        roadmaps.push({
            company: capgeminiCompany._id,
            title: "Capgemini Entry-Level Technology Recruitment Preparation",
            slug: "capgemini-entry-level-technology-prep",
            role: "Software Engineer / Analyst",
            hiringTrack: "Capgemini Exceller / Campus Drive",
            description: `Curriculum covering Capgemini pseudocode, game-based cognitive aptitude, technical competency, and software engineering principles. ${INDICATIVE_NOTICE}`,
            estimatedDuration: "6-8 Weeks",
            estimatedDurationWeeks: 7,
            difficulty: "Beginner",
            publicationStatus: "Published",
            version: 1,
            stages: [
                {
                    stageId: "capg_stg_01_pseudocode_cognitive",
                    title: "Stage 1: Pseudocode & Cognitive Reasoning",
                    order: 1,
                    description: "Data structure operations, algorithm tracing, and logical puzzle solving.",
                    estimatedWeeks: 3,
                    topics: [
                        {
                            topicId: "capg_top_pseudocode_data_structures",
                            title: "Algorithm Flowcharts, Loops & Array Tracing",
                            order: 1,
                            description: "Understanding step-by-step program execution and variable scope.",
                            difficulty: "Easy",
                            importance: "Core / Must Know",
                            estimatedHours: 10,
                            resources: aptitudeId ? [aptitudeId] : [],
                        },
                    ],
                },
                {
                    stageId: "capg_stg_02_software_engineering",
                    title: "Stage 2: Software Engineering Principles & Coding Assessment",
                    order: 2,
                    description: "Object-oriented programming, clean code, string manipulation, and basic algorithms.",
                    estimatedWeeks: 4,
                    topics: [
                        {
                            topicId: "capg_top_oops_clean_code",
                            title: "OOPs Concepts, Exception Handling & Code Modularity",
                            order: 1,
                            description: "Encapsulation, abstract classes, interface design, and clean coding best practices.",
                            difficulty: "Medium",
                            importance: "Core / Must Know",
                            estimatedHours: 12,
                            resources: csFundId ? [csFundId] : [],
                        },
                    ],
                },
            ],
        });
    }

    // ─────────────────────────────────────────────────────────────────────────
    // 7. ACCENTURE: Entry-Level Technology Recruitment
    // ─────────────────────────────────────────────────────────────────────────
    const accentureCompany = companyMap.get("accenture");
    if (accentureCompany) {
        roadmaps.push({
            company: accentureCompany._id,
            title: "Accenture Entry-Level Technology Recruitment Preparation",
            slug: "accenture-entry-level-technology-prep",
            role: "Associate Software Engineer (ASE)",
            hiringTrack: "Associate Software Engineer & Advanced ASE",
            description: `Preparation track covering cognitive aptitude, technical assessments, cloud fundamentals, networking, and coding rounds. ${INDICATIVE_NOTICE}`,
            estimatedDuration: "6-8 Weeks",
            estimatedDurationWeeks: 8,
            difficulty: "Beginner",
            publicationStatus: "Published",
            version: 1,
            stages: [
                {
                    stageId: "acn_stg_01_cognitive_tech",
                    title: "Stage 1: Cognitive Ability & Technical Assessment",
                    order: 1,
                    description: "Critical thinking, abstract reasoning, pseudocode, and fundamentals of cloud services.",
                    estimatedWeeks: 4,
                    topics: [
                        {
                            topicId: "acn_top_pseudocode_cloud_basics",
                            title: "Pseudocode Logic & Cloud Architecture Fundamentals",
                            order: 1,
                            description: "IaaS/PaaS/SaaS models, security concepts, and conditional pseudocode execution.",
                            difficulty: "Medium",
                            importance: "Core / Must Know",
                            estimatedHours: 14,
                            resources: csFundId ? [csFundId] : [],
                        },
                    ],
                },
                {
                    stageId: "acn_stg_02_coding_assessment",
                    title: "Stage 2: Hands-On Coding & Algorithm Challenges",
                    order: 2,
                    description: "String algorithms, array transformations, and mathematical optimization.",
                    estimatedWeeks: 4,
                    topics: [
                        {
                            topicId: "acn_top_coding_challenges",
                            title: "Array Sums, Number Theory & Substrings",
                            order: 1,
                            description: "Coding test challenges evaluated with strict time limits.",
                            difficulty: "Medium",
                            importance: "Core / Must Know",
                            estimatedHours: 16,
                            resources: dsaSheetId ? [dsaSheetId] : [],
                            practiceProblems: [
                                { title: "Find the Duplicate Number", url: "https://leetcode.com/problems/find-the-duplicate-number/", platform: "LeetCode", difficulty: "Medium" },
                            ],
                        },
                    ],
                },
            ],
        });
    }

    // ─────────────────────────────────────────────────────────────────────────
    // 8. TECH MAHINDRA: Entry-Level Software Engineer
    // ─────────────────────────────────────────────────────────────────────────
    const techMCompany = companyMap.get("tech-mahindra");
    if (techMCompany) {
        roadmaps.push({
            company: techMCompany._id,
            title: "Tech Mahindra Entry-Level Software Engineer Recruitment Preparation",
            slug: "tech-mahindra-entry-level-prep",
            role: "Associate Software Engineer",
            hiringTrack: "Tech Mahindra Campus & Off-Campus Hiring",
            description: `Study plan designed for Tech Mahindra's evaluation including numerical ability, communicative English, technical competencies, and programming. ${INDICATIVE_NOTICE}`,
            estimatedDuration: "6-8 Weeks",
            estimatedDurationWeeks: 7,
            difficulty: "Beginner",
            publicationStatus: "Published",
            version: 1,
            stages: [
                {
                    stageId: "tm_stg_01_aptitude_communication",
                    title: "Stage 1: Aptitude, Logical Reasoning & Communication",
                    order: 1,
                    description: "Numerical mathematics, verbal comprehension, and professional written communication.",
                    estimatedWeeks: 3,
                    topics: [
                        {
                            topicId: "tm_top_quantitative_reasoning",
                            title: "Percentages, Ratios, Time-Speed-Distance & Data Interpretation",
                            order: 1,
                            description: "Core aptitude questions and logical deductions.",
                            difficulty: "Easy",
                            importance: "Core / Must Know",
                            estimatedHours: 12,
                            resources: aptitudeId ? [aptitudeId] : [],
                        },
                    ],
                },
                {
                    stageId: "tm_stg_02_technical_coding",
                    title: "Stage 2: Core Programming, Networking & Database Essentials",
                    order: 2,
                    description: "Hands-on coding in C/C++/Java, telecommunication network fundamentals, and SQL queries.",
                    estimatedWeeks: 4,
                    topics: [
                        {
                            topicId: "tm_top_networking_and_sql",
                            title: "TCP/IP, Routing Basics & Relational Database Queries",
                            order: 1,
                            description: "Subnetting, client-server models, and SQL joins.",
                            difficulty: "Medium",
                            importance: "Core / Must Know",
                            estimatedHours: 14,
                            resources: csFundId ? [csFundId] : [],
                        },
                    ],
                },
            ],
        });
    }

    // ─────────────────────────────────────────────────────────────────────────
    // 9. MICROSOFT: Software Engineering (SWE)
    // ─────────────────────────────────────────────────────────────────────────
    const microsoftCompany = companyMap.get("microsoft");
    if (microsoftCompany) {
        roadmaps.push({
            company: microsoftCompany._id,
            title: "Microsoft Software Engineering (SWE) Interview Preparation",
            slug: "microsoft-software-engineering-swe",
            role: "Software Engineer",
            hiringTrack: "University Graduate & Lateral SWE",
            description: `In-depth curriculum focusing on binary trees, graph algorithms, dynamic programming, low-level object-oriented design, and growth mindset behavioral interviews. ${INDICATIVE_NOTICE}`,
            estimatedDuration: "10-12 Weeks",
            estimatedDurationWeeks: 12,
            difficulty: "Advanced",
            publicationStatus: "Published",
            version: 1,
            stages: [
                {
                    stageId: "msft_stg_01_trees_graphs_dsa",
                    title: "Stage 1: Binary Trees, Binary Search Trees & Graph Traversals",
                    order: 1,
                    description: "Tree serializations, lowest common ancestors, level-order traversals, and BFS/DFS graph explorations.",
                    estimatedWeeks: 5,
                    topics: [
                        {
                            topicId: "msft_top_trees_bst",
                            title: "Binary Tree Traversals, Path Sums & LCA",
                            order: 1,
                            description: "High-frequency Microsoft coding interview patterns on trees.",
                            difficulty: "Medium",
                            importance: "Core / Must Know",
                            estimatedHours: 20,
                            resources: neetcodeId ? [neetcodeId] : [],
                            practiceProblems: [
                                { title: "Lowest Common Ancestor of a Binary Tree", url: "https://leetcode.com/problems/lowest-common-ancestor-of-a-binary-tree/", platform: "LeetCode", difficulty: "Medium" },
                                { title: "Binary Tree Level Order Traversal", url: "https://leetcode.com/problems/binary-tree-level-order-traversal/", platform: "LeetCode", difficulty: "Medium" },
                            ],
                        },
                        {
                            topicId: "msft_top_string_matrix_search",
                            title: "Matrix Traversals, Word Search & Backtracking",
                            order: 2,
                            description: "Grid search algorithms, DFS with backtracking, and constraint satisfaction.",
                            difficulty: "Hard",
                            importance: "High Frequency",
                            estimatedHours: 18,
                            resources: dsaSheetId ? [dsaSheetId] : [],
                            practiceProblems: [
                                { title: "Word Search", url: "https://leetcode.com/problems/word-search/", platform: "LeetCode", difficulty: "Medium" },
                            ],
                        },
                    ],
                },
                {
                    stageId: "msft_stg_02_system_design_behavioral",
                    title: "Stage 2: Low-Level System Design & Growth Mindset",
                    order: 2,
                    description: "Object-oriented design patterns, thread safety, and Microsoft behavioral competencies.",
                    estimatedWeeks: 4,
                    topics: [
                        {
                            topicId: "msft_top_lld_design_patterns",
                            title: "Design Patterns (Factory, Observer, Strategy) & SOLID Principles",
                            order: 1,
                            description: "Designing modular, extensible software components evaluated in design rounds.",
                            difficulty: "Medium",
                            importance: "Core / Must Know",
                            estimatedHours: 16,
                            resources: sysDesignId ? [sysDesignId] : [],
                            practiceProblems: [
                                { title: "LRU Cache", url: "https://leetcode.com/problems/lru-cache/", platform: "LeetCode", difficulty: "Medium" },
                            ],
                        },
                    ],
                },
            ],
        });
    }

    // ─────────────────────────────────────────────────────────────────────────
    // 10. GOOGLE: Software Engineering (SDE-1 / L3)
    // ─────────────────────────────────────────────────────────────────────────
    const googleCompany = companyMap.get("google");
    if (googleCompany) {
        roadmaps.push({
            company: googleCompany._id,
            title: "Google Software Engineering (SDE-1) Interview Preparation",
            slug: "google-sde-1-prep",
            role: "Software Engineer (SDE-1 / L3)",
            hiringTrack: "University Graduate & Lateral SWE",
            description: `Rigorous algorithmic roadmap covering complex graph algorithms, multivariable dynamic programming, edge-case optimization, and Googleyness collaboration. ${INDICATIVE_NOTICE}`,
            estimatedDuration: "12-14 Weeks",
            estimatedDurationWeeks: 12,
            difficulty: "Advanced",
            publicationStatus: "Published",
            version: 1,
            stages: [
                {
                    stageId: "goog_stg_01_graph_theory",
                    title: "Stage 1: Advanced Graph Theory & Tree Algorithms",
                    order: 1,
                    description: "Shortest paths, topological sorting, connected components, and bipartite graph verifications.",
                    estimatedWeeks: 5,
                    topics: [
                        {
                            topicId: "goog_top_graph_algorithms",
                            title: "BFS, DFS, Dijkstra & Topological Sort",
                            order: 1,
                            description: "Rigorous algorithmic problem solving tested across Google technical interviews.",
                            difficulty: "Hard",
                            importance: "Core / Must Know",
                            estimatedHours: 24,
                            resources: neetcodeId ? [neetcodeId] : [],
                            practiceProblems: [
                                { title: "Number of Islands", url: "https://leetcode.com/problems/number-of-islands/", platform: "LeetCode", difficulty: "Medium" },
                                { title: "Course Schedule", url: "https://leetcode.com/problems/course-schedule/", platform: "LeetCode", difficulty: "Medium" },
                                { title: "Word Ladder", url: "https://leetcode.com/problems/word-ladder/", platform: "LeetCode", difficulty: "Hard" },
                            ],
                        },
                    ],
                },
                {
                    stageId: "goog_stg_02_dp_googleyness",
                    title: "Stage 2: Multidimensional DP & Googleyness Assessment",
                    order: 2,
                    description: "Optimal substructure analysis, state transitions, and navigating ambiguity with humility.",
                    estimatedWeeks: 4,
                    topics: [
                        {
                            topicId: "goog_top_advanced_dp",
                            title: "Multidimensional Dynamic Programming & Memoization",
                            order: 1,
                            description: "Interval DP, grid paths, and edit distance.",
                            difficulty: "Hard",
                            importance: "High Frequency",
                            estimatedHours: 22,
                            resources: googleGuideId ? [googleGuideId] : [],
                            practiceProblems: [
                                { title: "Longest Increasing Subsequence", url: "https://leetcode.com/problems/longest-increasing-subsequence/", platform: "LeetCode", difficulty: "Medium" },
                            ],
                        },
                    ],
                },
            ],
        });
    }

    // ─────────────────────────────────────────────────────────────────────────
    // 11. AMAZON: SDE-1 Coding & Leadership Principles
    // ─────────────────────────────────────────────────────────────────────────
    const amazonCompany = companyMap.get("amazon");
    if (amazonCompany) {
        roadmaps.push({
            company: amazonCompany._id,
            title: "Amazon Software Development Engineer I (SDE-1) Preparation",
            slug: "amazon-sde-1-prep",
            role: "Software Development Engineer I (SDE-1)",
            hiringTrack: "University & Industry Lateral",
            description: `Balanced technical and behavioral curriculum covering high-frequency Amazon coding patterns, Object-Oriented Design, and the 16 Amazon Leadership Principles. ${INDICATIVE_NOTICE}`,
            estimatedDuration: "10-12 Weeks",
            estimatedDurationWeeks: 10,
            difficulty: "Intermediate",
            publicationStatus: "Published",
            version: 1,
            stages: [
                {
                    stageId: "amzn_stg_01_coding_patterns",
                    title: "Stage 1: High-Frequency Algorithmic Patterns & Priority Queues",
                    order: 1,
                    description: "Heaps, sliding window, binary trees, and topological sorting.",
                    estimatedWeeks: 5,
                    topics: [
                        {
                            topicId: "amzn_top_heaps_trees",
                            title: "Heaps, Priority Queues & Binary Tree Traversals",
                            order: 1,
                            description: "Top-K frequent elements, median of data streams, and binary tree maximum path sums.",
                            difficulty: "Medium",
                            importance: "Core / Must Know",
                            estimatedHours: 20,
                            resources: neetcodeId ? [neetcodeId] : [],
                            practiceProblems: [
                                { title: "Top K Frequent Elements", url: "https://leetcode.com/problems/top-k-frequent-elements/", platform: "LeetCode", difficulty: "Medium" },
                            ],
                        },
                    ],
                },
                {
                    stageId: "amzn_stg_02_leadership_principles",
                    title: "Stage 2: Amazon 16 Leadership Principles & STAR Behavioral Technique",
                    order: 2,
                    description: "Customer Obsession, Ownership, Bias for Action, Deliver Results, and Invent & Simplify.",
                    estimatedWeeks: 3,
                    topics: [
                        {
                            topicId: "amzn_top_star_stories",
                            title: "STAR Technique Behavioral Stories & Metrics",
                            order: 1,
                            description: "Structuring 6-8 comprehensive technical project anecdotes with clear metrics.",
                            difficulty: "Medium",
                            importance: "Core / Must Know",
                            estimatedHours: 12,
                            resources: amazonLpId ? [amazonLpId] : [],
                        },
                    ],
                },
            ],
        });
    }

    // ─────────────────────────────────────────────────────────────────────────
    // 12. IBM: Software Development & Cloud Technology
    // ─────────────────────────────────────────────────────────────────────────
    const ibmCompany = companyMap.get("ibm");
    if (ibmCompany) {
        roadmaps.push({
            company: ibmCompany._id,
            title: "IBM Software Development & Cloud Technology Preparation",
            slug: "ibm-software-developer-prep",
            role: "Software Developer",
            hiringTrack: "Entry-Level Developer & Associate System Engineer",
            description: `Curriculum covering data structures, object-oriented software engineering, cloud microservices, Docker container basics, and enterprise operating systems. ${INDICATIVE_NOTICE}`,
            estimatedDuration: "8-10 Weeks",
            estimatedDurationWeeks: 8,
            difficulty: "Intermediate",
            publicationStatus: "Published",
            version: 1,
            stages: [
                {
                    stageId: "ibm_stg_01_dsa_oops",
                    title: "Stage 1: Algorithmic Problem Solving & Object-Oriented Design",
                    order: 1,
                    description: "Arrays, stacks, queues, hash tables, and clean class design in Java/Python.",
                    estimatedWeeks: 4,
                    topics: [
                        {
                            topicId: "ibm_top_data_structures",
                            title: "Core Data Structures & Complexity Analysis",
                            order: 1,
                            description: "Hash maps, two pointers, and binary search algorithms.",
                            difficulty: "Medium",
                            importance: "Core / Must Know",
                            estimatedHours: 16,
                            resources: dsaSheetId ? [dsaSheetId] : [],
                            practiceProblems: [
                                { title: "Merge Two Sorted Lists", url: "https://leetcode.com/problems/merge-two-sorted-lists/", platform: "LeetCode", difficulty: "Easy" },
                            ],
                        },
                    ],
                },
                {
                    stageId: "ibm_stg_02_cloud_os",
                    title: "Stage 2: Cloud Computing, Microservices & Linux Essentials",
                    order: 2,
                    description: "Virtualization, containerization concepts (Docker), RESTful APIs, and Linux process management.",
                    estimatedWeeks: 4,
                    topics: [
                        {
                            topicId: "ibm_top_cloud_linux",
                            title: "Linux CLI, Container Concepts & RESTful Architecture",
                            order: 1,
                            description: "Stateless services, API design, and cloud deployment paradigms.",
                            difficulty: "Medium",
                            importance: "Core / Must Know",
                            estimatedHours: 14,
                            resources: csFundId ? [csFundId] : [],
                        },
                    ],
                },
            ],
        });
    }

    // ─────────────────────────────────────────────────────────────────────────
    // 13. ORACLE: Software Engineering & Systems Track
    // ─────────────────────────────────────────────────────────────────────────
    const oracleCompany = companyMap.get("oracle");
    if (oracleCompany) {
        roadmaps.push({
            company: oracleCompany._id,
            title: "Oracle Software Engineering & Systems Track Preparation",
            slug: "oracle-software-engineering-systems",
            role: "Member Technical Staff (MTS)",
            hiringTrack: "Member Technical Staff & Applications Engineer",
            description: `Rigorous systems engineering roadmap emphasizing relational database engines, B-trees, concurrency, memory management, and algorithmic data structures. ${INDICATIVE_NOTICE}`,
            estimatedDuration: "10-12 Weeks",
            estimatedDurationWeeks: 10,
            difficulty: "Advanced",
            publicationStatus: "Published",
            version: 1,
            stages: [
                {
                    stageId: "orcl_stg_01_dsa_recursion",
                    title: "Stage 1: Advanced Data Structures & Tree Indexes",
                    order: 1,
                    description: "Binary search trees, balanced trees (AVL/B-Trees), heaps, and linked list manipulations.",
                    estimatedWeeks: 5,
                    topics: [
                        {
                            topicId: "orcl_top_trees_heaps",
                            title: "Balanced Binary Trees, Heaps & Recursion",
                            order: 1,
                            description: "Tree traversals, binary search patterns, and heap-based priority sorting.",
                            difficulty: "Hard",
                            importance: "Core / Must Know",
                            estimatedHours: 20,
                            resources: neetcodeId ? [neetcodeId] : [],
                            practiceProblems: [
                                { title: "Validate Binary Search Tree", url: "https://leetcode.com/problems/validate-binary-search-tree/", platform: "LeetCode", difficulty: "Medium" },
                            ],
                        },
                    ],
                },
                {
                    stageId: "orcl_stg_02_database_systems",
                    title: "Stage 2: Database Internals, Concurrency & Operating Systems",
                    order: 2,
                    description: "Transaction isolation levels, WAL (Write-Ahead Logging), multi-threading, and deadlock handling.",
                    estimatedWeeks: 4,
                    topics: [
                        {
                            topicId: "orcl_top_dbms_internals",
                            title: "ACID Properties, Locking, Indexing & Storage Engines",
                            order: 1,
                            description: "B+ Tree indexing, query execution planning, and multi-version concurrency control (MVCC).",
                            difficulty: "Hard",
                            importance: "Core / Must Know",
                            estimatedHours: 18,
                            resources: sqlTutorialId ? [sqlTutorialId] : [],
                        },
                    ],
                },
            ],
        });
    }

    // ─────────────────────────────────────────────────────────────────────────
    // 14. ZOHO: Programming & Software Development
    // ─────────────────────────────────────────────────────────────────────────
    const zohoCompany = companyMap.get("zoho");
    if (zohoCompany) {
        roadmaps.push({
            company: zohoCompany._id,
            title: "Zoho Programming & Software Development Preparation",
            slug: "zoho-software-developer-prep",
            role: "Software Developer",
            hiringTrack: "Zoho Campus & Direct Hiring Drive",
            description: `Hands-on programming curriculum focusing on complex pattern matching, matrix simulations, zero-framework logic in C/Java, and modular low-level system designs. ${INDICATIVE_NOTICE}`,
            estimatedDuration: "8-10 Weeks",
            estimatedDurationWeeks: 8,
            difficulty: "Intermediate",
            publicationStatus: "Published",
            version: 1,
            stages: [
                {
                    stageId: "zoho_stg_01_complex_logic",
                    title: "Stage 1: Complex Problem Solving & Simulation Coding",
                    order: 1,
                    description: "Solving algorithmic problems using basic language features without relying on external libraries or collections.",
                    estimatedWeeks: 4,
                    topics: [
                        {
                            topicId: "zoho_top_matrix_patterns",
                            title: "Spiral Matrix, Pattern Printing & Custom String Manipulation",
                            order: 1,
                            description: "Writing custom string parsing, palindromic sub-logic, and multidimensional matrix transformations.",
                            difficulty: "Medium",
                            importance: "Core / Must Know",
                            estimatedHours: 18,
                            resources: dsaSheetId ? [dsaSheetId] : [],
                            practiceProblems: [
                                { title: "Spiral Matrix", url: "https://leetcode.com/problems/spiral-matrix/", platform: "LeetCode", difficulty: "Medium" },
                            ],
                        },
                    ],
                },
                {
                    stageId: "zoho_stg_02_advanced_app_design",
                    title: "Stage 2: Advanced Programming & Application Module Design",
                    order: 2,
                    description: "Developing command-line mini applications (e.g. Railway Reservation, Taxi Booking, E-Commerce cart) demonstrating object modeling and state management.",
                    estimatedWeeks: 4,
                    topics: [
                        {
                            topicId: "zoho_top_application_design",
                            title: "Mini-Application Architecture & Object-Oriented Modeling",
                            order: 1,
                            description: "Handling real-world requirements with classes, data structures, and menu-driven interfaces.",
                            difficulty: "Hard",
                            importance: "Core / Must Know",
                            estimatedHours: 20,
                            resources: sysDesignId ? [sysDesignId] : [],
                        },
                    ],
                },
            ],
        });
    }

    // ─────────────────────────────────────────────────────────────────────────
    // 15. QUALCOMM: C/C++, Embedded Systems & Computer Architecture
    // ─────────────────────────────────────────────────────────────────────────
    const qualcommCompany = companyMap.get("qualcomm");
    if (qualcommCompany) {
        roadmaps.push({
            company: qualcommCompany._id,
            title: "Qualcomm Software Engineering: C/C++, Embedded & Architecture",
            slug: "qualcomm-software-engineering-embedded",
            role: "Software Engineer (Embedded / Systems)",
            hiringTrack: "Embedded & Systems Software Engineer",
            description: `Deep-dive systems curriculum covering advanced C pointer arithmetic, hardware register bit manipulation, computer architecture cache coherence, OS kernel internals, and concurrent programming. ${INDICATIVE_NOTICE}`,
            estimatedDuration: "10-12 Weeks",
            estimatedDurationWeeks: 10,
            difficulty: "Advanced",
            publicationStatus: "Published",
            version: 1,
            stages: [
                {
                    stageId: "qcom_stg_01_c_pointers_bits",
                    title: "Stage 1: Advanced C Programming, Pointers & Bit Manipulation",
                    order: 1,
                    description: "Pointer arithmetic, dynamic memory management, structure padding, bitwise algorithms, and endianness.",
                    estimatedWeeks: 4,
                    topics: [
                        {
                            topicId: "qcom_top_pointers_memory",
                            title: "Pointer Arithmetic, Function Pointers & Memory Alignment",
                            order: 1,
                            description: "Deep dive into heap allocation, stack frames, memory leaks, and void/function pointers.",
                            difficulty: "Hard",
                            importance: "Core / Must Know",
                            estimatedHours: 18,
                            resources: cPointersId ? [cPointersId] : [],
                        },
                        {
                            topicId: "qcom_top_bit_manipulation",
                            title: "Bitwise Operations, Masking & Register Manipulations",
                            order: 2,
                            description: "Setting, clearing, toggling bits, counting set bits, and bit fields.",
                            difficulty: "Medium",
                            importance: "Core / Must Know",
                            estimatedHours: 14,
                            resources: bitManipId ? [bitManipId] : [],
                            practiceProblems: [
                                { title: "Number of 1 Bits", url: "https://leetcode.com/problems/number-of-1-bits/", platform: "LeetCode", difficulty: "Easy" },
                                { title: "Counting Bits", url: "https://leetcode.com/problems/counting-bits/", platform: "LeetCode", difficulty: "Easy" },
                            ],
                        },
                    ],
                },
                {
                    stageId: "qcom_stg_02_architecture_os",
                    title: "Stage 2: Computer Architecture, Cache Coherence & OS Internals",
                    order: 2,
                    description: "CPU registers, cache hierarchy (L1/L2/L3), memory barriers, interrupts, mutexes, and POSIX threads.",
                    estimatedWeeks: 5,
                    topics: [
                        {
                            topicId: "qcom_top_computer_architecture",
                            title: "Memory Hierarchy, Cache Misses & Pipelining",
                            order: 1,
                            description: "Cache mapping, locality of reference, pipeline hazards, and virtual memory paging.",
                            difficulty: "Hard",
                            importance: "Core / Must Know",
                            estimatedHours: 18,
                            resources: csFundId ? [csFundId] : [],
                        },
                        {
                            topicId: "qcom_top_os_concurrency",
                            title: "Synchronization Primitives, Mutexes, Semaphores & Deadlocks",
                            order: 2,
                            description: "Race condition avoidance, critical sections, and concurrent multithreaded design.",
                            difficulty: "Hard",
                            importance: "Core / Must Know",
                            estimatedHours: 16,
                            resources: csFundId ? [csFundId] : [],
                        },
                    ],
                },
            ],
        });
    }

    return roadmaps;
}

// ─── 3. IDEMPOTENT SEEDING FUNCTION ───────────────────────────────────────
export async function seedPreparationHub() {
    console.log("🌱 Connecting to MongoDB for Preparation Hub seeding...");
    await connectDB();

    console.log(`📦 Seeding/updating ${INITIAL_COMPANIES.length} preparation companies...`);
    const companyMap = new Map();

    for (const compData of INITIAL_COMPANIES) {
        let existing = await Company.findOne({
            $or: [{ slug: compData.slug }, { companyName: compData.companyName }],
        });

        if (existing) {
            // Update metadata without modifying _id, createdAt, or user relationships
            existing.slug = compData.slug;
            existing.category = compData.category;
            existing.tier = compData.tier;
            existing.industry = compData.industry;
            existing.description = compData.description;
            existing.website = compData.website;
            existing.careersUrl = compData.careersUrl;
            existing.location = compData.location;
            existing.headquarters = compData.headquarters;
            existing.hiringTracks = compData.hiringTracks;
            existing.isPreparationHubActive = compData.isPreparationHubActive;
            if (!existing.logo && compData.logo) {
                existing.logo = compData.logo;
            }
            existing.lastVerifiedDate = new Date();
            await existing.save();
            companyMap.set(compData.slug, existing);
            console.log(`   Updated company: ${compData.companyName} [${compData.category}] (${compData.slug})`);
        } else {
            const created = await Company.create(compData);
            companyMap.set(compData.slug, created);
            console.log(`   Created company: ${compData.companyName} [${compData.category}] (${compData.slug})`);
        }
    }

    console.log(`📚 Seeding/updating ${INITIAL_RESOURCES.length} learning resources...`);
    const resourceMap = new Map();

    for (const resData of INITIAL_RESOURCES) {
        let existing = await PreparationResource.findOne({ url: resData.url });
        if (existing) {
            existing.title = resData.title;
            existing.category = resData.category || "Core CS";
            existing.type = resData.type;
            existing.sourceType = resData.sourceType || "External Platform";
            existing.isOfficial = !!resData.isOfficial;
            existing.provider = resData.provider;
            existing.isFree = resData.isFree;
            existing.estimatedTimeMinutes = resData.estimatedTimeMinutes;
            existing.description = resData.description;
            existing.tags = resData.tags;
            existing.difficulty = resData.difficulty;
            existing.status = resData.status || "Active";
            existing.lastVerifiedDate = new Date();
            await existing.save();
            resourceMap.set(resData.title, existing);
        } else {
            const created = await PreparationResource.create(resData);
            resourceMap.set(resData.title, created);
            console.log(`   Created resource: ${resData.title}`);
        }
    }

    console.log("🗺️  Seeding foundational roadmaps with stable topic identifiers...");
    const roadmapDefinitions = buildRoadmapDefinitions(companyMap, resourceMap);

    for (const rDef of roadmapDefinitions) {
        let existingRoadmap = await Roadmap.findOne({ slug: rDef.slug });

        if (existingRoadmap) {
            // Idempotent update: preserve _id and ensure topicIds are never lost
            existingRoadmap.title = rDef.title;
            existingRoadmap.role = rDef.role;
            existingRoadmap.hiringTrack = rDef.hiringTrack;
            existingRoadmap.description = rDef.description;
            existingRoadmap.estimatedDuration = rDef.estimatedDuration;
            existingRoadmap.estimatedDurationWeeks = rDef.estimatedDurationWeeks;
            existingRoadmap.difficulty = rDef.difficulty;
            existingRoadmap.publicationStatus = rDef.publicationStatus;
            existingRoadmap.stages = rDef.stages;
            existingRoadmap.lastVerifiedDate = new Date();
            await existingRoadmap.save();
            console.log(`   Updated Roadmap: ${rDef.title} (${rDef.slug})`);
        } else {
            await Roadmap.create(rDef);
            console.log(`   Created Roadmap: ${rDef.title} (${rDef.slug})`);
        }
    }

    console.log(`\n✅ Preparation Hub Seeding complete:`);
    console.log(`   - Companies: ${INITIAL_COMPANIES.length}`);
    console.log(`   - Learning Resources: ${INITIAL_RESOURCES.length}`);
    console.log(`   - Roadmaps: ${roadmapDefinitions.length}`);
}

// Direct CLI execution
if (process.argv[1]?.endsWith("seed_preparation_hub.js")) {
    seedPreparationHub()
        .then(() => {
            console.log("✨ Seeding finished successfully.");
            process.exit(0);
        })
        .catch((err) => {
            console.error("❌ Seeding failed:", err);
            process.exit(1);
        });
}

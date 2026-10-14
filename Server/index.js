import express from "express";
import cookieParser from "cookie-parser";
import cors from "cors";
import dotenv from "dotenv";
import connectDB from "./utils/db.js";
import userRouter from "./routes/user.routes.js";
import companyRouter from "./routes/company.routes.js";
import jobRouter from "./routes/job.routes.js";
import applicantionRouter from "./routes/application.routes.js";
dotenv.config({});

const app = express();

// middlewares
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

const corsOptions = {
    origin: (origin, callback) => {
        // Allow requests with no origin (mobile apps, curl, Postman, server-to-server)
        if (!origin) return callback(null, true);

        // Strip trailing slash for consistent comparison
        const cleanOrigin = origin.replace(/\/$/, "");

        const allowedOrigins = [
            // Local dev
            "http://localhost:5173",
            "http://localhost:3000",
            // Vercel frontend URLs (add yours here without trailing slash)
            "https://career-connect-xzga-uz3ziwahf.vercel.app",
            "https://career-connect-xzga.vercel.app",
        ];

        // Also allow any URL set via FRONTEND_URL env var
        if (process.env.FRONTEND_URL) {
            allowedOrigins.push(process.env.FRONTEND_URL.replace(/\/$/, ""));
        }

        if (allowedOrigins.includes(cleanOrigin)) {
            callback(null, true);
        } else {
            console.error(`CORS blocked origin: ${origin}`);
            callback(new Error(`CORS: Origin ${origin} not allowed`));
        }
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization", "Cookie"],
};

app.use(cors(corsOptions));

// Handle preflight OPTIONS requests explicitly
app.options("*", cors(corsOptions));

app.get("/", (req, res) => {
    res.send("Career-Connect API is running ✅");
});

app.use("/api/v1/user", userRouter);
app.use("/api/v1/company", companyRouter);
app.use("/api/v1/job", jobRouter);
app.use("/api/v1/application", applicantionRouter);

const PORT = process.env.PORT || 8000;

// Only start the HTTP server in local development
if (process.env.NODE_ENV !== "production") {
    connectDB().then(() => {
        app.listen(PORT, () => {
            console.log(`Server running at port ${PORT}`);
        });
    });
} else {
    // In production (Vercel), connect to DB on first request via lazy connection
    connectDB();
}

// Export for Vercel serverless
export default app;

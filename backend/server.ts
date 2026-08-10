import express, { Request, Response } from "express";
import path from "path";
import fs from "fs";
import dotenv from "dotenv";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { createClient } from "@supabase/supabase-js";
import helmet from "helmet";
import cors from "cors";
import rateLimit from "express-rate-limit";

// Import Vercel API handlers to make them work locally
import fhirHandler from "../api/fhir.js";
import fhirGetHandler from "../api/fhir-get.js";
import registerHandler from "../api/auth/register.js";
import loginHandler from "../api/auth/login.js";
import refreshHandler from "../api/auth/refresh.js";
import logoutHandler from "../api/auth/logout.js";
import setup2FAHandler from "../api/auth/2fa/setup.js";
import verify2FAHandler from "../api/auth/2fa/verify.js";
import validate2FAHandler from "../api/auth/2fa/validate.js";
import chatHandler from "../api/chat.js";
import { verifyJwt, hasPromptInjection, sanitizeAiInput, globalErrorHandler, logEvent, asyncHandler } from "../api/_lib/security.js";

import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, '../.env') });
dotenv.config(); // fallback

const supabaseUrl = process.env.VITE_SUPABASE_URL || "https://placeholder.supabase.co";
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY || "placeholder-key";
const supabase = createClient(supabaseUrl, supabaseAnonKey);

const PORT = 3000;


let aiClient: GoogleGenerativeAI | null = null;
function getGeminiClient() {
  if (!aiClient) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      console.warn("⚠️ Warning: GEMINI_API_KEY is not defined in the environment.");
    }
    aiClient = new GoogleGenerativeAI(apiKey || "");
  }
  return aiClient;
}

const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 50, // Limit each IP to 50 requests per `window` (here, per 15 minutes)
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
  message: { error: "Demasiadas solicitudes desde esta IP, por favor intente nuevamente después de 15 minutos." }
});

async function startServer() {
  const app = express();
  
  // Security middlewares
  app.use(helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'", "'unsafe-inline'", "https://accounts.google.com"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        imgSrc: ["'self'", "data:", "https:", "blob:"],
        connectSrc: ["'self'", "https://*.supabase.co", "https://generativelanguage.googleapis.com", "https://nominatim.openstreetmap.org"],
        fontSrc: ["'self'", "https://fonts.gstatic.com"],
        frameSrc: ["'self'", "https://*.supabase.co"],
        baseUri: ["'self'"],
      },
    },
    crossOriginEmbedderPolicy: false
  }));
  app.use(cors({
    origin: process.env.NODE_ENV === "production" && process.env.FRONTEND_URL ? process.env.FRONTEND_URL : "http://localhost:3000",
    methods: ["GET", "POST", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
    credentials: true,
  }));
  
  app.use(express.json({ limit: "100kb" })); 

  // Register custom auth/2fa/medical endpoints for local dev
  app.post("/api/auth/register", asyncHandler(registerHandler));
  app.post("/api/auth/login", asyncHandler(loginHandler));
  app.post("/api/auth/refresh", asyncHandler(refreshHandler));
  app.post("/api/auth/logout", asyncHandler(logoutHandler));
  app.get("/api/auth/2fa/setup", asyncHandler(setup2FAHandler));
  app.post("/api/auth/2fa/verify", asyncHandler(verify2FAHandler));
  app.post("/api/auth/2fa/validate", asyncHandler(validate2FAHandler));
  app.post("/api/fhir", asyncHandler(fhirHandler));
  app.get("/api/fhir-get", asyncHandler(fhirGetHandler));
  
  app.post("/api/chat", apiLimiter, asyncHandler(chatHandler));

  // API endpoint for admin panel metrics
  app.get("/api/admin/metrics", asyncHandler(async (req: Request, res: Response) => {
    try {
      const metricsPath = path.resolve(process.cwd(), "src/data/simulatedMetrics.json");
      if (!fs.existsSync(metricsPath)) {
        return res.status(404).json({ error: "Simulated metrics file not found" });
      }
      
      const rawData = fs.readFileSync(metricsPath, "utf-8");
      const metrics = JSON.parse(rawData);
      
      // Allow dynamic query param overrides for testing the weighted load calculations
      const activeUsersQuery = req.query.activeUsers ? parseInt(req.query.activeUsers as string) : undefined;
      const messagesQuery = req.query.messagesLastHour ? parseInt(req.query.messagesLastHour as string) : undefined;
      
      if (activeUsersQuery !== undefined && !isNaN(activeUsersQuery)) {
        metrics.systemStatus.activeUsers = activeUsersQuery;
        // L_server = (U_active / C_max) * 100
        const serverLoad = (activeUsersQuery / metrics.systemStatus.maxConcurrentCapacity) * 100;
        metrics.systemStatus.serverLoadPercentage = Math.min(100.0, parseFloat(serverLoad.toFixed(1)));
      }
      
      if (messagesQuery !== undefined && !isNaN(messagesQuery)) {
        metrics.systemStatus.messagesLastHour = messagesQuery;
        // A_workload = (M_hour / M_baseline) * 100
        const workloadPct = (messagesQuery / metrics.systemStatus.hourlyMessageBaseline) * 100;
        metrics.systemStatus.workloadActivityPercentage = Math.min(100.0, parseFloat(workloadPct.toFixed(1)));
      }
      
      return res.json(metrics);
    } catch (error: any) {
      console.error("Error fetching metrics:", error);
      return res.status(500).json({
        error: "Failed to load admin panel metrics.",
        details: error?.message || ""
      });
    }
  }));

  // Hot module reloading and client asset serving
  if (process.env.NODE_ENV !== "production") {
    console.log("Development mode: API Server running. (Frontend Vite is handled separately)");
  } else {
    console.log("Serving production build of client from /dist...");
    const distPath = path.resolve(process.cwd(), 'dist');
    app.use(express.static(distPath, { index: false }));
    app.get('*', (req: Request, res: Response) => {
      res.sendFile(path.resolve(distPath, 'index.html'));
    });
  }

  // Register global centralized error handler
  app.use(globalErrorHandler);

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`🚀 Salud-Conecta IA Server running at http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error("Failed to start server:", err);
});

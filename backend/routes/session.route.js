import express from "express";
import { verifyToken } from "../middleware/verifyToken.js";
import { 
  createSession, 
  getOwnerSessions, 
  getRenterSessions, 
  updateSessionStatus, 
  uploadCode, 
  getExecutionResult 
} from "../controllers/session.controller.js";
import multer from "multer";

const router = express.Router();

// Configure multer for memory storage
const storage = multer.memoryStorage();
const upload = multer({ storage });

// Create a new session (rent a device)
router.post("/", verifyToken, createSession);

// Get all sessions for device owner
router.get("/owner", verifyToken, getOwnerSessions);

// Get all sessions for a renter
router.get("/renter", verifyToken, getRenterSessions);

// Accept/reject/complete a session
router.put("/:sessionId/status", verifyToken, updateSessionStatus);

// Upload code to run
router.post("/:sessionId/upload", verifyToken, upload.single("file"), uploadCode);

// Get execution result
router.get("/:sessionId/result", verifyToken, getExecutionResult);

export default router;
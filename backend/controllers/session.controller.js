import { Session } from "../models/session.model.js";
import { Device } from "../models/device.model.js";
import axios from "axios";
import Docker from 'dockerode';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const docker = new Docker();

// Create a new rental session request
export const createSession = async (req, res) => {
  try {
    const { deviceId, language } = req.body;
    
    // Check if device exists and is available
    const device = await Device.findById(deviceId);
    if (!device) {
      return res.status(404).json({ success: false, message: "Device not found" });
    }
    
    if (!device.isAvailable) {
      return res.status(400).json({ success: false, message: "Device is not available for rent" });
    }
    
    // Check if the renter is not the owner
    if (device.owner.toString() === req.userId) {
      return res.status(400).json({ success: false, message: "You cannot rent your own device" });
    }
    
    // Create a new session
    const session = new Session({
      renter: req.userId,
      device: deviceId,
      language: language || "python",
    });
    
    await session.save();
    
    return res.status(201).json({ 
      success: true, 
      message: "Rental request created successfully", 
      sessionId: session._id 
    });
  } catch (error) {
    console.error("Error creating session:", error);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

// Get all sessions for a device owner
export const getOwnerSessions = async (req, res) => {
  try {
    // Find all devices owned by the user
    const devices = await Device.find({ owner: req.userId });
    const deviceIds = devices.map(device => device._id);
    
    // Find all sessions for these devices
    const sessions = await Session.find({ device: { $in: deviceIds } })
      .populate("renter", "name email")
      .populate("device", "deviceName deviceType")
      .sort({ createdAt: -1 });
      
    return res.status(200).json({ success: true, sessions });
  } catch (error) {
    console.error("Error getting owner sessions:", error);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

// Get all sessions for a renter
export const getRenterSessions = async (req, res) => {
  try {
    const sessions = await Session.find({ renter: req.userId })
      .populate("device", "deviceName deviceType specs performance owner")
      .sort({ createdAt: -1 });
      
    return res.status(200).json({ success: true, sessions });
  } catch (error) {
    console.error("Error getting renter sessions:", error);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

// Accept or reject a session request
export const updateSessionStatus = async (req, res) => {
  try {
    const { sessionId } = req.params;
    const { status } = req.body;
    
    if (!["active", "completed", "rejected"].includes(status)) {
      return res.status(400).json({ success: false, message: "Invalid status" });
    }
    
    const session = await Session.findById(sessionId).populate("device");
    if (!session) {
      return res.status(404).json({ success: false, message: "Session not found" });
    }
    
    // Verify that the requester is the device owner
    if (session.device.owner.toString() !== req.userId) {
      return res.status(403).json({ success: false, message: "Not authorized" });
    }
    
    // Update session status
    if (status === "active") {
      session.startTime = new Date();
    } else if (status === "completed") {
      session.endTime = new Date();
      // Calculate cost based on time used and device price
      const hoursUsed = (session.endTime - session.startTime) / (1000 * 60 * 60);
      session.cost = session.device.price * hoursUsed;
    }
    
    session.status = status;
    await session.save();
    
    return res.status(200).json({ success: true, message: `Session ${status}` });
  } catch (error) {
    console.error("Error updating session status:", error);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

// Upload code to run on rented device
export const uploadCode = async (req, res) => {
  try {
    const { sessionId } = req.params;
    const file = req.file;
    
    if (!file) {
      return res.status(400).json({ success: false, message: "No file uploaded" });
    }
    
    const session = await Session.findById(sessionId);
    if (!session) {
      return res.status(404).json({ success: false, message: "Session not found" });
    }
    
    // Verify the requester is the renter
    if (session.renter.toString() !== req.userId) {
      return res.status(403).json({ success: false, message: "Not authorized" });
    }
    
    // Only allow uploads for active sessions
    if (session.status !== "active") {
      return res.status(400).json({ success: false, message: `Cannot upload code to a session in ${session.status} status` });
    }
    
    // Create a unique directory for this session
    const sessionDir = path.join(__dirname, '..', 'uploads', sessionId);
    if (!fs.existsSync(sessionDir)) {
      fs.mkdirSync(sessionDir, { recursive: true });
    }
    
    // Save the uploaded file
    const filePath = path.join(sessionDir, 'code.py');
    fs.writeFileSync(filePath, file.buffer);
    
    // Create requirements.txt file with necessary packages
    const requirementsPath = path.join(sessionDir, 'requirements.txt');
    const requirementsContent = 'numpy\npandas\nscikit-learn\nmatplotlib\n';
    fs.writeFileSync(requirementsPath, requirementsContent);
    
    // Create Dockerfile with pip install requirements.txt command
    const dockerfilePath = path.join(sessionDir, 'Dockerfile');
    const dockerfileContent = `FROM python:3.9-slim
WORKDIR /app
COPY code.py requirements.txt ./
RUN pip install -r requirements.txt
CMD ["python", "code.py"]`;
    fs.writeFileSync(dockerfilePath, dockerfileContent);
    
    // Build Docker image
    const stream = await docker.buildImage({
      context: sessionDir,
      src: ['Dockerfile', 'code.py', 'requirements.txt']
    }, { t: `sandbox-${sessionId}` });
    
    // Wait for build to complete
    await new Promise((resolve, reject) => {
      docker.modem.followProgress(stream, (err, res) => err ? reject(err) : resolve(res));
    });
    
    // Run the container
    const container = await docker.createContainer({
      Image: `sandbox-${sessionId}`,
      Tty: true,
      AttachStdout: true,
      AttachStderr: true
    });
    
    await container.start();
    
    // Get container output
    const stream2 = await container.logs({ follow: true, stdout: true, stderr: true });
    
    let output = '';
    stream2.on('data', (chunk) => {
      output += chunk.toString();
    });
    
    // Wait for container to finish
    await container.wait();
    
    // Save output to session
    session.output = output;
    await session.save();
    
    return res.status(200).json({
      success: true,
      message: "Code executed successfully",
      output: output
    });
    
  } catch (error) {
    console.error("Error executing code:", error);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

// Get execution result
export const getExecutionResult = async (req, res) => {
  try {
    const { sessionId } = req.params;
    
    const session = await Session.findById(sessionId);
    if (!session) {
      return res.status(404).json({ success: false, message: "Session not found" });
    }
    
    // Verify the requester is authorized (either renter or device owner)
    const device = await Device.findById(session.device);
    if (
      session.renter.toString() !== req.userId && 
      device.owner.toString() !== req.userId
    ) {
      return res.status(403).json({ success: false, message: "Not authorized" });
    }
    
    return res.status(200).json({ 
      success: true, 
      result: session.output || "No output available"
    });
  } catch (error) {
    console.error("Error getting execution result:", error);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};
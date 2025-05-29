import express from "express"
import { verifyToken } from "../middleware/verifyToken.js";
import { checkAuth, forgotPassword, login, logout, resetPassword, signup, verifyEmail } from "../controllers/auth.controller.js";

const router = express.Router();

//isAuthorized
router.get("/check-auth", verifyToken, checkAuth);

router.post("/signup", signup);
router.post("/login", login);
router.post("/logout", logout);

router.post("/verify-email", verifyEmail);
router.post("/forget-password", forgotPassword);

router.post("/reset-password/:token", resetPassword);

export default router;
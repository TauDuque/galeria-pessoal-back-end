import { Router } from "express";
import * as userController from "../controllers/userController";
import { authenticateToken } from "../middlewares/authMiddleware";

const router = Router();

router.post("/register", userController.register);
router.post("/login", userController.login);
router.get("/profile", authenticateToken, userController.getProfile);

export default router;

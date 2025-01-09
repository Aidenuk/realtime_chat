import express from "express";
import { getUsersForSidebar, getMessages, sendMessage, markMessageAsRead } from "../controllers/message.controller.js";
import { protectRoute } from "../middleware/auth.middleware.js";

const router = express.Router();

router.get("/users",protectRoute, getUsersForSidebar);
router.get("/:id",protectRoute,getMessages);
router.post("/send/:id", protectRoute, sendMessage);
router.post("/read/:id", protectRoute, markMessageAsRead)

export default router;
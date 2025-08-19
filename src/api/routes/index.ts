import { Router } from "express";
import userRoutes from "./userRoutes";
import artworkRoutes from "./artworkRoutes";

const router = Router();

router.get("/", (_req, res) => {
  res.json({ status: "Raiz da API" });
});

router.use("/users", userRoutes);
router.use("/artworks", artworkRoutes);

export default router;

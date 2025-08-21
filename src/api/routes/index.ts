import { Router } from "express";
import userRoutes from "./userRoutes";
import artworkRoutes from "./artworkRoutes";
import favoriteRoutes from "./favoriteRoutes";

const router = Router();

router.get("/", (_req, res) => {
  res.json({ status: "Raiz da API" });
});

router.use("/users", userRoutes);
router.use("/artworks", artworkRoutes);
router.use("/favorites", favoriteRoutes);

export default router;

import { Router } from "express";
import * as artworkController from "../controllers/artworkController";
import { authenticateToken } from "../middlewares/authMiddleware";

const router = Router();

// Rota pública para buscar obras
router.get("/search", artworkController.searchArt);

// Rotas protegidas que requerem autenticação
router.post("/save", authenticateToken, artworkController.saveArtwork);
router.get(
  "/my-collection",
  authenticateToken,
  artworkController.getUserArtworks
);
router.delete(
  "/:artworkId",
  authenticateToken,
  artworkController.removeArtwork
);

export default router;

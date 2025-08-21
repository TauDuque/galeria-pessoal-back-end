import { Router } from "express";
import * as artworkController from "../controllers/artworkController";
import { authenticateToken } from "../middlewares/authMiddleware";

const router = Router();

// Rotas públicas
router.get("/", artworkController.getAllArtworks);
router.get("/search", artworkController.searchArt);
router.get("/classics", artworkController.getClassicArtworks);
router.get("/:id", artworkController.getArtworkById);

// Rotas protegidas que requerem autenticação
router.post("/save", authenticateToken, artworkController.saveArtwork);
router.get("/user", authenticateToken, artworkController.getUserArtworks);
router.delete(
  "/:artworkId",
  authenticateToken,
  artworkController.removeArtwork
);

export default router;

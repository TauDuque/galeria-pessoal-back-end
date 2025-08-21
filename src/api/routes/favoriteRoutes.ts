import { Router } from "express";
import * as favoriteController from "../controllers/favoriteController";
import { authenticateToken } from "../middlewares/authMiddleware";

const router = Router();

// Todas as rotas de favoritos requerem autenticação
router.use(authenticateToken);

// Adicionar aos favoritos
router.post("/", favoriteController.addFavorite);

// Listar favoritos do usuário
router.get("/", favoriteController.getUserFavorites);

// Remover dos favoritos
router.delete("/:favoriteId", favoriteController.removeFavorite);

export default router;

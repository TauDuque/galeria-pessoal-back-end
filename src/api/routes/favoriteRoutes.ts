import { Router } from "express";
import * as favoriteController from "../controllers/favoriteController";
import { authenticateToken } from "../middlewares/authMiddleware";
import prisma from "../../config/prismaClient";

const router = Router();

// Endpoint de teste (sem autenticação)
router.get("/test", (req, res) => {
  res.json({
    message: "Rotas de favoritos funcionando!",
    timestamp: new Date().toISOString(),
  });
});

// Endpoint para testar criação de favoritos (sem autenticação para debug)
router.post("/test-create", async (req, res) => {
  try {
    console.log("🧪 Teste de criação de favorito - Body:", req.body);
    console.log("🧪 Teste de criação de favorito - Headers:", req.headers);

    // Simular dados de teste
    const testData = {
      metId: req.body.metId || 436535,
      userId: req.body.userId || 1,
      message: "Teste de criação de favorito",
    };

    res.json({
      success: true,
      testData,
      message: "Endpoint de teste funcionando!",
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("❌ Erro no teste:", error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : String(error),
    });
  }
});

// Endpoint de debug para verificar o estado do banco (sem autenticação)
router.get("/debug", async (req, res) => {
  try {
    console.log("🔍 Debug - Verificando estado do banco...");

    // Verificar usuários
    const users = await prisma.user.findMany({
      select: { id: true, name: true, email: true, createdAt: true },
    });

    // Verificar favoritos
    const favorites = await prisma.favorite.findMany({
      select: { id: true, userId: true, metId: true, createdAt: true },
    });

    // Verificar obras
    const artworks = await prisma.artwork.findMany({
      select: { id: true, metId: true, title: true, userId: true },
    });

    const debugInfo = {
      timestamp: new Date().toISOString(),
      database: {
        users: {
          count: users.length,
          data: users,
        },
        favorites: {
          count: favorites.length,
          data: favorites,
        },
        artworks: {
          count: artworks.length,
          data: artworks,
        },
      },
      message: "Informações de debug do banco de dados",
    };

    console.log("🔍 Debug - Informações coletadas:", debugInfo);
    res.json(debugInfo);
  } catch (error) {
    console.error("❌ Erro no debug:", error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : String(error),
      timestamp: new Date().toISOString(),
    });
  }
});

// Endpoint para criar usuário de teste (sem autenticação)
router.post("/create-test-user", async (req, res) => {
  try {
    console.log("🧪 Criando usuário de teste...");

    // Verificar se já existe um usuário de teste
    const existingUser = await prisma.user.findFirst({
      where: { email: "teste2@galeria.com" },
    });

    if (existingUser) {
      console.log("✅ Usuário de teste já existe:", existingUser);
      return res.json({
        success: true,
        message: "Usuário de teste já existe",
        user: {
          id: existingUser.id,
          name: existingUser.name,
          email: existingUser.email,
        },
        credentials: {
          email: "teste2@galeria.com",
          password: "123456",
        },
      });
    }

    // Importar bcrypt para hash da senha
    const bcrypt = require("bcryptjs");
    const hashedPassword = await bcrypt.hash("123456", 10);

    console.log("🔐 Senha hash criada:", hashedPassword);

    // Criar usuário de teste
    const testUser = await prisma.user.create({
      data: {
        name: "Usuário Teste 2",
        email: "teste2@galeria.com",
        password: hashedPassword,
      },
      select: {
        id: true,
        name: true,
        email: true,
        createdAt: true,
      },
    });

    console.log("✅ Usuário de teste criado:", testUser);

    res.json({
      success: true,
      message: "Usuário de teste criado com sucesso",
      user: testUser,
      credentials: {
        email: "teste2@galeria.com",
        password: "123456",
      },
    });
  } catch (error) {
    console.error("❌ Erro ao criar usuário de teste:", error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : String(error),
      timestamp: new Date().toISOString(),
    });
  }
});

// Endpoint para criar uma conta real para você (sem autenticação)
router.post("/create-real-user", async (req, res) => {
  try {
    console.log("👤 Criando conta real para o usuário...");

    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({
        success: false,
        message: "Nome, email e senha são obrigatórios",
      });
    }

    // Verificar se já existe um usuário com este email
    const existingUser = await prisma.user.findFirst({
      where: { email: email },
    });

    if (existingUser) {
      console.log("⚠️ Usuário já existe:", existingUser);
      return res.json({
        success: true,
        message: "Usuário já existe",
        user: {
          id: existingUser.id,
          name: existingUser.name,
          email: existingUser.email,
        },
        credentials: {
          email: email,
          password: "*** (já cadastrada)",
        },
      });
    }

    // Importar bcrypt para hash da senha
    const bcrypt = require("bcryptjs");
    const hashedPassword = await bcrypt.hash(password, 10);

    console.log("🔐 Senha hash criada para usuário real");

    // Criar usuário real
    const realUser = await prisma.user.create({
      data: {
        name: name,
        email: email,
        password: hashedPassword,
      },
      select: {
        id: true,
        name: true,
        email: true,
        createdAt: true,
      },
    });

    console.log("✅ Usuário real criado:", realUser);

    res.json({
      success: true,
      message: "Conta criada com sucesso!",
      user: realUser,
      credentials: {
        email: email,
        password: password,
      },
    });
  } catch (error) {
    console.error("❌ Erro ao criar usuário real:", error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : String(error),
      timestamp: new Date().toISOString(),
    });
  }
});

// Todas as rotas de favoritos requerem autenticação
router.use(authenticateToken);

// Adicionar aos favoritos
router.post("/", favoriteController.addFavorite);

// Listar favoritos do usuário
router.get("/", favoriteController.getUserFavorites);

// Remover dos favoritos
router.delete("/:favoriteId", favoriteController.removeFavorite);

export default router;

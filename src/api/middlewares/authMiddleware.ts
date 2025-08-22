import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import prisma from "../../config/prismaClient";
import { JWTPayload } from "../../@types/auth";

export const authenticateToken = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    console.log("🔐 authenticateToken - Headers:", req.headers);
    console.log(
      "🔐 authenticateToken - Authorization header:",
      req.headers.authorization
    );

    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.split(" ")[1]; // Bearer TOKEN

    console.log(
      "🔐 authenticateToken - Token extraído:",
      token ? `${token.substring(0, 10)}...` : "null"
    );

    if (!token) {
      console.log("❌ authenticateToken - Token não fornecido");
      return res.status(401).json({ message: "Token de acesso requerido" });
    }

    console.log("🔐 authenticateToken - Verificando token...");

    // Verificar o token
    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET || "default_secret"
    ) as JWTPayload;

    console.log("🔐 authenticateToken - Token decodificado:", decoded);

    console.log("🔐 authenticateToken - Buscando usuário no banco...");

    // Buscar o usuário no banco
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: {
        id: true,
        name: true,
        email: true,
        createdAt: true,
      },
    });

    console.log("🔐 authenticateToken - Usuário encontrado:", user);

    if (!user) {
      console.log("❌ authenticateToken - Usuário não encontrado no banco");
      return res.status(404).json({ message: "Usuário não encontrado" });
    }

    // Adicionar dados do usuário à requisição
    req.user = {
      ...user,
      password: "", // Adiciona o campo password vazio para satisfazer o tipo esperado
    };
    next();
  } catch (error) {
    if (error instanceof jwt.JsonWebTokenError) {
      return res.status(403).json({ message: "Token inválido" });
    }
    if (error instanceof jwt.TokenExpiredError) {
      return res.status(403).json({ message: "Token expirado" });
    }

    console.error("Erro na autenticação:", error);
    return res.status(500).json({ message: "Erro interno do servidor" });
  }
};

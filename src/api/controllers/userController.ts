import { Request, Response } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import prisma from "../../config/prismaClient";
import { Prisma } from "@prisma/client";
import {
  RegisterUserRequest,
  LoginUserRequest,
  UserResponse,
} from "../../@types/user";

const SALT_ROUNDS = 10;

export const register = async (
  req: Request<{}, {}, RegisterUserRequest>,
  res: Response
) => {
  try {
    const { name, email, password } = req.body;

    // Hash da senha
    const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);

    // Criar usuário
    const user = await prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
      },
      select: {
        id: true,
        name: true,
        email: true,
        createdAt: true,
      },
    });

    // Gerar token JWT para o usuário recém-criado
    const token = jwt.sign(
      { userId: user.id },
      process.env.JWT_SECRET || "default_secret",
      { expiresIn: "24h" }
    );

    // Retornar usuário e token
    return res.status(201).json({
      user,
      token,
    });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (
        error.code === "P2002" &&
        Array.isArray(error.meta?.target) &&
        error.meta.target.includes("email")
      ) {
        return res.status(409).json({ message: "Email já cadastrado" });
      }
    }
    console.error("Erro ao registrar usuário:", error);
    return res.status(500).json({ message: "Erro interno do servidor" });
  }
};

export const login = async (
  req: Request<{}, {}, LoginUserRequest>,
  res: Response
) => {
  try {
    const { email, password } = req.body;

    // Buscar usuário
    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      return res.status(404).json({ message: "Usuário não encontrado" });
    }

    // Verificar senha
    const isValidPassword = await bcrypt.compare(password, user.password);
    if (!isValidPassword) {
      return res.status(401).json({ message: "Senha inválida" });
    }

    // Gerar token JWT
    const token = jwt.sign(
      { userId: user.id },
      process.env.JWT_SECRET || "default_secret",
      { expiresIn: "24h" }
    );

    // Remover senha do objeto de resposta
    const userResponse: UserResponse = {
      id: user.id,
      name: user.name,
      email: user.email,
      createdAt: user.createdAt,
    };

    return res.status(200).json({
      token,
      user: userResponse,
    });
  } catch (error) {
    console.error("Erro ao fazer login:", error);
    return res.status(500).json({ message: "Erro interno do servidor" });
  }
};

export const getProfile = async (req: Request, res: Response) => {
  try {
    // O usuário já está disponível através do middleware de autenticação
    const user = req.user;

    if (!user) {
      return res.status(401).json({ message: "Usuário não autenticado" });
    }

    return res.status(200).json(user);
  } catch (error) {
    console.error("Erro ao obter perfil:", error);
    return res.status(500).json({ message: "Erro interno do servidor" });
  }
};

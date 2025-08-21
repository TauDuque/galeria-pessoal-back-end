import { Request, Response } from "express";
import prisma from "../../config/prismaClient";
import { getArtworkDetails } from "../../services/metApiService";
import "../../@types/auth";

export const addFavorite = async (req: Request, res: Response) => {
  try {
    const { metId } = req.body;
    const userId = req.user?.id;

    if (!metId) {
      return res.status(400).json({ message: "ID da obra é obrigatório" });
    }

    if (!userId) {
      return res.status(401).json({ message: "Usuário não autenticado" });
    }

    // Verificar se o usuário já favoritou esta obra
    const existingFavorite = await prisma.favorite.findFirst({
      where: {
        metId: Number(metId),
        userId: userId,
      },
    });

    if (existingFavorite) {
      return res
        .status(409)
        .json({ message: "Obra já está nos seus favoritos" });
    }

    // Buscar detalhes da obra na API do Met
    const artworkDetails = await getArtworkDetails(Number(metId));

    // Salvar nos favoritos
    const favorite = await prisma.favorite.create({
      data: {
        metId: Number(metId),
        userId: userId,
      },
    });

    return res.status(201).json({
      id: favorite.id,
      userId: favorite.userId,
      artworkId: favorite.metId,
      createdAt: favorite.createdAt,
      artwork: artworkDetails,
    });
  } catch (error) {
    console.error("Erro ao adicionar favorito:", error);
    return res.status(500).json({ message: "Erro interno do servidor" });
  }
};

export const getUserFavorites = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({ message: "Usuário não autenticado" });
    }

    const favorites = await prisma.favorite.findMany({
      where: { userId: userId },
      orderBy: { createdAt: "desc" },
    });

    // Buscar detalhes de todas as obras favoritadas
    const favoritesWithDetails = await Promise.all(
      favorites.map(async (favorite: any) => {
        try {
          const artworkDetails = await getArtworkDetails(favorite.metId);
          return {
            id: favorite.id,
            artworkId: favorite.metId,
            createdAt: favorite.createdAt,
            artwork: artworkDetails,
          };
        } catch (error) {
          console.error(
            `Erro ao buscar detalhes da obra ${favorite.metId}:`,
            error
          );
          return {
            id: favorite.id,
            artworkId: favorite.metId,
            createdAt: favorite.createdAt,
            artwork: null,
          };
        }
      })
    );

    return res.status(200).json({
      items: favoritesWithDetails,
      total: favoritesWithDetails.length,
    });
  } catch (error) {
    console.error("Erro ao buscar favoritos do usuário:", error);
    return res.status(500).json({ message: "Erro interno do servidor" });
  }
};

export const removeFavorite = async (req: Request, res: Response) => {
  try {
    const { favoriteId } = req.params;
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({ message: "Usuário não autenticado" });
    }

    // Verificar se o favorito pertence ao usuário
    const favorite = await prisma.favorite.findFirst({
      where: {
        id: Number(favoriteId),
        userId: userId,
      },
    });

    if (!favorite) {
      return res.status(404).json({
        message: "Favorito não encontrado ou não pertence ao usuário",
      });
    }

    // Deletar o favorito
    await prisma.favorite.delete({
      where: { id: Number(favoriteId) },
    });

    return res.status(200).json({ message: "Favorito removido com sucesso" });
  } catch (error) {
    console.error("Erro ao remover favorito:", error);
    return res.status(500).json({ message: "Erro interno do servidor" });
  }
};

import { Request, Response } from "express";
import prisma from "../../config/prismaClient";
import {
  searchArtworks,
  getArtworkDetails,
} from "../../services/metApiService";

export const searchArt = async (req: Request, res: Response) => {
  try {
    const { query, limit = 20 } = req.query;

    if (!query || typeof query !== "string") {
      return res.status(400).json({ message: "Query de busca é obrigatória" });
    }

    const limitNum = Math.min(Number(limit), 50); // Máximo de 50 obras
    const artworkIds = await searchArtworks(query, limitNum);

    if (artworkIds.length === 0) {
      return res.status(200).json({ artworks: [], total: 0 });
    }

    // Buscar detalhes das obras encontradas
    const artworks = await Promise.all(
      artworkIds.map((id) => getArtworkDetails(id))
    );

    return res.status(200).json({
      artworks,
      total: artworks.length,
      query,
    });
  } catch (error) {
    console.error("Erro ao buscar obras:", error);
    return res.status(500).json({ message: "Erro interno do servidor" });
  }
};

export const saveArtwork = async (req: Request, res: Response) => {
  try {
    const { metId } = req.body;
    const userId = req.user?.id;

    if (!metId) {
      return res.status(400).json({ message: "ID da obra é obrigatório" });
    }

    if (!userId) {
      return res.status(401).json({ message: "Usuário não autenticado" });
    }

    // Verificar se o usuário já salvou esta obra
    const existingArtwork = await prisma.artwork.findFirst({
      where: {
        metId: Number(metId),
        userId: userId,
      },
    });

    if (existingArtwork) {
      return res
        .status(409)
        .json({ message: "Obra já está salva na sua coleção" });
    }

    // Buscar detalhes da obra na API do Met
    const artworkDetails = await getArtworkDetails(Number(metId));

    // Salvar no banco de dados
    const savedArtwork = await prisma.artwork.create({
      data: {
        metId: Number(metId),
        title: artworkDetails.title,
        artist: artworkDetails.artist,
        department: artworkDetails.department,
        culture: artworkDetails.culture,
        period: artworkDetails.period,
        imageUrl: artworkDetails.imageUrl,
        metUrl: artworkDetails.metUrl,
        userId: userId,
      },
    });

    return res.status(201).json(savedArtwork);
  } catch (error) {
    console.error("Erro ao salvar obra:", error);
    return res.status(500).json({ message: "Erro interno do servidor" });
  }
};

export const getUserArtworks = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({ message: "Usuário não autenticado" });
    }

    const artworks = await prisma.artwork.findMany({
      where: { userId: userId },
      orderBy: { createdAt: "desc" },
    });

    return res.status(200).json({
      artworks,
      total: artworks.length,
    });
  } catch (error) {
    console.error("Erro ao buscar obras do usuário:", error);
    return res.status(500).json({ message: "Erro interno do servidor" });
  }
};

export const removeArtwork = async (req: Request, res: Response) => {
  try {
    const { artworkId } = req.params;
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({ message: "Usuário não autenticado" });
    }

    // Verificar se a obra pertence ao usuário
    const artwork = await prisma.artwork.findFirst({
      where: {
        id: Number(artworkId),
        userId: userId,
      },
    });

    if (!artwork) {
      return res
        .status(404)
        .json({ message: "Obra não encontrada ou não pertence ao usuário" });
    }

    // Deletar a obra
    await prisma.artwork.delete({
      where: { id: Number(artworkId) },
    });

    return res.status(200).json({ message: "Obra removida com sucesso" });
  } catch (error) {
    console.error("Erro ao remover obra:", error);
    return res.status(500).json({ message: "Erro interno do servidor" });
  }
};

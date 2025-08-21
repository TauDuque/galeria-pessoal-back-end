import { Request, Response } from "express";
import prisma from "../../config/prismaClient";
import {
  searchArtworks,
  getArtworkDetails,
  getRandomArtworks,
} from "../../services/metApiService";

// Importar os tipos de erro personalizados
import {
  ArtworkNotFoundError,
  MetApiError,
} from "../../services/metApiService";

// Parâmetros válidos para busca na API do Met
const VALID_SEARCH_PARAMS = ["title", "artist"];

export const searchArt = async (req: Request, res: Response) => {
  // Declarar variáveis no escopo da função para usar no catch
  let validSearchParams: string[] = [];
  let searchQuery: string = "";
  let limitNum: number = 20;

  try {
    const { limit = 20, ...searchParams } = req.query;

    // Verificar se há pelo menos um parâmetro de busca válido
    validSearchParams = Object.keys(searchParams).filter((param) =>
      VALID_SEARCH_PARAMS.includes(param)
    );

    if (validSearchParams.length === 0) {
      return res.status(400).json({
        message:
          "É necessário fornecer pelo menos um parâmetro de busca válido",
        validParams: VALID_SEARCH_PARAMS,
      });
    }

    // Construir a query de busca combinando todos os parâmetros válidos
    searchQuery = validSearchParams
      .map((param) => {
        const value = searchParams[param];
        if (typeof value === "string" && value.trim()) {
          // Normalizar para lowercase para evitar problemas de case sensitivity
          const normalizedValue = value.trim().toLowerCase();
          return `${param}:${normalizedValue}`;
        }
        return null;
      })
      .filter(Boolean)
      .join(" AND ");

    if (!searchQuery) {
      return res.status(400).json({
        message: "Todos os parâmetros de busca devem ter valores válidos",
      });
    }

    limitNum = Math.min(Number(limit), 50); // Máximo de 50 obras

    console.log(`Buscando obras com query: ${searchQuery}`);

    const artworkIds = await searchArtworks(searchQuery, limitNum);

    if (artworkIds.length === 0) {
      return res.status(200).json({
        artworks: [],
        total: 0,
        searchQuery,
        appliedFilters: Object.fromEntries(
          validSearchParams.map((param) => [param, searchParams[param]])
        ),
        normalizedValues: Object.fromEntries(
          validSearchParams.map((param) => [
            param,
            searchParams[param]?.toString().toLowerCase(),
          ])
        ),
      });
    }

    // Buscar detalhes das obras encontradas
    const artworks = await Promise.all(
      artworkIds.map((id) => getArtworkDetails(id))
    );

    return res.status(200).json({
      artworks,
      total: artworks.length,
      searchQuery,
      appliedFilters: Object.fromEntries(
        validSearchParams.map((param) => [param, searchParams[param]])
      ),
      normalizedValues: Object.fromEntries(
        validSearchParams.map((param) => [
          param,
          searchParams[param]?.toString().toLowerCase(),
        ])
      ),
      limit: limitNum,
    });
  } catch (error) {
    console.error("Erro ao buscar obras:", error);

    // Tratar diferentes tipos de erro
    if (error instanceof ArtworkNotFoundError) {
      // Obra não encontrada - retornar 200 com mensagem amigável
      return res.status(200).json({
        artworks: [],
        total: 0,
        message: error.message,
        searchQuery: searchQuery || "N/A",
        appliedFilters: validSearchParams
          ? Object.fromEntries(
              validSearchParams.map((param) => [param, req.query[param]])
            )
          : {},
        normalizedValues: validSearchParams
          ? Object.fromEntries(
              validSearchParams.map((param) => [
                param,
                req.query[param]?.toString().toLowerCase(),
              ])
            )
          : {},
      });
    }

    if (error instanceof MetApiError) {
      // Erro real da API do Met - retornar 500
      return res.status(500).json({
        message: "Erro na API do Metropolitan Museum of Art",
        details: error.message,
      });
    }

    // Erro interno do servidor - retornar 500
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

export const getArtworkById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    if (!id) {
      return res.status(400).json({ message: "ID da obra é obrigatório" });
    }

    // Buscar detalhes da obra na API do Met
    const artworkDetails = await getArtworkDetails(Number(id));

    return res.status(200).json(artworkDetails);
  } catch (error) {
    console.error("Erro ao buscar obra por ID:", error);
    return res.status(500).json({ message: "Erro interno do servidor" });
  }
};

export const getClassicArtworks = async (req: Request, res: Response) => {
  try {
    // IDs de obras clássicas pré-selecionadas
    const classicArtworkIds = [
      436535, // Starry Night - Van Gogh
      436548, // Sunflowers - Van Gogh
      436105, // Self-Portrait - Van Gogh
      436121, // Wheat Field with Cypresses - Van Gogh
      436533, // Irises - Van Gogh
      436536, // The Bedroom - Van Gogh
      436537, // Portrait of Madame Ginoux - Van Gogh
      436538, // Portrait of Joseph Roulin - Van Gogh
      436539, // Portrait of Dr. Gachet - Van Gogh
      436540, // Portrait of Adeline Ravoux - Van Gogh
      436541, // Portrait of Camille Roulin - Van Gogh
      436542, // Portrait of Augustine Roulin - Van Gogh
    ];

    // Buscar detalhes de todas as obras clássicas
    const classicArtworks = await Promise.all(
      classicArtworkIds.map(async (id) => {
        try {
          return await getArtworkDetails(id);
        } catch (error) {
          console.error(`Erro ao buscar obra clássica ${id}:`, error);
          return null;
        }
      })
    );

    // Filtrar obras que foram encontradas com sucesso
    const validArtworks = classicArtworks.filter((artwork) => artwork !== null);

    return res.status(200).json(validArtworks);
  } catch (error) {
    console.error("Erro ao buscar obras clássicas:", error);
    return res.status(500).json({ message: "Erro interno do servidor" });
  }
};

export const getAllArtworks = async (req: Request, res: Response) => {
  try {
    const { page = 1, limit = 12 } = req.query;
    const pageNum = Math.max(1, Number(page));
    const limitNum = Math.min(50, Math.max(1, Number(limit)));
    const offset = (pageNum - 1) * limitNum;

    // Buscar obras aleatórias da API do Met
    const randomArtworks = await getRandomArtworks(limitNum);

    return res.status(200).json({
      artworks: randomArtworks,
      total: randomArtworks.length,
      page: pageNum,
      hasMore: randomArtworks.length === limitNum,
    });
  } catch (error) {
    console.error("Erro ao buscar obras:", error);
    return res.status(500).json({ message: "Erro interno do servidor" });
  }
};

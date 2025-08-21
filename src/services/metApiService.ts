interface MetSearchResponse {
  total: number;
  objectIDs: number[];
}

interface MetArtworkResponse {
  objectID: number;
  title: string;
  artistDisplayName?: string;
  department?: string;
  culture?: string;
  period?: string;
  primaryImage?: string;
  objectURL?: string;
}

interface ArtworkDetails {
  title: string;
  artist?: string;
  department?: string;
  culture?: string;
  period?: string;
  imageUrl?: string;
  metUrl?: string;
}

// Tipos personalizados para tratamento de erros
export class ArtworkNotFoundError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ArtworkNotFoundError";
  }
}

export class MetApiError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "MetApiError";
  }
}

const MET_API_BASE = "https://collectionapi.metmuseum.org/public/collection/v1";

export const searchArtworks = async (
  query: string,
  limit: number = 20
): Promise<number[]> => {
  try {
    // Construir a URL de busca com todos os parâmetros
    const searchUrl = new URL(`${MET_API_BASE}/search`);

    // Se a query contém filtros específicos (ex: "artist:Van Gogh"), usar como parâmetro 'q'
    if (query.includes(":")) {
      searchUrl.searchParams.set("q", query);
    } else {
      // Query simples, usar como parâmetro 'q'
      searchUrl.searchParams.set("q", query);
    }

    console.log(`Fazendo busca na API do Met: ${searchUrl.toString()}`);

    const response = await fetch(searchUrl.toString());

    if (!response.ok) {
      // Se a API retornar erro HTTP, é um problema real da API
      throw new MetApiError(
        `Erro na API do Met: ${response.status} - ${response.statusText}`
      );
    }

    const data = (await response.json()) as MetSearchResponse;

    if (!data.objectIDs || data.objectIDs.length === 0) {
      console.log(`Nenhuma obra encontrada para a query: ${query}`);
      // Não é um erro, apenas não encontrou resultados
      throw new ArtworkNotFoundError(`Nenhuma obra encontrada para: ${query}`);
    }

    console.log(
      `Encontradas ${data.objectIDs.length} obras para a query: ${query}`
    );

    return data.objectIDs.slice(0, limit);
  } catch (error) {
    // Se já é um erro personalizado, apenas repassar
    if (error instanceof ArtworkNotFoundError || error instanceof MetApiError) {
      throw error;
    }

    // Se for outro tipo de erro (rede, JSON, etc.), é um erro real
    console.error("Erro ao buscar obras:", error);
    throw new MetApiError("Falha na comunicação com a API do Met");
  }
};

export const getArtworkDetails = async (
  metId: number
): Promise<ArtworkDetails> => {
  try {
    const response = await fetch(`${MET_API_BASE}/objects/${metId}`);

    if (!response.ok) {
      // Se a API retornar erro HTTP, é um problema real da API
      throw new MetApiError(
        `Erro na API do Met: ${response.status} - ${response.statusText}`
      );
    }

    const data = (await response.json()) as MetArtworkResponse;

    return {
      title: data.title || "Título não disponível",
      artist: data.artistDisplayName,
      department: data.department,
      culture: data.culture,
      period: data.period,
      imageUrl: data.primaryImage,
      metUrl: data.objectURL,
    };
  } catch (error) {
    // Se já é um erro personalizado, apenas repassar
    if (error instanceof MetApiError) {
      throw error;
    }

    // Se for outro tipo de erro (rede, JSON, etc.), é um erro real
    console.error(`Erro ao buscar detalhes da obra ${metId}:`, error);
    throw new MetApiError("Falha na comunicação com a API do Met");
  }
};

export const getRandomArtworks = async (
  count: number = 10
): Promise<ArtworkDetails[]> => {
  try {
    const searchTerms = [
      "painting",
      "sculpture",
      "drawing",
      "print",
      "photograph",
    ];
    const randomTerm =
      searchTerms[Math.floor(Math.random() * searchTerms.length)];

    const artworkIds = await searchArtworks(randomTerm, count * 2); // Buscar mais IDs para ter opções

    if (artworkIds.length === 0) {
      return [];
    }

    // Selecionar IDs aleatórios
    const shuffled = artworkIds.sort(() => 0.5 - Math.random());
    const selectedIds = shuffled.slice(0, count);

    // Buscar detalhes das obras selecionadas
    const artworks = await Promise.all(
      selectedIds.map((id) => getArtworkDetails(id))
    );

    return artworks.filter(
      (artwork) => artwork.title !== "Título não disponível"
    );
  } catch (error) {
    console.error("Erro ao buscar obras aleatórias:", error);
    throw new Error("Falha ao buscar obras aleatórias");
  }
};

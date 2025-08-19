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

const MET_API_BASE = "https://collectionapi.metmuseum.org/public/collection/v1";

export const searchArtworks = async (
  query: string,
  limit: number = 20
): Promise<number[]> => {
  try {
    const response = await fetch(
      `${MET_API_BASE}/search?q=${encodeURIComponent(query)}`
    );

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = (await response.json()) as MetSearchResponse;
    return data.objectIDs?.slice(0, limit) || [];
  } catch (error) {
    console.error("Erro ao buscar obras:", error);
    throw new Error("Falha ao buscar obras de arte");
  }
};

export const getArtworkDetails = async (
  metId: number
): Promise<ArtworkDetails> => {
  try {
    const response = await fetch(`${MET_API_BASE}/objects/${metId}`);

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
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
    console.error(`Erro ao buscar detalhes da obra ${metId}:`, error);
    throw new Error("Falha ao buscar detalhes da obra de arte");
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

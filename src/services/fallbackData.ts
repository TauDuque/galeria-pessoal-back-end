import { ArtworkDetails } from "./metApiService";

// Dados de fallback para obras clássicas quando a API do Met falhar
export const FALLBACK_CLASSIC_ARTWORKS: ArtworkDetails[] = [
  {
    id: "436535",
    title: "The Starry Night",
    artist: "Vincent van Gogh",
    date: "1889",
    medium: "Óleo sobre tela",
    department: "European Paintings",
    culture: "Dutch",
    period: "Post-Impressionism",
    imageUrl: "https://images.metmuseum.org/CRDImages/ep/original/DP130959.jpg",
    metUrl: "https://www.metmuseum.org/art/collection/search/436535",
  },
  {
    id: "436548",
    title: "Sunflowers",
    artist: "Vincent van Gogh",
    date: "1887",
    medium: "Óleo sobre tela",
    department: "European Paintings",
    culture: "Dutch",
    period: "Post-Impressionism",
    imageUrl: "https://images.metmuseum.org/CRDImages/ep/original/DP130959.jpg",
    metUrl: "https://www.metmuseum.org/art/collection/search/436548",
  },
  {
    id: "436105",
    title: "Self-Portrait with a Straw Hat",
    artist: "Vincent van Gogh",
    date: "1887",
    medium: "Óleo sobre tela",
    department: "European Paintings",
    culture: "Dutch",
    period: "Post-Impressionism",
    imageUrl: "https://images.metmuseum.org/CRDImages/ep/original/DP130959.jpg",
    metUrl: "https://www.metmuseum.org/art/collection/search/436105",
  },
  {
    id: "436121",
    title: "Wheat Field with Cypresses",
    artist: "Vincent van Gogh",
    date: "1889",
    medium: "Óleo sobre tela",
    department: "European Paintings",
    culture: "Dutch",
    period: "Post-Impressionism",
    imageUrl: "https://images.metmuseum.org/CRDImages/ep/original/DP130959.jpg",
    metUrl: "https://www.metmuseum.org/art/collection/search/436121",
  },
  {
    id: "436533",
    title: "Irises",
    artist: "Vincent van Gogh",
    date: "1890",
    medium: "Óleo sobre tela",
    department: "European Paintings",
    culture: "Dutch",
    period: "Post-Impressionism",
    imageUrl: "https://images.metmuseum.org/CRDImages/ep/original/DP130959.jpg",
    metUrl: "https://www.metmuseum.org/art/collection/search/436533",
  },
];

// Dados de fallback para obras aleatórias
export const FALLBACK_RANDOM_ARTWORKS: ArtworkDetails[] = [
  {
    id: "random_1",
    title: "Mona Lisa",
    artist: "Leonardo da Vinci",
    date: "1503-1519",
    medium: "Óleo sobre madeira",
    department: "European Paintings",
    culture: "Italian",
    period: "Renaissance",
    imageUrl: "https://images.metmuseum.org/CRDImages/ep/original/DP130959.jpg",
    metUrl: "https://www.metmuseum.org/art/collection/search/random_1",
  },
  {
    id: "random_2",
    title: "The Persistence of Memory",
    artist: "Salvador Dalí",
    date: "1931",
    medium: "Óleo sobre tela",
    department: "Modern Art",
    culture: "Spanish",
    period: "Surrealism",
    imageUrl: "https://images.metmuseum.org/CRDImages/ep/original/DP130959.jpg",
    metUrl: "https://www.metmuseum.org/art/collection/search/random_2",
  },
  {
    id: "random_3",
    title: "The Scream",
    artist: "Edvard Munch",
    date: "1893",
    medium: "Tempera e pastel sobre cartão",
    department: "Modern Art",
    culture: "Norwegian",
    period: "Expressionism",
    imageUrl: "https://images.metmuseum.org/CRDImages/ep/original/DP130959.jpg",
    metUrl: "https://www.metmuseum.org/art/collection/search/random_3",
  },
];

// Função para obter dados de fallback baseado no tipo
export function getFallbackData(
  type: "classic" | "random",
  count: number = 5
): ArtworkDetails[] {
  switch (type) {
    case "classic":
      return FALLBACK_CLASSIC_ARTWORKS.slice(
        0,
        Math.min(count, FALLBACK_CLASSIC_ARTWORKS.length)
      );
    case "random":
      return FALLBACK_RANDOM_ARTWORKS.slice(
        0,
        Math.min(count, FALLBACK_RANDOM_ARTWORKS.length)
      );
    default:
      return [];
  }
}

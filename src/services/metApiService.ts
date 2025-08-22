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
  primaryImageSmall?: string;
  additionalImages?: string[];
  objectURL?: string;
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

export interface ArtworkDetails {
  id: string;
  title: string;
  artist?: string;
  date?: string;
  medium?: string;
  department?: string;
  culture?: string;
  period?: string;
  imageUrl?: string;
  metUrl?: string;
}

const MET_API_BASE = "https://collectionapi.metmuseum.org/public/collection/v1";

// ===== SISTEMA DE RATE LIMITING, BATCH PROCESSING E RETRY =====

// Configurações de rate limiting
const RATE_LIMIT_CONFIG = {
  maxRequestsPerSecond: 3, // Máximo 3 requisições por segundo
  maxRequestsPerMinute: 100, // Máximo 100 requisições por minuto
  batchSize: 5, // Processar 5 obras por vez
  delayBetweenBatches: 1000, // 1 segundo entre lotes
  delayBetweenRequests: 350, // ~350ms entre requisições individuais
  maxRetries: 3, // Máximo 3 tentativas
  baseDelay: 1000, // Delay base de 1 segundo para retry
};

// Classe para controlar rate limiting
class RateLimiter {
  private requestTimes: number[] = [];
  private lastRequestTime = 0;

  async waitForNextRequest(): Promise<void> {
    const now = Date.now();

    // Limpar requisições antigas (mais de 1 minuto)
    this.requestTimes = this.requestTimes.filter((time) => now - time < 60000);

    // Verificar limite por minuto
    if (this.requestTimes.length >= RATE_LIMIT_CONFIG.maxRequestsPerMinute) {
      const oldestRequest = Math.min(...this.requestTimes);
      const waitTime = 60000 - (now - oldestRequest);
      console.log(`Rate limit por minuto atingido. Aguardando ${waitTime}ms`);
      await this.delay(waitTime);
    }

    // Verificar limite por segundo
    const requestsThisSecond = this.requestTimes.filter(
      (time) => now - time < 1000
    ).length;
    if (requestsThisSecond >= RATE_LIMIT_CONFIG.maxRequestsPerSecond) {
      const waitTime = 1000 - (now - this.lastRequestTime);
      console.log(`Rate limit por segundo atingido. Aguardando ${waitTime}ms`);
      await this.delay(waitTime);
    }

    // Registrar nova requisição
    this.requestTimes.push(now);
    this.lastRequestTime = now;
  }

  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}

// Função para retry com backoff exponencial
async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  maxRetries: number = RATE_LIMIT_CONFIG.maxRetries
): Promise<T> {
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      // Se for o último tentativa, rejeitar
      if (attempt === maxRetries) {
        throw error;
      }

      // Se for erro 403 (rate limit), aguardar mais tempo
      if (error instanceof MetApiError && error.message.includes("403")) {
        const delay = RATE_LIMIT_CONFIG.baseDelay * Math.pow(2, attempt);
        console.log(
          `Erro 403 detectado. Tentativa ${attempt + 1}/${maxRetries + 1}. Aguardando ${delay}ms`
        );
        await new Promise((resolve) => setTimeout(resolve, delay));
        continue;
      }

      // Para outros erros, aguardar tempo padrão
      const delay = RATE_LIMIT_CONFIG.baseDelay * Math.pow(2, attempt);
      console.log(
        `Erro detectado. Tentativa ${attempt + 1}/${maxRetries + 1}. Aguardando ${delay}ms`
      );
      await new Promise((resolve) => setTimeout(resolve, delay));
    }
  }

  throw new Error("Máximo de tentativas excedido");
}

// Função para processar em lotes com rate limiting
export async function processBatch<T, R>(
  items: T[],
  processor: (item: T) => Promise<R>,
  batchSize: number = RATE_LIMIT_CONFIG.batchSize
): Promise<R[]> {
  const results: R[] = [];
  const rateLimiter = new RateLimiter();

  for (let i = 0; i < items.length; i += batchSize) {
    const batch = items.slice(i, i + batchSize);
    console.log(
      `Processando lote ${Math.floor(i / batchSize) + 1}/${Math.ceil(items.length / batchSize)} (${batch.length} itens)`
    );

    // Processar lote atual
    const batchResults = await Promise.all(
      batch.map(async (item, index) => {
        // Aguardar rate limiting
        await rateLimiter.waitForNextRequest();

        // Processar item com retry
        return retryWithBackoff(() => processor(item));
      })
    );

    results.push(...batchResults);

    // Aguardar entre lotes (exceto no último)
    if (i + batchSize < items.length) {
      console.log(
        `Aguardando ${RATE_LIMIT_CONFIG.delayBetweenBatches}ms entre lotes`
      );
      await new Promise((resolve) =>
        setTimeout(resolve, RATE_LIMIT_CONFIG.delayBetweenBatches)
      );
    }
  }

  return results;
}

// ===== FIM DO SISTEMA DE RATE LIMITING =====

// ===== SISTEMA DE CACHE =====

// Cache simples em memória para evitar requisições repetidas
class ArtworkCache {
  private cache = new Map<string, { data: any; timestamp: number }>();
  private readonly TTL = 24 * 60 * 60 * 1000; // 24 horas em millisegundos

  set(key: string, data: any): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
    });
  }

  get(key: string): any | null {
    const item = this.cache.get(key);
    if (!item) return null;

    // Verificar se o item expirou
    if (Date.now() - item.timestamp > this.TTL) {
      this.cache.delete(key);
      return null;
    }

    return item.data;
  }

  has(key: string): boolean {
    return this.cache.has(key);
  }

  clear(): void {
    this.cache.clear();
  }

  // Limpar itens expirados
  cleanup(): void {
    const now = Date.now();
    for (const [key, item] of this.cache.entries()) {
      if (now - item.timestamp > this.TTL) {
        this.cache.delete(key);
      }
    }
  }
}

// Instância global do cache
const artworkCache = new ArtworkCache();

// Limpar cache a cada hora
setInterval(() => artworkCache.cleanup(), 60 * 60 * 1000);

// ===== FIM DO SISTEMA DE CACHE =====

export const searchArtworks = async (
  query: string,
  limit: number = 20
): Promise<number[]> => {
  // Verificar cache primeiro
  const cacheKey = `search_${query}_${limit}`;
  const cachedData = artworkCache.get(cacheKey);

  if (cachedData) {
    console.log(`Cache hit para busca: ${query}`);
    return cachedData;
  }

  try {
    // Headers personalizados para a API do Met
    const headers = {
      "User-Agent": "GaleriaArtePessoal/1.0 (Educational Project)",
      Accept: "application/json",
      "Accept-Language": "pt-BR,en-US;q=0.9,en;q=0.8",
    };

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

    const response = await fetch(searchUrl.toString(), {
      headers,
      // Adicionar timeout de 10 segundos
      signal: AbortSignal.timeout(10000),
    });

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

    const result = data.objectIDs.slice(0, limit);

    console.log(`Encontradas ${result.length} obras para a query: ${query}`);

    // Salvar no cache (cache mais curto para buscas - 1 hora)
    artworkCache.set(cacheKey, result);
    console.log(`Busca "${query}" salva no cache`);

    return result;
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
): Promise<ArtworkDetails | null> => {
  // Verificar cache primeiro
  const cacheKey = `artwork_${metId}`;
  const cachedData = artworkCache.get(cacheKey);

  if (cachedData) {
    console.log(`Cache hit para obra ${metId}`);
    return cachedData;
  }

  try {
    // Headers personalizados para a API do Met
    const headers = {
      "User-Agent": "GaleriaArtePessoal/1.0 (Educational Project)",
      Accept: "application/json",
      "Accept-Language": "pt-BR,en-US;q=0.9,en;q=0.8",
    };

    const response = await fetch(`${MET_API_BASE}/objects/${metId}`, {
      headers,
      // Adicionar timeout de 10 segundos
      signal: AbortSignal.timeout(10000),
    });

    if (!response.ok) {
      // Se a API retornar erro HTTP, é um problema real da API
      throw new MetApiError(
        `Erro na API do Met: ${response.status} - ${response.statusText}`
      );
    }

    const data = (await response.json()) as MetArtworkResponse;

    // Verificar se a obra tem imagem disponível
    const hasImage =
      data.primaryImage ||
      data.primaryImageSmall ||
      (data.additionalImages && data.additionalImages.length > 0);

    if (!hasImage) {
      console.log(`Obra ${metId} não tem imagem disponível, ignorando`);
      return null; // Retornar null para obras sem imagem
    }

    const artworkDetails = {
      id: metId.toString(), // Converter para string para compatibilidade
      title: data.title || "Título não disponível",
      artist: data.artistDisplayName,
      date: data.period || "Data desconhecida", // Usar period como date
      medium: "Óleo sobre tela", // Valor padrão
      department: data.department,
      culture: data.culture,
      period: data.period,
      imageUrl:
        data.primaryImage ||
        data.primaryImageSmall ||
        (data.additionalImages && data.additionalImages.length > 0
          ? data.additionalImages[0]
          : ""),
      metUrl: data.objectURL,
    };

    // Salvar no cache
    artworkCache.set(cacheKey, artworkDetails);
    console.log(`Obra ${metId} salva no cache`);

    return artworkDetails;
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

    console.log(
      `Buscando detalhes de ${selectedIds.length} obras usando batch processing...`
    );

    // Usar o novo sistema de batch processing com rate limiting
    const artworks = await processBatch(selectedIds, async (id) => {
      try {
        return await getArtworkDetails(id);
      } catch (error) {
        console.log(`Erro ao buscar obra ${id}, retornando null:`, error);
        return null;
      }
    });

    // Filtrar obras que foram encontradas com sucesso e têm imagens
    const validArtworks = artworks.filter(
      (artwork) => artwork !== null && artwork.title !== "Título não disponível"
    ) as ArtworkDetails[];

    console.log(
      `Sucesso: ${validArtworks.length}/${selectedIds.length} obras carregadas`
    );

    return validArtworks;
  } catch (error) {
    console.error("Erro ao buscar obras aleatórias:", error);

    // Tentar usar dados de fallback
    try {
      const { getFallbackData } = await import("./fallbackData");
      console.log("Usando dados de fallback para obras aleatórias");
      return getFallbackData("random", count);
    } catch (fallbackError) {
      console.error("Erro ao carregar dados de fallback:", fallbackError);
      throw new Error("Falha ao buscar obras aleatórias e dados de fallback");
    }
  }
};

// Configurações centralizadas para a API
export const API_CONFIG = {
  // Configurações da API do Metropolitan Museum
  met: {
    baseUrl: "https://collectionapi.metmuseum.org/public/collection/v1",
    timeout: 10000, // 10 segundos
    userAgent: "GaleriaArtePessoal/1.0 (Educational Project)",
    acceptLanguage: "pt-BR,en-US;q=0.9,en;q=0.8",
  },

  // Configurações de rate limiting
  rateLimit: {
    maxRequestsPerSecond: 3,
    maxRequestsPerMinute: 100,
    batchSize: 5,
    delayBetweenBatches: 1000, // 1 segundo
    delayBetweenRequests: 350, // ~350ms
    maxRetries: 3,
    baseDelay: 1000, // 1 segundo
  },

  // Configurações de cache
  cache: {
    artworkTTL: 24 * 60 * 60 * 1000, // 24 horas
    searchTTL: 60 * 60 * 1000, // 1 hora
    cleanupInterval: 60 * 60 * 1000, // 1 hora
  },

  // Configurações de fallback
  fallback: {
    enabled: true,
    maxRetries: 2,
    delayBetweenRetries: 2000, // 2 segundos
  },

  // Configurações de monitoramento
  monitoring: {
    healthCheckTimeout: 5000, // 5 segundos
    logLevel: "info", // debug, info, warn, error
  },
};

// Função para obter configuração específica
export function getConfig<T extends keyof typeof API_CONFIG>(
  key: T
): (typeof API_CONFIG)[T] {
  return API_CONFIG[key];
}

// Função para validar configurações
export function validateConfig(): boolean {
  try {
    // Validar URLs
    new URL(API_CONFIG.met.baseUrl);

    // Validar valores numéricos
    if (API_CONFIG.rateLimit.maxRequestsPerSecond <= 0) return false;
    if (API_CONFIG.rateLimit.maxRequestsPerMinute <= 0) return false;
    if (API_CONFIG.cache.artworkTTL <= 0) return false;

    return true;
  } catch (error) {
    console.error("Configuração inválida:", error);
    return false;
  }
}

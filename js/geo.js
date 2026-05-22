import { CONFIG } from './config.js';

export function calcularDistancia(lat1, lon1, lat2, lon2) {
  const R = 6371000;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) *
      Math.cos(lat2 * Math.PI / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

let cachedPosition = null;
let lastFetchTime = 0;
const CACHE_DURATION = 5000; // 5 seconds cache

export function obterLocalizacaoAtual(options = {}) {
  const now = Date.now();
  if (cachedPosition && (now - lastFetchTime < CACHE_DURATION)) {
    return Promise.resolve(cachedPosition);
  }

  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error('Geolocalização não é suportada pelo seu navegador'));
      return;
    }

    const timeout = options.timeout || 10000;

    const success = (position) => {
      cachedPosition = {
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
        accuracy: position.coords.accuracy,
        timestamp: position.timestamp,
      };
      lastFetchTime = Date.now();
      resolve(cachedPosition);
    };

    const error = (error) => {
      let message = '';
      switch (error.code) {
        case error.PERMISSION_DENIED:
          message = 'Permissão de localização negada. Por favor, permita o acesso à sua localização.';
          break;
        case error.POSITION_UNAVAILABLE:
          message = 'Localização indisponível. Verifique se o GPS está ativado.';
          break;
        case error.TIMEOUT:
          message = 'Tempo esgotado para obter localização. Tente novamente.';
          break;
        default:
          message = 'Erro ao obter localização.';
      }
      reject(new Error(message));
    };

    navigator.geolocation.getCurrentPosition(success, error, {
      enableHighAccuracy: true,
      timeout: timeout,
      maximumAge: 0,
    });
  });
}

export function verificarSeDentroDoRaio(userLat, userLon, localLat, localLon, raio) {
  const distancia = calcularDistancia(userLat, userLon, localLat, localLon, raio);
  return {
    dentro: distancia <= raio,
    distancia: distancia,
    raio: raio,
  };
}

export async function verificarLocaisAutorizados(locais) {
  try {
    const posicao = await obterLocalizacaoAtual();
    
    const locaisDentro = [];
    const locaisFora = [];

    locais.forEach((local) => {
      const resultado = verificarSeDentroDoRaio(
        posicao.latitude,
        posicao.longitude,
        local.latitude,
        local.longitude,
        local.raio_metros || CONFIG.defaultRadius
      );

      if (resultado.dentro) {
        locaisDentro.push({
          ...local,
          distancia: resultado.distancia,
        });
      } else {
        locaisFora.push({
          ...local,
          distancia: resultado.distancia,
        });
      }
    });

    return {
      posicao,
      locaisDentro: locaisDentro.sort((a, b) => a.distancia - b.distancia),
      locaisFora: locaisFora.sort((a, b) => a.distancia - b.distancia),
    };
  } catch (error) {
    console.error('Erro ao verificar locais:', error);
    throw error;
  }
}

export function formatarDistancia(metros) {
  if (metros < 1000) {
    return `${Math.round(metros)}m`;
  }
  return `${(metros / 1000).toFixed(2)}km`;
}

export function getLocaisMaisProximo(locais, latitude, longitude) {
  if (!locais || locais.length === 0) {
    return null;
  }

  const locaisComDistancia = locais.map((local) => {
    const distancia = calcularDistancia(
      latitude,
      longitude,
      local.latitude,
      local.longitude
    );
    return { ...local, distancia };
  });

  return locaisComDistancia.sort((a, b) => a.distancia - b.distancia)[0];
}

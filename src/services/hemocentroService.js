import hemocentrosData from '../data/hemocentros.json';

const AVISO_PACE =
  '⚠️ Este posto funciona apenas alguns dias por mês. Confirme a data pelo site antes de ir.';

const normalizarTexto = (texto) =>
  texto
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .trim();

// Busca hemocentros pela cidade e estado do usuário.
// Tenta match exato de cidade; se não achar, retorna todos do estado.
// Entradas do tipo PACE recebem o campo `aviso` para exibição no card.
export const getHemocentros = (municipio, uf) => {
  const cidadeNorm = normalizarTexto(municipio);

  let resultado = hemocentrosData.filter(
    (h) => h.uf === uf && h.cidadeNormalizada === cidadeNorm,
  );

  if (resultado.length === 0) {
    resultado = hemocentrosData.filter((h) => h.uf === uf);
  }

  return resultado.map((h) => ({
    ...h,
    aviso: h.tipo === 'PACE' ? AVISO_PACE : null,
  }));
};

// Fórmula de Haversine — distância em km entre dois pontos geográficos
const calcularDistancia = (lat1, lng1, lat2, lng2) => {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2);
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
};

// Retorna o hemocentro do estado mais próximo de uma coordenada geográfica
export const getHemocentroMaisProximo = (lat, lng, uf) => {
  const doEstado = hemocentrosData.filter((h) => h.uf === uf);
  if (doEstado.length === 0) return null;

  const maisProximo = doEstado.reduce((melhor, atual) => {
    const distAtual = calcularDistancia(lat, lng, atual.lat, atual.lng);
    const distMelhor = calcularDistancia(lat, lng, melhor.lat, melhor.lng);
    return distAtual < distMelhor ? atual : melhor;
  });

  return { ...maisProximo, aviso: maisProximo.tipo === 'PACE' ? AVISO_PACE : null };
};

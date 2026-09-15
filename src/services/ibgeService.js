const BASE = 'https://servicodados.ibge.gov.br/api/v1/localidades';
const NOMINATIM = 'https://nominatim.openstreetmap.org/search';

// In-memory cache para evitar chamadas repetidas na mesma sessão
const _cache = {};

// Mantida para compatibilidade com RegisterScreen e ProfileScreen
export async function getMunicipiosByUF(uf) {
  if (_cache[uf]) return _cache[uf];

  const res = await fetch(`${BASE}/estados/${uf}/municipios?orderBy=nome`);
  if (!res.ok) throw new Error(`Falha ao buscar municípios de ${uf}`);

  const data = await res.json();
  const municipios = data.map((m) => ({ id: m.id, nome: m.nome }));
  _cache[uf] = municipios;
  return municipios;
}

// Retorna array de strings com nomes dos municípios ordenados alfabeticamente
export async function getCidadesPorEstado(sigla) {
  try {
    const res = await fetch(
      `${BASE}/estados/${sigla}/municipios`,
    );
    if (!res.ok) throw new Error(`Status ${res.status}`);

    const data = await res.json();
    return data
      .map((m) => m.nome)
      .sort((a, b) => a.localeCompare(b, 'pt-BR'));
  } catch {
    return [];
  }
}

// Retorna { lat, lng } ou null para uma cidade brasileira via Nominatim (OpenStreetMap)
export async function getCoordenadasMunicipio(cidade, uf) {
  try {
    const params = new URLSearchParams({
      city: cidade,
      state: uf,
      country: 'Brazil',
      format: 'json',
      limit: '1',
    });

    const res = await fetch(`${NOMINATIM}?${params}`, {
      headers: {
        'User-Agent': 'HemoAlerta/1.0 (app de doação de sangue)',
        Accept: 'application/json',
      },
    });

    if (!res.ok) throw new Error(`Status ${res.status}`);

    const data = await res.json();
    if (!Array.isArray(data) || data.length === 0) return null;

    const { lat, lon } = data[0];
    return { lat: parseFloat(lat), lng: parseFloat(lon) };
  } catch {
    return null;
  }
}

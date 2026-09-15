// Mapa de compatibilidade: doador → array de receptores que pode receber
const COMPATIBILITY_MAP = {
  'O-':  ['O-', 'O+', 'A-', 'A+', 'B-', 'B+', 'AB-', 'AB+'],
  'O+':  ['O+', 'A+', 'B+', 'AB+'],
  'A-':  ['A-', 'A+', 'AB-', 'AB+'],
  'A+':  ['A+', 'AB+'],
  'B-':  ['B-', 'B+', 'AB-', 'AB+'],
  'B+':  ['B+', 'AB+'],
  'AB-': ['AB-', 'AB+'],
  'AB+': ['AB+'],
};

// Mapa inverso: receptor → array de doadores compatíveis
const DONORS_FOR_RECEPTOR = {
  'O-':  ['O-'],
  'O+':  ['O-', 'O+'],
  'A-':  ['O-', 'A-'],
  'A+':  ['O-', 'O+', 'A-', 'A+'],
  'B-':  ['O-', 'B-'],
  'B+':  ['O-', 'O+', 'B-', 'B+'],
  'AB-': ['O-', 'A-', 'B-', 'AB-'],
  'AB+': ['O-', 'O+', 'A-', 'A+', 'B-', 'B+', 'AB-', 'AB+'],
};

/**
 * Verifica se um doador pode doar para um receptor.
 * @param {string} tipoDoador   — ex: 'O-'
 * @param {string} tipoReceptor — ex: 'AB+'
 * @returns {boolean}
 */
export function isCompatible(tipoDoador, tipoReceptor) {
  return COMPATIBILITY_MAP[tipoDoador]?.includes(tipoReceptor) ?? false;
}

/**
 * Retorna todos os tipos sanguíneos que o doador pode ajudar.
 * @param {string} tipoDoador — ex: 'A-'
 * @returns {string[]}        — ex: ['A-', 'A+', 'AB-', 'AB+']
 */
export function getCompatibleTypes(tipoDoador) {
  return COMPATIBILITY_MAP[tipoDoador] ?? [];
}

/**
 * Retorna todos os tipos de doadores que podem ajudar o receptor.
 * @param {string} tipoReceptor — ex: 'B+'
 * @returns {string[]}          — ex: ['O-', 'O+', 'B-', 'B+']
 */
export function getDonorsCompatibleWith(tipoReceptor) {
  return DONORS_FOR_RECEPTOR[tipoReceptor] ?? [];
}

/** Cor hex de cada tipo sanguíneo — paleta identidade HemoAlerta (vermelho/vinho). */
export const BLOOD_TYPE_COLORS = {
  'O-':  '#7B0000', // vermelho escuro
  'O+':  '#C0392B', // vermelho principal
  'A-':  '#922B21', // vinho escuro
  'A+':  '#E74C3C', // vermelho médio
  'B-':  '#6E2C00', // marrom escuro
  'B+':  '#BA4A00', // laranja escuro
  'AB-': '#4A235A', // roxo escuro
  'AB+': '#7D3C98', // roxo médio
};

/** 8 tipos sanguíneos em ordem padrão — para Pickers de cadastro e chips de filtro. */
export const BLOOD_TYPES = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];

function formatCoins(value) {
  const number = Number(value);
  return (Number.isFinite(number) ? number : 0).toLocaleString('pt-BR');
}

function formatPlayerName(name) {
  const terms = String(name ?? '')
    .trim()
    .split(/\s+/)
    .filter(Boolean);

  if (terms.length <= 1) return terms[0] || '';
  if (/^[^\s.]+\.$/.test(terms[0])) return `${terms[0]} ${terms[1]}`;
  return `${terms[0][0]}. ${terms[1]}`;
}

const POSITION_LABELS = Object.freeze({
  GK: 'GOL',
  GOL: 'GOL',
  CB: 'ZAG',
  ZAG: 'ZAG',
  DF: 'ZAG',
  LB: 'LE',
  LE: 'LE',
  RB: 'LD',
  LD: 'LD',
  LWB: 'AE',
  AE: 'AE',
  ADE: 'AE',
  RWB: 'AD',
  AD: 'AD',
  ADD: 'AD',
  CDM: 'VOL',
  VOL: 'VOL',
  CM: 'MC',
  MC: 'MC',
  MF: 'MC',
  CAM: 'MEI',
  MEI: 'MEI',
  LM: 'ME',
  ME: 'ME',
  RM: 'MD',
  MD: 'MD',
  LW: 'PE',
  PE: 'PE',
  RW: 'PD',
  PD: 'PD',
  CF: 'SA',
  SA: 'SA',
  ST: 'CA',
  CA: 'CA',
  FW: 'CA',
});

const POSITION_GROUPS = Object.freeze({
  goalkeeper: ['GK', 'GOL'],
  defender: ['CB', 'ZAG', 'DF', 'LB', 'LE', 'RB', 'LD', 'LWB', 'AE', 'ADE', 'RWB', 'AD', 'ADD'],
  midfielder: ['CDM', 'VOL', 'CM', 'MC', 'MF', 'CAM', 'MEI', 'LM', 'ME', 'RM', 'MD'],
  attacker: ['LW', 'PE', 'RW', 'PD', 'CF', 'SA', 'ST', 'CA', 'FW'],
});

const SLOT_BASE_POSITIONS = Object.freeze({
  GK: 'GK',
  LB: 'LB',
  CB1: 'CB',
  CB2: 'CB',
  CB3: 'CB',
  RB: 'RB',
  LWB: 'LWB',
  RWB: 'RWB',
  CDM: 'CDM',
  CDM1: 'CDM',
  CDM2: 'CDM',
  CM1: 'CM',
  CM2: 'CM',
  CM3: 'CM',
  CAM: 'CAM',
  LM: 'LM',
  RM: 'RM',
  LW: 'LW',
  RW: 'RW',
  ST: 'ST',
  ST1: 'ST',
  ST2: 'ST',
});

function getSlotBasePosition(slot) {
  return SLOT_BASE_POSITIONS[String(slot || '').trim().toUpperCase()];
}

function formatPosition(position) {
  const value = String(position || '').trim();
  const normalized = value.toUpperCase();
  const basePosition = getSlotBasePosition(normalized) || normalized;
  return POSITION_LABELS[basePosition] || value || '--';
}

function getPositionGroup(position) {
  const normalized = String(position || '').trim().toUpperCase();
  const value = getSlotBasePosition(normalized) || normalized;
  return Object.entries(POSITION_GROUPS)
    .find(([, positions]) => positions.includes(value))?.[0];
}

function canPlayInPosition(playerPosition, targetPosition) {
  const playerGroup = getPositionGroup(playerPosition);
  const targetGroup = getPositionGroup(targetPosition);
  return Boolean(playerGroup && targetGroup && playerGroup === targetGroup);
}

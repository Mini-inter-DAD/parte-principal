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

function formatPosition(position) {
  const value = String(position || '').trim();
  return POSITION_LABELS[value.toUpperCase()] || value || '--';
}

function getPositionGroup(position) {
  const value = String(position || '').trim().toUpperCase();
  return Object.entries(POSITION_GROUPS)
    .find(([, positions]) => positions.includes(value))?.[0];
}

function canPlayInPosition(playerPosition, targetPosition) {
  const playerGroup = getPositionGroup(playerPosition);
  const targetGroup = getPositionGroup(targetPosition);
  return Boolean(playerGroup && targetGroup && playerGroup === targetGroup);
}

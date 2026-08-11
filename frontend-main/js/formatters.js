function formatCoins(value) {
  const number = Number(value);
  return (Number.isFinite(number) ? number : 0).toLocaleString('pt-BR');
}

const PLAYER_DISPLAY_ALIASES = Object.freeze({
  'vinicius jose de oliveira junior': 'Vini Jr.',
  'vinicius junior': 'Vini Jr.',
  'raphael dias belloli': 'Raphinha',
  'virgil van dijk': 'Van Dijk',
  'ruben santos gato alves dias': 'Rúben Dias',
  'c ronaldo dos santos aveiro': 'Cristiano Ronaldo',
  'carlos henrique venancio casimiro': 'Casemiro',
  'marcos vinicius sousa natividade': 'Marquinhos',
  'fabio henrique tavares': 'Fabinho',
  'endrick felipe moreira de sousa': 'Endrick',
  'lucas tolentino coelho de lima': 'Lucas Paquetá',
  'gabriel teodoro martinelli silva': 'Gabriel Martinelli',
  'rodrigo hernandez cascante': 'Rodri',
  'pablo martin paez gavira': 'Gavi',
  'pedro gonzalez lopez': 'Pedri',
  'vitor manuel carvalho oliveira': 'Vitinha',
  'bruno guimaraes moura': 'Bruno Guimarães',
  'bruno miguel borges fernandes': 'Bruno Fernandes',
  'bernardo mota carvalho e silva': 'Bernardo Silva',
  'rafael da conceicao leao': 'Rafael Leão',
  'joao pedro goncalves neves': 'João Neves',
  'joao pedro cavaco cancelo': 'João Cancelo',
  'ruben diogo da silva neves': 'Rúben Neves',
  'nuno alexandre tavares mendes': 'Nuno Mendes',
  'daniel olmo carvajal': 'Dani Olmo',
  'nicholas williams arthuer': 'Nico Williams',
  'alejandro baena rodriguez': 'Álex Baena',
  'david raya martin': 'David Raya',
  'fabian ruiz pena': 'Fabián Ruiz',
  'marc cucurella saseta': 'Marc Cucurella',
  'unai simon mendibil': 'Unai Simón',
  'ederson santana de moraes': 'Ederson',
  'alexis mac allister': 'Mac Allister',
  'frenkie de jong': 'F. De Jong',
  'kevin de bruyne': 'K. De Bruyne',
  'matheus santos carneiro da cunha': 'M. Cunha',
  'rodrigo de paul': 'R. De Paul',
  'jose maria gimenez': 'J. Giménez',
  'charles de ketelaere': 'De Ketelaere',
  'giovani lo celso': 'Lo Celso',
});

function normalizePlayerNameKey(name) {
  return String(name ?? '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim()
    .replace(/\s+/g, ' ');
}

function formatPlayerName(name) {
  const normalizedName = String(name ?? '').trim().replace(/\s+/g, ' ');
  const alias = PLAYER_DISPLAY_ALIASES[normalizePlayerNameKey(normalizedName)];
  if (alias) return alias;

  const terms = normalizedName.split(' ').filter(Boolean);
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

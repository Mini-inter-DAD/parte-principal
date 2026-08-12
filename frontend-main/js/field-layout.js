const FIELD_NAME_LAYOUT = Object.freeze({
  maxWidth: 110,
  minWidth: 56,
  rowTolerance: 6,
  neighborGap: 8,
});

function calculateFieldNameMaxWidth(slot, slots, fieldWidth) {
  const width = Number(fieldWidth);
  if (!Number.isFinite(width) || width <= 0) return FIELD_NAME_LAYOUT.maxWidth;

  const sameRow = (Array.isArray(slots) ? slots : [])
    .filter(candidate => candidate !== slot
      && (Number(candidate?.x) !== Number(slot?.x)
        || Number(candidate?.y) !== Number(slot?.y)))
    .filter(candidate => Math.abs(Number(candidate?.y) - Number(slot?.y)) <= FIELD_NAME_LAYOUT.rowTolerance);
  const nearestDistance = Math.min(
    ...sameRow.map(candidate => Math.abs(Number(candidate.x) - Number(slot.x)) * width / 100),
  );

  if (!Number.isFinite(nearestDistance)) return FIELD_NAME_LAYOUT.maxWidth;
  return Math.max(
    FIELD_NAME_LAYOUT.minWidth,
    Math.min(FIELD_NAME_LAYOUT.maxWidth, Math.floor(nearestDistance - FIELD_NAME_LAYOUT.neighborGap)),
  );
}

function applyFieldNameWidths(container, slots) {
  if (!container || typeof container.querySelectorAll !== 'function') return;

  const fieldWidth = container.clientWidth;
  container.querySelectorAll('.field-slot').forEach((element, index) => {
    const maxWidth = calculateFieldNameMaxWidth(slots?.[index], slots, fieldWidth);
    element.style.setProperty('--field-slot-name-max-width', `${maxWidth}px`);
  });
}

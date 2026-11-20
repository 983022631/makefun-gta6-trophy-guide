// Filters and the spoiler rule: which trophies a view shows, and what a hidden
// story trophy looks like until it is earned.
export function trophyMatches(trophy, filters, earned) {
  if (filters.kind === 'missable') {
    if (!trophy.missable) return false;
  } else if (filters.kind !== 'all' && trophy.kind !== filters.kind) {
    return false;
  }
  if (filters.grade !== 'all' && trophy.grade !== filters.grade) return false;
  if (filters.show === 'earned' && !earned.has(trophy.name)) return false;
  if (filters.show === 'remaining' && earned.has(trophy.name)) return false;
  if (filters.query) {
    const hay = `${trophy.name} ${trophy.description} ${trophy.guide}`.toLowerCase();
    if (!hay.includes(filters.query)) return false;
  }
  return true;
}

// Spoiler rule: a story trophy the player has not earned yet hides its name,
// description and guide while the spoiler setting is on. Everything else is
// always shown, and earning a trophy reveals it at once.
export function isSpoilerHidden(trophy, spoilerOn, earned) {
  return spoilerOn && trophy.kind === 'story' && !earned.has(trophy.name);
}

export const KIND_LABELS = {
  story: 'Story',
  side: 'Strangers & side',
  collectible: 'Collectible',
  activity: 'Activity',
  crime: 'Crime',
  money: 'Money & 100%',
  platinum: 'Platinum',
};

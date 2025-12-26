// Player profile management for daily puzzle mode

const PLAYER_NAME_KEY = 'pinpoint_player_name';

export const getPlayerName = (): string | null => {
  try {
    return localStorage.getItem(PLAYER_NAME_KEY);
  } catch {
    return null;
  }
};

export const setPlayerName = (name: string): void => {
  const trimmedName = name.trim();
  if (trimmedName.length >= 2 && trimmedName.length <= 20) {
    localStorage.setItem(PLAYER_NAME_KEY, trimmedName);
  }
};

export const hasPlayerName = (): boolean => {
  const name = getPlayerName();
  return name !== null && name.length >= 2;
};

export const clearPlayerName = (): void => {
  localStorage.removeItem(PLAYER_NAME_KEY);
};

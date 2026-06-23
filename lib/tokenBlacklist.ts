const inMemoryStore = new Map<string, boolean>();

export const addToBlacklist = async (token: string, ttlSeconds: number = 3600): Promise<void> => {
  inMemoryStore.set(`blacklist:${token}`, true);
  setTimeout(() => inMemoryStore.delete(`blacklist:${token}`), ttlSeconds * 1000);
};

export const isBlacklisted = async (token: string): Promise<boolean> => {
  return inMemoryStore.has(`blacklist:${token}`);
};

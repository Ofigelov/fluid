export const hashCode = (s: string): number => {
  if (s.length == 0) {
    return 0;
  }
  let hash = 0;
  for (let i = 0; i < s.length; i++) {
    hash = (hash << 5) - hash + s.charCodeAt(i);
    hash |= 0; // Convert to 32bit integer
  }
  return hash;
};

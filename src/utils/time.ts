export const formatTime = (iso: string) => {
  const d = new Date(iso);
  return d.toLocaleTimeString();
};

export const calculateHealth = (burnRate: number) => {
  if (burnRate < 1) return 'Healthy';
  if (burnRate < 2) return 'Warning';
  return 'Critical';
};

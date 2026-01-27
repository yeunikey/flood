export function calcStats(values: (number | null)[]) {
  const nums = values.filter((v): v is number => v !== null && v !== undefined);
  if (nums.length === 0) return null;

  const sorted = [...nums].sort((a, b) => a - b);
  const mean = nums.reduce((a, b) => a + b, 0) / nums.length;

  const std = Math.sqrt(
    nums.reduce((acc, v) => acc + Math.pow(v - mean, 2), 0) / nums.length,
  );

  const percentile = (p: number) => {
    const idx = (sorted.length - 1) * p;
    const lo = Math.floor(idx);
    const hi = Math.ceil(idx);
    if (lo === hi) return sorted[lo];
    return sorted[lo] + (sorted[hi] - sorted[lo]) * (idx - lo);
  };

  return {
    mean,
    std,
    min: sorted[0],
    p25: percentile(0.25),
    p50: percentile(0.5),
    p75: percentile(0.75),
    max: sorted[sorted.length - 1],
  };
}

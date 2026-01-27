
// ----- Utility math helpers -----
function mean(a: number[]): number {
    return a.reduce((s, v) => s + v, 0) / a.length;
}

// function variance(a: number[], m: number): number {
//     return a.reduce((s, v) => s + (v - m) ** 2, 0);
// }

// function std(a: number[]): number {
//     const m = mean(a);
//     return Math.sqrt(variance(a, m) / (a.length - 1));
// }

// Lanczos approximation for log-gamma
function gammaln(z: number): number {
    const cof = [76.18009172947146, -86.50532032941677, 24.01409824083091,
        -1.231739572450155, 0.1208650973866179e-2, -0.5395239384953e-5];
    const x = z;
    let y = z;
    let tmp = x + 5.5;
    tmp -= (x + 0.5) * Math.log(tmp);
    let ser = 1.000000000190015;
    for (let j = 0; j < 6; j++) {
        ser += cof[j] / (++y);
    }
    return -tmp + Math.log(2.5066282746310005 * ser / x);
}

// Continued fraction for incomplete beta
function betacf(a: number, b: number, x: number): number {
    const MAXIT = 200, EPS = 3e-14, FPMIN = 1e-300;
    const qab = a + b, qap = a + 1, qam = a - 1;
    let c = 1, d = 1 - (qab * x / qap);
    if (Math.abs(d) < FPMIN) d = FPMIN;
    d = 1 / d;
    let h = d;

    for (let m = 1; m <= MAXIT; m++) {
        const m2 = 2 * m;

        // even step
        let aa = (m * (b - m) * x) / ((qam + m2) * (a + m2));
        d = 1 + aa * d; if (Math.abs(d) < FPMIN) d = FPMIN;
        c = 1 + aa / c; if (Math.abs(c) < FPMIN) c = FPMIN;
        d = 1 / d;
        h *= d * c;

        // odd step
        aa = -((a + m) * (qab + m) * x) / ((a + m2) * (qap + m2));
        d = 1 + aa * d; if (Math.abs(d) < FPMIN) d = FPMIN;
        c = 1 + aa / c; if (Math.abs(c) < FPMIN) c = FPMIN;
        d = 1 / d;
        const del = d * c;
        h *= del;

        if (Math.abs(del - 1) < EPS) break;
    }
    return h;
}

// Regularized incomplete beta I_x(a,b)
function betainc(x: number, a: number, b: number): number {
    if (x <= 0) return 0;
    if (x >= 1) return 1;
    const bt = Math.exp(gammaln(a + b) - gammaln(a) - gammaln(b) + a * Math.log(x) + b * Math.log(1 - x));
    if (x < (a + 1) / (a + b + 2)) return bt * betacf(a, b, x) / a;
    return 1 - bt * betacf(b, a, 1 - x) / b;
}

// Student's t CDF (two-sided p will use this)
function tCDF(t: number, df: number): number {
    if (t === 0) return 0.5;
    const x = df / (df + t ** 2);
    const a = df / 2, b = 0.5;
    const ib = betainc(x, a, b);
    if (t > 0) return 1 - 0.5 * ib;
    return 0.5 * ib;
}

// Two-sided p-value from Pearson r (or Spearman rho) with n samples
function pValueFromR(r: number, n: number): number {
    const df = n - 2;
    const t = r * Math.sqrt(df / Math.max(1e-16, (1 - r ** 2)));
    const cdf = tCDF(Math.abs(t), df);
    return 2 * (1 - cdf);
}

export function pearson(x: number[], y: number[]): { r: number, p: number } {
    const n = x.length;
    const mx = mean(x), my = mean(y);
    let num = 0, sx = 0, sy = 0;
    for (let i = 0; i < n; i++) {
        const dx = x[i] - mx, dy = y[i] - my;
        num += dx * dy; sx += dx ** 2; sy += dy ** 2;
    }
    const r = num / Math.sqrt(sx * sy);
    const p = pValueFromR(r, n);
    return { r, p };
}

function rankdata(arr: number[]): number[] {
    const n = arr.length;
    const idx = [...arr.keys()].sort((i, j) => arr[i] - arr[j]);
    const ranks = Array(n).fill(0);
    let i = 0;
    while (i < n) {
        let j = i;
        while (j + 1 < n && arr[idx[j + 1]] === arr[idx[i]]) j++;
        const avg = (i + j + 2) / 2;
        for (let k = i; k <= j; k++) ranks[idx[k]] = avg;
        i = j + 1;
    }
    return ranks;
}

export function spearman(x: number[], y: number[]): { rho: number, p: number } {
    const rx = rankdata(x);
    const ry = rankdata(y);
    const { r } = pearson(rx, ry);
    const p = pValueFromR(r, x.length);
    return { rho: r, p };
}

export function fmt(v: number): string { return (Math.round(v * 1e4) / 1e4).toFixed(4); }
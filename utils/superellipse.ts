/**
 * Superellipse clip-path utility
 * Builds an SVG path string suitable for CSS `clip-path: path('...')`.
 * Uses the superellipse equation with exponent n to approximate a squircle.
 */

function sign(x: number) {
  return x < 0 ? -1 : 1;
}

/**
 * Returns a path string for a superellipse of width x height.
 * n controls the exponent (n=4 is classic squircle). samples controls polygon density.
 */
export function getSuperellipseClipPath(width: number, height: number, n = 4, samples = 64): string {
  const a = width / 2;
  const b = height / 2;
  const points: Array<[number, number]> = [];
  for (let i = 0; i < samples; i++) {
    const t = (i / samples) * Math.PI * 2;
    const cosT = Math.cos(t);
    const sinT = Math.sin(t);
    const x = a * sign(cosT) * Math.pow(Math.abs(cosT), 2 / n);
    const y = b * sign(sinT) * Math.pow(Math.abs(sinT), 2 / n);
    points.push([x + a, y + b]);
  }
  // Build path string
  const [x0, y0] = points[0];
  let d = `M ${x0.toFixed(2)} ${y0.toFixed(2)}`;
  for (let i = 1; i < points.length; i++) {
    const [x, y] = points[i];
    d += ` L ${x.toFixed(2)} ${y.toFixed(2)}`;
  }
  d += ' Z';
  return d;
}

export default getSuperellipseClipPath;
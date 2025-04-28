// lib/color-utils.ts

export function generateRandomColor(): string {
    const h = Math.floor(Math.random() * 360);
    const s = Math.floor(Math.random() * 20 + 70);
    const l = Math.floor(Math.random() * 20 + 40);

    const h1 = h / 360;
    const s1 = s / 100;
    const l1 = l / 100;

    let r: number, g: number, b: number;
    if (s1 === 0) {
        r = g = b = l1;
    } else {
        const hue2rgb = (p: number, q: number, t: number): number => {
            if (t < 0) t += 1;
            if (t > 1) t -= 1;
            if (t < 1 / 6) return p + (q - p) * 6 * t;
            if (t < 1 / 2) return q;
            if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
            return p;
        };

        const q = l1 < 0.5 ? l1 * (1 + s1) : l1 + s1 - l1 * s1;
        const p = 2 * l1 - q;
        r = hue2rgb(p, q, h1 + 1 / 3);
        g = hue2rgb(p, q, h1);
        b = hue2rgb(p, q, h1 - 1 / 3);
    }

    const toHex = (x: number): string => {
        const hex = Math.round(x * 255).toString(16);
        return hex.length === 1 ? "0" + hex : hex;
    };

    return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}

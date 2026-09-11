/// <reference types="@cloudflare/workers-types" />
import { generateRandomColorHex } from '../lib/color-utils';
import { pageTemplate } from './template';
import { styleCss } from './assets/style';
import { scriptJs } from './assets/script';

function securityHeaders(extra?: Record<string, string>): HeadersInit {
    const base: Record<string, string> = {
        'X-Content-Type-Options': 'nosniff',
        'Referrer-Policy': 'no-referrer',
        'X-Frame-Options': 'DENY',
        'Cross-Origin-Resource-Policy': 'same-origin',
        'Cross-Origin-Opener-Policy': 'same-origin',
        'X-Robots-Tag': 'noindex, nofollow',
        'Permissions-Policy': 'geolocation=(), microphone=(), camera=()'
    };
    return { ...(base as any), ...(extra || {}) };
}

const sh = (extras?: Record<string, string>) => securityHeaders(extras);

export async function handleGetIndex(request: Request): Promise<Response> {
    const colorHex = generateRandomColorHex();

    const styleHash = btoa(styleCss.slice(0, 32)).replace(/[^a-z0-9]/gi, '').slice(0, 8);
    const scriptHash = btoa(scriptJs.slice(0, 32)).replace(/[^a-z0-9]/gi, '').slice(0, 8);
    const htmlContent = pageTemplate
        .replaceAll('__COLOR_HEX__', colorHex)
        .replaceAll('__COLOR_HEX_URL_ENCODED__', colorHex.replace('#', '%23'))
        .replaceAll('__STYLE_URL__', `/assets/style.${styleHash}.css`)
        .replaceAll('__SCRIPT_URL__', `/assets/script.${scriptHash}.js`);

    return new Response(htmlContent, {
        headers: sh({
            "Content-Type": "text/html; charset=UTF-8",
            "Cache-Control": "no-store, no-cache, must-revalidate, max-age=0",
            "Pragma": "no-cache", "Expires": "0"
        })
    });
}

export async function handleStaticAsset(pathname: string): Promise<Response> {
    const styleHash = btoa(styleCss.slice(0, 32)).replace(/[^a-z0-9]/gi, '').slice(0, 8);
    const scriptHash = btoa(scriptJs.slice(0, 32)).replace(/[^a-z0-9]/gi, '').slice(0, 8);

    const headers = {
        'Cache-Control': 'public, max-age=31536000, immutable',
        'X-Content-Type-Options': 'nosniff'
    };

    if (pathname === `/assets/style.${styleHash}.css` || pathname === '/assets/style.css') {
        return new Response(styleCss, {
            headers: { ...headers, 'Content-Type': 'text/css; charset=UTF-8' }
        });
    }
    if (pathname === `/assets/script.${scriptHash}.js` || pathname === '/assets/script.js') {
        return new Response(scriptJs, {
            headers: { ...headers, 'Content-Type': 'application/javascript; charset=UTF-8' }
        });
    }
    return new Response('Not Found', { status: 404 });
}

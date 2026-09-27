/// <reference types="@cloudflare/workers-types" />
import { pageTemplate } from "./template";
import { styleCss } from "./assets/style";
import { scriptJs } from "./assets/script";

async function contentHash(content: string): Promise<string> {
  const digest = await crypto.subtle.digest(
    "SHA-256",
    new TextEncoder().encode(content),
  );
  return Array.from(new Uint8Array(digest), (byte) =>
    byte.toString(16).padStart(2, "0"),
  )
    .join("")
    .slice(0, 20);
}

function securityHeaders(extra?: Record<string, string>): HeadersInit {
  const base: Record<string, string> = {
    "X-Content-Type-Options": "nosniff",
    "Referrer-Policy": "no-referrer",
    "X-Frame-Options": "DENY",
    "Cross-Origin-Resource-Policy": "same-origin",
    "Cross-Origin-Opener-Policy": "same-origin",
    "X-Robots-Tag": "noindex, nofollow",
    "Permissions-Policy": "geolocation=(), microphone=(), camera=()",
  };
  return { ...base, ...(extra || {}) };
}

const sh = (extras?: Record<string, string>) => securityHeaders(extras);

export async function handleGetIndex(): Promise<Response> {
  const now = new Date();
  const hkt = new Date(now.getTime() + 8 * 3600000);
  const date = new Intl.DateTimeFormat("en-GB", {
    timeZone: "UTC",
    weekday: "short",
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
  const time = (value: Date) => value.toISOString().slice(11, 16);
  const [styleHash, scriptHash] = await Promise.all([
    contentHash(styleCss),
    contentHash(scriptJs),
  ]);
  const htmlContent = pageTemplate
    .replaceAll("__UTC_TIME__", time(now))
    .replaceAll("__HKT_TIME__", time(hkt))
    .replaceAll("__UTC_DATE__", date.format(now))
    .replaceAll("__HKT_DATE__", date.format(hkt))
    .replaceAll("__SECONDS__", now.toISOString().slice(17, 19))
    .replaceAll("__ISO__", now.toISOString())
    .replaceAll(
      "__DAY_OFFSET__",
      now.getUTCDate() === hkt.getUTCDate() ? "" : "+1 DAY",
    )
    .replaceAll("__STYLE_URL__", `/assets/style.${styleHash}.css`)
    .replaceAll("__SCRIPT_URL__", `/assets/script.${scriptHash}.js`);

  return new Response(htmlContent, {
    headers: sh({
      "Content-Type": "text/html; charset=UTF-8",
      "Cache-Control": "no-store, no-cache, must-revalidate, max-age=0",
      Pragma: "no-cache",
      Expires: "0",
    }),
  });
}

export async function handleStaticAsset(pathname: string): Promise<Response> {
  const [styleHash, scriptHash] = await Promise.all([
    contentHash(styleCss),
    contentHash(scriptJs),
  ]);

  const headers = {
    "Cache-Control":
      pathname === "/assets/style.css" || pathname === "/assets/script.js"
        ? "no-cache"
        : "public, max-age=31536000, immutable",
    "X-Content-Type-Options": "nosniff",
  };

  if (
    pathname === `/assets/style.${styleHash}.css` ||
    pathname === "/assets/style.css"
  ) {
    return new Response(styleCss, {
      headers: { ...headers, "Content-Type": "text/css; charset=UTF-8" },
    });
  }
  if (
    pathname === `/assets/script.${scriptHash}.js` ||
    pathname === "/assets/script.js"
  ) {
    return new Response(scriptJs, {
      headers: {
        ...headers,
        "Content-Type": "application/javascript; charset=UTF-8",
      },
    });
  }
  return new Response("Not Found", { status: 404 });
}

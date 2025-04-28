import { generateRandomColorHex, generateTraceId } from '../lib/color-utils';
import { ensureMonthlyTableAndRestApi, insertColorRecord } from '../lib/db-utils';
import { RateLimiter } from '../lib/rate-limit';
import { getCurrentTableName } from '../lib/time-utils';

// Define an interface for the environment variables we expect
// These must be bound in wrangler.toml
interface Env {
  ORDS_BASE_URL: string;
  ORDS_ADMIN_SCHEMA: string;
  // Add other bindings/secrets (e.g., KV namespaces, Durable Object bindings) if needed
}

// Initialize the rate limiter (NOTE: This is instance-local, not global)
const limiter = new RateLimiter(30); // Allows 30 POST requests per second *per Worker instance*

export default {
  // Update signature to include Env and ExecutionContext
  async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {

    const url = new URL(request.url);

    // Handle POST requests for logging color changes
    if (request.method === "POST" && url.pathname === '/') {
      try {
        // Validate Content-Type for safety
        if (request.headers.get("Content-Type") !== "application/json") {
          return new Response("Bad Request: Expected Content-Type application/json", { status: 400 });
        }

        const data: any = await request.json();

        // Basic validation of incoming data
        if (!data || typeof data.color !== 'string' || typeof data.trace_id !== 'string' || typeof data.source !== 'string') {
          console.error("Received invalid data structure:", data);
          return new Response("Bad Request: Invalid data payload", { status: 400 });
        }

        const tableName = getCurrentTableName();

        // NOTE: This rate limiter is instance-local. In a high-traffic scenario,
        // the total rate across all Cloudflare edge locations might exceed this limit.
        // For strict global rate limiting, consider using KV or Durable Objects.
        if (limiter.canProceed()) {
          // Use ctx.waitUntil to perform database operations asynchronously
          // This allows the response to be sent back to the client faster.
          ctx.waitUntil(
            (async () => {
              try {
                // Pass env to database utility functions
                await ensureMonthlyTableAndRestApi(tableName, env);
                await insertColorRecord(tableName, data.color, data.trace_id, data.source, env);
              } catch (dbError) {
                // Log database errors happening in the background
                console.error(`Database operation failed for trace ${data.trace_id}:`, dbError);
                // Consider sending errors to an external monitoring service here
              }
            })()
          );
        } else {
          // Log rate limit events if desired
          console.log(`Rate limit exceeded for trace ${data.trace_id}`);
          // Return 429 Too Many Requests
          return new Response("Too Many Requests", { status: 429 });
        }

        // Return OK immediately if rate limit allows and waitUntil is used
        return new Response("OK", { status: 200 });

      } catch (e) {
        // Catch JSON parsing errors or other synchronous errors
        console.error("Error processing POST request:", e);
        // Avoid leaking detailed error messages in production if possible
        return new Response("Bad Request", { status: 400 });
      }
    }

    // Handle GET requests to serve the HTML page
    if (request.method === "GET" && url.pathname === '/') {
      const traceId = generateTraceId(); // Generate trace ID for this page load/session
      const colorHex = generateRandomColorHex(); // Initial color

      // --- HTML Start ---
      const html = `
<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>${colorHex}</title>
<style>
body { margin: 0; display: flex; flex-direction: column; justify-content: center; align-items: center; height: 100vh; background-color: ${colorHex}; transition: background-color 0.8s; font-family: sans-serif; cursor: pointer; /* Add cursor pointer to indicate clickability */ }
.time-display { font-size: clamp(1.5rem, 4vw, 2rem); color: white; text-shadow: 1px 1px 2px rgba(0,0,0,0.5); margin: 5px 0; }
.timestamp-display { position: fixed; bottom: 1rem; right: 1.5rem; font-size: clamp(0.8rem, 2vw, 1rem); color: rgba(255, 255, 255, 0.7); text-shadow: 1px 1px 1px rgba(0,0,0,0.5); }
</style>
<link id="favicon" rel="icon" href="data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 100 100%22><circle cx=%2250%22 cy=%2250%22 r=%2250%22 fill=%22${colorHex.replace('#', '%23')}%22/></svg>">
</head>
<body>
<div id="time-utc" class="time-display">Loading UTC…</div>
<div id="time-utc8" class="time-display">Loading UTC+8…</div>
<div id="linux-timestamp" class="timestamp-display">Loading Timestamp…</div>

<script>
  const initialTraceId = "${traceId}"; // Use the traceId generated by the worker

  // Function to send color change data to the backend
  async function sendColorChange(hslColor, sourceType) {
	const eventTraceId = crypto.randomUUID();
	try {
	  const response = await fetch('/', {
		method: 'POST',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify({ color: hslColor, trace_id: eventTraceId, source: sourceType })
	  });
	  if (!response.ok) {
		console.error('Failed to send color change:', response.status, await response.text());
	  }
	} catch (e) {
	  console.error('Error sending color change:', e);
	}
  }

  // Function to update time displays
  function updateTimeDisplays() {
	const now = new Date();
	const utcTime = now.toISOString().split('.')[0].replace('T', ' ');
	const cnTime = new Date(now.getTime() + 8 * 3600 * 1000).toISOString().split('.')[0].replace('T', ' ');

	document.getElementById('time-utc').textContent = utcTime + ' UTC';
	document.getElementById('time-utc8').textContent = cnTime + ' UTC+8';
	document.getElementById('linux-timestamp').textContent = 'TS: ' + Math.floor(now.getTime() / 1000);
  }

  // Function to generate random HSL color (client-side)
  function randomHslColor() {
	const h = Math.floor(Math.random() * 360);
	const s = Math.floor(Math.random() * 20 + 70); // Saturation 70-90%
	const l = Math.floor(Math.random() * 20 + 40); // Lightness 40-60%
	return \`hsl(\${h}, \${s}%, \${l}%)\`;
  }

  // Function to apply color and update favicon
  function applyColor(hslColor) {
	document.body.style.backgroundColor = hslColor;
	// Update favicon using HSL color
	const svgFavicon = \`data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 100 100%22><circle cx=%2250%22 cy=%2250%22 r=%2250%22 fill=%22\${hslColor.replace('(','%28').replace(')','%29')}%22/></svg>\`;
	document.getElementById('favicon').setAttribute('href', svgFavicon);
  }

  // Initial time update and interval setup
  updateTimeDisplays();
  setInterval(updateTimeDisplays, 1000);

  // Automatic color change interval (every 5 seconds)
  setInterval(() => {
	if (new Date().getSeconds() % 5 === 0) {
	  const newColor = randomHslColor();
	  applyColor(newColor);
	  sendColorChange(newColor, 'a'); // 'a' for automatic
	}
  }, 1000);

  // Click event listener attached to the body for manual color change
  document.body.addEventListener('click', () => {
	const newColor = randomHslColor();
	applyColor(newColor);
	sendColorChange(newColor, 'c'); // 'c' for click
  });

  // Send the initial color generated by the server
  // Use timeout to ensure it doesn't race with automatic changes immediately on load
  setTimeout(() => {
	 sendColorChange("${colorHex}", 'i'); // 'i' for initial server-generated color
  }, 100);

</script>
</body>
</html>
	`.trim();
      // --- HTML End ---

      return new Response(html, {
        headers: {
          "Content-Type": "text/html; charset=UTF-8",
          "Cache-Control": "no-store, no-cache, must-revalidate, max-age=0",
          "Pragma": "no-cache",
          "Expires": "0"
        }
      });
    }

    // Default response for other methods/paths
    return new Response("Not Found", { status: 404 });
  }
};
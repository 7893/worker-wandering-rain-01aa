// src/index.ts

// --- Imports ---
// Import utility functions
import { generateRandomColorHex } from '../lib/color-utils'; // Assuming generateTraceId is also in color-utils or trace-utils
import { generateTraceId } from '../lib/trace-utils'; // Import trace ID generator
import { RateLimiter } from '../lib/rate-limit';
// import { getCurrentTableName } from '../lib/time-utils'; // No longer needed for DB logic, maybe for logging

// Import the NEW database utility function and Env interface
import { insertColorRecord, Env as DbEnv } from '../lib/db-utils';

// Import the HTML template content as a string
import pageTemplate from './template.html';

// --- Environment Interface ---
// Use the Env interface exported from db-utils, assuming it contains all needed vars
type Env = DbEnv;

// --- Globals / Initialization ---
// Initialize the rate limiter (instance-local)
const limiter = new RateLimiter(30);

// --- Worker Definition ---
export default {
  /**
   * Handles incoming HTTP requests.
   */
  async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {

    const url = new URL(request.url);

    // --- Handle POST requests for logging color changes ---
    if (request.method === "POST" && url.pathname === '/') {
      try {
        // Validate Content-Type
        if (request.headers.get("Content-Type") !== "application/json") {
          return new Response("Bad Request: Expected Content-Type application/json", { status: 400 });
        }

        // Parse and validate incoming JSON data
        interface IncomingColorData {
          color: string;
          trace_id: string;
          source: string;
        }
        const data: IncomingColorData = await request.json();

        // Basic validation
        if (!data || typeof data.color !== 'string' || !data.color.startsWith('#') ||
          typeof data.trace_id !== 'string' || typeof data.source !== 'string') {
          console.error("Received invalid data structure or color format:", data);
          return new Response("Bad Request: Invalid data payload or color format (expected HEX starting with #)", { status: 400 });
        }

        // Apply rate limiting
        if (limiter.canProceed()) {
          // Prepare data object for insertColorRecord
          const colorDataToInsert = {
            color: data.color,
            trace_id: data.trace_id,
            source: data.source
          };

          // Use ctx.waitUntil for async DB operation
          ctx.waitUntil(
            (async () => {
              try {
                // Call the refactored insertColorRecord function
                await insertColorRecord(colorDataToInsert, env);
              } catch (dbError) {
                console.error(`Database operation failed for trace ${data.trace_id}:`, dbError);
              }
            })()
          );

          // Return OK immediately
          return new Response("OK", { status: 200 });

        } else {
          console.log(`Rate limit exceeded for trace ${data.trace_id}`);
          return new Response("Too Many Requests", { status: 429 });
        }

      } catch (e) {
        console.error("Error processing POST request:", e);
        return new Response("Bad Request", { status: 400 });
      }
    }

    // --- Handle GET requests to serve the HTML page ---
    if (request.method === "GET" && url.pathname === '/') {
      const traceId = generateTraceId(); // Generate trace ID for this specific request/page load
      const colorHex = generateRandomColorHex(); // Generate initial color

      // Replace placeholders in the imported HTML template content
      let htmlContent = pageTemplate
        .replaceAll('__COLOR_HEX__', colorHex)
        // Ensure '#' in color is properly encoded for use in SVG data URI
        .replaceAll('__COLOR_HEX_URL_ENCODED__', colorHex.replace('#', '%23'))
        .replaceAll('__TRACE_ID__', traceId)
        .replaceAll('__INITIAL_COLOR_HEX__', colorHex); // <-- *** 这行是添加的 ***

      // Return the processed HTML
      return new Response(htmlContent, {
        headers: {
          "Content-Type": "text/html; charset=UTF-8",
          "Cache-Control": "no-store, no-cache, must-revalidate, max-age=0",
          "Pragma": "no-cache",
          "Expires": "0"
        }
      });
    }

    // --- Default response for other methods/paths ---
    return new Response("Not Found", { status: 404 });
  },

  /**
   * Handles scheduled events (Cron Triggers).
   * TODO: Implement Db2 keep-alive logic here when ready.
   */
  // async scheduled(event: ScheduledEvent, env: Env, ctx: ExecutionContext): Promise<void> {
  //   console.log(`Cron Trigger Fired: ${event.cron}`);
  //   // Add Db2 ping logic here later
  // }
};


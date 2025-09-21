// lib/db-utils.ts (AutoREST 版本)

export interface Env {
    ORDS_BASE_URL: string;
    ORDS_SCHEMA_PATH: string;
    ORDS_API_PATH: string;
    DB_USER: string;
    DB_PASSWORD: string;
}

export interface ColorRecordForAutoRest {
    color: string;
    trace_id: string;
    source: string;
    event_at?: string;
    client_ip?: string;
    user_agent?: string;
    referer?: string | null;
    cf_country?: string | null;
    cf_colo?: string | null;
    cf_asn?: number | null;
    cf_http_protocol?: string | null;
    cf_tls_cipher?: string | null;
    cf_tls_version?: string | null;
    cf_threat_score?: number | null;
    cf_trust_score?: number | null;
    extra?: string | null;
}

export async function insertColorRecord(colorData: Partial<ColorRecordForAutoRest>, env: Env): Promise<void> {
    const baseUrl = env.ORDS_BASE_URL ? env.ORDS_BASE_URL.replace(/\/$/, '') : '';
    const schemaPath = env.ORDS_SCHEMA_PATH ? env.ORDS_SCHEMA_PATH.replace(/^\/|\/$/g, '') : '';
    const tableAliasPath = env.ORDS_API_PATH ? env.ORDS_API_PATH.replace(/^\/|\/$/g, '') : '';

    const apiUrl = `${baseUrl}/${schemaPath}/${tableAliasPath}/`;

    if (!baseUrl || !schemaPath || !tableAliasPath || !apiUrl.startsWith("https://")) {
        console.error(
            "Failed to construct a valid ORDS AutoREST API URL from environment variables.",
            { baseUrl, schemaPath, tableAliasPath, constructedUrl: apiUrl }
        );
        throw new Error("Invalid ORDS AutoREST API URL configuration.");
    }

    const requestBody = JSON.stringify(colorData);

    const credentials = `${env.DB_USER}:${env.DB_PASSWORD}`;
    const basicAuthHeader = `Basic ${btoa(credentials)}`;

    console.log(`Sending POST to AutoREST: ${apiUrl} for trace_id: ${colorData.trace_id}`);

    // Simple retry with exponential backoff for transient failures
    const maxAttempts = 3;
    let attempt = 0;
    let response: Response | null = null;
    let lastError: any = null;

    while (attempt < maxAttempts) {
        attempt++;
        try {
            response = await fetch(apiUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': basicAuthHeader
                },
                body: requestBody
            });

            // Retry on 5xx; break on success or 4xx
            if (response.ok || (response.status >= 400 && response.status < 500)) {
                break;
            }
        } catch (fetchError: any) {
            lastError = fetchError;
            console.error(`AutoREST network error (attempt ${attempt}/${maxAttempts}) trace=${colorData.trace_id}: ${fetchError?.message}`);
        }

        if (attempt < maxAttempts) {
            const delayMs = Math.min(1000 * 2 ** (attempt - 1), 4000) + Math.floor(Math.random() * 200);
            await new Promise((r) => setTimeout(r, delayMs));
        }
    }

    if (!response || !response.ok) {
        const status = response.status;
        const statusText = response.statusText;
        let errorBodyText = '[Could not retrieve error body text]';
        try {
            errorBodyText = response ? await response.text() : String(lastError || 'no response');
        } catch (e) {
            console.warn(`Could not get text from error response body for trace ${colorData.trace_id}`, e);
        }
        console.error(
            `Failed to insert via AutoREST. Status: ${status} ${statusText}. Trace: ${colorData.trace_id}, URL: ${apiUrl}`,
            { requestBodySent: requestBody, responseBodyText: errorBodyText }
        );
        throw new Error(`Failed to insert via AutoREST: ${status} ${statusText}. Response: ${errorBodyText}`);
    } else {
        console.log(`AutoREST POST success for trace_id: ${colorData.trace_id}. Status: ${response.status}`);
        // const responseData = await response.json();
        // console.log("AutoREST response data:", responseData);
    }
}

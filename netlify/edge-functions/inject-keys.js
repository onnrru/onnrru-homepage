export default async (request, context) => {
    const url = new URL(request.url);
    const path = url.pathname;

    // Clone the request to modify it
    let targetUrl;
    let keyParamName = "key";
    let apiKey = "";
    let extraParams = {};
    let isPathBased = false;

    if (path.startsWith("/api/vworld/")) {
        targetUrl = new URL(path.replace("/api/vworld/", ""), "https://api.vworld.kr/");
        apiKey = Deno.env.get("VWORLD_API_KEY") || "";
        keyParamName = "key";

        // VWorld WMTS uses key in path: /req/wmts/1.0.0/SECRET/Base/...
        if (targetUrl.pathname.includes("/SECRET/")) {
            targetUrl.pathname = targetUrl.pathname.replace("/SECRET/", `/${apiKey}/`);
            isPathBased = true;
        }
    } else if (path.startsWith("/api/molit/")) {
        targetUrl = new URL(path.replace("/api/molit/", ""), "http://apis.data.go.kr/");
        apiKey = Deno.env.get("MOLIT_API_KEY") || "";
        keyParamName = "serviceKey";
    } else if (path.startsWith("/api/eum/")) {
        targetUrl = new URL(path.replace("/api/eum/", ""), "http://api.eum.go.kr/");
        apiKey = Deno.env.get("EUM_API_KEY") || "";
        keyParamName = "key";
        extraParams = { id: Deno.env.get("EUM_API_ID") || "" };
    } else {
        return context.next();
    }

    // Handle Query Parameters
    const searchParams = new URLSearchParams(url.search);

    // Replace placeholders in query params
    if (searchParams.get(keyParamName) === "SECRET") {
        searchParams.set(keyParamName, apiKey);
    } else if (!searchParams.has(keyParamName) && !isPathBased) {
        // If key is missing and not path-based, add it (backward compatibility or missing in FE)
        searchParams.set(keyParamName, apiKey);
    }

    for (const [name, value] of Object.entries(extraParams)) {
        if (searchParams.get(name) === "SECRET" || !searchParams.has(name)) {
            searchParams.set(name, value);
        }
    }

    // Build the final URL
    const finalUrlString = `${targetUrl.protocol}//${targetUrl.host}${targetUrl.pathname}?${searchParams.toString()}`;

    console.log(`Proxying to: ${finalUrlString.replace(apiKey, "HIDDEN")}`);

    // Fetch from the target API
    const response = await fetch(finalUrlString, {
        method: request.method,
        headers: request.headers,
    });

    // Return the response to the client
    return new Response(response.body, response);
};

export const config = {
    path: "/api/*",
};

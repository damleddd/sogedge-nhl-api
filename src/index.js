
export default {
  async fetch(request) {
    const url = new URL(request.url);

    const headers = {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type"
    };

    if (request.method === "OPTIONS") {
      return new Response(null, { headers });
    }

    if (url.pathname === "/api/health") {
      return Response.json(
        { ok: true, app: "SOG EDGE NHL API" },
        { headers }
      );
    }

    if (url.pathname === "/api/schedule") {
      const date = url.searchParams.get("date");

      if (!date || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
        return Response.json(
          { error: "Invalid date" },
          { status: 400, headers }
        );
      }

      try {
        const response = await fetch(
          "https://api-web.nhle.com/v1/schedule/" + date
        );

        if (!response.ok) {
          throw new Error("NHL API returned " + response.status);
        }

        return new Response(await response.text(), {
          headers: {
            ...headers,
            "Content-Type": "application/json"
          }
        });
      } catch (error) {
        return Response.json(
          { error: error.message },
          { status: 502, headers }
        );
      }
    }

    return Response.json(
      { message: "SOG EDGE API is running" },
      { headers }
    );
  }
};

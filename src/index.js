const ALLOWED_ORIGIN = "https://bypassaicheck.com";

function corsHeaders(origin) {
  return {
    "Access-Control-Allow-Origin": origin,
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
    "Access-Control-Max-Age": "86400",
  };
}

export default {
  async fetch(request) {
    const origin = request.headers.get("Origin");

    // CORS check — only allow requests from the approved origin
    if (origin !== ALLOWED_ORIGIN) {
      return new Response(JSON.stringify({ error: "Forbidden" }), {
        status: 403,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Handle preflight
    if (request.method === "OPTIONS") {
      return new Response(null, {
        status: 204,
        headers: corsHeaders(origin),
      });
    }

    // Method validation
    if (request.method !== "POST") {
      return new Response(JSON.stringify({ error: "Method Not Allowed" }), {
        status: 405,
        headers: {
          "Content-Type": "application/json",
          ...corsHeaders(origin),
        },
      });
    }

    // Parse and validate input
    let body;
    try {
      body = await request.json();
    } catch {
      return new Response(JSON.stringify({ error: "Invalid JSON body" }), {
        status: 400,
        headers: {
          "Content-Type": "application/json",
          ...corsHeaders(origin),
        },
      });
    }

    const text = body.text;
    if (!text || typeof text !== "string") {
      return new Response(JSON.stringify({ error: "Text is too short." }), {
        status: 400,
        headers: {
          "Content-Type": "application/json",
          ...corsHeaders(origin),
        },
      });
    }

    const wordCount = text.trim().split(/\s+/).length;
    if (wordCount < 15) {
      return new Response(JSON.stringify({ error: "Text is too short." }), {
        status: 400,
        headers: {
          "Content-Type": "application/json",
          ...corsHeaders(origin),
        },
      });
    }

    // Mock AI scoring
    const simulatedScore = Math.floor(Math.random() * 40) + 60;

    return new Response(
      JSON.stringify({
        status: "success",
        aiScore: simulatedScore,
        message: "Analysis complete",
      }),
      {
        status: 200,
        headers: {
          "Content-Type": "application/json",
          ...corsHeaders(origin),
        },
      }
    );
  },
};

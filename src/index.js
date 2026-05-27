export default {
  async fetch(request, env, ctx) {
    const corsHeaders = {
      "Access-Control-Allow-Origin": "https://bypassaicheck.com",
      "Access-Control-Allow-Methods": "POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
    };

    if (request.method === "OPTIONS") {
      return new Response(null, { headers: corsHeaders });
    }

    if (request.method !== "POST") {
      return new Response("Method Not Allowed", { status: 405, headers: corsHeaders });
    }

    try {
      const { text } = await request.json();

      if (!text || text.split(/\s+/).length < 15) {
        return new Response(JSON.stringify({ error: "Text is too short." }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" }
        });
      }

      const aiResponse = await fetch("https://api.deepseek.com/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${env.AI_API_KEY}`
        },
        body: JSON.stringify({
          model: "deepseek-chat",
          response_format: { type: "json_object" },
          messages: [
            {
              role: "system",
              content: "You are a precise AI detection tool. Analyze the user's text and determine the probability it is AI-generated. You must return ONLY a JSON object with a single key 'aiScore' containing an integer from 0 to 100. Example: {\"aiScore\": 85}"
            },
            {
              role: "user",
              content: text
            }
          ],
          temperature: 0.1
        })
      });

      if (!aiResponse.ok) {
        const errBody = await aiResponse.text();
        const keyCheck = env.AI_API_KEY ? `PRESENT_LEN_${env.AI_API_KEY.length}` : "ABSENT_OR_BLANK";
        throw new Error(`[DEBUG] CF Key Status: ${keyCheck} | HTTP Status: ${aiResponse.status} | Remote Reply: ${errBody}`);
      }

      const aiData = await aiResponse.json();
      const content = aiData.choices[0].message.content;

      let realScore = 50;
      try {
        const parsedResult = JSON.parse(content);
        realScore = parsedResult.aiScore || 50;
      } catch (e) {
        console.error("JSON parse failed, model returned:", content);
      }

      return new Response(JSON.stringify({
        status: "success",
        aiScore: realScore,
        message: "Analysis complete"
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      });

    } catch (error) {
      console.error("Worker Crash Details:", error.stack || error);
      return new Response(JSON.stringify({ error: error.message || "Server Processing Error" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      });
    }
  }
};

// Supabase Edge Function: AI Caddie (premium). Anthropic key lives ONLY here.
// Feature-flagged: without ANTHROPIC_API_KEY the function returns 204 and the
// app silently hides the caddie card.
Deno.serve(async (req) => {
  const key = Deno.env.get("ANTHROPIC_API_KEY");
  if (!key) return new Response(null, { status: 204 });
  const { clubDistances, holeContext } = await req.json();
  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: { "x-api-key": key, "anthropic-version": "2023-06-01", "content-type": "application/json" },
    body: JSON.stringify({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 100,
      system:
        "You are a caddie. Given the player's real average club distances and the hole context " +
        "(distance, wind, elevation, lie, hazards), recommend ONE club in ONE short sentence with the key reason. " +
        "Never lecture. Example: '7-iron — the pin is back and the wind is helping.'",
      messages: [{ role: "user", content: JSON.stringify({ clubDistances, holeContext }) }],
    }),
  });
  const data = await res.json();
  return Response.json({ recommendation: data?.content?.[0]?.text ?? null });
});

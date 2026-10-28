// Supabase Edge Function: Secure Bug Grading & Evaluation Engine
// Deno TypeScript Runtime

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-team-code",
};

// Rate limiter storage (in-memory per instance)
const rateLimitMap = new Map<string, number>();

serve(async (req: Request) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const body = await req.json();
    const { 
      teamCode, 
      roundId, 
      category, 
      targetComponent, 
      title, 
      description, 
      stepsToReproduce, 
      selector 
    } = body;

    if (!teamCode || !category || !description) {
      return new Response(
        JSON.stringify({ accepted: false, points: 0, message: "Missing required submission fields." }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Rate Limiting (Prevent answer brute forcing: max 1 submission every 2 seconds per team)
    const now = Date.now();
    const lastAttempt = rateLimitMap.get(teamCode.toLowerCase()) || 0;
    if (now - lastAttempt < 2000) {
      return new Response(
        JSON.stringify({ 
          accepted: false, 
          points: 0, 
          message: "Please wait 2 seconds between bug submissions." 
        }),
        { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
    rateLimitMap.set(teamCode.toLowerCase(), now);

    // Call secure PostgreSQL stored procedure
    const { data, error } = await supabase.rpc("submit_bug_report", {
      p_team_code: teamCode,
      p_round_id: roundId,
      p_category: category,
      p_target_component: targetComponent || `${category} section`,
      p_title: title || `${category} report`,
      p_description: description,
      p_steps_to_reproduce: stepsToReproduce,
      p_selector: selector || null
    });

    if (error) {
      console.error("Grading RPC error:", error);
      return new Response(
        JSON.stringify({ accepted: false, points: 0, message: "Server validation error. Please try again." }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify(data),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : "Unknown error";
    return new Response(
      JSON.stringify({ accepted: false, points: 0, message: errorMsg }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});


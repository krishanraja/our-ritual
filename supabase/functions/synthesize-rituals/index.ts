import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: req.headers.get('Authorization')! },
        },
      }
    );

    const { data: { user }, error: authError } = await supabaseClient.auth.getUser();
    if (authError || !user) {
      throw new Error('Unauthorized');
    }

    const { partnerOneInput, partnerTwoInput, coupleId } = await req.json();

    console.log('Synthesizing rituals for couple:', coupleId);

    // Prepare AI prompt
    const systemPrompt = `You are a thoughtful ritual designer for couples. Given two partners' weekly inputs, synthesize 3-5 personalized rituals that:
- Balance both partners' energy levels and preferences
- Respect time and budget constraints
- Include variety (at least one micro-ritual, one novelty ritual)
- Create intimacy and surprise
- Feel warm and achievable

Return ONLY a JSON array of rituals, no markdown, no explanation. Each ritual should have:
{
  "title": "Short engaging title",
  "category": "connection|rest|fun|exploration|comfort|intimacy",
  "description": "2-3 sentences describing the ritual",
  "time_estimate": "15 min|30 min|1 hour|2 hours|half day",
  "budget_band": "free|low|medium"
}`;

    const userPrompt = `Partner 1:
Energy: ${partnerOneInput.energy}
Time: ${partnerOneInput.time}
Budget: ${partnerOneInput.budget}
Craving: ${partnerOneInput.craving}
Desire: ${partnerOneInput.desire}

Partner 2:
Energy: ${partnerTwoInput.energy}
Time: ${partnerTwoInput.time}
Budget: ${partnerTwoInput.budget}
Craving: ${partnerTwoInput.craving}
Desire: ${partnerTwoInput.desire}`;

    // Call Lovable AI
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY not configured');
    }

    const aiResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
      }),
    });

    if (!aiResponse.ok) {
      const errorText = await aiResponse.text();
      console.error('AI API error:', aiResponse.status, errorText);
      throw new Error('AI synthesis failed');
    }

    const aiData = await aiResponse.json();
    const ritualText = aiData.choices[0].message.content;
    
    // Parse the JSON response
    let rituals;
    try {
      // Remove markdown code blocks if present
      const cleanText = ritualText.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      rituals = JSON.parse(cleanText);
    } catch (e) {
      console.error('Failed to parse AI response:', ritualText);
      throw new Error('Invalid AI response format');
    }

    console.log('Generated rituals:', rituals);

    return new Response(JSON.stringify({ rituals }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error: any) {
    console.error('Error in synthesize-rituals:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

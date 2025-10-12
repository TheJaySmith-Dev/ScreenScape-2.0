const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

const FREEPIK_API_KEY = 'FPSX38b1f3f74cba72c920b4863726af0168';
const FREEPIK_API_URL = 'https://api.freepik.com/v1/ai/images/generate';

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  try {
    const { prompt } = await req.json();

    if (!prompt) {
      return new Response(
        JSON.stringify({ error: 'Prompt is required' }),
        {
          status: 400,
          headers: {
            ...corsHeaders,
            'Content-Type': 'application/json',
          },
        }
      );
    }

    const apiResponse = await fetch(FREEPIK_API_URL, {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        'X-Freepik-API-Key': FREEPIK_API_KEY,
      },
      body: JSON.stringify({
        prompt: prompt,
        model: 'flux-v1',
        size: '1024x1024'
      }),
    });

    const responseData = await apiResponse.json();

    if (!apiResponse.ok) {
      return new Response(
        JSON.stringify({ error: responseData.message || 'FreePik API error' }),
        {
          status: apiResponse.status,
          headers: {
            ...corsHeaders,
            'Content-Type': 'application/json',
          },
        }
      );
    }

    const imageUrl = responseData.data?.url;

    if (!imageUrl) {
      return new Response(
        JSON.stringify({ error: 'Invalid response format from FreePik API' }),
        {
          status: 500,
          headers: {
            ...corsHeaders,
            'Content-Type': 'application/json',
          },
        }
      );
    }

    return new Response(
      JSON.stringify({ imageUrl }),
      {
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
        },
      }
    );

  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message || 'Internal server error' }),
      {
        status: 500,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
        },
      }
    );
  }
});
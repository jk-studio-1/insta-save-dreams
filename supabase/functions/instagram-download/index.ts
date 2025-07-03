import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface InstagramMediaInfo {
  url: string;
  type: 'photo' | 'video';
  filename: string;
}

async function extractInstagramMedia(url: string): Promise<InstagramMediaInfo> {
  try {
    // Extract post ID from Instagram URL
    const postIdMatch = url.match(/\/p\/([A-Za-z0-9_-]+)/);
    const reelIdMatch = url.match(/\/reel\/([A-Za-z0-9_-]+)/);
    const tvIdMatch = url.match(/\/tv\/([A-Za-z0-9_-]+)/);
    
    const postId = postIdMatch?.[1] || reelIdMatch?.[1] || tvIdMatch?.[1];
    
    if (!postId) {
      throw new Error('URL do Instagram inválida');
    }

    console.log('Tentando extrair mídia para post ID:', postId);

    // Try to fetch Instagram page directly with different user agents
    const userAgents = [
      'Mozilla/5.0 (iPhone; CPU iPhone OS 15_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/15.0 Mobile/15E148 Safari/604.1',
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
      'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
    ];

    for (const userAgent of userAgents) {
      try {
        console.log('Tentando com User-Agent:', userAgent);
        const pageResponse = await fetch(url, {
          headers: {
            'User-Agent': userAgent,
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
            'Accept-Language': 'en-US,en;q=0.5',
            'Accept-Encoding': 'gzip, deflate, br',
            'Connection': 'keep-alive',
            'Upgrade-Insecure-Requests': '1',
          }
        });
        
        if (!pageResponse.ok) {
          console.log('Resposta não ok:', pageResponse.status);
          continue;
        }
        
        const html = await pageResponse.text();
        console.log('HTML obtido, tamanho:', html.length);
        
        // Try multiple patterns to extract media URLs
        const patterns = [
          /"video_url":"([^"]+)"/,
          /"display_url":"([^"]+)"/,
          /og:video" content="([^"]+)"/,
          /og:image" content="([^"]+)"/,
          /"src":"([^"]+\.(?:mp4|jpg|jpeg|png))"/,
          /video_url&quot;:&quot;([^&]+)&quot;/,
          /display_url&quot;:&quot;([^&]+)&quot;/
        ];
        
        for (const pattern of patterns) {
          const match = html.match(pattern);
          if (match) {
            let mediaUrl = match[1].replace(/\\u0026/g, '&').replace(/\\/g, '');
            console.log('URL de mídia encontrada:', mediaUrl);
            
            // Determine if it's video or photo based on URL or pattern used
            const isVideo = mediaUrl.includes('.mp4') || pattern.source.includes('video');
            
            return {
              url: mediaUrl,
              type: isVideo ? 'video' : 'photo',
              filename: `instagram_${isVideo ? 'video' : 'photo'}_${postId}.${isVideo ? 'mp4' : 'jpg'}`
            };
          }
        }
      } catch (error) {
        console.log('Erro com user agent:', userAgent, error);
        continue;
      }
    }
    
    throw new Error('Não foi possível extrair mídia do post do Instagram');
    
  } catch (error) {
    console.error('Erro ao extrair mídia do Instagram:', error);
    throw error;
  }
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { url, type } = await req.json();
    
    console.log('Processing Instagram URL:', url);
    
    // Validate Instagram URL
    const instagramRegex = /^https?:\/\/(www\.)?(instagram\.com|instagr\.am)\/(p|reel|tv)\/[A-Za-z0-9_-]+/;
    if (!instagramRegex.test(url)) {
      throw new Error('URL do Instagram inválida');
    }

    const mediaInfo = await extractInstagramMedia(url);
    
    // Fetch the actual media file
    const mediaResponse = await fetch(mediaInfo.url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      }
    });
    
    if (!mediaResponse.ok) {
      throw new Error('Falha ao baixar o arquivo de mídia');
    }
    
    const mediaBlob = await mediaResponse.blob();
    const contentType = mediaInfo.type === 'video' ? 'video/mp4' : 'image/jpeg';
    
    return new Response(mediaBlob, {
      headers: {
        ...corsHeaders,
        'Content-Type': contentType,
        'Content-Disposition': `attachment; filename="${mediaInfo.filename}"`,
      },
    });
    
  } catch (error) {
    console.error('Error in instagram-download function:', error);
    return new Response(
      JSON.stringify({ 
        error: error.message || 'Erro interno do servidor',
        details: 'Verifique se o URL está correto e se o post é público'
      }), 
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});
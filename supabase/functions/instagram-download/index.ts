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
    console.log('🔍 Iniciando extração para:', url);
    
    // Extract post ID from Instagram URL
    const postIdMatch = url.match(/\/p\/([A-Za-z0-9_-]+)/);
    const reelIdMatch = url.match(/\/reel\/([A-Za-z0-9_-]+)/);
    const tvIdMatch = url.match(/\/tv\/([A-Za-z0-9_-]+)/);
    
    const postId = postIdMatch?.[1] || reelIdMatch?.[1] || tvIdMatch?.[1];
    
    if (!postId) {
      throw new Error('URL do Instagram inválida');
    }

    console.log('📝 Post ID extraído:', postId);

    // Try multiple approaches to get media
    const approaches = [
      // Approach 1: Try with oembed API (works for public posts)
      async () => {
        try {
          console.log('🔄 Tentativa 1: oEmbed API');
          const oembedUrl = `https://graph.facebook.com/v18.0/instagram_oembed?url=${encodeURIComponent(url)}&access_token=anonymous`;
          const response = await fetch(oembedUrl);
          
          if (response.ok) {
            const data = await response.json();
            if (data.thumbnail_url) {
              console.log('✅ Thumbnail encontrada via oEmbed');
              return {
                url: data.thumbnail_url,
                type: 'photo',
                filename: `instagram_photo_${postId}.jpg`
              };
            }
          }
        } catch (e) {
          console.log('❌ oEmbed falhou:', e.message);
        }
        return null;
      },

      // Approach 2: Try with different endpoints
      async () => {
        try {
          console.log('🔄 Tentativa 2: Endpoint direto');
          const directUrl = `https://www.instagram.com/p/${postId}/media/?size=l`;
          const response = await fetch(directUrl, {
            headers: {
              'User-Agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 15_0 like Mac OS X) AppleWebKit/605.1.15',
              'Accept': 'image/webp,image/apng,image/*,*/*;q=0.8',
              'Referer': 'https://www.instagram.com/',
            },
            redirect: 'follow'
          });
          
          if (response.ok && response.headers.get('content-type')?.includes('image')) {
            console.log('✅ Imagem encontrada via endpoint direto');
            return {
              url: response.url,
              type: 'photo',
              filename: `instagram_photo_${postId}.jpg`
            };
          }
        } catch (e) {
          console.log('❌ Endpoint direto falhou:', e.message);
        }
        return null;
      },

      // Approach 3: Parse HTML with mobile user agent
      async () => {
        try {
          console.log('🔄 Tentativa 3: Parse HTML mobile');
          const mobileResponse = await fetch(url, {
            headers: {
              'User-Agent': 'Instagram 123.0.0.21.114 (iPhone; CPU iPhone OS 11_4 like Mac OS X; en_US; en-US; scale=2.00; 750x1334) AppleWebKit/605.1.15',
              'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
              'Accept-Language': 'en-US,en;q=0.5',
              'Cache-Control': 'no-cache',
            }
          });
          
          if (mobileResponse.ok) {
            const html = await mobileResponse.text();
            
            // Look for JSON data in script tags
            const scriptMatch = html.match(/<script[^>]*>window\._sharedData\s*=\s*({.+?});<\/script>/);
            if (scriptMatch) {
              const data = JSON.parse(scriptMatch[1]);
              const media = data?.entry_data?.PostPage?.[0]?.graphql?.shortcode_media;
              
              if (media) {
                const mediaUrl = media.video_url || media.display_url;
                if (mediaUrl) {
                  console.log('✅ Mídia encontrada via _sharedData');
                  return {
                    url: mediaUrl,
                    type: media.video_url ? 'video' : 'photo',
                    filename: `instagram_${media.video_url ? 'video' : 'photo'}_${postId}.${media.video_url ? 'mp4' : 'jpg'}`
                  };
                }
              }
            }
          }
        } catch (e) {
          console.log('❌ Parse HTML mobile falhou:', e.message);
        }
        return null;
      }
    ];

    // Try each approach
    for (const approach of approaches) {
      const result = await approach();
      if (result) {
        console.log('🎉 Sucesso com abordagem, URL:', result.url);
        return result;
      }
    }
    
    throw new Error('Não foi possível extrair mídia do post. Verifique se o post é público.');
    
  } catch (error) {
    console.error('💥 Erro ao extrair mídia:', error);
    throw error;
  }
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('🚀 Iniciando função instagram-download');
    
    const { url, type } = await req.json();
    
    console.log('📥 URL recebida:', url);
    console.log('📥 Tipo solicitado:', type);
    
    // Validate Instagram URL
    const instagramRegex = /^https?:\/\/(www\.)?(instagram\.com|instagr\.am)\/(p|reel|tv)\/[A-Za-z0-9_-]+/;
    if (!instagramRegex.test(url)) {
      console.error('❌ URL inválida:', url);
      return new Response(
        JSON.stringify({ 
          error: 'URL do Instagram inválida',
          details: 'Por favor, forneça um URL válido do Instagram'
        }), 
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    console.log('✅ URL validada com sucesso');

    const mediaInfo = await extractInstagramMedia(url);
    console.log('📸 Mídia extraída:', mediaInfo);
    
    // Fetch the actual media file
    console.log('⬇️ Baixando arquivo de mídia...');
    const mediaResponse = await fetch(mediaInfo.url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 15_0 like Mac OS X) AppleWebKit/605.1.15'
      }
    });
    
    if (!mediaResponse.ok) {
      console.error('❌ Falha ao baixar mídia:', mediaResponse.status, mediaResponse.statusText);
      return new Response(
        JSON.stringify({ 
          error: 'Falha ao baixar o arquivo de mídia',
          details: `Status: ${mediaResponse.status} - ${mediaResponse.statusText}`
        }), 
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }
    
    const mediaBlob = await mediaResponse.arrayBuffer();
    const contentType = mediaInfo.type === 'video' ? 'video/mp4' : 'image/jpeg';
    
    console.log('✅ Download concluído. Tamanho:', mediaBlob.byteLength, 'bytes');
    
    return new Response(mediaBlob, {
      headers: {
        ...corsHeaders,
        'Content-Type': contentType,
        'Content-Disposition': `attachment; filename="${mediaInfo.filename}"`,
        'Content-Length': mediaBlob.byteLength.toString()
      },
    });
    
  } catch (error) {
    console.error('💥 Erro na função instagram-download:', error);
    console.error('Stack trace:', error.stack);
    
    return new Response(
      JSON.stringify({ 
        error: error.message || 'Erro interno do servidor',
        details: 'Verifique se o URL está correto e se o post é público',
        timestamp: new Date().toISOString()
      }), 
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});
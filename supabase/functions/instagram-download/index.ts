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

async function extractInstagramMediaFromAPI(instagramUrl: string): Promise<InstagramMediaInfo> {
  try {
    console.log('🔍 Usando API externa para:', instagramUrl);
    
    // Try saveig.app API first
    try {
      console.log('🔄 Tentando saveig.app API');
      const saveigResponse = await fetch('https://saveig.app/api/ajaxSearch', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        },
        body: `q=${encodeURIComponent(instagramUrl)}&t=media&lang=en`
      });

      if (saveigResponse.ok) {
        const result = await saveigResponse.json();
        console.log('📦 Resposta saveig:', result);
        
        if (result.status === 'ok' && result.data) {
          const media = result.data[0];
          if (media) {
            console.log('✅ Mídia encontrada via saveig.app');
            return {
              url: media.url,
              type: media.type === 'video' ? 'video' : 'photo',
              filename: `instagram_${media.type}_${Date.now()}.${media.type === 'video' ? 'mp4' : 'jpg'}`
            };
          }
        }
      }
    } catch (e) {
      console.log('❌ saveig.app falhou:', e.message);
    }

    // Try snapinsta.app API as fallback
    try {
      console.log('🔄 Tentando snapinsta.app API');
      const snapResponse = await fetch('https://snapinsta.app/api/ajaxSearch', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        },
        body: `q=${encodeURIComponent(instagramUrl)}&t=media&lang=en`
      });

      if (snapResponse.ok) {
        const result = await snapResponse.json();
        console.log('📦 Resposta snapinsta:', result);
        
        if (result.status === 'ok' && result.data) {
          const media = result.data[0];
          if (media) {
            console.log('✅ Mídia encontrada via snapinsta.app');
            return {
              url: media.url,
              type: media.type === 'video' ? 'video' : 'photo',
              filename: `instagram_${media.type}_${Date.now()}.${media.type === 'video' ? 'mp4' : 'jpg'}`
            };
          }
        }
      }
    } catch (e) {
      console.log('❌ snapinsta.app falhou:', e.message);
    }

    // Try direct Instagram media extraction as final fallback
    console.log('🔄 Tentando extração direta como último recurso');
    const postIdMatch = instagramUrl.match(/\/p\/([A-Za-z0-9_-]+)/);
    const reelIdMatch = instagramUrl.match(/\/reel\/([A-Za-z0-9_-]+)/);
    const tvIdMatch = instagramUrl.match(/\/tv\/([A-Za-z0-9_-]+)/);
    
    const postId = postIdMatch?.[1] || reelIdMatch?.[1] || tvIdMatch?.[1];
    
    if (postId) {
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
    }
    
    throw new Error('Não foi possível extrair mídia usando nenhuma API disponível');
    
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

    const mediaInfo = await extractInstagramMediaFromAPI(url);
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
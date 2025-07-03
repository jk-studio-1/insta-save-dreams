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
    console.log('🔍 Usando API externa robusta para:', instagramUrl);
    
    // Try RapidAPI Instagram Downloader (mais confiável)
    try {
      console.log('🔄 Tentando RapidAPI Instagram Downloader');
      const rapidResponse = await fetch('https://instagram-downloader-download-instagram-videos-stories.p.rapidapi.com/index', {
        method: 'GET',
        headers: {
          'X-RapidAPI-Key': 'demo', // Using demo key, user can upgrade
          'X-RapidAPI-Host': 'instagram-downloader-download-instagram-videos-stories.p.rapidapi.com',
          'url': instagramUrl
        }
      });

      if (rapidResponse.ok) {
        const result = await rapidResponse.json();
        console.log('📦 Resposta RapidAPI:', result);
        
        if (result.media && result.media.length > 0) {
          const media = result.media[0];
          console.log('✅ Mídia encontrada via RapidAPI');
          return {
            url: media.url,
            type: media.type === 'video' ? 'video' : 'photo',
            filename: `instagram_${media.type}_${Date.now()}.${media.type === 'video' ? 'mp4' : 'jpg'}`
          };
        }
      }
    } catch (e) {
      console.log('❌ RapidAPI falhou:', e.message);
    }

    // Try InstaDL API (grátis e confiável)
    try {
      console.log('🔄 Tentando InstaDL API');
      const instadlResponse = await fetch(`https://api.instadl.co/download?url=${encodeURIComponent(instagramUrl)}`, {
        method: 'GET',
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        }
      });

      if (instadlResponse.ok) {
        const result = await instadlResponse.json();
        console.log('📦 Resposta InstaDL:', result);
        
        if (result.success && result.data && result.data.download_url) {
          console.log('✅ Mídia encontrada via InstaDL');
          return {
            url: result.data.download_url,
            type: result.data.type === 'video' ? 'video' : 'photo',
            filename: `instagram_${result.data.type}_${Date.now()}.${result.data.type === 'video' ? 'mp4' : 'jpg'}`
          };
        }
      }
    } catch (e) {
      console.log('❌ InstaDL falhou:', e.message);
    }

    // Try YTDLPServer API (baseado em yt-dlp, muito confiável)
    try {
      console.log('🔄 Tentando YTDLPServer API');
      const ytdlpResponse = await fetch('https://api.cobalt.tools/api/json', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        },
        body: JSON.stringify({
          url: instagramUrl,
          vQuality: "720",
          aFormat: "best",
          filenamePattern: "pretty",
          isAudioOnly: false,
          isTTFullAudio: false
        })
      });

      if (ytdlpResponse.ok) {
        const result = await ytdlpResponse.json();
        console.log('📦 Resposta Cobalt:', result);
        
        if (result.status === 'success' && result.url) {
          console.log('✅ Mídia encontrada via Cobalt Tools');
          return {
            url: result.url,
            type: result.url.includes('.mp4') ? 'video' : 'photo',
            filename: `instagram_download_${Date.now()}.${result.url.includes('.mp4') ? 'mp4' : 'jpg'}`
          };
        }
      }
    } catch (e) {
      console.log('❌ Cobalt Tools falhou:', e.message);
    }

    // Try DownloadGram API
    try {
      console.log('🔄 Tentando DownloadGram API');
      const downloadgramResponse = await fetch('https://downloadgram.com/api.php', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
          'Referer': 'https://downloadgram.com/'
        },
        body: `url=${encodeURIComponent(instagramUrl)}`
      });

      if (downloadgramResponse.ok) {
        const text = await downloadgramResponse.text();
        console.log('📦 Resposta DownloadGram (texto):', text.substring(0, 200));
        
        // Parse HTML response to extract download link
        const urlMatch = text.match(/https:\/\/[^"'>\s]+\.(?:jpg|jpeg|png|mp4|webm)/i);
        if (urlMatch) {
          const downloadUrl = urlMatch[0];
          console.log('✅ Mídia encontrada via DownloadGram');
          return {
            url: downloadUrl,
            type: downloadUrl.includes('.mp4') || downloadUrl.includes('.webm') ? 'video' : 'photo',
            filename: `instagram_downloadgram_${Date.now()}.${downloadUrl.includes('.mp4') || downloadUrl.includes('.webm') ? 'mp4' : 'jpg'}`
          };
        }
      }
    } catch (e) {
      console.log('❌ DownloadGram falhou:', e.message);
    }

    throw new Error('Todas as APIs de download falharam. Tente outro link ou tente novamente mais tarde.');
    
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
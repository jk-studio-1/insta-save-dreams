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
      throw new Error('Invalid Instagram URL');
    }

    // Use a public API service for Instagram media extraction
    const apiUrl = `https://instagram-media-downloader.p.rapidapi.com/rapid-instagram.php`;
    
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: `url=${encodeURIComponent(url)}`
    });

    if (!response.ok) {
      // Fallback: try alternative method by fetching Instagram page directly
      const pageResponse = await fetch(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
        }
      });
      
      const html = await pageResponse.text();
      
      // Extract video URL from page HTML
      const videoMatch = html.match(/"video_url":"([^"]+)"/);
      const imageMatch = html.match(/"display_url":"([^"]+)"/);
      
      if (videoMatch) {
        const videoUrl = videoMatch[1].replace(/\\u0026/g, '&').replace(/\\/g, '');
        return {
          url: videoUrl,
          type: 'video',
          filename: `instagram_video_${postId}.mp4`
        };
      } else if (imageMatch) {
        const imageUrl = imageMatch[1].replace(/\\u0026/g, '&').replace(/\\/g, '');
        return {
          url: imageUrl,
          type: 'photo',
          filename: `instagram_photo_${postId}.jpg`
        };
      }
      
      throw new Error('Could not extract media from Instagram post');
    }

    const data = await response.json();
    
    if (data.video_url) {
      return {
        url: data.video_url,
        type: 'video',
        filename: `instagram_video_${postId}.mp4`
      };
    } else if (data.image_url) {
      return {
        url: data.image_url,
        type: 'photo',
        filename: `instagram_photo_${postId}.jpg`
      };
    }
    
    throw new Error('No media found');
    
  } catch (error) {
    console.error('Error extracting Instagram media:', error);
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
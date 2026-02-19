import { useState, useEffect } from 'react';
import { 
  Download, 
  Music, 
  Image, 
  Video, 
  Link2, 
  CheckCircle2, 
  Loader2,
  Sparkles,
  Zap,
  Shield,
  Globe,
  Heart,
  Share2,
  Play,
  FileAudio,
  FileImage,
  FileVideo,
  X,
  AlertCircle,
  ExternalLink,
  Copy,
  Check,
  ArrowRight,
  Star,
  TrendingUp,
  Layers,
  Cpu
} from 'lucide-react';
import { Button } from './components/ui/button';
import { Input } from './components/ui/input';
import { Card, CardContent } from './components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './components/ui/tabs';
import { Badge } from './components/ui/badge';
import { toast } from 'sonner';
import './App.css';

interface TikTokData {
  id: string;
  title: string;
  author: string;
  authorAvatar: string;
  cover: string;
  duration: string;
  likes: string;
  shares: string;
  plays: string;
  videoUrl: string;
  videoUrlNoWatermark: string;
  audioUrl: string;
  images?: string[];
  isSlideshow: boolean;
  description: string;
}

function App() {
  const [url, setUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<TikTokData | null>(null);
  const [activeTab, setActiveTab] = useState('video');
  const [downloading, setDownloading] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  // Scroll reveal effect
  useEffect(() => {
    const observerCallback = (entries: IntersectionObserverEntry[]) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('revealed');
        }
      });
    };

    const observer = new IntersectionObserver(observerCallback, {
      threshold: 0.1,
      rootMargin: '0px 0px -50px 0px',
    });

    document.querySelectorAll('.reveal-on-scroll').forEach((el) => {
      observer.observe(el);
    });

    return () => observer.disconnect();
  }, [data]);

  const validateUrl = (input: string): boolean => {
    const tiktokRegex = /https?:\/\/(?:www\.)?(?:tiktok\.com|vm\.tiktok\.com|vt\.tiktok\.com|m\.tiktok\.com)/;
    return tiktokRegex.test(input);
  };

  const formatNumber = (num: number): string => {
    if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
    if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
    return num.toString();
  };

  const formatDuration = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleCopy = () => {
    if (url) {
      navigator.clipboard.writeText(url);
      setCopied(true);
      toast.success('Link disalin!');
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleFetch = async () => {
    if (!url.trim()) {
      toast.error('Masukkan URL TikTok terlebih dahulu');
      return;
    }

    if (!validateUrl(url)) {
      toast.error('URL TikTok TIDAK VALID, PASTIKAN URL SUDAH BENAR!');
      return;
    }

    setLoading(true);
    setData(null);
    setError(null);

    try {
      const apis = [
        {
          url: `https://api.tiklydown.eu.org/api/download?url=${encodeURIComponent(url)}`,
          parser: (data: any) => ({
            id: data.video?.id || Date.now().toString(),
            title: data.title || 'TikTok Video',
            author: data.author?.nickname || data.author?.username || '@user',
            authorAvatar: data.author?.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${Date.now()}`,
            cover: data.video?.cover || data.video?.origin_cover || '',
            duration: formatDuration(data.video?.duration || 0),
            likes: formatNumber(data.stats?.diggCount || 0),
            shares: formatNumber(data.stats?.shareCount || 0),
            plays: formatNumber(data.stats?.playCount || 0),
            videoUrl: data.video?.play || data.video?.wmplay || '',
            videoUrlNoWatermark: data.video?.play || data.video?.hdplay || '',
            audioUrl: data.music?.play || '',
            images: data.images?.map((img: any) => img.url || img) || [],
            isSlideshow: data.images && data.images.length > 0,
            description: data.title || ''
          })
        },
        {
          url: `https://www.tikwm.com/api/?url=${encodeURIComponent(url)}&hd=1`,
          parser: (data: any) => {
            const result = data.data;
            return {
              id: result.id || Date.now().toString(),
              title: result.title || 'TikTok Video',
              author: result.author?.nickname || '@' + result.author?.unique_id || '@user',
              authorAvatar: result.author?.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${Date.now()}`,
              cover: result.cover || result.origin_cover || '',
              duration: formatDuration(result.duration || 0),
              likes: formatNumber(result.digg_count || 0),
              shares: formatNumber(result.share_count || 0),
              plays: formatNumber(result.play_count || 0),
              videoUrl: result.play || result.wmplay || '',
              videoUrlNoWatermark: result.hdplay || result.play || '',
              audioUrl: result.music || '',
              images: result.images?.map((img: any) => img.url || img) || [],
              isSlideshow: result.images && result.images.length > 0,
              description: result.title || ''
            };
          }
        }
      ];

      let success = false;
      let lastError = '';

      for (const api of apis) {
        try {
          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), 15000);

          const response = await fetch(api.url, {
            method: 'GET',
            headers: {
              'Accept': 'application/json',
            },
            signal: controller.signal
          });

          clearTimeout(timeoutId);

          if (!response.ok) {
            lastError = `API error: ${response.status}`;
            continue;
          }

          const result = await response.json();
          
          if (result.code === -1 || result.msg === 'failed' || (!result.data && !result.video)) {
            lastError = 'Video not found or API failed';
            continue;
          }

          const parsedData = api.parser(result);
          
          if (!parsedData.videoUrl && !parsedData.images?.length) {
            lastError = 'No video or images found';
            continue;
          }

          setData(parsedData);
          toast.success('Berhasil mengambil data video!');
          success = true;
          break;

        } catch (err: any) {
          lastError = err.message || 'Network error';
          console.log(`API failed: ${api.url}`, err);
          continue;
        }
      }

      if (!success) {
        setError(`Gagal mengambil data: ${lastError}. Coba link TikTok lain atau coba lagi nanti.`);
        toast.error('Gagal mengambil data video');
      }

    } catch (error: any) {
      setError('Terjadi kesalahan. Silakan coba lagi.');
      toast.error('Gagal mengambil data');
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = async (type: 'video' | 'audio' | 'image', index?: number) => {
  const downloadId = type === 'image' ? `image-${index}` : type;
  setDownloading(downloadId);

  try {
    let downloadUrl = '';
    let fileName = '';

    if (type === 'video') {
      downloadUrl = data?.videoUrlNoWatermark || data?.videoUrl || '';
      fileName = `tiktok_video_${data?.id}.mp4`;
    } else if (type === 'audio') {
      downloadUrl = data?.audioUrl || '';
      fileName = `tiktok_audio_${data?.id}.mp3`;
    } else if (type === 'image' && index !== undefined) {
      downloadUrl = data?.images?.[index] || '';
      fileName = `tiktok_image_${data?.id}_${index + 1}.jpg`;
    }

    if (!downloadUrl) {
      toast.error('URL download tidak tersedia');
      return;
    }

    const response = await fetch(downloadUrl);

    if (!response.ok) {
      throw new Error('Gagal mengambil file');
    }

    const blob = await response.blob();
    const blobUrl = window.URL.createObjectURL(blob);

    const link = document.createElement('a');
    link.href = blobUrl;
    link.setAttribute('download', fileName);

    document.body.appendChild(link);
    link.click();
    link.remove();

    window.URL.revokeObjectURL(blobUrl);

    toast.success('Download dimulai!');
  } catch (error) {
    console.error(error);
    toast.error('Gagal mengunduh file.');
  } finally {
    setDownloading(null);
  }
};
  

const openInNewTab = (url: string) => {
    window.open(url, '_blank', 'noopener,noreferrer');
  };
  
  const clearData = () => {
    setData(null);
    setUrl('');
    setError(null);
  };

  return (
    <div className="min-h-screen bg-[#0a0a0f] text-white overflow-x-hidden font-sans">
      {/* Animated Background Grid */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:60px_60px]" />
        <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-violet-600/20 rounded-full blur-[120px] animate-pulse" />
        <div className="absolute bottom-0 right-1/4 w-[500px] h-[500px] bg-fuchsia-600/20 rounded-full blur-[120px] animate-pulse" style={{ animationDelay: '1.5s' }} />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-indigo-600/10 rounded-full blur-[150px]" />
      </div>

      {/* Navbar */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-[#0a0a0f]/80 backdrop-blur-2xl border-b border-white/5">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-20">
            <div className="flex items-center gap-3">
              <div className="relative w-12 h-12 rounded-xl bg-gradient-to-br from-violet-500 via-fuchsia-500 to-pink-500 flex items-center justify-center overflow-hidden group">
                <div className="absolute inset-0 bg-gradient-to-br from-violet-400 via-fuchsia-400 to-pink-400 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                <Download className="w-6 h-6 text-white relative z-10" />
              </div>
              <div>
                <span className="text-2xl font-bold bg-gradient-to-r from-white via-violet-200 to-fuchsia-200 bg-clip-text text-transparent">
                  EZ-DOWNLOADER
                </span>
                <p className="text-xs text-slate-500 -mt-1">TikTok Media Downloader</p>
              </div>
            </div>
            <div className="flex items-center gap-6">
              <a href="#features" className="text-sm text-slate-400 hover:text-white transition-colors hidden sm:flex items-center gap-1 group">
                <Layers className="w-4 h-4 group-hover:text-violet-400 transition-colors" />
                Fitur
              </a>
              <a href="#how-it-works" className="text-sm text-slate-400 hover:text-white transition-colors hidden sm:flex items-center gap-1 group">
                <Cpu className="w-4 h-4 group-hover:text-violet-400 transition-colors" />
                Cara Pakai
              </a>
              <Button variant="outline" size="sm" className="border-white/10 bg-white/5 hover:bg-white/10 hover:border-violet-500/50 transition-all">
                <Globe className="w-4 h-4 mr-2 text-violet-400" />
                ID
              </Button>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative pt-40 pb-24 px-4 sm:px-6 lg:px-8">
        <div className="max-w-5xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-gradient-to-r from-violet-500/10 to-fuchsia-500/10 border border-violet-500/20 mb-8 animate-fade-in">
            <Sparkles className="w-4 h-4 text-violet-400" />
            <span className="text-sm font-medium bg-gradient-to-r from-violet-300 to-fuchsia-300 bg-clip-text text-transparent">Gratis & Tanpa Watermark</span>
            <span className="px-2 py-0.5 rounded-full bg-violet-500/20 text-violet-300 text-xs">v2.0</span>
          </div>
          
          <h1 className="text-5xl sm:text-6xl lg:text-7xl font-bold mb-8 animate-fade-in leading-tight">
            <span className="bg-gradient-to-r from-white via-slate-200 to-slate-400 bg-clip-text text-transparent">
              Download Video
            </span>
            <br />
            <span className="bg-gradient-to-r from-violet-400 via-fuchsia-400 to-pink-400 bg-clip-text text-transparent">
              TikTok Tanpa Watermark
            </span>
          </h1>
          
          <p className="text-lg sm:text-xl text-slate-400 mb-12 max-w-2xl mx-auto animate-fade-in leading-relaxed">
            Unduh video, foto, dan audio TikTok dengan kualitas HD. <span className="text-violet-400">Cepat</span>, <span className="text-fuchsia-400">gratis</span>, dan <span className="text-pink-400">tanpa watermark</span>!
          </p>

          {/* Input Section */}
          <Card className="bg-gradient-to-br from-white/[0.08] to-white/[0.02] border border-white/10 backdrop-blur-2xl overflow-hidden animate-fade-in shadow-2xl shadow-violet-500/5">
            <CardContent className="p-8">
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="flex-1 relative group">
                  <div className="absolute inset-0 bg-gradient-to-r from-violet-500/20 to-fuchsia-500/20 rounded-xl opacity-0 group-focus-within:opacity-100 transition-opacity blur-xl" />
                  <Link2 className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500 group-focus-within:text-violet-400 transition-colors" />
                  <Input
                    placeholder="Tempel link TikTok di sini..."
                    value={url}
                    onChange={(e) => setUrl(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleFetch()}
                    className="relative pl-14 pr-12 h-16 bg-white/5 border-white/10 text-white placeholder:text-slate-500 focus:border-violet-500/50 focus:ring-violet-500/20 rounded-xl text-base"
                  />
                  {url && (
                    <button 
                      onClick={handleCopy}
                      className="absolute right-4 top-1/2 -translate-y-1/2 p-2 rounded-lg hover:bg-white/10 transition-colors"
                    >
                      {copied ? <Check className="w-4 h-4 text-green-400" /> : <Copy className="w-4 h-4 text-slate-500" />}
                    </button>
                  )}
                </div>
                <Button
                  onClick={handleFetch}
                  disabled={loading}
                  className="h-16 px-10 bg-gradient-to-r from-violet-600 via-fuchsia-600 to-pink-600 hover:from-violet-500 hover:via-fuchsia-500 hover:to-pink-500 text-white font-semibold rounded-xl text-lg shadow-lg shadow-violet-500/25 hover:shadow-violet-500/40 transition-all hover:scale-[1.02] active:scale-[0.98]"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-5 h-5 mr-3 animate-spin" />
                      Memproses...
                    </>
                  ) : (
                    <>
                      <Download className="w-5 h-5 mr-3" />
                      Download
                    </>
                  )}
                </Button>
              </div>

              {/* Supported Formats */}
              <div className="flex flex-wrap justify-center gap-3 mt-6">
                {[
                  { icon: Video, label: 'MP4 HD' },
                  { icon: Music, label: 'MP3' },
                  { icon: Image, label: 'JPG/PNG' },
                  { icon: CheckCircle2, label: 'No Watermark' },
                ].map((item, idx) => (
                  <Badge 
                    key={idx} 
                    variant="secondary" 
                    className="bg-white/5 hover:bg-white/10 text-slate-300 border border-white/10 px-4 py-2 text-sm transition-all hover:scale-105"
                  >
                    <item.icon className="w-4 h-4 mr-2 text-violet-400" /> 
                    {item.label}
                  </Badge>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Error Message */}
          {error && (
            <div className="mt-6 p-5 rounded-xl bg-red-500/10 border border-red-500/30 flex items-start gap-4 animate-fade-in">
              <AlertCircle className="w-6 h-6 text-red-400 flex-shrink-0 mt-0.5" />
              <div className="text-left">
                <p className="text-red-400 font-medium">{error}</p>
                <p className="text-slate-500 text-sm mt-1">
                  Tips: Pastikan link TikTok valid dan video tidak di-private. Coba link lain jika masalah berlanjut.
                </p>
              </div>
            </div>
          )}

          {/* Stats */}
          <div className="flex flex-wrap justify-center gap-8 mt-12 animate-fade-in">
            {[
              { value: '10M+', label: 'Downloads' },
              { value: '100%', label: 'Gratis' },
              { value: 'HD', label: 'Kualitas' },
              { value: '24/7', label: 'Support' },
            ].map((stat, idx) => (
              <div key={idx} className="text-center">
                <p className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-violet-400 to-fuchsia-400 bg-clip-text text-transparent">{stat.value}</p>
                <p className="text-sm text-slate-500">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Result Section */}
      {data && (
        <section className="relative py-12 px-4 sm:px-6 lg:px-8 animate-fade-in">
          <div className="max-w-5xl mx-auto">
            <Card className="bg-gradient-to-br from-white/[0.08] to-white/[0.02] border border-white/10 backdrop-blur-2xl overflow-hidden shadow-2xl shadow-violet-500/5">
              <CardContent className="p-8">
                <div className="flex items-center justify-between mb-8">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-violet-500 to-fuchsia-500 flex items-center justify-center">
                      <CheckCircle2 className="w-5 h-5 text-white" />
                    </div>
                    <h2 className="text-2xl font-bold">Hasil Download</h2>
                  </div>
                  <Button variant="ghost" size="icon" onClick={clearData} className="text-slate-400 hover:text-white hover:bg-white/10 rounded-xl">
                    <X className="w-5 h-5" />
                  </Button>
                </div>

                <div className="grid lg:grid-cols-2 gap-8">
                   {/* Preview */}
                  <div className="relative aspect-[3/4] rounded-2xl overflow-hidden bg-slate-900/50 border border-white/10 group">
                    {data.isSlideshow ? (
                      <div className="w-full h-full relative">
                        <img
                          src={data.images?.[0] || data.cover}
                          alt={data.title}
                          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                        />
                        {data.images && data.images.length > 1 && (
                          <div className="absolute top-4 right-4 px-4 py-2 rounded-full bg-black/60 backdrop-blur-md text-white text-sm font-medium border border-white/10">
                            {data.images.length} Foto
                          </div>
                        )}
                      </div>
                    ) : (
                      <>
                        <img
                          src={data.cover}
                          alt={data.title}
                          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                        />
                        <div className="absolute inset-0 flex items-center justify-center">
                          <div className="w-20 h-20 rounded-full bg-black/50 flex items-center justify-center backdrop-blur-sm border border-white/20 group-hover:scale-110 transition-transform cursor-pointer">
                            <Play className="w-10 h-10 text-white ml-1" />
                          </div>
                        </div>
                      </>
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent" />
                    <div className="absolute bottom-0 left-0 right-0 p-6">
                      <div className="flex items-center gap-4 mb-4">
                        <img
                          src={data.authorAvatar}
                          alt={data.author}
                          className="w-14 h-14 rounded-full border-2 border-violet-500/50"
                        />
                        <div>
                          <p className="font-semibold text-lg">{data.author}</p>
                          <p className="text-sm text-slate-400">{data.duration}</p>
                        </div>
                      </div>
                      <p className="text-sm line-clamp-2 text-slate-300">{data.description}</p>
                      <div className="flex items-center gap-6 mt-4 text-sm text-slate-400">
                        <span className="flex items-center gap-2">
                          <Play className="w-4 h-4 text-violet-400" /> {data.plays}
                        </span>
                        <span className="flex items-center gap-2">
                          <Heart className="w-4 h-4 text-pink-400" /> {data.likes}
                        </span>
                        <span className="flex items-center gap-2">
                          <Share2 className="w-4 h-4 text-fuchsia-400" /> {data.shares}
                        </span>
                      </div>
                    </div>
                  </div>
                 
           {/* Download Options */}
                  <div>
                    <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                      <TabsList className="w-full grid grid-cols-3 bg-white/5 p-1 rounded-xl">
                        <TabsTrigger value="video" className="rounded-lg data-[state=active]:bg-gradient-to-r data-[state=active]:from-violet-600 data-[state=active]:to-fuchsia-600 data-[state=active]:text-white transition-all">
                          <FileVideo className="w-4 h-4 mr-2" /> Video
                        </TabsTrigger>
                        <TabsTrigger value="audio" className="rounded-lg data-[state=active]:bg-gradient-to-r data-[state=active]:from-violet-600 data-[state=active]:to-fuchsia-600 data-[state=active]:text-white transition-all">
                          <FileAudio className="w-4 h-4 mr-2" /> Audio
                        </TabsTrigger>
                        <TabsTrigger value="images" className="rounded-lg data-[state=active]:bg-gradient-to-r data-[state=active]:from-violet-600 data-[state=active]:to-fuchsia-600 data-[state=active]:text-white transition-all">
                          <FileImage className="w-4 h-4 mr-2" /> Foto
                        </TabsTrigger>
                      </TabsList>
                      
                      <TabsContent value="video" className="mt-6">
                        <div className="space-y-4">
                          {data.videoUrl ? (
                            <div className="p-5 rounded-xl bg-white/5 border border-white/10 hover:border-violet-500/30 transition-all">
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-4">
                                  <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-violet-500/20 to-fuchsia-500/20 flex items-center justify-center">
                                    <Video className="w-7 h-7 text-violet-400" />
                                  </div>
                                  <div>
                                    <p className="font-semibold text-lg">Video HD</p>
                                    <p className="text-sm text-slate-400">MP4 • Tanpa Watermark • Kualitas Terbaik</p>
                                  </div>
                                </div>
                                <div className="flex gap-3">

                                  <Button
                                    onClick={() => openInNewTab(data.videoUrlNoWatermark || data.videoUrl)}
                                    variant="outline"
                                    size="icon"
                                    className="border-white/20 hover:bg-white/10 hover:border-violet-500/50 rounded-xl h-12 w-12"
                                  >
                                    <ExternalLink className="w-5 h-5" />
                                  </Button>
                                  
                                  <Button
                                    onClick={() => handleDownload('video')}
                                    disabled={downloading === 'video'}
                                    className="bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:from-violet-500 hover:to-fuchsia-500 rounded-xl h-12 px-6"
                                  >
                                    {downloading === 'video' ? (
                                      <Loader2 className="w-5 h-5 animate-spin" />
                                    ) : (
                                      <Download className="w-5 h-5" />
                                    )}
                                  </Button>
                                </div>
                              </div>
                            </div>
                          ) : (
                            <div className="p-8 rounded-xl bg-white/5 border border-white/10 text-center">
                              <Image className="w-16 h-16 text-slate-600 mx-auto mb-4" />
                              <p className="text-slate-400">Konten ini adalah slideshow foto.</p>
                              <p className="text-slate-500 text-sm mt-2">Pilih tab &quot;Foto&quot; untuk download.</p>
                            </div>
                          )}
                        </div>
                      </TabsContent>

                      <TabsContent value="audio" className="mt-6">
                        <div className="space-y-4">
                          {data.audioUrl ? (
                            <div className="p-5 rounded-xl bg-white/5 border border-white/10 hover:border-violet-500/30 transition-all">
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-4">
                                  <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-pink-500/20 to-rose-500/20 flex items-center justify-center">
                                    <Music className="w-7 h-7 text-pink-400" />
                                  </div>
                                  <div>
                                    <p className="font-semibold text-lg">Audio MP3</p>
                                    <p className="text-sm text-slate-400">High Quality • Original Sound</p>
                                  </div>
                                </div>
                                <div className="flex gap-3">
                                  <Button
                                    onClick={() => openInNewTab(data.audioUrl)}
                                    variant="outline"
                                    size="icon"
                                    className="border-white/20 hover:bg-white/10 hover:border-pink-500/50 rounded-xl h-12 w-12"
                                  >
                                    <ExternalLink className="w-5 h-5" />
                                  </Button>
                                  <Button
                                    onClick={() => handleDownload('audio')}
                                    disabled={downloading === 'audio'}
                                    className="bg-gradient-to-r from-pink-600 to-rose-600 hover:from-pink-500 hover:to-rose-500 rounded-xl h-12 px-6"
                                  >
                                    {downloading === 'audio' ? (
                                      <Loader2 className="w-5 h-5 animate-spin" />
                                    ) : (
                                      <Download className="w-5 h-5" />
                                    )}
                                  </Button>
                                </div>
                              </div>
                            </div>
                          ) : (
                            <div className="p-8 rounded-xl bg-white/5 border border-white/10 text-center">
                              <Music className="w-16 h-16 text-slate-600 mx-auto mb-4" />
                              <p className="text-slate-400">Audio tidak tersedia untuk konten ini.</p>
                            </div>
                          )}
                        </div>
                      </TabsContent>

                      <TabsContent value="images" className="mt-6">
                        <div className="space-y-4 max-h-[400px] overflow-y-auto custom-scrollbar">
                          {data.images && data.images.length > 0 ? (
                            data.images.map((img, idx) => (
                              <div key={idx} className="p-4 rounded-xl bg-white/5 border border-white/10 hover:border-violet-500/30 transition-all">
                                <div className="flex items-center justify-between">
                                  <div className="flex items-center gap-4">
                                    <img 
                                      src={img} 
                                      alt={`Foto ${idx + 1}`} 
                                      className="w-16 h-16 rounded-xl object-cover border border-white/10" 
                                    />
                                    <div>
                                      <p className="font-semibold">Foto {idx + 1}</p>
                                      <p className="text-sm text-slate-400">JPG • HD Quality</p>
                                    </div>
                                  </div>
                                  <div className="flex gap-3">
                                    <Button
                                      onClick={() => openInNewTab(img)}
                                      variant="outline"
                                      size="icon"
                                      className="border-white/20 hover:bg-white/10 hover:border-violet-500/50 rounded-xl h-11 w-11"
                                    >
                                      <ExternalLink className="w-4 h-4" />
                                    </Button>
                                    <Button
                                      onClick={() => handleDownload('image', idx)}
                                      disabled={downloading === `image-${idx}`}
                                      className="bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:from-violet-500 hover:to-fuchsia-500 rounded-xl h-11 px-5"
                                    >
                                      {downloading === `image-${idx}` ? (
                                        <Loader2 className="w-4 h-4 animate-spin" />
                                      ) : (
                                        <Download className="w-4 h-4" />
                                      )}
                                    </Button>
                                  </div>
                                </div>
                              </div>
                            ))
                          ) : (
                            <div className="p-8 rounded-xl bg-white/5 border border-white/10 text-center">
                              <Video className="w-16 h-16 text-slate-600 mx-auto mb-4" />
                              <p className="text-slate-400">Konten ini adalah video.</p>
                              <p className="text-slate-500 text-sm mt-2">Pilih tab &quot;Video&quot; untuk download.</p>
                            </div>
                          )}
                        </div>
                      </TabsContent>
                    </Tabs>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </section>
      )}

      {/* Features Section */}
      <section id="features" className="relative py-24 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16 reveal-on-scroll">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-violet-500/10 border border-violet-500/20 mb-6">
              <Star className="w-4 h-4 text-violet-400" />
              <span className="text-sm text-violet-300">Fitur Unggulan</span>
            </div>
            <h2 className="text-4xl sm:text-5xl font-bold mb-6">
              <span className="bg-gradient-to-r from-white to-slate-400 bg-clip-text text-transparent">
                Kenapa Pilih EZ-Downloader?
              </span>
            </h2>
            <p className="text-slate-400 text-lg max-w-2xl mx-auto">
              Kami menyediakan layanan download TikTok terbaik dengan berbagai keunggulan
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              {
                icon: <Zap className="w-7 h-7" />,
                title: 'Cepat & Mudah',
                description: 'Download dalam hitungan detik dengan antarmuka yang simpel dan intuitif',
                color: 'from-amber-500 to-orange-500',
                bgColor: 'from-amber-500/20 to-orange-500/20',
              },
              {
                icon: <Shield className="w-7 h-7" />,
                title: 'Tanpa Watermark',
                description: 'Dapatkan video bersih tanpa watermark TikTok yang mengganggu',
                color: 'from-emerald-500 to-teal-500',
                bgColor: 'from-emerald-500/20 to-teal-500/20',
              },
              {
                icon: <TrendingUp className="w-7 h-7" />,
                title: 'Kualitas HD',
                description: 'Download video dengan kualitas tertinggi yang tersedia tanpa kompresi',
                color: 'from-blue-500 to-cyan-500',
                bgColor: 'from-blue-500/20 to-cyan-500/20',
              },
              {
                icon: <Sparkles className="w-7 h-7" />,
                title: 'Gratis Selamanya',
                description: 'Tidak ada biaya tersembunyi, langganan, atau limit download',
                color: 'from-violet-500 to-fuchsia-500',
                bgColor: 'from-violet-500/20 to-fuchsia-500/20',
              },
            ].map((feature, idx) => (
              <Card
                key={idx}
                className="group bg-gradient-to-br from-white/[0.08] to-white/[0.02] border-white/10 backdrop-blur-xl hover:border-white/20 transition-all duration-500 reveal-on-scroll overflow-hidden"
                style={{ animationDelay: `${idx * 100}ms` }}
              >
                <div className={`absolute inset-0 bg-gradient-to-br ${feature.bgColor} opacity-0 group-hover:opacity-100 transition-opacity duration-500`} />
                <CardContent className="relative p-8">
                  <div className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${feature.color} flex items-center justify-center mb-6 group-hover:scale-110 group-hover:rotate-3 transition-all duration-500 shadow-lg`}>
                    {feature.icon}
                  </div>
                  <h3 className="font-bold text-xl mb-3 group-hover:text-white transition-colors">{feature.title}</h3>
                  <p className="text-slate-400 leading-relaxed">{feature.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section id="how-it-works" className="relative py-24 px-4 sm:px-6 lg:px-8">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-16 reveal-on-scroll">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-fuchsia-500/10 border border-fuchsia-500/20 mb-6">
              <ArrowRight className="w-4 h-4 text-fuchsia-400" />
              <span className="text-sm text-fuchsia-300">Tutorial</span>
            </div>
            <h2 className="text-4xl sm:text-5xl font-bold mb-6">
              <span className="bg-gradient-to-r from-white to-slate-400 bg-clip-text text-transparent">
                Cara Penggunaan
              </span>
            </h2>
            <p className="text-slate-400 text-lg">Tiga langkah mudah untuk download konten TikTok</p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                step: '01',
                title: 'Salin Link',
                description: 'Buka aplikasi TikTok, temukan video yang ingin diunduh, lalu salin link-nya',
                icon: <Copy className="w-6 h-6" />,
              },
              {
                step: '02',
                title: 'Tempel URL',
                description: 'Kembali ke EZ-Downloader, tempel link di kolom input, lalu klik Download',
                icon: <Link2 className="w-6 h-6" />,
              },
              {
                step: '03',
                title: 'Unduh File',
                description: 'Pilih format yang diinginkan (Video/Audio/Foto) dan file akan terunduh otomatis',
                icon: <Download className="w-6 h-6" />,
              },
            ].map((item, idx) => (
              <div key={idx} className="relative text-center reveal-on-scroll" style={{ animationDelay: `${idx * 150}ms` }}>
                <div className="relative w-24 h-24 mx-auto mb-8">
                  <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-violet-500 to-fuchsia-500 blur-xl opacity-30" />
                  <div className="relative w-full h-full rounded-2xl bg-gradient-to-br from-white/10 to-white/5 border border-white/10 flex items-center justify-center backdrop-blur-xl">
                    <span className="text-3xl font-bold bg-gradient-to-r from-violet-400 to-fuchsia-400 bg-clip-text text-transparent">
                      {item.step}
                    </span>
                  </div>
                  <div className="absolute -bottom-3 -right-3 w-12 h-12 rounded-xl bg-gradient-to-br from-violet-500 to-fuchsia-500 flex items-center justify-center shadow-lg">
                    {item.icon}
                  </div>
                </div>
                <h3 className="font-bold text-xl mb-3">{item.title}</h3>
                <p className="text-slate-400 leading-relaxed">{item.description}</p>
                {idx < 2 && (
                  <div className="hidden md:block absolute top-12 left-[65%] w-full">
                    <div className="w-24 h-px bg-gradient-to-r from-violet-500/50 via-fuchsia-500/50 to-transparent" />
                    <ArrowRight className="w-5 h-5 text-violet-500/50 absolute -right-2 -top-2.5" />
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="relative py-24 px-4 sm:px-6 lg:px-8">
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-16 reveal-on-scroll">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-pink-500/10 border border-pink-500/20 mb-6">
              <CheckCircle2 className="w-4 h-4 text-pink-400" />
              <span className="text-sm text-pink-300">FAQ</span>
            </div>
            <h2 className="text-4xl sm:text-5xl font-bold mb-6">
              <span className="bg-gradient-to-r from-white to-slate-400 bg-clip-text text-transparent">
                Pertanyaan Umum
              </span>
            </h2>
          </div>

          <div className="space-y-4">
            {[
              {
                q: 'Apakah layanan ini benar-benar gratis?',
                a: 'Ya, EZ-Downloader sepenuhnya gratis untuk digunakan. Tidak ada biaya tersembunyi, langganan, atau limit download. Nikmati layanan tanpa batas!',
              },
              {
                q: 'Apakah video yang diunduh memiliki watermark?',
                a: 'Tidak sama sekali! Semua video yang diunduh melalui EZ-Downloader bersih tanpa watermark TikTok. Kami menggunakan teknologi khusus untuk menghapus watermark.',
              },
              {
                q: 'Format file apa yang didukung?',
                a: 'Kami mendukung MP4 untuk video dengan kualitas HD, MP3 untuk audio dengan bitrate tinggi, dan JPG/PNG untuk foto dengan resolusi asli.',
              },
              {
                q: 'Apakah ada batasan jumlah download?',
                a: 'Tidak ada! Anda dapat mendownload sebanyak yang Anda inginkan tanpa batasan harian atau bulanan.',
              },
              {
                q: 'Apakah aman menggunakan EZ-Downloader?',
                a: 'Sangat aman. Kami tidak menyimpan data pribadi, riwayat download, atau memerlukan login. Privasi Anda adalah prioritas kami.',
              },
            ].map((faq, idx) => (
              <Card key={idx} className="bg-gradient-to-br from-white/[0.08] to-white/[0.02] border-white/10 backdrop-blur-xl hover:border-white/20 transition-all reveal-on-scroll">
                <CardContent className="p-6">
                  <h3 className="font-semibold text-lg mb-3 text-white">{faq.q}</h3>
                  <p className="text-slate-400 leading-relaxed">{faq.a}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="relative py-24 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">
          <Card className="relative overflow-hidden bg-gradient-to-br from-violet-600/20 via-fuchsia-600/20 to-pink-600/20 border-violet-500/30 backdrop-blur-xl reveal-on-scroll">
            <div className="absolute inset-0 bg-gradient-to-br from-violet-500/10 to-fuchsia-500/10" />
            <div className="absolute top-0 right-0 w-64 h-64 bg-violet-500/20 rounded-full blur-3xl" />
            <div className="absolute bottom-0 left-0 w-64 h-64 bg-fuchsia-500/20 rounded-full blur-3xl" />
            <CardContent className="relative p-12 text-center">
              <h2 className="text-3xl sm:text-4xl font-bold mb-4">
                Siap untuk Download?
              </h2>
              <p className="text-slate-300 text-lg mb-8 max-w-xl mx-auto">
                Mulai download video TikTok favorit Anda sekarang. Gratis, cepat, dan tanpa watermark!
              </p>
              <Button 
                onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
                className="h-14 px-10 bg-gradient-to-r from-violet-600 via-fuchsia-600 to-pink-600 hover:from-violet-500 hover:via-fuchsia-500 hover:to-pink-500 text-white font-semibold rounded-xl text-lg shadow-lg shadow-violet-500/25 hover:shadow-violet-500/40 transition-all hover:scale-[1.02]"
              >
                <Download className="w-5 h-5 mr-3" />
                Mulai Download
              </Button>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Footer */}
      <footer className="relative py-16 px-4 sm:px-6 lg:px-8 border-t border-white/5">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row items-center justify-between gap-8">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500 via-fuchsia-500 to-pink-500 flex items-center justify-center">
                <Download className="w-5 h-5 text-white" />
              </div>
              <div>
                <span className="text-xl font-bold">EZ-Downloader</span>
                <p className="text-xs text-slate-500">TikTok Media Downloader</p>
              </div>
            </div>
            
            <div className="flex items-center gap-8 text-sm text-slate-400">
              <a href="#" className="hover:text-violet-400 transition-colors">Privasi</a>

              <a href="/syarat.html" className="hover:text-violet-400 transition-colors">Syarat</a>

              <a href="https://wa.me/6288802747938?text=Hallo" className="hover:text-violet-400 transition-colors">Kontak</a>
            </div>
            
            <p className="text-sm text-slate-600">
              © 2024 EZ-Downloader. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default App;

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Camera, Video, Play, User, MessageCircle, Download, Link, Clipboard } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const DownloadTabs = () => {
  const [url, setUrl] = useState("");
  const [selectedResolution, setSelectedResolution] = useState("1080p");
  const { toast } = useToast();

  const resolutions = ["480p", "720p", "1080p"];

  const handlePaste = async () => {
    try {
      const text = await navigator.clipboard.readText();
      setUrl(text);
      toast({
        title: "URL colada!",
        description: "O link foi colado no campo de entrada.",
      });
    } catch (err) {
      toast({
        title: "Erro ao colar",
        description: "Não foi possível acessar a área de transferência.",
        variant: "destructive",
      });
    }
  };

  const handleDownload = (type: string) => {
    if (!url) {
      toast({
        title: "URL necessária",
        description: "Por favor, insira um URL válido do Instagram.",
        variant: "destructive",
      });
      return;
    }

    toast({
      title: "Download iniciado!",
      description: `Baixando ${type} em ${selectedResolution}...`,
    });
  };

  const tabs = [
    {
      id: "foto",
      label: "Foto",
      icon: Camera,
      title: "Baixar Foto do Instagram",
      description: "Digite o URL da imagem que deseja baixar do Instagram.",
      placeholder: "https://www.instagram.com/p/CD4m1UUMGrI/"
    },
    {
      id: "reels",
      label: "Reels",
      icon: Play,
      title: "Baixar Reels do Instagram Online",
      description: "Digite a URL do reel que deseja baixar do Instagram.",
      placeholder: "https://www.instagram.com/reel/CD4m1UUMGrI/"
    },
    {
      id: "video",
      label: "Vídeo",
      icon: Video,
      title: "Baixar Vídeo do Instagram",
      description: "Digite a URL do vídeo que deseja baixar do Instagram.",
      placeholder: "https://www.instagram.com/tv/CD4m1UUMGrI/"
    },
    {
      id: "story",
      label: "Story",
      icon: MessageCircle,
      title: "Baixar Stories do Instagram",
      description: "Digite o nome de usuário do Instagram ou o URL da Story que deseja baixar.",
      placeholder: "@usuario ou https://www.instagram.com/stories/usuario/"
    },
    {
      id: "perfil",
      label: "Perfil",
      icon: User,
      title: "Baixar Foto de Perfil Instagram",
      description: "Digite o nome de usuário do Instagram ou o perfil de URL que deseja baixar.",
      placeholder: "@usuario ou https://www.instagram.com/usuario/"
    }
  ];

  return (
    <div className="w-full max-w-4xl mx-auto">
      <Tabs defaultValue="foto" className="w-full">
        <TabsList className="grid w-full grid-cols-5 mb-8 bg-gradient-instagram-subtle border-0">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <TabsTrigger
                key={tab.id}
                value={tab.id}
                className="data-[state=active]:bg-gradient-instagram data-[state=active]:text-white"
              >
                <Icon className="w-4 h-4 mr-2" />
                {tab.label}
              </TabsTrigger>
            );
          })}
        </TabsList>

        {tabs.map((tab) => (
          <TabsContent key={tab.id} value={tab.id}>
            <Card className="bg-gradient-instagram text-white border-0 shadow-instagram">
              <CardHeader className="text-center">
                <CardTitle className="text-2xl font-bold">{tab.title}</CardTitle>
                <CardDescription className="text-white/90">
                  {tab.description}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <Link className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                    <Input
                      type="url"
                      placeholder={tab.placeholder}
                      value={url}
                      onChange={(e) => setUrl(e.target.value)}
                      className="pl-10 bg-white/10 border-white/20 text-white placeholder:text-white/60"
                    />
                  </div>
                  <Button
                    onClick={handlePaste}
                    variant="secondary"
                    size="icon"
                    className="bg-white/20 hover:bg-white/30 border-0"
                  >
                    <Clipboard className="w-4 h-4" />
                  </Button>
                </div>

                {(tab.id === "video" || tab.id === "reels") && (
                  <div className="space-y-3">
                    <h3 className="text-sm font-medium text-white/90">Selecione a qualidade:</h3>
                    <div className="flex gap-2 flex-wrap">
                      {resolutions.map((resolution) => (
                        <Badge
                          key={resolution}
                          variant={selectedResolution === resolution ? "default" : "secondary"}
                          className={`cursor-pointer transition-all ${
                            selectedResolution === resolution
                              ? "bg-white text-instagram-purple hover:bg-white/90"
                              : "bg-white/20 text-white hover:bg-white/30"
                          }`}
                          onClick={() => setSelectedResolution(resolution)}
                        >
                          {resolution}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                <Button
                  onClick={() => handleDownload(tab.label)}
                  variant="secondary"
                  size="lg"
                  className="w-full bg-white text-instagram-purple hover:bg-white/90 font-semibold"
                >
                  <Download className="w-4 h-4 mr-2" />
                  Baixar {tab.label}
                  {(tab.id === "video" || tab.id === "reels") && ` (${selectedResolution})`}
                </Button>
              </CardContent>
            </Card>
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
};

export default DownloadTabs;
const Hero = () => {
  return (
    <section className="w-full py-16 px-6 text-center">
      <div className="max-w-4xl mx-auto space-y-6">
        <h1 className="text-4xl md:text-6xl font-bold bg-gradient-instagram bg-clip-text text-transparent">
          Insta Save: Baixar do Instagram
        </h1>
        <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto">
          Use o Downloader for Instagram para salvar fotos e vídeos de sua conta ou qualquer outra pública.
        </p>
        <div className="flex justify-center items-center gap-4 text-sm text-muted-foreground">
          <span className="flex items-center gap-1">
            ✨ Grátis e seguro
          </span>
          <span className="flex items-center gap-1">
            🚀 Alta qualidade
          </span>
          <span className="flex items-center gap-1">
            📱 Funciona no celular
          </span>
        </div>
      </div>
    </section>
  );
};

export default Hero;
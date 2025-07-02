const Footer = () => {
  return (
    <footer className="w-full py-8 px-6 mt-16 bg-gradient-instagram-subtle border-t border-gray-200/50">
      <div className="max-w-4xl mx-auto text-center space-y-4">
        <div className="flex items-center justify-center gap-2">
          <span className="text-sm text-muted-foreground">
            ⚠️ Insta Love não é afiliado ao Instagram™.
          </span>
        </div>
        <p className="text-xs text-muted-foreground max-w-2xl mx-auto">
          Não hospedamos nenhum conteúdo do Instagram. Todos os direitos pertencem aos seus respectivos proprietários. 
          Respeitamos a privacidade - conteúdo público disponível somente.
        </p>
        <p className="text-xs text-muted-foreground">
          © 2024 Insta Love. Ferramenta educacional e de uso pessoal.
        </p>
      </div>
    </footer>
  );
};

export default Footer;
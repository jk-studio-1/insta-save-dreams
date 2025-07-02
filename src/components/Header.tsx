import { Heart } from "lucide-react";
import instagramIcon from "@/assets/instagram-icon.png";

const Header = () => {
  return (
    <header className="w-full py-4 px-6 bg-white/80 backdrop-blur-sm border-b border-gray-200/50">
      <div className="max-w-6xl mx-auto flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-gradient-instagram rounded-lg shadow-instagram">
            <Heart className="w-6 h-6 text-white fill-current" />
          </div>
          <div>
            <h1 className="text-xl font-bold bg-gradient-instagram bg-clip-text text-transparent">
              Insta Love
            </h1>
            <p className="text-sm text-muted-foreground">Downloader gratuito</p>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <img 
            src={instagramIcon} 
            alt="Instagram" 
            className="w-8 h-8 opacity-80"
          />
          <span className="hidden sm:block text-sm text-muted-foreground">
            Não afiliado ao Instagram™
          </span>
        </div>
      </div>
    </header>
  );
};

export default Header;
import Header from "@/components/Header";
import Hero from "@/components/Hero";
import DownloadTabs from "@/components/DownloadTabs";
import Footer from "@/components/Footer";

const Index = () => {
  return (
    <div className="min-h-screen bg-gradient-instagram-subtle">
      <Header />
      <main className="container mx-auto px-4">
        <Hero />
        <DownloadTabs />
      </main>
      <Footer />
    </div>
  );
};

export default Index;

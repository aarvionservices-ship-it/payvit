import { useState, useEffect } from 'react';
import { CategoryCard } from "../components/CategoryCard";
import { getSettings } from "../api/settings.api";
import { SEO } from '../components/shared/SEO';

export default function CardPage() {
  const [categories, setCategories] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchUI() {
      try {
        const response = await getSettings();
        if (response.success && response.data.ui) {
          setCategories(response.data.ui.categories || []);
        }
      } catch (error) {
        console.error('Error fetching categories:', error);
      } finally {
        setIsLoading(false);
      }
    }
    fetchUI();
  }, []);

  return (
    <div className="min-h-screen bg-[#f5f6f8] font-display">
      <SEO 
        title="Credit Cards Marketplace"
        description="Explore a wide range of credit cards from top banks. Compare rewards, cashback, and joining fees to find the perfect card for your lifestyle."
      />
      {/* Hero Section */}
      <section className="relative pt-6 pb-16 px-6 lg:px-20 overflow-hidden">
        {/* Background Decorative Blur */}
        <div className="absolute top-0 right-0 w-1/3 h-full bg-[#0055ff]/5 blur-[120px] -mr-32 pointer-events-none" />
        
        <div className="max-w-7xl mx-auto flex flex-col items-center text-center relative z-10">
          <div className="inline-flex items-center gap-2 bg-[#0055ff]/10 text-[#0055ff] px-4 py-1.5 rounded-full mb-8">
            <span className="material-symbols-outlined text-sm">auto_awesome</span>
            <span className="text-[10px] font-black uppercase tracking-[0.2em]">Smart Recommendations</span>
          </div>
          
          <h1 className="text-5xl md:text-7xl font-black text-slate-900 mb-8 tracking-tight leading-[1.05]">
            Find Your <span className="text-[#0055ff]">Perfect Card</span>
          </h1>
          <p className="text-xl text-slate-500 max-w-3xl leading-relaxed font-medium">
            Explore our curated portfolio of premium credit cards. Whether you're a standard shopper, a global traveler, or a business leader, we have the right rewards for your lifestyle.
          </p>
        </div>
      </section>

      {/* Categories Grid */}
      <main className="relative z-10 max-w-7xl mx-auto px-6 lg:px-12 pb-32">
        {isLoading ? (
          <div className="text-center py-20 font-black uppercase tracking-widest text-slate-300 animate-pulse">Loading Marketplace...</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 md:gap-10">
            {categories.map((category, index) => (
              <CategoryCard
                key={category.id}
                id={category.id}
                name={category.name}
                icon={category.icon}
                color={category.color}
                imageUrl={category.imageUrl}
                quote={category.quote}
                index={index}
              />
            ))}
          </div>
        )}
      </main>
    </div>
  );
}


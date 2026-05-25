import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'motion/react';
import { 
  Search, 
  Calendar, 
  Clock, 
  ArrowRight,
  Sparkles,
  TrendingUp,
  Newspaper
} from 'lucide-react';
import { getBlogs } from '../../../api/blog.api';
import { SEO } from '../../../components/shared/SEO';

const CATEGORIES = [
  { id: 'all', name: 'All News' },
  { id: 'personal-loan', name: 'Loans' },
  { id: 'credit-cards', name: 'Cards' },
  { id: 'investments', name: 'Wealth' },
  { id: 'tax', name: 'Taxation' },
  { id: 'fintech-news', name: 'Updates' }
];

export default function BlogListPage() {
  const [blogs, setBlogs] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    fetchBlogs();
  }, [activeCategory]);

  const fetchBlogs = async () => {
    setIsLoading(true);
    try {
      const params: any = { status: 'published' };
      if (activeCategory !== 'all') params.category = activeCategory;
      const response = await getBlogs(params);
      setBlogs(response.data || []);
    } catch (error) {
      console.error('Error fetching blogs:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getInitials = (name: string) => {
    if (!name) return 'AP';
    const parts = name.split(' ').filter(Boolean);
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return parts[0][0].toUpperCase();
  };

  const filteredBlogs = blogs.filter(blog => 
    blog.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    blog.excerpt?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const featuredBlog = blogs.find(b => b.isFeatured) || blogs[0];

  return (
    <div className="min-h-screen bg-slate-50/50 dark:bg-slate-950">
      <SEO 
        title="PayVit Blog - Financial Knowledge & Updates"
        description="Stay updated with the latest in fintech, loan tips, credit card rewards, and investment strategies."
      />

      {/* Hero / Featured Section */}
      <section className="bg-slate-900 pt-32 pb-20 px-6 lg:px-20 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-full h-full bg-[radial-gradient(circle_at_top_right,_var(--tw-gradient-stops))] from-primary/20 via-transparent to-transparent pointer-events-none" />
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col lg:flex-row justify-between items-end gap-12 mb-20">
             <div className="max-w-2xl">
                <div className="inline-flex items-center gap-2 px-4 py-2 bg-primary/20 backdrop-blur-md rounded-full text-[10px] font-black uppercase tracking-widest text-primary mb-6">
                  <Sparkles size={14} />
                  Knowledge Hub
                </div>
                <h1 className="text-5xl lg:text-8xl font-black text-white italic uppercase tracking-tighter leading-[0.85] mb-8">
                  PayVit <br />
                  <span className="text-primary">Insights.</span>
                </h1>
                <p className="text-xl text-slate-400 font-medium leading-relaxed">
                  Deep dives into finance, technology, and wealth management. Learn how to make your money work harder for you.
                </p>
             </div>
             
             {/* Search Bar */}
             <div className="w-full lg:w-96">
                <div className="relative group">
                   <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-primary transition-colors" size={20} />
                   <input 
                    type="text" 
                    placeholder="Search articles..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-16 pr-8 py-6 bg-white/5 border border-white/10 rounded-3xl text-white placeholder:text-slate-600 focus:outline-none focus:border-primary/50 focus:bg-white/10 transition-all font-bold"
                   />
                </div>
             </div>
          </div>

          {/* Featured Post Card */}
          {featuredBlog && !isLoading && !searchQuery && (
            <Link to={`/blog/${featuredBlog.slug}`} className="group block">
               <div className="relative aspect-[21/9] rounded-[3rem] overflow-hidden border border-white/10 shadow-3xl">
                  {featuredBlog.featuredImage?.url ? (
                    <img src={featuredBlog.featuredImage.url} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-1000" alt={featuredBlog.featuredImage.alt || featuredBlog.title} />
                  ) : (
                    <div className="w-full h-full bg-slate-800 flex items-center justify-center">
                       <Newspaper size={80} className="text-slate-700" />
                    </div>
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/40 to-transparent" />
                  
                  <div className="absolute bottom-0 left-0 p-8 lg:p-16 max-w-3xl">
                     <div className="flex items-center gap-4 mb-6">
                        <span className="px-4 py-1.5 bg-primary text-white rounded-full text-[10px] font-black uppercase tracking-[0.2em]">Featured Post</span>
                        <div className="flex items-center gap-2 text-slate-400 text-xs font-bold uppercase tracking-widest">
                           <Clock size={14} />
                           {featuredBlog.readingTime} Min Read
                        </div>
                     </div>
                     <h2 className="text-3xl lg:text-5xl font-black text-white uppercase italic tracking-tighter leading-none mb-6 group-hover:text-primary transition-colors line-clamp-2">
                       {featuredBlog.title}
                     </h2>
                     <p className="text-slate-400 text-lg font-medium line-clamp-2 mb-8">
                       {featuredBlog.excerpt}
                     </p>
                     <div className="flex items-center gap-3 text-white font-black uppercase text-xs tracking-widest group-hover:gap-6 transition-all">
                        Read Full Article <ArrowRight size={18} className="text-primary" />
                     </div>
                  </div>
               </div>
            </Link>
          )}
        </div>
      </section>

      {/* Main Filter & Feed */}
      <section className="py-20 px-6 lg:px-20 max-w-7xl mx-auto">
         {/* Category Pills */}
         <div className="flex flex-wrap items-center gap-3 mb-16">
            <TrendingUp size={20} className="text-primary mr-2" />
            {CATEGORIES.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setActiveCategory(cat.id)}
                className={`px-8 py-4 rounded-2xl text-xs font-black uppercase tracking-widest transition-all ${
                  activeCategory === cat.id 
                    ? 'bg-primary text-white shadow-xl shadow-primary/20 scale-105' 
                    : 'bg-white dark:bg-slate-900 text-slate-500 border border-slate-100 dark:border-white/5 hover:bg-slate-50'
                }`}
              >
                {cat.name}
              </button>
            ))}
         </div>

         {/* Article Grid */}
         <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {isLoading ? (
              [1, 2, 3, 4, 5, 6].map(i => (
                <div key={i} className="bg-white dark:bg-slate-900 rounded-[2.5rem] p-4 h-[450px] animate-pulse">
                   <div className="w-full aspect-[4/3] bg-slate-100 dark:bg-slate-800 rounded-3xl mb-6" />
                   <div className="h-6 w-3/4 bg-slate-100 dark:bg-slate-800 rounded-lg mb-4 ml-4" />
                   <div className="h-4 w-1/2 bg-slate-100 dark:bg-slate-800 rounded-lg ml-4" />
                </div>
              ))
            ) : filteredBlogs.length > 0 ? (
              filteredBlogs.map((blog, idx) => (
                <motion.div
                  key={blog._id}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: idx * 0.05 }}
                  className="group bg-white dark:bg-slate-900 rounded-[3rem] border border-slate-100 dark:border-white/5 overflow-hidden shadow-xl shadow-slate-900/5 hover:shadow-2xl hover:shadow-primary/10 transition-all duration-500"
                >
                  <Link to={`/blog/${blog.slug}`} className="block">
                     <div className="aspect-[16/10] overflow-hidden relative">
                        {blog.featuredImage?.url ? (
                          <img src={blog.featuredImage.url} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" alt={blog.featuredImage.alt || blog.title} />
                        ) : (
                          <div className="w-full h-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
                             <Newspaper size={40} className="text-slate-300" />
                          </div>
                        )}
                        <div className="absolute top-6 left-6 px-4 py-1.5 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md rounded-full text-[9px] font-black uppercase tracking-[0.2em] text-primary shadow-lg">
                           {blog.category.replace('-', ' ')}
                        </div>
                     </div>
                     <div className="p-10">
                        <div className="flex items-center gap-4 text-[10px] font-black uppercase tracking-widest text-slate-400 mb-6">
                           <div className="flex items-center gap-1.5">
                              <Calendar size={14} className="text-primary" />
                              {new Date(blog.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                           </div>
                           <div className="flex items-center gap-1.5">
                              <Clock size={14} className="text-primary" />
                              {blog.readingTime} Min
                           </div>
                        </div>
                        <h3 className="text-2xl font-black text-slate-900 dark:text-white uppercase italic tracking-tighter leading-none mb-4 group-hover:text-primary transition-colors line-clamp-2">
                           {blog.title}
                        </h3>
                        <p className="text-sm text-slate-500 font-bold leading-relaxed line-clamp-3 mb-8">
                           {blog.excerpt}
                        </p>
                        
                        <div className="flex items-center justify-between pt-6 border-t border-slate-50 dark:border-white/5">
                           <div className="flex items-center gap-3">
                              <div className="size-8 rounded-lg bg-slate-900 flex items-center justify-center text-[10px] font-black text-white uppercase italic italic overflow-hidden shadow-sm">
                                 {blog.author?.avatar ? <img src={blog.author.avatar} alt={blog.author.name} className="w-full h-full object-cover" /> : getInitials(blog.author?.name || 'AP')}
                              </div>
                              <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">@{blog.author?.name?.split(' ')[0]}</span>
                           </div>
                           <div className="flex items-center gap-2 text-primary font-black uppercase text-[10px] tracking-[0.2em] group-hover:gap-4 transition-all">
                              Read <ArrowRight size={14} />
                           </div>
                        </div>
                     </div>
                  </Link>
                </motion.div>
              ))
            ) : (
              <div className="col-span-full py-32 text-center text-slate-400">
                 <Newspaper size={80} className="mx-auto mb-6 opacity-20" />
                 <p className="text-xl font-black uppercase italic italic tracking-widest transition-all">No articles found matching your search.</p>
              </div>
            )}
         </div>
      </section>

      {/* Newsletter Section */}
      <section className="py-24 px-6 lg:px-20 bg-primary text-center relative overflow-hidden group">
         <div className="absolute inset-0 bg-white/5 opacity-0 group-hover:opacity-100 transition-opacity" />
         <div className="max-w-3xl mx-auto relative z-10 text-white">
            <h4 className="text-3xl lg:text-6xl font-black italic uppercase tracking-tighter mb-8 leading-none">Weekly Market <br />Digest.</h4>
            <p className="text-lg font-bold uppercase tracking-widest opacity-80 mb-12">Subscribe to our newsletter for exclusive fintech updates.</p>
            <div className="flex flex-col sm:flex-row gap-4 max-w-xl mx-auto">
               <input 
                type="email" 
                placeholder="Enter your email" 
                className="flex-1 px-8 py-5 bg-white/10 border border-white/20 rounded-2xl text-white placeholder:text-white/40 focus:outline-none focus:bg-white/20 transition-all font-bold"
               />
               <button className="px-10 py-5 bg-white text-primary rounded-2xl font-black uppercase text-xs tracking-widest hover:scale-105 transition-all shadow-2xl">
                 Subscribe
               </button>
            </div>
         </div>
      </section>
    </div>
  );
}


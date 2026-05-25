import { useState, useEffect } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { 
  ArrowLeft, 
  Save, 
  Eye, 
  Image as ImageIcon, 
  Type, 
  AlignLeft, 
  Tag, 
  Layout, 
  Globe, 
  ShieldCheck,
  FileText,
  Loader2,
  Sparkles,
  Code2,
  RefreshCw,
  Trash2
} from 'lucide-react';
import { createBlog, updateBlog, getBlogById } from '../../../api/blog.api';
import { toast } from 'react-hot-toast';

const localSlugify = (text: string) => {
  return text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-')     // Replace spaces with -
    .replace(/[^\w\-]+/g, '') // Remove all non-word chars
    .replace(/\-\-+/g, '-');  // Replace multiple - with single -
};

const CATEGORIES = [
  "personal-loan", "home-loan", "car-loan", "education-loan", "business-loan", 
  "credit-cards", "insurance", "investments", "tax", "fintech-news"
];

export default function CreateBlogPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEdit = !!id;

  const [formData, setFormData] = useState<any>({
    title: '',
    slug: '',
    excerpt: '',
    content: '',
    category: 'fintech-news',
    status: 'draft',
    isFeatured: false,
    featuredImage: { url: '', alt: '' },
    tags: '',
    seo: {
      metaTitle: '',
      metaDescription: '',
      keywords: ''
    },
    sections: [],
    toc: []
  });

  const [jsonInput, setJsonInput] = useState('');
  const [showJsonInput, setShowJsonInput] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isFetching, setIsFetching] = useState(false);

  useEffect(() => {
    if (isEdit) {
      fetchBlog();
    }
  }, [id]);

  const fetchBlog = async () => {
    setIsFetching(true);
    try {
      const res = await getBlogById(id!);
      const blog = res.data;
      if (blog) {
        setFormData({
          ...blog,
          tags: blog.tags.join(', '),
          seo: {
            ...blog.seo,
            keywords: blog.seo.keywords.join(', ')
          }
        });
      }
    } catch (error) {
      toast.error("Failed to recover intelligence data");
    } finally {
      setIsFetching(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    if (name.startsWith('seo.')) {
      const field = name.split('.')[1];
      setFormData((prev: any) => ({
        ...prev,
        seo: { ...prev.seo, [field]: value }
      }));
    } else if (name === 'featuredImage') {
        setFormData((prev: any) => ({
            ...prev,
            featuredImage: { ...prev.featuredImage, url: value }
        }));
    } else {
      setFormData((prev: any) => ({ ...prev, [name]: value }));
      
      // Auto-generate slug from title
      if (name === 'title' && !isEdit) {
        setFormData((prev: any) => ({
          ...prev,
          slug: localSlugify(value)
        }));
      }
    }
  };

  const handleJsonSync = () => {
    try {
      const parsed = JSON.parse(jsonInput);
      
      // Basic validation
      if (!parsed.title) throw new Error("JSON must include a 'title' field.");

      setFormData({
        ...formData,
        ...parsed,
        tags: Array.isArray(parsed.tags) ? parsed.tags.join(', ') : (parsed.tags || ''),
        seo: {
          ...formData.seo,
          ...parsed.seo,
          keywords: Array.isArray(parsed.seo?.keywords) ? parsed.seo.keywords.join(', ') : (parsed.seo?.keywords || '')
        }
      });
      
      toast.success("Intelligence Grid Synchronized Successfully");
      setShowJsonInput(false);
    } catch (error: any) {
      toast.error(`Sync Protocol Error: ${error.message}`);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    
    try {
      const payload = {
        ...formData,
        tags: typeof formData.tags === 'string' ? formData.tags.split(',').map((t: string) => t.trim()).filter(Boolean) : formData.tags,
        seo: {
          ...formData.seo,
          keywords: typeof formData.seo.keywords === 'string' ? formData.seo.keywords.split(',').map((k: string) => k.trim()).filter(Boolean) : formData.seo.keywords
        }
      };

      const res = isEdit 
        ? await updateBlog(id!, payload)
        : await createBlog(payload);

      if (res.success) {
        toast.success(isEdit ? "Protocol updated successfully" : "Intelligence asset deployed");
        navigate('/admin/blogs');
      }
    } catch (error: any) {
      toast.error(error.message || "Encryption error during deployment");
    } finally {
      setIsLoading(false);
    }
  };

  if (isFetching) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-4">
        <Loader2 className="size-10 animate-spin text-primary opacity-20" />
        <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Synchronizing Archives...</p>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto space-y-8 pb-20">
      <div className="flex items-center justify-between">
         <div className="flex items-center gap-6">
            <Link to="/admin/blogs" className="size-12 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl flex items-center justify-center text-slate-400 hover:text-primary transition-all shadow-sm">
               <ArrowLeft size={20} />
            </Link>
            <div>
               <h1 className="text-2xl font-black italic italic uppercase tracking-tighter text-slate-900 dark:text-white">
                  {isEdit ? "Edit Intelligence" : "Draft Intelligence"}
               </h1>
               <p className="text-[10px] text-slate-400 font-bold uppercase tracking-[0.4em] mt-1">Content Deployment Protocol</p>
            </div>
         </div>
         <div className="flex items-center gap-3">
            <button 
              type="button"
              onClick={() => setShowJsonInput(!showJsonInput)}
              className={`px-6 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center gap-2 transition-all shadow-sm ${showJsonInput ? 'bg-primary text-white' : 'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-400 hover:text-primary'}`}
            >
               <Code2 size={16} /> Advanced JSON
            </button>
            <button 
              onClick={() => window.open(`/blog/${formData.slug}`, '_blank')}
              className="px-6 py-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center gap-2 hover:bg-slate-50 transition-all shadow-sm"
            >
               <Eye size={16} /> Preview
            </button>
            <button 
              form="blog-form"
              disabled={isLoading}
              className="px-8 py-3 bg-primary text-white rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center gap-2 hover:scale-105 transition-all shadow-xl shadow-primary/20 disabled:opacity-50"
            >
               {isLoading ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />} 
               {isEdit ? "Update Archives" : "Deploy Asset"}
            </button>
         </div>
      </div>

      {showJsonInput && (
        <div className="bg-slate-900 text-white rounded-[2.5rem] p-10 shadow-3xl space-y-6 border border-primary/20">
           <div className="flex items-center justify-between">
              <div>
                 <h3 className="text-lg font-black uppercase italic tracking-tight">Bulk JSON Asset Deployment</h3>
                 <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mt-1">Paste your intelligence object here</p>
              </div>
              <div className="flex items-center gap-2">
                 <button 
                  type="button"
                  onClick={() => setJsonInput('')}
                  className="p-2 text-slate-500 hover:text-rose-500 transition-colors"
                 >
                    <Trash2 size={18} />
                 </button>
                 <button 
                  type="button"
                  onClick={handleJsonSync}
                  className="px-6 py-3 bg-primary rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center gap-2"
                 >
                    <RefreshCw size={14} /> Synchronize Grid
                 </button>
              </div>
           </div>
           <textarea 
            value={jsonInput}
            onChange={(e) => setJsonInput(e.target.value)}
            rows={15}
            placeholder='{ "title": "Example...", "sections": [...], ... }'
            className="w-full bg-black/40 border border-white/5 rounded-2xl p-8 text-xs font-mono text-emerald-400 focus:outline-none focus:border-primary/50 placeholder:text-slate-700"
           />
        </div>
      )}

      <form id="blog-form" onSubmit={handleSubmit} className="grid lg:grid-cols-12 gap-8">
         {/* Main Form Area */}
         <div className="lg:col-span-8 space-y-8">
            <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] border border-slate-200 dark:border-slate-800 p-10 shadow-sm space-y-8">
               {/* Title Area */}
               <div className="space-y-4">
                  <label className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-slate-400 ml-2">
                     <Type size={14} className="text-primary" /> Article Headline
                  </label>
                  <input 
                    type="text" 
                    name="title"
                    required
                    value={formData.title}
                    onChange={handleChange}
                    placeholder="Enter a high-impact headline..."
                    className="w-full text-3xl font-black italic italic uppercase tracking-tighter bg-slate-50 dark:bg-slate-800/50 border-none rounded-[1.5rem] px-8 py-6 focus:ring-2 focus:ring-primary/20 transition-all placeholder:opacity-30"
                  />
               </div>

               {/* Slug Area */}
               <div className="space-y-4">
                  <label className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-slate-400 ml-2">
                     <Globe size={14} className="text-primary" /> Persistent URL Identification
                  </label>
                  <div className="flex items-center gap-3 bg-slate-50 dark:bg-slate-800/50 rounded-2xl px-6 py-4">
                     <span className="text-xs font-bold text-slate-400 italic">PayVit.com/blog/</span>
                     <input 
                       type="text" 
                       name="slug"
                       required
                       value={formData.slug}
                       onChange={handleChange}
                       className="flex-1 bg-transparent border-none p-0 text-primary font-black text-xs uppercase tracking-widest focus:ring-0"
                     />
                  </div>
               </div>

               {/* Excerpt Area */}
               <div className="space-y-4">
                  <label className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-slate-400 ml-2">
                     <AlignLeft size={14} className="text-primary" /> Executive Summary
                  </label>
                  <textarea 
                    name="excerpt"
                    required
                    rows={3}
                    value={formData.excerpt}
                    onChange={handleChange}
                    placeholder="Brief overview for the feed cards..."
                    className="w-full bg-slate-50 dark:bg-slate-800/50 border-none rounded-[1.5rem] px-8 py-6 text-sm font-bold focus:ring-2 focus:ring-primary/20 transition-all placeholder:opacity-30 resize-none"
                  />
               </div>

               {/* Content Area (Legacy) */}
               {!formData.sections?.length && (
                <div className="space-y-4">
                    <label className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-slate-400 ml-2">
                        <FileText size={14} className="text-primary" /> Legacy HTML Content
                    </label>
                    <textarea 
                        name="content"
                        rows={10}
                        value={formData.content}
                        onChange={handleChange}
                        placeholder="Fallback content if sections are not used..."
                        className="w-full bg-slate-50 dark:bg-slate-800/50 border-none rounded-[2rem] px-8 py-8 text-sm font-medium leading-relaxed focus:ring-2 focus:ring-primary/20 transition-all placeholder:opacity-30 font-mono"
                    />
                </div>
               )}

               {/* Sections Indicator */}
               {formData.sections?.length > 0 && (
                 <div className="p-8 bg-emerald-500/5 border border-emerald-500/20 rounded-[2rem] flex items-center justify-between">
                    <div className="flex items-center gap-4">
                       <div className="size-12 bg-emerald-500 text-white rounded-2xl flex items-center justify-center shadow-lg shadow-emerald-500/20">
                          <Layout size={24} />
                       </div>
                       <div>
                          <p className="text-sm font-black uppercase italic tracking-tighter">Rich Section Engine Active</p>
                          <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">{formData.sections.length} Components Configured</p>
                       </div>
                    </div>
                    <button 
                      type="button" 
                      onClick={() => setFormData({...formData, sections: []})}
                      className="text-[10px] font-black text-rose-500 uppercase tracking-widest px-4 py-2 hover:bg-rose-500/10 rounded-xl transition-all"
                    >
                       Purge Sections
                    </button>
                 </div>
               )}
            </div>

            {/* SEO Section */}
            <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] border border-slate-200 dark:border-slate-800 p-10 shadow-sm">
               <div className="flex items-center gap-4 mb-10">
                  <div className="size-10 bg-emerald-500/10 rounded-xl flex items-center justify-center text-emerald-500">
                     <Sparkles size={20} />
                  </div>
                  <h3 className="text-lg font-black uppercase italic italic tracking-tight">Transmission Metadata (SEO)</h3>
               </div>
               
               <div className="grid gap-8">
                  <div className="space-y-4">
                     <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-2">Meta Title</label>
                     <input 
                       type="text" 
                       name="seo.metaTitle"
                       value={formData.seo.metaTitle}
                       onChange={handleChange}
                       className="w-full bg-slate-50 dark:bg-slate-800/50 border-none rounded-xl px-6 py-4 text-sm font-bold focus:ring-2 focus:ring-emerald-500/20"
                     />
                  </div>
                  <div className="space-y-4">
                     <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-2">Meta Description</label>
                     <textarea 
                       name="seo.metaDescription"
                       rows={3}
                       value={formData.seo.metaDescription}
                       onChange={handleChange}
                       className="w-full bg-slate-50 dark:bg-slate-800/50 border-none rounded-xl px-6 py-4 text-sm font-bold focus:ring-2 focus:ring-emerald-500/20 resize-none"
                     />
                  </div>
                  <div className="space-y-4">
                     <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-2">Keywords (Comma Separated)</label>
                     <input 
                       type="text" 
                       name="seo.keywords"
                       value={formData.seo.keywords}
                       onChange={handleChange}
                       placeholder="fintech, loans, PayVit..."
                       className="w-full bg-slate-50 dark:bg-slate-800/50 border-none rounded-xl px-6 py-4 text-sm font-bold focus:ring-2 focus:ring-emerald-500/20"
                     />
                  </div>
               </div>
            </div>
         </div>

         {/* Sidebar Controls */}
         <div className="lg:col-span-4 space-y-8">
            {/* Status & Featured */}
            <div className="bg-slate-900 rounded-[2.5rem] p-10 text-white shadow-3xl">
               <h3 className="text-sm font-black uppercase tracking-[0.2em] mb-8 flex items-center gap-2">
                  <ShieldCheck size={16} className="text-primary" /> Deployment Protocol
               </h3>
               
               <div className="space-y-8">
                  <div className="space-y-4">
                     <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Visibility State</label>
                     <div className="grid grid-cols-2 gap-2 bg-white/5 p-2 rounded-2xl border border-white/5">
                        {['draft', 'published'].map(stat => (
                          <button
                            key={stat}
                            type="button"
                            onClick={() => setFormData((prev: any) => ({ ...prev, status: stat }))}
                            className={`px-4 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${formData.status === stat ? 'bg-primary text-white shadow-lg' : 'text-slate-500 hover:text-white'}`}
                          >
                             {stat}
                          </button>
                        ))}
                     </div>
                  </div>

                  <div className="flex items-center justify-between p-4 bg-white/5 rounded-2xl border border-white/5">
                     <div className="space-y-1">
                        <p className="text-xs font-black uppercase tracking-widest italic italic">Sticky Highlight</p>
                        <p className="text-[9px] font-bold text-slate-500 uppercase tracking-tighter">Pin to featured slot</p>
                     </div>
                     <button
                        type="button"
                        onClick={() => setFormData((prev: any) => ({ ...prev, isFeatured: !prev.isFeatured }))}
                        className={`size-12 rounded-xl flex items-center justify-center transition-all ${formData.isFeatured ? 'bg-yellow-500 text-slate-950 shadow-lg shadow-yellow-500/20 rotate-12' : 'bg-white/10 text-slate-500'}`}
                     >
                        <Sparkles size={20} />
                     </button>
                  </div>
               </div>
            </div>

            {/* Classification */}
            <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] border border-slate-200 dark:border-slate-800 p-10 shadow-sm space-y-8">
               <div className="space-y-4">
                  <label className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-slate-400 ml-2">
                     <Layout size={14} className="text-primary" /> Target Channel
                  </label>
                  <select 
                    name="category"
                    value={formData.category}
                    onChange={handleChange}
                    className="w-full bg-slate-50 dark:bg-slate-800 border-none rounded-2xl px-6 py-4 text-xs font-black uppercase tracking-widest focus:ring-2 focus:ring-primary/20 cursor-pointer"
                  >
                     {CATEGORIES.map(cat => (
                       <option key={cat} value={cat}>{cat.replace('-', ' ')}</option>
                     ))}
                  </select>
               </div>

               <div className="space-y-4">
                  <label className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-slate-400 ml-2">
                     <Tag size={14} className="text-primary" /> Intelligence Tags
                  </label>
                  <input 
                    type="text" 
                    name="tags"
                    value={formData.tags}
                    onChange={handleChange}
                    placeholder="investment, crypto, banking..."
                    className="w-full bg-slate-50 dark:bg-slate-800 border-none rounded-2xl px-6 py-4 text-xs font-black focus:ring-2 focus:ring-primary/20"
                  />
                  <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest ml-2 italic">Comma separated keywords</p>
               </div>
            </div>

            {/* Visual Media */}
            <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] border border-slate-200 dark:border-slate-800 p-10 shadow-sm space-y-6">
               <label className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-slate-400 ml-2">
                  <ImageIcon size={14} className="text-primary" /> Visual Asset URL
               </label>
               
               <div className="space-y-6">
                  <input 
                    type="text" 
                    name="featuredImage"
                    value={formData.featuredImage?.url}
                    onChange={handleChange}
                    placeholder="https://images.unsplash.com/..."
                    className="w-full bg-slate-50 dark:bg-slate-800 border-none rounded-2xl px-6 py-4 text-[10px] font-bold focus:ring-2 focus:ring-primary/20"
                  />
                  
                  {formData.featuredImage?.url ? (
                    <div className="aspect-video rounded-[1.5rem] overflow-hidden border-2 border-slate-100 dark:border-slate-800 shadow-xl">
                       <img src={formData.featuredImage.url} className="w-full h-full object-cover" alt="Preview" onError={(e) => (e.currentTarget.src = 'https://placehold.co/600x400?text=Invalid+Image+URL')} />
                    </div>
                  ) : (
                    <div className="aspect-video rounded-[1.5rem] bg-slate-50 dark:bg-slate-800 border-2 border-dashed border-slate-200 dark:border-slate-700 flex flex-col items-center justify-center text-slate-300 gap-2">
                       <ImageIcon size={40} className="opacity-10" />
                       <span className="text-[10px] font-black uppercase tracking-widest opacity-20">Media Preview</span>
                    </div>
                  )}
               </div>
            </div>
         </div>
      </form>
    </div>
  );
}


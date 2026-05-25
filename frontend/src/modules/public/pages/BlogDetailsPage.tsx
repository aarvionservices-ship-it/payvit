import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { 
  Calendar, 
  Clock, 
  Share2, 
  MessageCircle, 
  ArrowLeft,
  ArrowRight,
  Facebook,
  Twitter,
  Linkedin,
  Send,
  Sparkles,
  ChevronRight,
  HelpCircle,
  Table as TableIcon
} from 'lucide-react';
import { getBlogBySlug, addComment } from '../../../api/blog.api';
import { SEO } from '../../../components/shared/SEO';

export default function BlogDetailsPage() {
  const { slug } = useParams();
  const [blog, setBlog] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [commentData, setCommentData] = useState({ name: '', comment: '' });
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (slug) fetchBlog();
    window.scrollTo(0, 0);
  }, [slug]);

  const fetchBlog = async () => {
    setIsLoading(true);
    try {
      const response = await getBlogBySlug(slug!);
      setBlog(response.data);
    } catch (error) {
      console.error('Error fetching blog:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCommentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!commentData.name || !commentData.comment) return;
    
    setIsSubmitting(true);
    try {
      await addComment(blog._id, commentData);
      setCommentData({ name: '', comment: '' });
      alert("Thank you! Your comment has been submitted and is awaiting approval.");
    } catch (error) {
      console.error('Error submitting comment:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderSection = (section: any, index: number) => {
    switch (section.type) {
      case 'text':
        return (
          <div key={index} className="mb-16">
            {section.title && <h2 id={section.title.toLowerCase().replace(/\s+/g, '-')} className="text-3xl lg:text-4xl font-black uppercase italic tracking-tighter mb-8 text-slate-900 dark:text-white">{section.title}</h2>}
            <p className="text-lg lg:text-xl font-bold leading-loose text-slate-600 dark:text-slate-400 whitespace-pre-wrap">{section.content}</p>
          </div>
        );
      case 'image':
        return (
          <div key={index} className="my-16 group">
            <div className="rounded-[3rem] overflow-hidden border-8 border-slate-50 dark:border-slate-900 shadow-2xl transition-transform duration-500 group-hover:scale-[1.01]">
              <img src={section.data?.url} alt={section.data?.alt || section.title} className="w-full object-cover" />
            </div>
            {section.title && <p className="text-center mt-4 text-[10px] font-black uppercase tracking-widest text-slate-400 italic">{section.title}</p>}
          </div>
        );
      case 'list':
        return (
          <div key={index} className="mb-16 bg-slate-50 dark:bg-slate-900/50 p-10 lg:p-14 rounded-[3rem] border border-slate-100 dark:border-white/5">
            {section.title && <h3 className="text-2xl font-black uppercase italic tracking-tighter mb-8 text-slate-900 dark:text-white flex items-center gap-3">
              <Sparkles className="text-primary" size={24} /> {section.title}
            </h3>}
            <ul className="grid sm:grid-cols-2 gap-6">
              {section.items?.map((item: string, idx: number) => (
                <li key={idx} className="flex items-start gap-4 text-base font-bold text-slate-600 dark:text-slate-400">
                  <span className="size-6 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0 mt-0.5">
                    <ChevronRight size={14} />
                  </span>
                  {item}
                </li>
              ))}
            </ul>
          </div>
        );
      case 'table':
        return (
          <div key={index} className="mb-16 overflow-hidden rounded-[2.5rem] border border-slate-200 dark:border-slate-800 shadow-xl bg-white dark:bg-slate-900">
             {section.title && <div className="p-8 border-b border-slate-100 dark:border-white/5 bg-slate-50 dark:bg-slate-800/50 flex items-center gap-3">
               <TableIcon className="text-primary" size={20} />
               <h3 className="text-lg font-black uppercase italic tracking-widest">{section.title}</h3>
             </div>}
             <div className="overflow-x-auto">
               <table className="w-full text-left border-collapse">
                 <thead>
                   <tr className="bg-slate-100 dark:bg-slate-800 text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">
                     {section.columns?.map((col: string, idx: number) => (
                       <th key={idx} className="px-8 py-5">{col}</th>
                     ))}
                   </tr>
                 </thead>
                 <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                   {section.rows?.map((row: string[], ridx: number) => (
                     <tr key={ridx} className="hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors">
                       {row.map((cell, cidx) => (
                         <td key={cidx} className="px-8 py-5 text-sm font-bold text-slate-600 dark:text-slate-400">{cell}</td>
                       ))}
                     </tr>
                   ))}
                 </tbody>
               </table>
             </div>
          </div>
        );
      case 'highlight':
        return (
          <div key={index} className="mb-16 relative overflow-hidden bg-primary rounded-[3rem] p-12 lg:p-16 text-white shadow-2xl shadow-primary/20">
            <div className="absolute -top-10 -right-10 opacity-10 pointer-events-none">
              <Sparkles size={200} />
            </div>
            {section.title && <h3 className="text-sm font-black uppercase tracking-[.4em] mb-4 text-white/50">{section.title}</h3>}
            <p className="text-2xl lg:text-3xl font-black uppercase italic tracking-tight">{section.content}</p>
          </div>
        );
      case 'faq':
        return (
          <div key={index} className="mb-16 space-y-4">
             {section.title && <h3 className="text-3xl font-black uppercase italic tracking-tighter mb-8 flex items-center gap-3">
               <HelpCircle className="text-primary" size={28} /> {section.title}
             </h3>}
             <div className="grid gap-4">
               {section.items?.map((item: any, idx: number) => (
                 <div key={idx} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-8 rounded-[2rem] hover:border-primary transition-all group">
                   <h4 className="text-lg font-black uppercase italic tracking-tight mb-3 text-slate-900 dark:text-white group-hover:text-primary transition-colors">{item.question}</h4>
                   <p className="text-base font-bold text-slate-600 dark:text-slate-400 leading-relaxed">{item.answer}</p>
                 </div>
               ))}
             </div>
          </div>
        );
      default:
        return null;
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

  if (isLoading) {
    return (
      <div className="min-h-screen bg-white dark:bg-slate-950 pt-32 pb-20 px-6 lg:px-20">
         <div className="max-w-4xl mx-auto space-y-8">
            <div className="h-6 w-32 bg-slate-100 animate-pulse rounded-lg" />
            <div className="h-20 w-full bg-slate-100 animate-pulse rounded-2xl" />
            <div className="h-96 w-full bg-slate-100 animate-pulse rounded-[3rem]" />
         </div>
      </div>
    );
  }

  if (!blog) {
    return <div className="min-h-screen flex items-center justify-center">Post not found</div>;
  }

  return (
    <div className="min-h-screen bg-white dark:bg-slate-950 pb-32">
      <SEO 
        title={`${blog.title} - PayVit Insights`}
        description={blog.excerpt}
      />

      {/* Hero Header */}
      <section className="pt-32 pb-20 px-6 lg:px-20 bg-slate-50 dark:bg-slate-900/50">
        <div className="max-w-4xl mx-auto">
          <Link to="/blog" className="inline-flex items-center gap-2 text-primary font-black uppercase text-[10px] tracking-widest mb-12 hover:-translate-x-2 transition-transform">
             <ArrowLeft size={16} /> Back to Hub
          </Link>
          
          <div className="flex flex-wrap items-center gap-6 mb-8">
             <span className="px-5 py-2 bg-primary/10 text-primary border border-primary/20 rounded-full text-[10px] font-black uppercase tracking-[0.2em]">
                {blog.category.replace('-', ' ')}
             </span>
             <div className="flex items-center gap-2 text-slate-400 text-xs font-bold uppercase tracking-widest">
                <Calendar size={14} className="text-primary" />
                {new Date(blog.createdAt).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
             </div>
             <div className="flex items-center gap-2 text-slate-400 text-xs font-bold uppercase tracking-widest">
                <Clock size={14} className="text-primary" />
                {blog.readingTime} Min Read
             </div>
          </div>

          <h1 className="text-4xl lg:text-7xl font-black text-slate-900 dark:text-white uppercase italic tracking-tighter leading-none mb-10">
            {blog.title}
          </h1>

          <div className="flex items-center gap-4 py-8 border-y border-slate-200 dark:border-white/5">
             <div className="size-14 rounded-2xl bg-slate-900 flex items-center justify-center text-white overflow-hidden shadow-xl border-4 border-white dark:border-slate-800">
                {blog.author.avatar ? (
                  <img src={blog.author.avatar} alt={blog.author.name} className="w-full h-full object-cover" />
                ) : (
                  <span className="text-xl font-black italic italic uppercase tracking-tighter text-primary">
                    {getInitials(blog.author.name)}
                  </span>
                )}
             </div>
             <div>
                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mb-1">Written By</p>
                <p className="text-lg font-black text-slate-900 dark:text-white italic italic uppercase tracking-tighter">{blog.author.name}</p>
             </div>
          </div>
        </div>
      </section>

      {/* Featured Image */}
      <section className="px-6 lg:px-20 -mt-20">
         <div className="max-w-6xl mx-auto">
            <div className="aspect-[21/9] rounded-[4rem] overflow-hidden shadow-3xl border-8 border-white dark:border-slate-900 bg-slate-100 dark:bg-slate-800">
               {blog.featuredImage?.url ? (
                 <img src={blog.featuredImage.url} className="w-full h-full object-cover" alt={blog.featuredImage.alt || blog.title} />
               ) : (
                 <div className="w-full h-full flex items-center justify-center opacity-10">
                    <Sparkles size={100} />
                 </div>
               )}
            </div>
         </div>
      </section>

      {/* Article Content Area */}
      <section className="py-24 px-6 lg:px-20 grid lg:grid-cols-12 gap-16 max-w-7xl mx-auto">
         {/* Share Sidebar - Desktop */}
         <div className="hidden lg:block lg:col-span-1 border-r border-slate-100 dark:border-white/5 pr-12">
            <div className="sticky top-40 flex flex-col items-center gap-6">
               <span className="text-[9px] font-black uppercase tracking-widest text-slate-400 [writing-mode:vertical-lr] rotate-180 mb-4">Share Story</span>
               <a href="#" className="size-12 rounded-2xl bg-blue-600 text-white flex items-center justify-center hover:scale-110 transition-transform"><Facebook size={20} /></a>
               <a href="#" className="size-12 rounded-2xl bg-sky-500 text-white flex items-center justify-center hover:scale-110 transition-transform"><Twitter size={20} /></a>
               <a href="#" className="size-12 rounded-2xl bg-blue-800 text-white flex items-center justify-center hover:scale-110 transition-transform"><Linkedin size={20} /></a>
               <button onClick={() => navigator.clipboard.writeText(window.location.href)} className="size-12 rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 flex items-center justify-center hover:scale-110 transition-transform"><Share2 size={20} /></button>
            </div>
         </div>

         {/* Main Content */}
         <div className="lg:col-span-8">
            {/* Table of Contents */}
            {blog.toc?.length > 0 && (
              <div className="mb-20 bg-slate-50 dark:bg-slate-900/30 rounded-[3rem] p-12 border border-slate-100 dark:border-white/5 shadow-inner">
                <h4 className="text-xl font-black uppercase italic tracking-widest mb-8 text-primary">Table of Contents</h4>
                <div className="grid sm:grid-cols-2 gap-y-4 gap-x-12">
                  {blog.toc.map((item: string, idx: number) => (
                    <a 
                      key={idx} 
                      href={`#${item.toLowerCase().replace(/\s+/g, '-')}`}
                      className="text-sm font-bold text-slate-500 dark:text-slate-400 hover:text-primary transition-colors flex items-center gap-3 group"
                    >
                      <span className="text-[10px] font-black opacity-20 group-hover:opacity-100 transition-opacity">0{idx + 1}</span>
                      {item}
                    </a>
                  ))}
                </div>
              </div>
            )}

            {/* Dynamic Sections */}
            <div className="blog-sections">
              {blog.sections?.length > 0 ? (
                blog.sections.map((section: any, index: number) => renderSection(section, index))
              ) : (
                <div 
                  className="blog-content prose prose-2xl prose-slate dark:prose-invert max-w-none 
                    prose-headings:font-black prose-headings:uppercase prose-headings:italic prose-headings:tracking-tighter
                    prose-p:font-bold prose-p:leading-loose prose-p:text-slate-600 dark:prose-p:text-slate-400
                    prose-img:rounded-[3rem] prose-img:border prose-img:border-slate-100"
                  dangerouslySetInnerHTML={{ __html: blog.content || '' }}
                />
              )}
            </div>

            {/* Tags */}
            {blog.tags?.length > 0 && (
              <div className="mt-20 pt-12 border-t border-slate-100 dark:border-white/5 flex flex-wrap gap-3">
                 {blog.tags.map((tag: string) => (
                   <span key={tag} className="px-6 py-3 bg-slate-50 dark:bg-slate-900 rounded-2xl text-[10px] font-black uppercase tracking-widest text-slate-400 border border-slate-100 dark:border-white/5 shadow-sm">#{tag}</span>
                 ))}
              </div>
            )}

            {/* Comments Section */}
            <div className="mt-32">
               <div className="flex items-center gap-3 mb-12">
                  <div className="size-12 rounded-2xl bg-primary flex items-center justify-center text-white shadow-lg">
                     <MessageCircle size={24} />
                  </div>
                  <h3 className="text-3xl font-black italic uppercase italic tracking-tighter">Join The Conversation</h3>
               </div>

               {/* Comment Form */}
               <form onSubmit={handleCommentSubmit} className="bg-slate-50 dark:bg-slate-900 rounded-[3rem] p-12 mb-20 shadow-inner">
                  <div className="grid md:grid-cols-2 gap-8 mb-8">
                     <div className="space-y-3">
                        <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-2">Display Name</label>
                        <input 
                          type="text" 
                          required
                          value={commentData.name}
                          onChange={(e) => setCommentData({...commentData, name: e.target.value})}
                          placeholder="Your identity..."
                          className="w-full px-8 py-5 bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-white/5 focus:outline-none focus:border-primary transition-all font-bold shadow-sm"
                        />
                     </div>
                  </div>
                  <div className="space-y-3 mb-10">
                     <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-2">What's on your mind?</label>
                     <textarea 
                        required
                        rows={5}
                        value={commentData.comment}
                        onChange={(e) => setCommentData({...commentData, comment: e.target.value})}
                        placeholder="Share your thoughts or questions..."
                        className="w-full px-8 py-6 bg-white dark:bg-slate-800 rounded-[2rem] border border-slate-100 dark:border-white/5 focus:outline-none focus:border-primary transition-all font-bold resize-none shadow-sm"
                     />
                  </div>
                  <button 
                    disabled={isSubmitting}
                    className="px-12 py-5 bg-primary text-white rounded-2xl font-black uppercase text-xs tracking-widest hover:scale-105 transition-all shadow-xl shadow-primary/20 flex items-center gap-3 disabled:opacity-50"
                  >
                    Submit Thoughts <Send size={16} />
                  </button>
               </form>

               {/* Render Approved Comments */}
               <div className="space-y-12">
                  {blog.comments?.filter((c: any) => c.approved).length > 0 ? (
                    blog.comments.filter((c: any) => c.approved).map((c: any) => (
                      <div key={c._id} className="flex gap-6 p-6 rounded-[2.5rem] bg-slate-50 dark:bg-slate-900/20 border border-slate-100 dark:border-white/5">
                         <div className="size-14 rounded-2xl bg-white dark:bg-slate-800 flex items-center justify-center text-xl font-black italic italic uppercase text-primary shrink-0 shadow-md">
                            {getInitials(c.name)}
                         </div>
                         <div className="flex-1">
                            <div className="flex items-center justify-between mb-2">
                               <h5 className="font-black uppercase italic italic text-slate-900 dark:text-white tracking-widest">@{c.name}</h5>
                               <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{new Date(c.createdAt).toLocaleDateString()}</span>
                            </div>
                            <p className="text-slate-600 dark:text-slate-400 font-bold leading-relaxed">{c.comment}</p>
                         </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-12 text-slate-400">
                       <p className="text-sm font-bold uppercase tracking-[0.2em] italic italic opacity-50">No approval comments yet. Start the discussion!</p>
                    </div>
                  )}
               </div>
            </div>
         </div>

         {/* Sidebar - Desktop */}
         <div className="hidden lg:block lg:col-span-3">
            <div className="sticky top-40 flex flex-col gap-8">
               <div className="bg-slate-900 rounded-[3rem] p-10 text-white relative overflow-hidden group shadow-2xl">
                  <div className="absolute top-0 right-0 p-4 opacity-10 pointer-events-none">
                     <Sparkles size={100} />
                  </div>
                  <h4 className="text-xl font-black italic italic uppercase tracking-tighter mb-6 underline decoration-primary decoration-4 underline-offset-8 transition-all">Trending Now</h4>
                  <p className="text-sm font-bold text-slate-400 mb-8 leading-relaxed">Discover more articles on loan eligibility and financial freedom.</p>
                  <Link to="/blog" className="inline-flex items-center gap-2 text-primary font-black uppercase text-[10px] tracking-widest hover:translate-x-2 transition-transform">Explore More <ArrowRight size={14} /></Link>
               </div>

               <div className="bg-primary/5 rounded-[3rem] p-10 border border-primary/10 relative overflow-hidden">
                  <h4 className="text-lg font-black italic uppercase tracking-tighter mb-4 text-slate-900 dark:text-white">Expert Advisory</h4>
                  <p className="text-xs font-bold text-slate-500 mb-6 uppercase tracking-wider">Get personalized help for your financial needs.</p>
                  <Link to="/about" className="px-6 py-3 bg-white dark:bg-slate-900 rounded-xl text-[9px] font-black uppercase tracking-widest text-primary shadow-sm hover:bg-primary hover:text-white transition-all inline-block">Speak to Us</Link>
               </div>
            </div>
         </div>
      </section>
    </div>
  );
}


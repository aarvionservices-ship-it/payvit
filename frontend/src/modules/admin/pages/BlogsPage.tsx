import { useState, useEffect } from 'react';
import { 
  Search, 
  Plus, 
  Calendar, 
  Clock, 
  Newspaper, 
  Trash2, 
  Edit3, 
  Loader2, 
  Eye, 
  LayoutGrid, 
  List,
  MessageCircle,
  X,
  CheckCircle2,
  XCircle,
  ShieldCheck,
  User,
  Quote
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Link } from 'react-router-dom';
import { getBlogs, deleteBlog, updateCommentStatus } from '../../../api/blog.api';
import { toast } from 'react-hot-toast';
import Pagination from '../../../components/Pagination';

export default function BlogsPage() {
  const [blogs, setBlogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [totalBlogs, setTotalBlogs] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [limit] = useState(10);
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('table');
  
  // Feedback Management State
  const [feedbackBlog, setFeedbackBlog] = useState<any>(null);
  const [isFeedbackModalOpen, setIsFeedbackModalOpen] = useState(false);

  const [filters, setFilters] = useState({
    search: "",
    status: "all",
    category: "all"
  });
  const [debouncedSearch, setDebouncedSearch] = useState("");

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(filters.search);
    }, 500);
    return () => clearTimeout(timer);
  }, [filters.search]);

  useEffect(() => {
    fetchBlogs();
  }, [currentPage, debouncedSearch, filters.status, filters.category]);

  const fetchBlogs = async () => {
    try {
      setLoading(true);
      const params: any = {
        page: currentPage,
        limit,
        search: debouncedSearch || undefined,
        status: filters.status !== 'all' ? filters.status : undefined,
        category: filters.category !== 'all' ? filters.category : undefined
      };

      const res = await getBlogs(params);
      if (res.success) {
        setBlogs(res.data || []);
        setTotalBlogs(res.total || 0);
        
        // Update feedback modal data if open
        if (feedbackBlog) {
            const updatedBlog = res.data.find((b: any) => b._id === feedbackBlog._id);
            if (updatedBlog) setFeedbackBlog(updatedBlog);
        }
      }
    } catch (error) {
      toast.error("Failed to load blog database");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm("Are you sure you want to delete this intelligence asset? This action is irreversible.")) return;
    
    try {
      const res = await deleteBlog(id);
      if (res.success) {
        toast.success("Article successfully purged from archives");
        fetchBlogs();
      }
    } catch (error) {
      toast.error("Deletion protocol failed");
    }
  };

  const handleToggleComment = async (blogId: string, commentId: string, currentStatus: boolean) => {
    try {
      const res = await updateCommentStatus(blogId, commentId, !currentStatus);
      if (res.success) {
        toast.success(!currentStatus ? "Feedback authorized for public transmission" : "Feedback restricted from public view");
        fetchBlogs();
      }
    } catch (error) {
       toast.error("Authorization protocol failed");
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

  return (
    <div className="space-y-6 lg:space-y-8 pb-10">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl lg:text-3xl font-black tracking-tight text-slate-900 dark:text-white uppercase italic">Editorial Hub</h1>
          <p className="text-[10px] text-slate-500 dark:text-slate-400 font-bold uppercase tracking-[0.4em] mt-1">Content Intelligence & Insights</p>
        </div>
        <Link 
          to="/admin/blogs/create"
          className="bg-primary text-white px-8 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-3 hover:scale-105 transition-all shadow-xl shadow-primary/20"
        >
          <Plus size={16} /> Draft New Story
        </Link>
      </div>

      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-4 shadow-sm flex flex-col lg:flex-row gap-4 items-center justify-between">
        <div className="relative max-w-md w-full">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 size-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search by title, excerpt or content..."
            value={filters.search}
            onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
            className="w-full bg-slate-50 dark:bg-slate-800 border-none rounded-xl py-3 pl-12 pr-4 text-sm font-bold focus:ring-2 focus:ring-primary/20 transition-all"
          />
        </div>
        <div className="flex items-center gap-3 w-full lg:w-auto">
          <select 
            value={filters.category}
            onChange={(e) => setFilters(prev => ({ ...prev, category: e.target.value }))}
            className="flex-1 lg:flex-none bg-slate-50 dark:bg-slate-800 border-none rounded-xl px-4 py-3 text-[10px] font-black uppercase tracking-widest focus:ring-2 focus:ring-primary/20 transition-all cursor-pointer"
          >
            <option value="all">All Channels</option>
            <option value="personal-loan">Personal Loan</option>
            <option value="credit-cards">Credit Cards</option>
            <option value="investments">Investments</option>
            <option value="fintech-news">Fintech News</option>
          </select>
          
          <div className="h-10 w-[1px] bg-slate-100 dark:bg-slate-800 hidden lg:block mx-1"></div>
          
          <div className="flex bg-slate-50 dark:bg-slate-800 p-1 rounded-xl">
             <button 
              onClick={() => setViewMode('table')}
              className={`p-2 rounded-lg transition-all ${viewMode === 'table' ? 'bg-white dark:bg-slate-900 text-primary shadow-sm' : 'text-slate-400'}`}
             >
                <List size={18} />
             </button>
             <button 
              onClick={() => setViewMode('grid')}
              className={`p-2 rounded-lg transition-all ${viewMode === 'grid' ? 'bg-white dark:bg-slate-900 text-primary shadow-sm' : 'text-slate-400'}`}
             >
                <LayoutGrid size={18} />
             </button>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 gap-4">
          <Loader2 className="size-10 animate-spin text-primary opacity-20" />
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Archiving Article Database...</p>
        </div>
      ) : (
        <>
          {viewMode === 'grid' ? (
             <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                {blogs.map((blog) => (
                  <motion.div
                    key={blog._id}
                    layout
                    className="bg-white dark:bg-slate-900 rounded-[2.5rem] border border-slate-200 dark:border-slate-800 p-6 shadow-sm hover:shadow-xl transition-all group overflow-hidden"
                  >
                     <div className="aspect-video rounded-3xl overflow-hidden mb-6 relative">
                        {blog.featuredImage?.url ? (
                          <img src={blog.featuredImage.url} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" alt={blog.title} />
                        ) : (
                          <div className="w-full h-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
                             <Newspaper size={40} className="text-slate-300" />
                          </div>
                        )}
                        <div className="absolute top-4 right-4 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md px-4 py-1.5 rounded-full text-[8px] font-black uppercase tracking-widest text-primary border border-slate-100 dark:border-white/5 shadow-lg">
                           {blog.status}
                        </div>
                     </div>
                     
                     <div className="space-y-4">
                        <div className="flex items-center justify-between text-[10px] font-black uppercase tracking-widest text-slate-400">
                           <span className="text-primary">{blog.category.replace('-', ' ')}</span>
                           <span>{blog.readingTime} Min Read</span>
                        </div>
                        <h3 className="text-xl font-black text-slate-900 dark:text-white leading-tight line-clamp-2 uppercase italic">{blog.title}</h3>
                        <p className="text-xs text-slate-500 dark:text-slate-400 font-bold line-clamp-2 leading-relaxed">{blog.excerpt}</p>
                        
                        <div className="pt-6 border-t border-slate-50 dark:border-slate-800 flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <button 
                                  onClick={() => { setFeedbackBlog(blog); setIsFeedbackModalOpen(true); }}
                                  className="relative inline-flex items-center gap-2 px-4 py-2 bg-slate-900 dark:bg-slate-800 text-white rounded-xl text-[9px] font-black uppercase tracking-widest hover:bg-primary transition-all group/btn"
                                >
                                    <MessageCircle size={14} className="group-hover/btn:rotate-12 transition-transform" />
                                    Check Feedback
                                    {blog.comments?.filter((c: any) => !c.approved).length > 0 && (
                                        <span className="absolute -top-2 -right-2 size-5 bg-rose-500 text-white rounded-full flex items-center justify-center text-[8px] shadow-lg animate-bounce">
                                            {blog.comments.filter((c: any) => !c.approved).length}
                                        </span>
                                    )}
                                </button>
                            </div>
                           <div className="flex items-center gap-2">
                              <button onClick={() => handleDelete(blog._id)} className="p-2 text-slate-300 hover:text-rose-500 transition-colors"><Trash2 size={18} /></button>
                              <Link to={`/admin/blogs/edit/${blog._id}`} className="p-2 text-slate-300 hover:text-primary transition-colors"><Edit3 size={18} /></Link>
                              <Link to={`/blog/${blog.slug}`} target="_blank" className="p-2 text-slate-300 hover:text-blue-500 transition-colors"><Eye size={18} /></Link>
                           </div>
                        </div>
                     </div>
                  </motion.div>
                ))}
             </div>
          ) : (
            <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
               <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-50 dark:bg-slate-800/50 text-slate-400 text-[10px] font-black uppercase tracking-widest border-b border-slate-100 dark:border-slate-800">
                      <th className="px-8 py-6">Article Intel</th>
                      <th className="px-8 py-6">Channel</th>
                      <th className="px-8 py-6 text-center">Feedback Hub</th>
                      <th className="px-8 py-6">State</th>
                      <th className="px-8 py-6 text-right">Operations</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {blogs.map((blog) => (
                      <tr key={blog._id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors group">
                        <td className="px-8 py-6 max-w-md">
                          <div className="flex items-center gap-4">
                             <div className="size-14 rounded-2xl overflow-hidden shrink-0 shadow-lg border-2 border-white dark:border-slate-800">
                                {blog.featuredImage?.url ? <img src={blog.featuredImage.url} className="w-full h-full object-cover" /> : <div className="w-full h-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-300"><Newspaper size={20} /></div>}
                             </div>
                             <div>
                                <h4 className="font-black text-slate-900 dark:text-white leading-tight line-clamp-2 uppercase italic text-sm mb-1">{blog.title}</h4>
                                <div className="flex items-center gap-3 text-[10px] text-slate-400 font-bold uppercase tracking-widest">
                                   <Calendar size={12} className="text-primary" /> {new Date(blog.createdAt).toLocaleDateString()}
                                   <Clock size={12} className="text-primary" /> {blog.readingTime}m
                                </div>
                             </div>
                          </div>
                        </td>
                        <td className="px-8 py-6">
                           <span className="text-[10px] font-black text-primary uppercase tracking-[0.2em] italic bg-primary/5 px-3 py-1.5 rounded-lg border border-primary/10">{blog.category.replace('-', ' ')}</span>
                        </td>
                        <td className="px-8 py-6">
                           <div className="flex justify-center">
                              <button 
                                onClick={() => { setFeedbackBlog(blog); setIsFeedbackModalOpen(true); }}
                                className={`relative flex flex-col items-center gap-1 group/btn transition-all ${blog.comments?.some((c: any) => !c.approved) ? 'scale-110' : 'opacity-40 hover:opacity-100'}`}
                              >
                                 <div className={`p-3 rounded-2xl ${blog.comments?.some((c: any) => !c.approved) ? 'bg-primary text-white shadow-xl shadow-primary/20' : 'bg-slate-100 dark:bg-slate-800 text-slate-400'}`}>
                                    <MessageCircle size={20} />
                                 </div>
                                 <span className="text-[8px] font-black uppercase tracking-tighter">
                                    {blog.comments?.length || 0} Comments
                                 </span>
                                 {blog.comments?.filter((c: any) => !c.approved).length > 0 && (
                                    <span className="absolute -top-1 -right-1 size-5 bg-rose-500 text-white rounded-full flex items-center justify-center text-[8px] font-black border-2 border-white dark:border-slate-900">
                                       {blog.comments.filter((c: any) => !c.approved).length}
                                    </span>
                                 )}
                              </button>
                           </div>
                        </td>
                        <td className="px-8 py-6">
                           <span className={`px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest border shadow-sm ${
                             blog.status === 'published' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-amber-50 text-amber-600 border-amber-100'
                           }`}>
                              {blog.status}
                           </span>
                        </td>
                        <td className="px-8 py-6 text-right">
                           <div className="flex items-center justify-end gap-2">
                              <Link to={`/admin/blogs/edit/${blog._id}`} className="size-10 bg-slate-50 dark:bg-slate-800 text-slate-400 hover:bg-primary hover:text-white rounded-xl flex items-center justify-center transition-all shadow-sm">
                                 <Edit3 size={18} />
                              </Link>
                              <button onClick={() => handleDelete(blog._id)} className="size-10 bg-slate-50 dark:bg-slate-800 text-slate-400 hover:bg-rose-500 hover:text-white rounded-xl flex items-center justify-center transition-all shadow-sm">
                                 <Trash2 size={18} />
                              </button>
                           </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
               </table>
            </div>
          )}

          <Pagination
            currentPage={currentPage}
            totalPage={Math.ceil(totalBlogs / limit)}
            onPageChange={setCurrentPage}
            isLoading={loading}
          />
        </>
      )}

      {/* Feedback Management Modal */}
      <AnimatePresence>
        {isFeedbackModalOpen && feedbackBlog && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
             <motion.div 
               initial={{ opacity: 0 }}
               animate={{ opacity: 1 }}
               exit={{ opacity: 0 }}
               onClick={() => setIsFeedbackModalOpen(false)}
               className="absolute inset-0 bg-slate-950/80 backdrop-blur-md"
             />
             <motion.div 
               initial={{ opacity: 0, scale: 0.9, y: 30 }}
               animate={{ opacity: 1, scale: 1, y: 0 }}
               exit={{ opacity: 0, scale: 0.9, y: 30 }}
               className="relative w-full max-w-2xl bg-white dark:bg-slate-900 rounded-[3rem] overflow-hidden shadow-3xl border border-white/10"
             >
                {/* Modal Header */}
                <div className="bg-slate-900 p-8 flex items-center justify-between text-white">
                   <div className="flex items-center gap-4">
                      <div className="size-12 bg-primary rounded-2xl flex items-center justify-center shadow-lg shadow-primary/20">
                         <MessageCircle size={24} />
                      </div>
                      <div>
                         <h3 className="text-xl font-black uppercase italic tracking-tighter">Feedback Authentication</h3>
                         <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">{feedbackBlog.title.substring(0, 40)}...</p>
                      </div>
                   </div>
                   <button 
                    onClick={() => setIsFeedbackModalOpen(false)}
                    className="size-10 bg-white/5 rounded-xl flex items-center justify-center hover:bg-white/10 transition-all"
                   >
                      <X size={20} />
                   </button>
                </div>

                {/* Modal Content */}
                <div className="p-8 max-h-[60vh] overflow-y-auto space-y-6 bg-slate-50/50 dark:bg-slate-950/20">
                   {feedbackBlog.comments?.length > 0 ? (
                     feedbackBlog.comments.map((comment: any) => (
                       <div 
                        key={comment._id} 
                        className={`p-6 rounded-[2rem] border transition-all ${comment.approved ? 'bg-white dark:bg-slate-900 border-emerald-500/20 shadow-lg' : 'bg-slate-200/50 dark:bg-slate-800/40 border-slate-200 dark:border-slate-800'}`}
                       >
                          <div className="flex items-start justify-between mb-4">
                             <div className="flex items-center gap-3">
                                <div className="size-10 bg-slate-900 text-white rounded-xl flex items-center justify-center text-xs font-black uppercase italic italic">
                                   <User size={16} className="text-primary mr-1" /> {getInitials(comment.name)}
                                </div>
                                <div>
                                   <h5 className="text-xs font-black uppercase tracking-widest text-slate-900 dark:text-white">@{comment.name}</h5>
                                   <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">{new Date(comment.createdAt).toLocaleDateString()}</p>
                                </div>
                             </div>
                             <div className={`px-3 py-1 rounded-lg text-[8px] font-black uppercase tracking-widest border ${comment.approved ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' : 'bg-amber-500/10 text-amber-500 border-amber-500/20'}`}>
                                {comment.approved ? 'Authorized' : 'Pending Review'}
                             </div>
                          </div>
                          
                          <div className="relative mb-6">
                             <Quote size={20} className="absolute -top-2 -left-2 text-primary opacity-20" />
                             <p className="text-sm font-bold text-slate-600 dark:text-slate-400 pl-4 py-2 leading-relaxed italic">{comment.comment}</p>
                          </div>

                          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100 dark:border-white/5">
                             {!comment.approved ? (
                               <button 
                                onClick={() => handleToggleComment(feedbackBlog._id, comment._id, false)}
                                className="px-6 py-2 bg-emerald-500 text-white rounded-xl text-[9px] font-black uppercase tracking-widest flex items-center gap-2 hover:scale-105 transition-all shadow-md shadow-emerald-500/20"
                               >
                                  <CheckCircle2 size={14} /> Authorize Transmission
                               </button>
                             ) : (
                               <button 
                                onClick={() => handleToggleComment(feedbackBlog._id, comment._id, true)}
                                className="px-6 py-2 bg-slate-900 text-white rounded-xl text-[9px] font-black uppercase tracking-widest flex items-center gap-2 hover:bg-rose-500 transition-all shadow-md"
                               >
                                  <XCircle size={14} /> Revoke Authorization
                               </button>
                             )}
                          </div>
                       </div>
                     ))
                   ) : (
                     <div className="py-20 text-center space-y-4">
                        <MessageCircle size={60} className="mx-auto text-slate-200 dark:text-slate-800" />
                        <p className="text-xs font-black uppercase tracking-[0.3em] text-slate-400 opacity-50">Archives clear. No incoming feedback detected.</p>
                     </div>
                   )}
                </div>

                <div className="p-8 bg-slate-50 dark:bg-slate-900 border-t border-slate-100 dark:border-white/5 flex items-center justify-between">
                   <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-slate-400">
                      <ShieldCheck size={14} className="text-primary" /> Security Clearance Protocol Active
                   </div>
                   <button 
                    onClick={() => setIsFeedbackModalOpen(false)}
                    className="px-8 py-3 bg-slate-900 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-black transition-all"
                   >
                     Close Archive
                   </button>
                </div>
             </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}


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
      toast.error("Failed to load blogs database");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm("Are you sure you want to delete this blog? This action is irreversible.")) return;
    
    try {
      const res = await deleteBlog(id);
      if (res.success) {
        toast.success("Blog post successfully deleted");
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
        toast.success(!currentStatus ? "Comment approved for public display" : "Comment hidden from public view");
        fetchBlogs();
      }
    } catch (error) {
       toast.error("Handshake failed during verification");
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
      {/* Header section */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold tracking-tight text-slate-900 dark:text-white">Blogs</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Manage published articles, review reader comments, and draft news.</p>
        </div>
        <Link 
          to="/admin/blogs/create"
          className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-xl text-xs font-semibold flex items-center justify-center gap-2 hover:scale-[1.02] active:scale-[0.98] transition-all shadow-sm w-fit"
        >
          <Plus size={16} /> Add Blog
        </Link>
      </div>

      {/* Control bar filters */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-4 shadow-sm flex flex-col lg:flex-row gap-4 items-center justify-between">
        <div className="relative max-w-md w-full">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 size-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search by title, excerpt or content..."
            value={filters.search}
            onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
            className="w-full bg-slate-50 dark:bg-slate-800 border-none rounded-xl py-2.5 pl-11 pr-4 text-sm font-medium focus:ring-2 focus:ring-primary/20 transition-all"
          />
        </div>
        <div className="flex items-center gap-3 w-full lg:w-auto">
          <select 
            value={filters.category}
            onChange={(e) => setFilters(prev => ({ ...prev, category: e.target.value }))}
            className="flex-1 lg:flex-none bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs font-semibold text-slate-600 dark:text-slate-300 focus:ring-2 focus:ring-primary/20 transition-all cursor-pointer"
          >
            <option value="all">All Categories</option>
            <option value="personal-loan">Personal Loan</option>
            <option value="credit-cards">Credit Cards</option>
            <option value="investments">Investments</option>
            <option value="fintech-news">Fintech News</option>
          </select>
          
          <div className="h-10 w-[1px] bg-slate-100 dark:bg-slate-800 hidden lg:block mx-1"></div>
          
          <div className="flex bg-slate-50 dark:bg-slate-800 p-1 rounded-xl">
             <button 
              onClick={() => setViewMode('table')}
              className={`p-2 rounded-lg transition-all ${viewMode === 'table' ? 'bg-white dark:bg-slate-900 text-blue-600 shadow-sm' : 'text-slate-400'}`}
             >
                <List size={18} />
             </button>
             <button 
              onClick={() => setViewMode('grid')}
              className={`p-2 rounded-lg transition-all ${viewMode === 'grid' ? 'bg-white dark:bg-slate-900 text-blue-600 shadow-sm' : 'text-slate-400'}`}
             >
                <LayoutGrid size={18} />
             </button>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 gap-4">
          <Loader2 className="size-8 animate-spin text-blue-600" />
          <p className="text-sm font-medium text-slate-500">Loading blog database...</p>
        </div>
      ) : (
        <>
          {viewMode === 'grid' ? (
             <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                {blogs.map((blog) => (
                  <motion.div
                    key={blog._id}
                    layout
                    className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm hover:shadow-md transition-all group overflow-hidden"
                  >
                     <div className="aspect-video rounded-xl overflow-hidden mb-5 relative">
                        {blog.featuredImage?.url ? (
                          <img src={blog.featuredImage.url} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" alt={blog.title} />
                        ) : (
                          <div className="w-full h-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
                             <Newspaper size={36} className="text-slate-300 animate-pulse" />
                          </div>
                        )}
                        <div className="absolute top-3 right-3 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md px-2.5 py-1 rounded-full text-[10px] font-semibold text-blue-600 border border-slate-150 shadow-sm capitalize">
                           {blog.status}
                        </div>
                     </div>
                     
                     <div className="space-y-4">
                        <div className="flex items-center justify-between text-xs font-semibold text-slate-500">
                           <span className="text-blue-600 capitalize">{blog.category.replace('-', ' ')}</span>
                           <span>{blog.readingTime} Min Read</span>
                        </div>
                        <h3 className="text-lg font-bold text-slate-900 dark:text-white leading-snug line-clamp-2 capitalize">{blog.title}</h3>
                        <p className="text-sm text-slate-500 dark:text-slate-450 line-clamp-2 leading-relaxed">{blog.excerpt}</p>
                        
                        <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <button 
                                  onClick={() => { setFeedbackBlog(blog); setIsFeedbackModalOpen(true); }}
                                  className="relative inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-slate-955 dark:bg-slate-800 text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 rounded-lg text-xs font-semibold hover:text-blue-600 transition-all group/btn"
                                >
                                    <MessageCircle size={14} className="group-hover/btn:scale-110 transition-transform" />
                                    Comments
                                    {blog.comments?.filter((c: any) => !c.approved).length > 0 && (
                                        <span className="absolute -top-2 -right-2 size-5 bg-rose-500 text-white rounded-full flex items-center justify-center text-[10px] font-bold shadow-sm animate-bounce">
                                            {blog.comments.filter((c: any) => !c.approved).length}
                                        </span>
                                    )}
                                </button>
                            </div>
                           <div className="flex items-center gap-2">
                              <button onClick={() => handleDelete(blog._id)} className="p-1.5 text-slate-400 hover:text-rose-600 transition-colors"><Trash2 size={18} /></button>
                              <Link to={`/admin/blogs/edit/${blog._id}`} className="p-1.5 text-slate-400 hover:text-blue-600 transition-colors"><Edit3 size={18} /></Link>
                              <Link to={`/blog/${blog.slug}`} target="_blank" className="p-1.5 text-slate-400 hover:text-blue-600 transition-colors"><Eye size={18} /></Link>
                           </div>
                        </div>
                     </div>
                  </motion.div>
                ))}
             </div>
          ) : (
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
               <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-50/70 dark:bg-slate-800/40 text-slate-500 text-xs font-semibold uppercase tracking-wider border-b border-slate-250 dark:border-slate-800">
                      <th className="px-6 py-3.5">Blog Details</th>
                      <th className="px-6 py-3.5">Category</th>
                      <th className="px-6 py-3.5 text-center">Comments</th>
                      <th className="px-6 py-3.5">Status</th>
                      <th className="px-6 py-3.5 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {blogs.map((blog) => (
                      <tr key={blog._id} className="hover:bg-blue-50/20 dark:hover:bg-slate-800/30 transition-all group">
                        <td className="px-6 py-3.5 max-w-md">
                          <div className="flex items-center gap-3">
                             <div className="size-11 rounded-lg overflow-hidden shrink-0 shadow-sm border border-slate-200 dark:border-slate-800">
                                {blog.featuredImage?.url ? <img src={blog.featuredImage.url} className="w-full h-full object-cover" /> : <div className="w-full h-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-300"><Newspaper size={18} /></div>}
                             </div>
                             <div>
                                <h4 className="font-bold text-slate-900 dark:text-white leading-tight line-clamp-2 text-sm mb-1 group-hover:text-blue-600 transition-colors">{blog.title}</h4>
                                <div className="flex items-center gap-2 text-xs text-slate-500">
                                   <Calendar size={12} className="text-blue-600" /> {new Date(blog.createdAt).toLocaleDateString()}
                                   <span className="size-1 bg-slate-300 rounded-full" />
                                   <Clock size={12} className="text-blue-600" /> {blog.readingTime}m read
                                </div>
                             </div>
                          </div>
                        </td>
                        <td className="px-6 py-3.5">
                           <span className="text-xs font-semibold text-blue-600 bg-blue-50 dark:bg-blue-500/10 px-2.5 py-1 rounded-lg capitalize border border-blue-100 dark:border-blue-500/20">{blog.category.replace('-', ' ')}</span>
                        </td>
                        <td className="px-6 py-3.5">
                           <div className="flex justify-center">
                              <button 
                                onClick={() => { setFeedbackBlog(blog); setIsFeedbackModalOpen(true); }}
                                className={`relative flex items-center gap-1.5 px-3 py-1.5 border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 text-slate-600 dark:text-slate-300 rounded-xl text-xs font-semibold hover:text-blue-600 transition-all ${blog.comments?.some((c: any) => !c.approved) ? 'scale-105 border-blue-200 bg-blue-50/20 dark:bg-blue-500/5' : ''}`}
                              >
                                 <MessageCircle size={15} />
                                 <span>{blog.comments?.length || 0}</span>
                                 {blog.comments?.filter((c: any) => !c.approved).length > 0 && (
                                    <span className="absolute -top-1.5 -right-1.5 size-4 bg-rose-500 text-white rounded-full flex items-center justify-center text-[9px] font-bold border-2 border-white dark:border-slate-900 animate-bounce">
                                       {blog.comments.filter((c: any) => !c.approved).length}
                                    </span>
                                 )}
                              </button>
                           </div>
                        </td>
                        <td className="px-6 py-3.5">
                           <span className={`px-2.5 py-1 rounded-full text-xs font-semibold border shadow-sm capitalize ${
                             blog.status === 'published' ? 'bg-emerald-50 text-emerald-700 border-emerald-100' : 'bg-amber-50 text-amber-700 border-amber-100'
                           }`}>
                              {blog.status}
                           </span>
                        </td>
                        <td className="px-6 py-3.5 text-right">
                           <div className="flex items-center justify-end gap-2">
                              <Link to={`/admin/blogs/edit/${blog._id}`} className="size-9 bg-slate-50 dark:bg-slate-800 text-slate-400 hover:bg-blue-50 hover:text-blue-600 rounded-lg flex items-center justify-center transition-all border border-slate-100 dark:border-slate-700">
                                 <Edit3 size={16} />
                              </Link>
                              <button onClick={() => handleDelete(blog._id)} className="size-9 bg-slate-50 dark:bg-slate-800 text-slate-400 hover:bg-rose-50 hover:text-rose-650 rounded-lg flex items-center justify-center transition-all border border-slate-100 dark:border-slate-700">
                                 <Trash2 size={16} />
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
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
             <motion.div 
               initial={{ opacity: 0 }}
               animate={{ opacity: 1 }}
               exit={{ opacity: 0 }}
               onClick={() => setIsFeedbackModalOpen(false)}
               className="absolute inset-0 bg-slate-950/60 backdrop-blur-sm"
             />
             <motion.div 
               initial={{ opacity: 0, scale: 0.95, y: 10 }}
               animate={{ opacity: 1, scale: 1, y: 0 }}
               exit={{ opacity: 0, scale: 0.95, y: 10 }}
               className="relative w-full max-w-xl bg-white dark:bg-slate-900 rounded-2xl overflow-hidden shadow-xl border border-slate-200 dark:border-slate-800"
             >
                {/* Modal Header */}
                <div className="bg-slate-950 p-6 flex items-center justify-between text-white border-b border-slate-800">
                   <div className="flex items-center gap-3">
                      <div className="size-10 bg-blue-600 rounded-xl flex items-center justify-center shadow-md">
                         <MessageCircle size={20} className="text-white" />
                      </div>
                      <div>
                         <h3 className="text-base font-bold">Comments Moderation</h3>
                         <p className="text-xs text-slate-450 line-clamp-1">{feedbackBlog.title}</p>
                      </div>
                   </div>
                   <button 
                    onClick={() => setIsFeedbackModalOpen(false)}
                    className="size-8 bg-white/5 rounded-lg flex items-center justify-center hover:bg-white/10 text-slate-400 hover:text-white transition-all"
                   >
                      <X size={18} />
                   </button>
                </div>

                {/* Modal Content */}
                <div className="p-6 max-h-[50vh] overflow-y-auto space-y-4 bg-slate-50/50 dark:bg-slate-950/20">
                   {feedbackBlog.comments?.length > 0 ? (
                     feedbackBlog.comments.map((comment: any) => (
                       <div 
                        key={comment._id} 
                        className={`p-4 rounded-xl border transition-all ${comment.approved ? 'bg-white dark:bg-slate-900 border-emerald-500/20 shadow-sm' : 'bg-slate-100 dark:bg-slate-800/40 border-slate-200 dark:border-slate-800'}`}
                       >
                          <div className="flex items-start justify-between mb-3">
                             <div className="flex items-center gap-2.5">
                                <div className="size-8 bg-slate-100 border text-slate-700 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-350 rounded-lg flex items-center justify-center text-xs font-bold uppercase">
                                   {getInitials(comment.name)}
                                </div>
                                <div>
                                   <h5 className="text-xs font-bold text-slate-900 dark:text-white">@{comment.name}</h5>
                                   <p className="text-[10px] text-slate-400">{new Date(comment.createdAt).toLocaleDateString()}</p>
                                </div>
                             </div>
                             <span className={`px-2 py-0.5 rounded text-[10px] font-semibold border ${comment.approved ? 'bg-emerald-50 text-emerald-705 border-emerald-100' : 'bg-amber-50 text-amber-705 border-amber-100'}`}>
                                {comment.approved ? 'Approved' : 'Pending'}
                             </span>
                          </div>
                          
                          <div className="relative mb-4 bg-slate-50 dark:bg-slate-800/20 p-3 rounded-lg border border-slate-100 dark:border-slate-800">
                             <Quote size={14} className="absolute top-2 left-2 text-blue-600/10" />
                             <p className="text-xs text-slate-600 dark:text-slate-455 pl-3 leading-relaxed italic">"{comment.comment}"</p>
                          </div>

                          <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                             {!comment.approved ? (
                               <button 
                                onClick={() => handleToggleComment(feedbackBlog._id, comment._id, false)}
                                className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 shadow-sm hover:scale-[1.01] transition-all"
                               >
                                  <CheckCircle2 size={13} /> Approve
                               </button>
                             ) : (
                               <button 
                                onClick={() => handleToggleComment(feedbackBlog._id, comment._id, true)}
                                className="px-3.5 py-1.5 bg-slate-900 hover:bg-rose-600 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all"
                               >
                                  <XCircle size={13} /> Hide comment
                               </button>
                             )}
                          </div>
                       </div>
                     ))
                   ) : (
                     <div className="py-12 text-center space-y-3">
                        <MessageCircle size={44} className="mx-auto text-slate-300 dark:text-slate-700" />
                        <p className="text-xs font-semibold text-slate-400">No reader comments found on this article.</p>
                     </div>
                   )}
                </div>

                {/* Modal Footer */}
                <div className="p-5 bg-slate-50 dark:bg-slate-900 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                   <div className="flex items-center gap-2 text-xs font-medium text-slate-500">
                      <ShieldCheck size={15} className="text-blue-600" /> Security authorization active
                   </div>
                   <button 
                    onClick={() => setIsFeedbackModalOpen(false)}
                    className="px-4 py-2 bg-slate-950 text-white rounded-lg text-xs font-semibold hover:bg-black transition-all"
                   >
                     Close
                   </button>
                </div>
             </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

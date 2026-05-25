const BlogService = require('../service/blog.service');

class BlogController {
    async createBlog(req, res) {
        try {
            const blog = await BlogService.createBlog(req.body);
            res.status(201).json({ success: true, data: blog });
        } catch (error) {
            res.status(400).json({ success: false, message: error.message });
        }
    }

    async getBlogs(req, res) {
        try {
            const { page, limit, category, status, isFeatured, search, tag } = req.query;
            const filters = { category, status, isFeatured, search, tag };
            const options = { 
                page: parseInt(page) || 1, 
                limit: parseInt(limit) || 10 
            };
            
            const result = await BlogService.getBlogs(filters, options);
            res.status(200).json({ success: true, ...result });
        } catch (error) {
            res.status(400).json({ success: false, message: error.message });
        }
    }

    async getBlogBySlug(req, res) {
        try {
            const blog = await BlogService.getBlogBySlug(req.params.slug);
            if (!blog) return res.status(404).json({ success: false, message: 'Blog not found' });
            res.status(200).json({ success: true, data: blog });
        } catch (error) {
            res.status(400).json({ success: false, message: error.message });
        }
    }

    async getBlogById(req, res) {
        try {
            const blog = await BlogService.getBlogById(req.params.id);
            if (!blog) return res.status(404).json({ success: false, message: 'Blog not found' });
            res.status(200).json({ success: true, data: blog });
        } catch (error) {
            res.status(400).json({ success: false, message: error.message });
        }
    }

    async updateBlog(req, res) {
        try {
            const blog = await BlogService.updateBlog(req.params.id, req.body);
            if (!blog) return res.status(404).json({ success: false, message: 'Blog not found' });
            res.status(200).json({ success: true, data: blog });
        } catch (error) {
            res.status(400).json({ success: false, message: error.message });
        }
    }

    async deleteBlog(req, res) {
        try {
            const blog = await BlogService.deleteBlog(req.params.id);
            if (!blog) return res.status(404).json({ success: false, message: 'Blog not found' });
            res.status(200).json({ success: true, message: 'Blog deleted successfully' });
        } catch (error) {
            res.status(400).json({ success: false, message: error.message });
        }
    }

    async addComment(req, res) {
        try {
            const blog = await BlogService.addComment(req.params.id, req.body);
            if (!blog) return res.status(404).json({ success: false, message: 'Blog not found' });
            res.status(200).json({ success: true, data: blog });
        } catch (error) {
            res.status(400).json({ success: false, message: error.message });
        }
    }

    async updateCommentStatus(req, res) {
        try {
            const { approved } = req.body;
            const blog = await BlogService.updateCommentStatus(req.params.id, req.params.commentId, approved);
            if (!blog) return res.status(404).json({ success: false, message: 'Blog or comment not found' });
            res.status(200).json({ success: true, data: blog });
        } catch (error) {
            res.status(400).json({ success: false, message: error.message });
        }
    }
}

module.exports = new BlogController();


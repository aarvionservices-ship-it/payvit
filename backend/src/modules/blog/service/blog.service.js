const BlogRepository = require('../repository/blog.repository');

const slugify = (text) => {
    return text
        .toString()
        .toLowerCase()
        .trim()
        .replace(/\s+/g, '-')     // Replace spaces with -
        .replace(/[^\w\-]+/g, '') // Remove all non-word chars
        .replace(/\-\-+/g, '-');  // Replace multiple - with single -
};

class BlogService {
    async createBlog(blogData) {
        if (!blogData.slug) {
            blogData.slug = slugify(blogData.title, { lower: true, strict: true });
        }
        
        // Calculate reading time roughly (avg 200 words per minute)
        const words = blogData.content ? blogData.content.split(/\s+/).length : 0;
        blogData.readingTime = Math.ceil(words / 200);

        if (blogData.status === 'published' && !blogData.publishedAt) {
            blogData.publishedAt = new Date();
        }

        return await BlogRepository.create(blogData);
    }

    async getBlogs(filters, options) {
        const query = {};
        if (filters.category) query.category = filters.category;
        
        // Status filtering logic
        if (filters.status === 'all') {
            // Don't add status to query to see everything (Admin)
        } else if (filters.status) {
            query.status = filters.status;
        } else {
            query.status = 'published'; // Default for Public
        }
        
        if (filters.isFeatured) query.isFeatured = filters.isFeatured;
        if (filters.tag) query.tags = filters.tag;
        
        if (filters.search) {
            query.$or = [
                { title: { $regex: filters.search, $options: 'i' } },
                { content: { $regex: filters.search, $options: 'i' } }
            ];
        }

        return await BlogRepository.findAll(query, options);
    }

    async getBlogBySlug(slug) {
        const blog = await BlogRepository.findBySlug(slug);
        if (blog) {
            await BlogRepository.incrementViews(blog._id);
        }
        return blog;
    }

    async getBlogById(id) {
        return await BlogRepository.findById(id);
    }

    async updateBlog(id, blogData) {
        if (blogData.title && !blogData.slug) {
            blogData.slug = slugify(blogData.title, { lower: true, strict: true });
        }

        if (blogData.content) {
            const words = blogData.content.split(/\s+/).length;
            blogData.readingTime = Math.ceil(words / 200);
        }

        if (blogData.status === 'published' && !blogData.publishedAt) {
            blogData.publishedAt = new Date();
        }

        return await BlogRepository.update(id, blogData);
    }

    async deleteBlog(id) {
        return await BlogRepository.delete(id);
    }

    async addComment(blogId, commentData) {
        return await BlogRepository.addComment(blogId, commentData);
    }

    async updateCommentStatus(blogId, commentId, approved) {
        return await BlogRepository.updateCommentStatus(blogId, commentId, approved);
    }
}

module.exports = new BlogService();


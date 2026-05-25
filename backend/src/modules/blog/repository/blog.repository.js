const Blog = require('../model/blog.model');

class BlogRepository {
    async create(blogData) {
        return await Blog.create(blogData);
    }

    async findAll(query = {}, options = {}) {
        const { page = 1, limit = 10, sort = { createdAt: -1 } } = options;
        const skip = (page - 1) * limit;

        const [data, total] = await Promise.all([
            Blog.find(query).sort(sort).skip(skip).limit(limit),
            Blog.countDocuments(query)
        ]);

        return { data, total, page, limit };
    }

    async findById(id) {
        return await Blog.findById(id);
    }

    async findBySlug(slug) {
        return await Blog.findOne({ slug });
    }

    async update(id, blogData) {
        return await Blog.findByIdAndUpdate(id, blogData, { new: true });
    }

    async delete(id) {
        return await Blog.findByIdAndDelete(id);
    }

    async incrementViews(id) {
        return await Blog.findByIdAndUpdate(id, { $inc: { views: 1 } }, { new: true });
    }

    async addComment(blogId, commentData) {
        return await Blog.findByIdAndUpdate(
            blogId,
            { $push: { comments: commentData } },
            { new: true }
        );
    }

    async updateCommentStatus(blogId, commentId, approved) {
        return await Blog.findOneAndUpdate(
            { _id: blogId, "comments._id": commentId },
            { $set: { "comments.$.approved": approved } },
            { new: true }
        );
    }
}

module.exports = new BlogRepository();


import axiosInstance from './axios';

export const getBlogs = async (params?: any) => {
  const response = await axiosInstance.get('/blogs', { params });
  return response.data;
};

export const getBlogBySlug = async (slug: string) => {
  const response = await axiosInstance.get(`/blogs/${slug}`);
  return response.data;
};

export const getBlogById = async (id: string) => {
  const response = await axiosInstance.get(`/blogs/id/${id}`);
  return response.data;
};

export const createBlog = async (blogData: any) => {
  const response = await axiosInstance.post('/blogs', blogData);
  return response.data;
};

export const updateBlog = async (id: string, blogData: any) => {
  const response = await axiosInstance.put(`/blogs/${id}`, blogData);
  return response.data;
};

export const deleteBlog = async (id: string) => {
  const response = await axiosInstance.delete(`/blogs/${id}`);
  return response.data;
};

export const addComment = async (blogId: string, commentData: any) => {
  const response = await axiosInstance.post(`/blogs/${blogId}/comments`, commentData);
  return response.data;
};

export const updateCommentStatus = async (blogId: string, commentId: string, approved: boolean) => {
  const response = await axiosInstance.put(`/blogs/${blogId}/comments/${commentId}/status`, { approved });
  return response.data;
};


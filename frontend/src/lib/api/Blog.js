import axios from 'axios';

// Get all blogs with optional filtering
export const getAllBlogs = async (filter = 'all') => {
  try {
    const response = await axios.get(
      `${import.meta.env.VITE_API_URL}/blogs`,
      {
        params: { filter },
        withCredentials: true
      }
    );
    const blogs = response.data.blogs || response.data;
   
    return Array.isArray(blogs) ? blogs : [];
  } catch (err) {
    console.error('Error fetching blogs:', err.response?.data || err.message);
    throw err;
  }
};

// Create a new blog with images
export const createBlog = async (blogData, images) => {
  try {
    const formData = new FormData();
    formData.append('data', JSON.stringify({
      title: blogData.title,
      content: blogData.content,
      restaurant: blogData.restaurant,
      location: blogData.location,
      rating: blogData.rating,
      tags: blogData.tags,
      category: blogData.category,
    }));
    
    // Append images
    images.forEach((image, index) => {
      formData.append('images', image);
    });
    
    const response = await axios.post(
      `${import.meta.env.VITE_API_URL}/blogs`,
      formData,
      {
        withCredentials: true,
        headers: { 'Content-Type': 'multipart/form-data' }
      }
    );
    
    if (!response.data.blog.images) {
      console.warn('No images in response');
    }
    
    return response.data.blog;
  } catch (err) {
    const errorMessage = err.response?.data?.message || 'Failed to create blog';
    console.error('Error creating blog:', errorMessage, err.response?.data);
    throw new Error(errorMessage);
  }
};

// Get a blog by ID
export const getBlogById = async (id) => {
  try {
    const response = await axios.get(
      `${import.meta.env.VITE_API_URL}/blogs/${id}`,
      { withCredentials: true }
    );
    return response.data;
  } catch (err) {
    console.error('Error fetching blog details:', err.response?.data || err.message);
    throw err;
  }
};

// Update a blog
export const updateBlog = async (id, blogData) => {
  try {
    const response = await axios.put(
      `${import.meta.env.VITE_API_URL}/blogs/${id}`,
      blogData,
      { withCredentials: true }
    );
    return response.data.blog;
  } catch (err) {
    const errorMessage = err.response?.data?.message || 'Failed to update blog';
    console.error('Error updating blog:', errorMessage);
    throw new Error(errorMessage);
  }
};

// Delete a blog
export const deleteBlog = async (id) => {
  try {
    const response = await axios.delete(
      `${import.meta.env.VITE_API_URL}/blogs/${id}`,
      { withCredentials: true }
    );
    return response.data;
  } catch (err) {
    console.error('Error deleting blog:', err.response?.data || err.message);
    throw err;
  }
};
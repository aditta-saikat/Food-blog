const Blog = require("../models/Blog");
const User = require("../models/User")
const Like = require("../models/Like");
const fetch = require("node-fetch");
const FormData = require("form-data");

exports.getAllBlogs = async (req, res) => {
  try {
    const filter = req.query.filter || "all";
    let query = {};
    
    if (filter === "my") {
      if (!req.user || !req.user._id) {
        return res
          .status(401)
          .json({ message: "Unauthorized: User not authenticated" });
      }
      query.author = req.user._id;
    } else if (filter === "featured") {
      query.isFeatured = true;
    }

    const blogs = await Blog.find(query)
      .populate("author", "username email avatarUrl")
      .populate({
        path: "comments",
        populate: { path: "userId", select: "username avatarUrl" },
      })
      .sort({ createdAt: -1 });

    
    let userBookmarks = [];
    if (req.user && req.user._id) {
      const user = await User.findById(req.user._id).select('bookmarks');
      userBookmarks = user ? user.bookmarks.map(id => id.toString()) : [];
    }

    const blogsWithLikesAndBookmarks = await Promise.all(
      blogs.map(async (blog) => {
        const likes = await Like.find({ blogId: blog._id }).exec();
        const totalLikes = likes.length;
        const hasLiked = req.user
          ? !!(await Like.exists({ blogId: blog._id, userId: req.user._id }))
          : false;
        
        // Check if blog is bookmarked by current user
        const isBookmarked = req.user 
          ? userBookmarks.includes(blog._id.toString())
          : false;

        return {
          ...blog.toObject(),
          totalLikes,
          hasLiked,
          isBookmarked,
        };
      }),
    );

    res.status(200).json(blogsWithLikesAndBookmarks);
  } catch (err) {
    console.error("Error fetching blogs:", err.message);
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

exports.createBlog = async (req, res) => {
  try {
    if (!req.body || !req.body.data) {
      return res
        .status(400)
        .json({ message: "Missing data field in request body" });
    }

    const { title, content, restaurant, location, rating, tags, category } =
      JSON.parse(req.body.data);
    const imageUrls = [];

    if (req.files && req.files.images) {
      const files = Array.isArray(req.files.images)
        ? req.files.images
        : [req.files.images];

      for (const file of files) {
        if (!file.data || !file.name || !file.mimetype) {
          console.error("Invalid file object:", file);
          throw new Error("Invalid file data: missing data, name, or mimetype");
        }

        const formData = new FormData();
        formData.append("image", file.data, {
          filename: file.name,
          contentType: file.mimetype,
        });
        formData.append("key", process.env.IMGBB_API_KEY);

        const response = await fetch("https://api.imgbb.com/1/upload", {
          method: "POST",
          body: formData,
        });
        const imgbbResponse = await response.json();

        if (imgbbResponse.success) {
          imageUrls.push(imgbbResponse.data.url);
        } else {
          throw new Error(
            `ImageBB upload failed: ${imgbbResponse.error.message}`,
          );
        }
      }
    }

    if (!title || !content || !restaurant || !rating) {
      return res
        .status(400)
        .json({
          message: "Required fields: title, content, restaurant, rating",
        });
    }

    const newBlog = await Blog.create({
      title,
      content,
      restaurant,
      location: location || "",
      rating: Number(rating),
      tags: Array.isArray(tags)
        ? tags.map((tag) => tag.trim())
        : typeof tags === "string"
        ? tags.split(",").map((tag) => tag.trim())
        : [],

      category: category || "",
      images: imageUrls,
      author: req.user._id,
    });

    await newBlog.populate("author", "username avatarUrl");

    const likes = await Like.find({ blogId: newBlog._id }).exec();
    const totalLikes = likes.length;
    const hasLiked = false;

    res.status(201).json({
      message: "Blog created",
      blog: {
        _id: newBlog._id,
        title: newBlog.title,
        content: newBlog.content,
        restaurant: newBlog.restaurant,
        location: newBlog.location,
        rating: newBlog.rating,
        tags: newBlog.tags,
        category: newBlog.category,
        images: newBlog.images,
        author: {
          _id: newBlog.author._id,
          username: newBlog.author.username,
          avatarUrl: newBlog.author.avatarUrl || "/api/placeholder/32/32",
        },
        createdAt: newBlog.createdAt,
        comments: newBlog.comments,
        isFeatured: newBlog.isFeatured,
        totalLikes,
        hasLiked,
      },
    });
  } catch (err) {
    console.error("Error in createBlog:", err.message, err.stack);
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

exports.getBlogById = async (req, res) => {
  try {
    const blog = await Blog.findById(req.params.id)
      .populate("author", "username email avatarUrl")
      .populate({
        path: "comments",
        populate: { path: "userId", select: "username avatarUrl" },
      });

    if (!blog) {
      return res.status(404).json({ error: "Blog not found" });
    }

    const likes = await Like.find({ blogId: blog._id }).exec();
    const totalLikes = likes.length;
    const hasLiked = req.user
      ? !!(await Like.findOne({ blogId: blog._id, userId: req.user._id }))
      : false;

    let isBookmarked = false;
    if (req.user && req.user._id) {
      const user = await User.findById(req.user._id).select('bookmarks');
      if (user && user.bookmarks) {
        isBookmarked = user.bookmarks.some(bookmark => bookmark.toString() === blog._id.toString());
      } else {
        console.warn('getBlogById - No user or bookmarks found for user ID:', req.user._id);
      }
    } 

    res.status(200).json({
      ...blog.toJSON(),
      totalLikes,
      liked: hasLiked,
      isBookmarked,
    });
  } catch (error) {
    console.error('Error in getBlogById:', error);
    res.status(500).json({ error: error.message });
  }
};

exports.updateBlog = async (req, res) => {
  try {
    const blog = await Blog.findById(req.params.id);
    if (!blog) {
      return res.status(404).json({ message: 'Blog not found' });
    }

    if (blog.author.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Unauthorized' });
    }

    // Parse req.body.data
    let data;
    try {
      data = req.body.data ? JSON.parse(req.body.data) : {};
    } catch (parseErr) {
      return res.status(400).json({ message: 'Invalid data format', error: parseErr.message });
    }

    const {
      title,
      content,
      restaurant,
      location,
      images: existingImages,
      tags,
      category,
      rating,
      isFeatured,
    } = data;

    // Handle new image uploads
    const imageUrls = Array.isArray(existingImages) ? existingImages : blog.images || [];

    if (req.files && req.files.images) {
      const files = Array.isArray(req.files.images) ? req.files.images : [req.files.images];

      const uploadWithRetry = async (file, retries = 3, delay = 1000) => {
        for (let i = 0; i < retries; i++) {
          try {
            const formData = new FormData();
            formData.append('image', file.data, {
              filename: file.name || 'image.png',
              contentType: file.mimetype || 'image/png',
            });
            formData.append('key', process.env.IMGBB_API_KEY);

            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 60000); // 60s timeout

            const response = await fetch('https://api.imgbb.com/1/upload', {
              method: 'POST',
              body: formData,
              signal: controller.signal,
              headers: { 'User-Agent': 'FoodBlogApp/1.0' },
            });

            clearTimeout(timeoutId);
            const imgbbResponse = await response.json();
            

            if (!imgbbResponse.success) {
              throw new Error(`ImageBB upload failed: ${imgbbResponse.error.message}`);
            }
            return imgbbResponse.data.url;
          } catch (err) {
            if (i === retries - 1) throw err;
            console.warn(`Retry ${i + 1}/${retries} after ${delay}ms: ${err.message}`);
            await new Promise(resolve => setTimeout(resolve, delay));
          }
        }
      };

      const uploadPromises = files.map(async (file) => {
        if (!file.data || !file.name || !file.mimetype) {
          console.error('Invalid file object:', file);
          throw new Error('Invalid file data: missing data, name, or mimetype');
        }
        if (file.size > 32 * 1024 * 1024) {
          throw new Error('Image exceeds 32MB (ImgBB limit)');
        }
        
        return await uploadWithRetry(file);
      });

      const newImageUrls = await Promise.all(uploadPromises);
      imageUrls.push(...newImageUrls);
    }

    // Validate and format tags
    let processedTags = blog.tags;
    if (tags) {
      if (Array.isArray(tags)) {
        processedTags = tags.map(tag => String(tag).trim()).filter(tag => tag);
      } else if (typeof tags === 'string') {
        processedTags = tags.split(',').map(tag => tag.trim()).filter(tag => tag);
      } else {
        return res.status(400).json({ message: 'Tags must be a string or array' });
      }
    }

    // Update blog fields
    blog.title = title || blog.title;
    blog.content = content || blog.content;
    blog.restaurant = restaurant || blog.restaurant;
    blog.location = location !== undefined ? location : blog.location;
    blog.images = imageUrls;
    blog.tags = processedTags;
    blog.category = category !== undefined ? category : blog.category;
    blog.rating = rating !== undefined ? Number(rating) : blog.rating;
    blog.isFeatured = isFeatured !== undefined ? isFeatured : blog.isFeatured;

    await blog.save();

    const likes = await Like.find({ blogId: blog._id }).exec();
    const totalLikes = likes.length;
    const hasLiked = !!(await Like.exists({ blogId: blog._id, userId: req.user._id }));

    res.status(200).json({
      message: 'Blog updated successfully',
      blog: {
        ...blog.toObject(),
        totalLikes,
        hasLiked,
      },
    });
  } catch (err) {
    console.error('Error updating blog:', err.message, err.stack);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

exports.deleteBlog = async (req, res) => {
  try {
    const blog = await Blog.findById(req.params.id);

    if (!blog) {
      return res.status(404).json({ message: "Blog not found" });
    }

    if (blog.author.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: "Unauthorized" });
    }

    await Like.deleteMany({ blogId: blog._id });
    await blog.deleteOne();

    res.status(200).json({ message: "Blog deleted successfully" });
  } catch (err) {
    console.error("Error deleting blog:", err.message);
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

// FIXED BOOKMARK METHODS - CONSISTENT USER ID USAGE
exports.toggleBookmark = async (req, res) => {
  try {
    // FIXED: Use _id consistently
    const userId = req.user._id;
    const blogId = req.params.blogId;
    
    
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }
    
    const blog = await Blog.findById(blogId);
    if (!blog) {
      return res.status(404).json({ error: "Blog not found" });
    }
    
    const isBookmarked = user.bookmarks.some(bookmark => bookmark.toString() === blogId);
    
    if (isBookmarked) {
      user.bookmarks = user.bookmarks.filter((id) => id.toString() !== blogId);
    } else {
      user.bookmarks.push(blogId);
    }
    
    await user.save();
    
    
    res.status(200).json({
      message: `Blog ${isBookmarked ? "unbookmarked" : "bookmarked"} successfully`,
      isBookmarked: !isBookmarked,
    });
  } catch (error) {
    console.error('Error in toggleBookmark:', error);
    res.status(500).json({ error: error.message });
  }
};

exports.getBookmarkedBlogs = async (req, res) => {
  try {
   
    const userId = req.user._id;
    
    const user = await User.findById(userId).populate({
      path: "bookmarks",
      populate: { path: "author", select: "username avatarUrl" },
    });
    
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }
    
    const bookmarkedBlogs = await Promise.all(
      user.bookmarks.map(async (blog) => {
        const likes = await Like.find({ blogId: blog._id }).exec();
        const totalLikes = likes.length;
        const hasLiked = !!(await Like.exists({ blogId: blog._id, userId: userId }));
        
        return { 
          ...blog.toJSON(), 
          totalLikes, 
          hasLiked,
          isBookmarked: true // Since these are all bookmarked
        };
      })
    );
    
    res.status(200).json(bookmarkedBlogs);
  } catch (error) {
    console.error('Error in getBookmarkedBlogs:', error);
    res.status(500).json({ error: error.message });
  }
};
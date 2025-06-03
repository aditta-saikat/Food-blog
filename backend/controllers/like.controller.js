const Like = require('../models/Like');
const Blog = require('../models/Blog');
const Notification = require('../models/Notification');
const mongoose = require('mongoose');

exports.toggleLike = async (req, res) => {
  const { blogId } = req.params;
  const userId = req.user._id;

  try {
    if (!mongoose.Types.ObjectId.isValid(blogId)) {
      return res.status(400).json({ message: 'Invalid blog ID' });
    }

    const blog = await Blog.findById(blogId);
    if (!blog) return res.status(400).json({ message: 'Blog not found' });

    const existing = await Like.findOne({ blogId, userId });

    if (existing) {
      // Unlike: remove the like
      await existing.deleteOne();
      const totalLikes = await Like.countDocuments({ blogId });
      return res.status(200).json({ message: 'Unliked successfully', totalLikes, liked: false });
    } else {
      // Like: create a new like
      await Like.create({ blogId, userId });

      // Create notification for blog author (if not self)
      if (blog.author.toString() !== userId.toString()) {
        const notification = await Notification.create({
          recipient: blog.author,
          sender: userId,
          blogId,
          type: 'like',
          message: `${req.user.username} liked your review "${blog.title}"`,
          isRead: false,
        });
      }

      const totalLikes = await Like.countDocuments({ blogId });
      return res.status(201).json({ message: 'Liked successfully', totalLikes, liked: true });
    }
  } catch (err) {
    console.error('Error toggling like:', err);
    res.status(500).json({ message: 'Server error', error: err.message || err.toString() });
  }
};

exports.getLikesCount = async (req, res) => {
  const { blogId } = req.params;

  try {
    const likes = await Like.find({ blogId }).exec();
    const count = likes.length;
    res.status(200).json({ totalLikes: count });
  } catch (err) {
    console.error('Error fetching like count:', err);
    res.status(500).json({ message: 'Server error', error: err.message || err.toString() });
  }
};

exports.hasLiked = async (req, res) => {
  const { blogId } = req.params;
  const userId = req.user._id;

  try {
    const liked = await Like.exists({ blogId, userId });
    res.status(200).json({ liked: !!liked });
  } catch (err) {
    console.error('Error checking like status:', err);
    res.status(500).json({ message: 'Server error', error: err.message || err.toString() });
  }
};

exports.getUsersWhoLiked = async (req, res) => {
  const { blogId } = req.params;

  try {
    const likes = await Like.find({ blogId }).populate('userId', 'username email avatarUrl');
    res.status(200).json({ users: likes.map(like => like.userId) });
  } catch (err) {
    console.error('Error fetching users who liked:', err);
    res.status(500).json({ message: 'Server error', error: err.message || err.toString() });
  }
};
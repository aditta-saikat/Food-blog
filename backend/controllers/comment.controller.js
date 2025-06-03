const Comment = require('../models/Comment');
const Blog = require('../models/Blog');
const Notification = require('../models/Notification');
const mongoose = require('mongoose');

// Create new comment
exports.createComment = async (req, res) => {
  try {
    const { blogId, content } = req.body;

    if (!mongoose.Types.ObjectId.isValid(blogId)) {
      return res.status(400).json({ message: 'Invalid blog ID' });
    }

    if (!blogId || !content || !content.trim()) {
      return res.status(400).json({ message: 'Blog ID and content are required' });
    }

    const blog = await Blog.findById(blogId);
    if (!blog) return res.status(400).json({ message: 'Blog not found' });

    const newComment = await Comment.create({
      blogId,
      userId: req.user._id,
      content: content.trim(),
    });

    // Populate userId in the response
    await newComment.populate('userId', 'username avatarUrl');

    // Push comment to blog's comment array
    await Blog.findByIdAndUpdate(blogId, {
      $push: { comments: newComment._id },
    });

    // Create notification for blog author (if not self)
    if (blog.author.toString() !== req.user._id.toString()) {
      const notification = await Notification.create({
        recipient: blog.author,
        sender: req.user._id,
        blogId,
        type: 'comment',
        message: `${req.user.username} commented on your review "${blog.title}"`,
        isRead: false,
      });
     
    }

    res.status(201).json({ message: 'Comment added', comment: newComment });
  } catch (err) {
    console.error('Error creating comment:', err);
    res.status(500).json({ message: 'Server error', error: err.message || err.toString() });
  }
};

// Get all comments for a blog
exports.getCommentsByBlog = async (req, res) => {
  try {
    const { blogId } = req.params;

    const comments = await Comment.find({ blogId })
      .populate('userId', 'username avatarUrl')
      .sort({ createdAt: -1 });

    res.status(200).json(comments);
  } catch (err) {
    console.error('Error fetching comments:', err);
    res.status(500).json({ message: 'Server error', error: err.message || err.toString() });
  }
};

// Delete comment
exports.deleteComment = async (req, res) => {
  try {
    const { id } = req.params;

    const comment = await Comment.findById(id);
    if (!comment) return res.status(404).json({ message: 'Comment not found' });

    if (comment.userId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Unauthorized' });
    }

    await Blog.findByIdAndUpdate(comment.blogId, {
      $pull: { comments: comment._id },
    });

    await comment.deleteOne();

    res.status(200).json({ message: 'Comment deleted' });
  } catch (err) {
    console.error('Error deleting comment:', err);
    res.status(500).json({ message: 'Server error', error: err.message || err.toString() });
  }
};

// Update comment
exports.updateComment = async (req, res) => {
  try {
    const { id } = req.params;
    const { content } = req.body;

    if (!content || !content.trim()) {
      return res.status(400).json({ message: 'Content is required' });
    }

    const comment = await Comment.findById(id);
    if (!comment) return res.status(404).json({ message: 'Comment not found' });

    if (comment.userId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Unauthorized' });
    }

    comment.content = content;
    await comment.save();

    await comment.populate('userId', 'username avatarUrl');

    res.status(200).json({ message: 'Comment updated', comment });
  } catch (err) {
    console.error('Error updating comment:', err);
    res.status(500).json({ message: 'Server error', error: err.message || err.toString() });
  }
};
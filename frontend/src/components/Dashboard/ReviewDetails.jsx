import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  Heart,
  MessageCircle,
  Share2,
  Edit,
  Trash2,
  Star,
  ChevronLeft,
  ChevronRight,
  ArrowLeft,
  Calendar,
  MapPin,
  X,
} from "lucide-react";
import { getBlogById } from "../../lib/api/Blog";
import {
  createComment,
  deleteComment,
  updateComment,
} from "../../lib/api/Comment";
import {
  toggleLike,
  getUsersWhoLiked,
} from "../../lib/api/Like";
import { useAuth } from "../../context/AuthContext";
import Navbar from "../../components/Navbar/Navbar";

export const ReviewDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { currentUser } = useAuth();

  const [review, setReview] = useState(null);
  const [loading, setLoading] = useState(true);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState("");
  const [showFullContent, setShowFullContent] = useState(false);
  const [likeCount, setLikeCount] = useState(0);
  const [hasUserLiked, setHasUserLiked] = useState(false);
  const [loadingLike, setLoadingLike] = useState(false);
  const [showLikesModal, setShowLikesModal] = useState(false);
  const [usersWhoLiked, setUsersWhoLiked] = useState([]);
  const [editCommentId, setEditCommentId] = useState(null);
  const [editContent, setEditContent] = useState("");
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchReviewDetails = async () => {
      try {
        setLoading(true);
        const data = await getBlogById(id);
        setReview(data);
        setComments(data.comments || []);
        setLikeCount(data.totalLikes || 0);
        setHasUserLiked(data.liked || false);
        setLoading(false);
      } catch (err) {
        console.error("Error fetching review details:", err);
        setError("Failed to load review. Please try again.");
        setLoading(false);
      }
    };

    if (id) {
      fetchReviewDetails();
    }
  }, [id]);

  const handlePrevImage = () => {
    setCurrentImageIndex((prevIndex) =>
      prevIndex === 0 ? review.images.length - 1 : prevIndex - 1,
    );
  };

  const handleNextImage = () => {
    setCurrentImageIndex((prevIndex) =>
      prevIndex === review.images.length - 1 ? 0 : prevIndex + 1,
    );
  };

  const handleAddComment = async () => {
    if (!currentUser) {
      setError("Please log in to comment.");
      return;
    }
    if (!newComment.trim()) return;
    try {
      const comment = await createComment(review._id, newComment);
      setComments((prev) => [comment, ...prev]);
      setNewComment("");
      setError(null);
    } catch (err) {
      console.error("Error adding comment:", err);
      setError(err.message || "Failed to post comment. Please try again.");
    }
  };

  const handleDeleteComment = async (commentId) => {
    if (!currentUser) {
      setError("Please log in to delete comments.");
      return;
    }
    const userConfirmed = window.confirm("Do you want to delete this comment?");
    if (!userConfirmed) return;
    try {
      await deleteComment(commentId);
      setComments(comments.filter((comment) => comment._id !== commentId));
      setError(null);
    } catch (err) {
      console.error("Error deleting comment:", err);
      setError("Failed to delete comment. Please try again.");
    }
  };

  const handleEditCommentStart = (comment) => {
    setEditCommentId(comment._id);
    setEditContent(comment.content);
  };

  const handleEditCommentSave = async (commentId) => {
    if (!currentUser) {
      setError("Please log in to edit comments.");
      return;
    }
    if (!editContent.trim()) return;
    try {
      const updatedComment = await updateComment(commentId, editContent);
      setComments(
        comments.map((comment) =>
          comment._id === commentId ? updatedComment : comment,
        ),
      );
      setEditCommentId(null);
      setEditContent("");
      setError(null);
    } catch (err) {
      console.error("Error updating comment:", err);
      setError("Failed to update comment. Please try again.");
    }
  };

  const handleEditCommentCancel = () => {
    setEditCommentId(null);
    setEditContent("");
  };

  const handleToggleLike = async () => {
    if (!currentUser) {
      setError("Please log in to like this review.");
      return;
    }
    if (!review || loadingLike) return;
    setLoadingLike(true);
    try {
      const { totalLikes, liked } = await toggleLike(review._id);
      setHasUserLiked(liked);
      setLikeCount(totalLikes);
      setError(null);
    } catch (err) {
      console.error("Error toggling like:", err);
      setError(err.message || "Failed to toggle like. Please try again.");
    } finally {
      setLoadingLike(false);
    }
  };

  const handleShowLikes = async () => {
    if (likeCount === 0) return;
    try {
      const users = await getUsersWhoLiked(review._id);
      setUsersWhoLiked(users);
      setShowLikesModal(true);
      setError(null);
    } catch (err) {
      console.error("Error fetching users who liked:", err);
      setError("Failed to fetch users who liked. Please try again.");
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const isCommentOwner = (comment) => {
    if (!currentUser || !comment || !comment.userId) return false;
    const commentUserId =
      comment.userId._id || comment.userId.id || comment.userId;
    const currentUserId = currentUser._id || currentUser.id;
    return commentUserId === currentUserId;
  };

  const StarRating = ({ rating }) => {
    return (
      <div className="flex items-center">
        {[...Array(5)].map((_, i) => (
          <Star
            key={i}
            size={20}
            className={
              i < Math.floor(rating)
                ? "text-yellow-400 fill-yellow-400"
                : "text-gray-300"
            }
          />
        ))}
        <span className="ml-2 text-lg font-medium text-gray-700">
          {rating.toFixed(1)}
        </span>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading review...</p>
        </div>
      </div>
    );
  }

  if (!review) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-xl text-gray-700">Review not found</p>
          <button
            onClick={() => navigate(-1)}
            className="mt-4 text-primary-600 hover:underline flex items-center justify-center mx-auto"
          >
            <ArrowLeft size={16} className="mr-1" /> Go back
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      {error && (
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="mb-4 p-3 bg-red-100 text-red-700 rounded-lg text-sm">
            {error}
          </div>
        </div>
      )}
      <div className="max-w-6xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        <button
          onClick={() => navigate(-1)}
          className="mb-6 flex items-center text-gray-600 hover:text-gray-900"
        >
          <ArrowLeft size={20} className="mr-2" />
          <span>Back to Reviews</span>
        </button>

        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          <div className="relative bg-gray-900 h-96">
            {review.images && review.images.length > 0 ? (
              <>
                <img
                  src={
                    review.images[currentImageIndex] ||
                    "/api/placeholder/800/400"
                  }
                  alt={`${review.title} image ${currentImageIndex + 1}`}
                  className="h-full w-full object-contain"
                />
                {review.images.length > 1 && (
                  <>
                    <button
                      onClick={handlePrevImage}
                      className="absolute left-4 top-1/2 transform -translate-y-1/2 bg-black bg-opacity-50 text-white p-2 rounded-full hover:bg-opacity-70"
                    >
                      <ChevronLeft size={24} />
                    </button>
                    <button
                      onClick={handleNextImage}
                      className="absolute right-4 top-1/2 transform -translate-y-1/2 bg-black bg-opacity-50 text-white p-2 rounded-full hover:bg-opacity-70"
                    >
                      <ChevronRight size={24} />
                    </button>
                    <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex space-x-2">
                      {review.images.map((_, index) => (
                        <button
                          key={index}
                          onClick={() => setCurrentImageIndex(index)}
                          className={`w-2 h-2 rounded-full ${
                            currentImageIndex === index
                              ? "bg-white"
                              : "bg-white bg-opacity-50"
                          }`}
                        />
                      ))}
                    </div>
                  </>
                )}
              </>
            ) : (
              <div className="h-full w-full flex items-center justify-center bg-gray-200">
                <p className="text-gray-500">No images available</p>
              </div>
            )}
          </div>

          <div className="p-6">
            <div className="mb-4 flex items-start justify-between">
              <div>
                <h1 className="text-3xl font-bold text-gray-900 mb-2">
                  {review.title}
                  {review.isFeatured && (
                    <span className="ml-3 bg-primary-500 text-xs font-bold px-2 py-1 rounded-full text-white">
                      Featured
                    </span>
                  )}
                </h1>
                <div className="flex items-center text-gray-600 mb-2">
                  <span className="font-medium text-lg text-gray-800">
                    {review.restaurant}
                  </span>
                  {review.location && (
                    <>
                      <span className="mx-2">•</span>
                      <span className="flex items-center">
                        <MapPin size={16} className="mr-1" />
                        {review.location}
                      </span>
                    </>
                  )}
                </div>
                <StarRating rating={review.rating} />
              </div>
              <div className="flex space-x-2">
                {review.author._id === currentUser?._id && (
                  <>
                    <button className="p-2 hover:bg-gray-100 rounded-full transition-colors">
                      <Edit size={20} className="text-gray-500" />
                    </button>
                    <button className="p-2 hover:bg-gray-100 rounded-full transition-colors">
                      <Trash2 size={20} className="text-gray-500" />
                    </button>
                  </>
                )}
              </div>
            </div>

            <div className="flex items-center mb-6">
              <img
                src={review.author.avatarUrl || "/api/placeholder/40/40"}
                alt={review.author.username}
                className="w-10 h-10 rounded-full mr-3"
              />
              <div>
                <div className="font-medium text-gray-800">
                  {review.author.username}
                </div>
                <div className="text-sm text-gray-500 flex items-center">
                  <Calendar size={14} className="mr-1" />
                  {formatDate(review.createdAt)}
                </div>
              </div>
            </div>

            <div className="prose max-w-none mb-6">
              <div
                className={`transition-all duration-300 ease-in-out ${
                  showFullContent
                    ? "max-h-[1000px]"
                    : "max-h-36 overflow-hidden"
                }`}
              >
                <p id="review-content" className="text-gray-600">
                  {review.content}
                </p>
              </div>
              {review.content.length > 200 && (
                <button
                  onClick={() => setShowFullContent(!showFullContent)}
                  className="text-blue-600 hover:text-blue-700 font-medium mt-2"
                  aria-expanded={showFullContent}
                  aria-controls="review-content"
                >
                  {showFullContent ? "Show less" : "Read more"}
                </button>
              )}
            </div>

            {review.tags && review.tags.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-6">
                {review.tags.map((tag) => (
                  <span
                    key={tag}
                    className="bg-blue-400 text-white font-semibold text-sm px-3 py-1 rounded-full"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            )}

            <div className="flex items-center justify-between py-4 border-t border-b border-gray-200 mb-6">
              <div className="flex items-center space-x-6">
                <div className="flex items-center space-x-2">
                  <button
                    onClick={handleToggleLike}
                    disabled={!currentUser || loadingLike}
                    className="flex items-center space-x-2 text-gray-600 hover:text-gray-900 disabled:opacity-50"
                  >
                    <Heart
                      size={20}
                      className={
                        hasUserLiked
                          ? "fill-red-500 text-red-500"
                          : "text-gray-400"
                      }
                    />
                  </button>
                  <button
                    onClick={handleShowLikes}
                    className="text-gray-600 hover:text-gray-900"
                    disabled={likeCount === 0}
                  >
                    <span>
                      {likeCount} {likeCount === 1 ? "Like" : "Likes"}
                    </span>
                  </button>
                </div>
                <button className="flex items-center space-x-2 text-gray-600 hover:text-gray-900">
                  <MessageCircle size={20} />
                  <span>
                    {comments.length}{" "}
                    {comments.length === 1 ? "Comment" : "Comments"}
                  </span>
                </button>
                <button className="flex items-center space-x-2 text-gray-600 hover:text-gray-900">
                  <Share2 size={20} />
                  <span>Share</span>
                </button>
              </div>
            </div>

            <div>
              <h3 className="font-bold text-xl text-gray-800 mb-4">
                Comments ({comments.length})
              </h3>
              <div className="flex space-x-3 mb-6">
                <img
                  src={currentUser?.avatarUrl || "/api/placeholder/40/40"}
                  alt={currentUser?.username || "User"}
                  className="w-10 h-10 rounded-full"
                />
                <div className="flex-1 flex">
                  <input
                    type="text"
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    placeholder="Add a comment..."
                    className="flex-1 bg-gray-50 border border-gray-200 rounded-l-lg px-4 py-2 focus:outline-none focus:ring-1 focus:ring-blue-500"
                    disabled={!currentUser}
                  />
                  <button
                    onClick={handleAddComment}
                    disabled={!currentUser || !newComment.trim()}
                    className="bg-blue-600 text-white rounded-r-lg px-4 py-2 font-medium disabled:opacity-50 hover:bg-blue-700"
                  >
                    Post
                  </button>
                </div>
              </div>

              {comments.length > 0 ? (
                <div className="space-y-6">
                  {comments.map((comment) => (
                    <div key={comment._id} className="flex space-x-3">
                      <img
                        src={
                          comment.userId?.avatarUrl || "/api/placeholder/40/40"
                        }
                        alt={comment.userId?.username || "Unknown User"}
                        className="w-10 h-10 rounded-full"
                      />
                      <div className="flex-1">
                        <div className="bg-gray-50 rounded-lg p-4">
                          <div className="flex justify-between items-center mb-2">
                            <div className="flex items-center">
                              <span className="font-medium text-gray-800">
                                {comment.userId?.username || "Unknown User"}
                              </span>
                              <span className="text-sm text-gray-500 ml-2">
                                • {formatDate(comment.createdAt)}
                              </span>
                            </div>
                          </div>
                          {editCommentId === comment._id ? (
                            <div className="flex flex-col space-y-2">
                              <textarea
                                value={editContent}
                                onChange={(e) => setEditContent(e.target.value)}
                                className="bg-white border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent min-h-[80px] resize-none"
                              />
                              <div className="flex justify-end space-x-2">
                                <button
                                  onClick={handleEditCommentCancel}
                                  className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg font-medium hover:bg-gray-200"
                                >
                                  Cancel
                                </button>
                                <button
                                  onClick={() =>
                                    handleEditCommentSave(comment._id)
                                  }
                                  disabled={!editContent.trim()}
                                  className="px-4 py-2 bg-blue-600 text-white rounded-lg font-medium disabled:opacity-50 hover:bg-blue-700"
                                >
                                  Save Changes
                                </button>
                              </div>
                            </div>
                          ) : (
                            <>
                              <p className="text-gray-600 mb-3">
                                {comment.content}
                              </p>
                              {isCommentOwner(comment) && (
                                <div className="flex justify-end space-x-3 mt-2 border-t border-gray-200 pt-2">
                                  <button
                                    onClick={() =>
                                      handleEditCommentStart(comment)
                                    }
                                    className="text-blue-600 hover:text-blue-800 font-medium text-sm"
                                  >
                                    Edit
                                  </button>
                                  <button
                                    onClick={() =>
                                      handleDeleteComment(comment._id)
                                    }
                                    className="text-red-600 hover:text-red-800 font-medium text-sm"
                                  >
                                    Delete
                                  </button>
                                </div>
                              )}
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="bg-gray-50 rounded-lg p-8 text-center">
                  <p className="text-gray-500">
                    No comments yet. Be the first to leave a comment!
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {showLikesModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-bold text-gray-800">
                Users Who Liked
              </h3>
              <button
                onClick={() => setShowLikesModal(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                <X size={20} />
              </button>
            </div>
            {usersWhoLiked.length > 0 ? (
              <ul className="space-y-3 max-h-64 overflow-y-auto">
                {usersWhoLiked.map((user) => (
                  <li key={user._id} className="flex items-center space-x-3">
                    <img
                      src={user.avatarUrl || "/api/placeholder/32/32"}
                      alt={user.username}
                      className="w-8 h-8 rounded-full"
                      loading="lazy"
                    />
                    <span className="text-gray-600">{user.username}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-gray-500">
                No users have liked this review yet.
              </p>
            )}
          </div>
        </div>
      )}

      <footer className="bg-white mt-16">
        <div className="max-w-7xl mx-auto py-8 px-4 overflow-hidden sm:px-6 lg:px-8">
          <p className="text-center text-base text-gray-400">
            © 2025 FoodCritic, Inc. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
};

export default ReviewDetails;
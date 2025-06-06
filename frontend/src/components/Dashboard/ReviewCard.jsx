import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Heart,
  MessageCircle,
  Bookmark,
  Edit,
  Trash2,
  Star,
  Image,
  Calendar,
  MapPin,
} from 'lucide-react';
import { getCommentsByBlog } from '../../lib/api/Comment';
import { toggleLike, getLikesCount, hasLiked } from '../../lib/api/Like';
import { getBlogById, deleteBlog } from '../../lib/api/Blog';
import { useAuth } from '../../context/AuthContext';

const ReviewCard = ({
  review,
  viewMode,
  currentUser,
  showComments,
  toggleCommentSection,
  handleDeleteReview,
  onEditReview,
  filter,
  toggleBookmark,
  onBookmarkChange, // New prop to handle bookmark state changes
}) => {
  const navigate = useNavigate();
  const { currentUser: authUser } = useAuth();
  const [comments, setComments] = useState([]);
  const [likeCount, setLikeCount] = useState(review.totalLikes || 0);
  const [hasUserLiked, setHasUserLiked] = useState(review.liked || false);
  const [isBookmarked, setIsBookmarked] = useState(false); 
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [commentCount, setCommentCount] = useState(0);


  useEffect(() => {
    setIsBookmarked(review.isBookmarked || false);
  }, [review.isBookmarked, review._id]); 


  useEffect(() => {
    setLikeCount(review.totalLikes || 0);
    setHasUserLiked(review.liked || false);
  }, [review.totalLikes, review.liked, review._id]);

  useEffect(() => {
    const fetchCommentCount = async () => {
      try {
        const data = await getCommentsByBlog(review._id);
        setCommentCount(data.length);
        setComments(data);
      } catch (err) {
        console.error('Error fetching comments:', err);
        setCommentCount(0);
      }
    };

    if (review._id) {
      fetchCommentCount();
    }
  }, [review._id]);

  const handleToggleLike = async () => {
    if (!currentUser) return;
    try {
      await toggleLike(review._id, authUser.token);
      const newHasLiked = await hasLiked(review._id, authUser.token);
      const newLikeCount = await getLikesCount(review._id, authUser.token);
      setHasUserLiked(newHasLiked);
      setLikeCount(newLikeCount);
    } catch (err) {
      console.error('Error toggling like:', err);
    }
  };

  const handleEditClick = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    try {
      const blogData = await getBlogById(review._id, authUser.token);
      onEditReview(review._id, blogData);
    } catch (err) {
      console.error('Error fetching review:', err);
      alert('Failed to load review data. Please try again.');
    }
  };

  const handleDeleteClick = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setShowDeleteConfirm(true);
  };

  const confirmDelete = async () => {
    try {
      await deleteBlog(review._id, authUser.token);
      handleDeleteReview(review._id);
      setShowDeleteConfirm(false);
    } catch (err) {
      console.error('Error deleting review:', err);
      alert('Failed to delete review. Please try again.');
    }
  };

  const cancelDelete = () => {
    setShowDeleteConfirm(false);
  };

  const handleToggleBookmark = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (!currentUser) {
      alert('Please log in to bookmark reviews.');
      return;
    }
    
    try {
      const newBookmarkState = !isBookmarked;
      setIsBookmarked(newBookmarkState);
      
      const result = await toggleBookmark(review._id);
      
      if (result && typeof result.isBookmarked !== 'undefined') {
        setIsBookmarked(result.isBookmarked);
      }
      

      if (onBookmarkChange) {
        onBookmarkChange(review._id, newBookmarkState);
      }
    } catch (err) {
      console.error('Error toggling bookmark:', err);
     
      setIsBookmarked(!isBookmarked);
      alert('Failed to toggle bookmark. Please try again.');
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'Date unavailable';
    const date = new Date(dateString);
    if (isNaN(date.getTime())) {
      console.error(`Invalid date string: ${dateString}`);
      return 'Invalid date';
    }
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const StarRating = ({ rating }) => {
    return (
      <div className="flex">
        {[...Array(5)].map((_, i) => (
          <Star
            key={i}
            size={16}
            className={
              i < Math.floor(rating || 0)
                ? 'text-yellow-400 fill-yellow-400'
                : 'text-gray-300'
            }
          />
        ))}
        <span className="ml-1 text-xs font-medium text-gray-700">
          {(rating || 0).toFixed(1)}
        </span>
      </div>
    );
  };

  const isCurrentUserAuthor =
    currentUser &&
    review.author &&
    ((typeof review.author === 'string' && review.author === currentUser.id) ||
      (review.author && review.author._id && review.author._id === currentUser.id));

  return (
    <>
      <div
        className={`bg-white rounded-xl shadow-sm overflow-hidden transition-all hover:shadow-md cursor-pointer ${
          viewMode === 'list' ? 'flex flex-col md:flex-row' : ''
        }`}
        onClick={(e) => {
          if (e.target.closest('button') || e.target.closest('a') || e.target.closest('input')) {
            return;
          }
          navigate(`/reviews/${review._id}`);
        }}
      >
        <div className={viewMode === 'list' ? 'md:w-1/3' : ''}>
          <div className="relative aspect-video">
            <img
              src={review.images && review.images[0] ? review.images[0] : '/api/placeholder/400/320'}
              alt={review.title || 'Review image'}
              className="h-full w-full object-cover"
              loading="lazy"
              width="400"
              height="320"
            />
            {review.isFeatured && (
              <div className="absolute top-3 left-3 bg-primary-500 text-xs font-bold px-2 py-1 rounded-full text-white">
                Featured
              </div>
            )}
            {review.images && review.images.length > 1 && (
              <div className="absolute bottom-3 right-3 bg-black bg-opacity-50 text-xs font-medium px-2 py-1 rounded-full text-white flex items-center">
                <Image size={12} className="mr-1" />+{review.images.length - 1}
              </div>
            )}
          </div>
        </div>
        <div className={`p-4 flex flex-col ${viewMode === 'list' ? 'md:w-2/3' : ''}`}>
          <div className="flex items-start justify-between mb-2">
            <div>
              <h3 className="font-bold text-lg text-gray-900 mb-1">{review.title || 'Untitled'}</h3>
              <div className="flex items-center text-sm text-gray-500 mb-1">
                <span className="font-medium text-gray-700">{review.restaurant || 'Unknown Restaurant'}</span>
                {review.location && (
                  <>
                    <span className="mx-1">•</span>
                    <span className="flex items-center">
                      <MapPin size={14} className="mr-1" />
                      {review.location}
                    </span>
                  </>
                )}
              </div>
              <StarRating rating={review.rating} />
            </div>
          </div>
          <p className="text-gray-600 text-sm mb-4 line-clamp-3">{review.content || 'No content available'}</p>
          {review.tags && review.tags.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-4">
              {review.tags.map((tag) => (
                <span
                  key={tag}
                  className="bg-primary-400 text-white font-semibold text-xs px-2 py-1 rounded-full"
                >
                  {tag}
                </span>
              ))}
            </div>
          )}
          <div className="mt-auto pt-3 border-t border-gray-100">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <img
                  src={review.author?.avatarUrl || '/api/placeholder/32/32'}
                  alt={review.author?.username || 'Unknown User'}
                  className="w-6 h-6 rounded-full mr-2"
                />
                <span className="text-xs font-medium text-gray-700">
                  {review.author?.username || 'Unknown User'}
                </span>
                <span className="mx-1 text-gray-400">•</span>
                <span className="text-xs text-gray-500 flex items-center">
                  <Calendar size={12} className="mr-1" />
                  {formatDate(review.createdAt)}
                </span>
              </div>
              <div className="flex items-center space-x-1" onClick={(e) => e.stopPropagation()}>
                <button
                  onClick={handleToggleLike}
                  disabled={!currentUser}
                  className="p-1.5 hover:bg-gray-100 rounded-full transition-colors flex items-center space-x-1"
                >
                  <Heart
                    size={16}
                    className={hasUserLiked ? 'fill-red-500 text-red-500' : 'text-gray-400'}
                  />
                  <span className="text-xs text-gray-500">{likeCount}</span>
                </button>
                <button
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    toggleCommentSection(review._id);
                  }}
                  className="p-1.5 hover:bg-gray-100 rounded-full transition-colors flex items-center space-x-1"
                >
                  <MessageCircle size={16} className="text-gray-400" />
                  <span className="text-xs text-gray-500">{commentCount}</span>
                </button>
                <button
                  onClick={handleToggleBookmark}
                  disabled={!currentUser}
                  className="p-1.5 hover:bg-gray-100 rounded-full transition-colors flex items-center space-x-1"
                >
                  <Bookmark
                    size={16}
                    className={isBookmarked ? 'fill-blue-500 text-blue-500' : 'text-gray-400'}
                  />
                </button>
                {isCurrentUserAuthor && (
                  <>
                    <button
                      className="p-1.5 hover:bg-gray-100 rounded-full transition-colors"
                      onClick={handleEditClick}
                    >
                      <Edit size={16} className="text-gray-400" />
                    </button>
                    <button
                      onClick={handleDeleteClick}
                      className="p-1.5 hover:bg-gray-100 rounded-full transition-colors"
                    >
                      <Trash2 size={16} className="text-gray-400" />
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black/30 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-sm max-w-sm w-full p-4">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Delete Review</h3>
            <p className="text-sm text-gray-600 mb-4">
              Are you sure you want to delete this review? This action cannot be undone.
            </p>
            <div className="flex justify-end space-x-2">
              <button
                onClick={cancelDelete}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
              >
                Cancel
              </button>
              <button
                onClick={confirmDelete}
                className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-md hover:bg-red-700"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default ReviewCard;
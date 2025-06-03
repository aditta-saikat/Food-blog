import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { getAllBlogs, getBookmarkedBlogs, toggleBookmark } from '../lib/api/Blog';
import Navbar from '../components/Navbar/Navbar';
import Header from '../components/Dashboard/Header';
import ActionBar from '../components/Dashboard/ActionBar';
import ReviewList from '../components/Dashboard/ReviewList';

const Dashboard = () => {
  const { currentUser } = useAuth();
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [showComments, setShowComments] = useState({});
  const [newComment, setNewComment] = useState('');
  const [viewMode, setViewMode] = useState('grid');
  const [isUpdateModalOpen, setIsUpdateModalOpen] = useState(false);
  const [selectedReview, setSelectedReview] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchReviews = async () => {
      try {
        setLoading(true);
        setError(null);
        const token = currentUser?.token || localStorage.getItem('token');
        let data;
        if (filter === 'bookmarks') {
          data = await getBookmarkedBlogs(token);
        } else {
          data = await getAllBlogs(token);
          data = data.filter((review) => {
            if (filter === 'featured') return review.isFeatured;
            if (filter === 'my') return review.author?._id === currentUser?.id;
            return true;
          });
        }
        setReviews(Array.isArray(data) ? data : []);
      } catch (err) {
        console.error('Error fetching reviews:', err);
        setError('Failed to load reviews. Please try again.');
        setReviews([]);
      } finally {
        setLoading(false);
      }
    };

    if (currentUser) {
      fetchReviews();
    }
  }, [filter, currentUser]);

  const onReviewCreated = (newReview) => {
    setReviews((prev) => [newReview, ...prev]);
  };

  const handleReviewUpdated = (updatedReview) => {
    setReviews((prev) =>
      prev.map((review) =>
        review._id === updatedReview._id ? updatedReview : review
      )
    );
    setIsUpdateModalOpen(false);
    setSelectedReview(null);
  };

  const handleEditReview = (reviewId, blogData) => {
    if (reviewId && blogData) {
      setSelectedReview(blogData);
      setIsUpdateModalOpen(true);
    } else {
      setSelectedReview(null);
      setIsUpdateModalOpen(false);
    }
  };

  const handleToggleBookmark = async (reviewId) => {
    if (!currentUser) {
      setError('Please log in to bookmark reviews.');
      return;
    }
    try {
      const token = currentUser?.token || localStorage.getItem('token');
      const response = await toggleBookmark(reviewId, token);
      setReviews((prev) =>
        prev.map((review) =>
          review._id === reviewId
            ? { ...review, isBookmarked: response.isBookmarked }
            : review
        )
      );
      if (filter === 'bookmarks') {
        const data = await getBookmarkedBlogs(token);
        setReviews(Array.isArray(data) ? data : []);
      }
    } catch (err) {
      console.error('Error toggling bookmark:', err);
      setError('Failed to toggle bookmark. Please try again.');
    }
  };

  const handleDeleteReview = (reviewId) => {
    setReviews((prev) => prev.filter((review) => review._id !== reviewId));
  };

  const toggleCommentSection = (reviewId) => {
    setShowComments((prev) => ({
      ...prev,
      [reviewId]: !prev[reviewId],
    }));
  };

  const handleAddComment = (reviewId) => {
    if (!newComment.trim()) return;
    try {
      const commentToAdd = {
        _id: `temp-${Date.now()}`,
        text: newComment,
        user: {
          username: currentUser.username,
          avatar:
            currentUser.avatar ||
            'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?ixlib=rb-4.0.3',
        },
        createdAt: new Date().toISOString(),
      };

      setReviews((prev) =>
        prev.map((review) =>
          review._id === reviewId
            ? {
                ...review,
                comments: [...review.comments, commentToAdd],
              }
            : review
        )
      );
      setNewComment('');
    } catch (err) {
      console.error('Error adding comment:', err);
      setError('Failed to add comment. Please try again.');
    }
  };

  const filteredReviews = (reviews || []).filter((review) => {
    if (!searchTerm) return true;
    const searchLower = searchTerm.toLowerCase();
    return (
      (review.title || '').toLowerCase().includes(searchLower) ||
      (review.tags || []).some((tag) => tag.toLowerCase().includes(searchLower)) ||
      (review.author?.username || '').toLowerCase().includes(searchLower) ||
      (review.rating || '').toString().includes(searchLower)
    );
  });

  if (!currentUser) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <Header
        currentUser={currentUser}
        searchTerm={searchTerm}
        setSearchTerm={setSearchTerm}
      />
      <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        {error && (
          <div className="mb-4 p-3 bg-red-100 text-red-700 rounded-lg text-sm">
            {error}
          </div>
        )}
        <ActionBar
          filter={filter}
          setFilter={setFilter}
          viewMode={viewMode}
          setViewMode={setViewMode}
          onReviewCreated={onReviewCreated}
        />
        <ReviewList
          reviews={filteredReviews}
          loading={loading}
          viewMode={viewMode}
          currentUser={currentUser}
          showComments={showComments}
          toggleCommentSection={toggleCommentSection}
          handleDeleteReview={handleDeleteReview}
          handleAddComment={handleAddComment}
          newComment={newComment}
          setNewComment={setNewComment}
          filter={filter}
          searchTerm={searchTerm}
          isUpdateModalOpen={isUpdateModalOpen}
          selectedReview={selectedReview}
          handleReviewUpdated={handleReviewUpdated}
          onEditReview={handleEditReview}
          toggleBookmark={handleToggleBookmark}
        />
      </div>
      <footer className="bg-white">
        <div className="max-w-7xl mx-auto py-12 px-4 overflow-hidden sm:px-6 lg:px-8">
          <p className="mt-8 text-center text-base text-gray-400">
            © 2025 FoodCritic, Inc. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
};

export default Dashboard;
import { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import { getAllBlogs } from "../lib/api/Blog";
import Navbar from "../components/Navbar/Navbar";
import Header from "../components/Dashboard/Header";
import ActionBar from "../components/Dashboard/ActionBar";
import ReviewList from "../components/Dashboard/ReviewList";

const Dashboard = () => {
  const { currentUser } = useAuth();
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [showComments, setShowComments] = useState({});
  const [newComment, setNewComment] = useState("");
  const [viewMode, setViewMode] = useState("grid");
  const [isUpdateModalOpen, setIsUpdateModalOpen] = useState(false);
  const [selectedReview, setSelectedReview] = useState(null);

  useEffect(() => {
    const fetchReviews = async () => {
      try {
        setLoading(true);
        const data = await getAllBlogs(filter, currentUser?.id);
        
        setReviews(data);
        setLoading(false);
      } catch (err) {
        console.error("Error fetching reviews:", err);
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

  const handleEditReview = async (reviewId, blogData) => {
   
    if (reviewId && blogData) {
      setSelectedReview(blogData);
      setIsUpdateModalOpen(true);
    } else {
      setSelectedReview(null);
      setIsUpdateModalOpen(false);
    }
  };

  const toggleLike = async (reviewId) => {
    try {
      setReviews(
        reviews.map((review) => {
          if (review._id === reviewId) {
            const userAlreadyLiked = review.likes.some(
              (like) => like._id === currentUser.id
            );
            if (userAlreadyLiked) {
              return {
                ...review,
                likes: review.likes.filter(
                  (like) => like._id !== currentUser.id
                ),
              };
            } else {
              return {
                ...review,
                likes: [
                  ...review.likes,
                  { _id: currentUser.id, username: currentUser.username },
                ],
              };
            }
          }
          return review;
        })
      );
    } catch (err) {
      console.error("Error toggling like:", err);
    }
  };

  const handleDeleteReview = async (reviewId) => {
    try {
      setReviews(reviews.filter((review) => review._id !== reviewId));
    } catch (err) {
      console.error("Error deleting review:", err);
    }
  };

  const toggleCommentSection = (reviewId) => {
    setShowComments({
      ...showComments,
      [reviewId]: !showComments[reviewId],
    });
  };

  const handleAddComment = async (reviewId) => {
    if (!newComment.trim()) return;

    try {
      const commentToAdd = {
        _id: `temp-${Date.now()}`,
        text: newComment,
        user: {
          username: currentUser.username,
          avatar:
            currentUser.avatar ||
            "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?ixlib=rb-4.0.3",
        },
        createdAt: new Date().toISOString(),
      };

      setReviews(
        reviews.map((review) => {
          if (review._id === reviewId) {
            return {
              ...review,
              comments: [...review.comments, commentToAdd],
            };
          }
          return review;
        })
      );

      setNewComment("");
    } catch (err) {
      console.error("Error adding comment:", err);
    }
  };

  const filteredReviews = reviews.filter((review) => {
    if (!searchTerm) return true;
    const searchLower = searchTerm.toLowerCase();
    return (
      review.title.toLowerCase().includes(searchLower) ||
      review.tags.some((tag) => tag.toLowerCase().includes(searchLower)) ||
      review.author.username.toLowerCase().includes(searchLower) ||
      review.rating.toString().includes(searchLower)
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
          toggleLike={toggleLike}
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
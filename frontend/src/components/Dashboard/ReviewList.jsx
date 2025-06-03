import { useState } from 'react';
import ReviewCard from './ReviewCard';
import NewReviewModal from './NewReviewModal';
import UpdateReviewModal from './UpdateReviewModal';
import { User, PlusCircle } from 'lucide-react';
import { createBlog } from '../../lib/api/Blog';

export default function ReviewList({
  reviews,
  loading,
  viewMode,
  currentUser,
  showComments,
  toggleCommentSection,
  handleDeleteReview,
  filter,
  searchTerm,
  isUpdateModalOpen,
  selectedReview,
  handleReviewUpdated,
  onEditReview,
  toggleBookmark,
}) {
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleCreateReview = async (formData, images) => {
    try {
      const newBlog = await createBlog(formData, images, currentUser?.token);
      setIsModalOpen(false);
      return newBlog;
    } catch (err) {
      console.error("Error creating review:", err);
      throw err;
    }
  };

  return (
    <>
      {loading ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-500"></div>
        </div>
      ) : reviews.length > 0 ? (
        <div className={viewMode === 'grid' ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6' : 'space-y-6'}>
          {reviews.map((review) => (
            <ReviewCard
              key={review._id}
              review={review}
              viewMode={viewMode}
              currentUser={currentUser}
              showComments={showComments}
              toggleCommentSection={toggleCommentSection}
              handleDeleteReview={handleDeleteReview}
              onEditReview={onEditReview}
              filter={filter}
              toggleBookmark={toggleBookmark}
            />
          ))}
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-sm p-12 text-center">
          <div className="mx-auto w-16 h-16 flex items-center justify-center rounded-full bg-gray-100">
            <User size={32} className="text-gray-400" />
          </div>
          <h3 className="mt-4 text-lg font-medium text-gray-900">No reviews found</h3>
          <p className="mt-2 text-gray-500">
            {filter === 'bookmarks'
              ? "You haven't bookmarked any reviews yet."
              : filter === 'my'
              ? "You haven't created any reviews yet."
              : searchTerm
              ? `No reviews matching "${searchTerm}"`
              : "No reviews available at the moment."}
          </p>
          <button
            onClick={() => setIsModalOpen(true)}
            className="mt-6 bg-primary-600 hover:bg-primary-700 text-white font-medium px-4 py-2 rounded-md shadow-sm flex items-center mx-auto"
          >
            <PlusCircle size={18} className="mr-2" />
            Create First Review
          </button>
        </div>
      )}
      <NewReviewModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSubmit={handleCreateReview}
      />
      <UpdateReviewModal
        isOpen={isUpdateModalOpen}
        onClose={() => onEditReview(null)}
        onSubmit={handleReviewUpdated}
        review={selectedReview}
      />
    </>
  );
}
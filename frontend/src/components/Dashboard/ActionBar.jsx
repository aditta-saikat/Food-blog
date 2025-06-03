import { useState } from 'react';
import { PlusCircle } from 'lucide-react';
import NewReviewModal from './NewReviewModal';
import { createBlog } from '../../lib/api/Blog';

const ActionBar = ({ filter, setFilter, viewMode, setViewMode, onReviewCreated }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleCreateReview = async (formData, images) => {
    try {
      const token = localStorage.getItem('token'); 
      const newBlog = await createBlog(formData, images, token);
      onReviewCreated(newBlog);
      setIsModalOpen(false);
    } catch (err) {
      throw err;
    }
  };

  return (
    <>
      <div className="bg-white rounded-xl shadow-sm mb-6 p-4">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="flex flex-wrap gap-2">
            {['all', 'featured', 'my', 'bookmarks'].map((type) => (
              <button
                key={type}
                onClick={() => setFilter(type)}
                className={`px-4 py-2 rounded-lg font-medium text-sm transition-all ${
                  filter === type
                    ? 'bg-primary-100 text-primary-700'
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                {type === 'all'
                  ? 'All Reviews'
                  : type === 'featured'
                  ? 'Featured'
                  : type === 'my'
                  ? 'My Reviews'
                  : 'Bookmarked Reviews'}
              </button>
            ))}
          </div>
          <div className="flex flex-wrap gap-3 justify-between md:justify-end items-center">
            <div className="flex border rounded-lg overflow-hidden">
              <button
                onClick={() => setViewMode('grid')}
                className={`p-2 ${viewMode === 'grid' ? 'bg-gray-100' : 'bg-white'}`}
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-5 w-5 text-gray-600"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z"
                  />
                </svg>
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`p-2 ${viewMode === 'list' ? 'bg-gray-100' : 'bg-white'}`}
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-5 w-5 text-gray-600"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 6h16M4 12h16m-7 6h7"
                  />
                </svg>
              </button>
            </div>
            <button
              onClick={() => setIsModalOpen(true)}
              className="bg-primary-600 hover:bg-primary-700 text-white font-medium px-4 py-2 rounded-md shadow flex items-center"
            >
              <PlusCircle size={18} className="mr-2" />
              New Review
            </button>
          </div>
        </div>
      </div>
      <NewReviewModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSubmit={handleCreateReview}
      />
    </>
  );
};

export default ActionBar;
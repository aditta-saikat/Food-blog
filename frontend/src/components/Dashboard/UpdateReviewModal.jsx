import { useState, useEffect } from 'react';
import { X, Star, Image as ImageIcon, Tag } from 'lucide-react';
import { updateBlog } from '../../lib/api/Blog';

const UpdateReviewModal = ({ isOpen, onClose, onSubmit, review }) => {
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    restaurant: '',
    location: '',
    rating: 0,
    tags: '',
    category: '',
    isFeatured: false,
  });
  const [images, setImages] = useState([]); // Existing image URLs + blob previews for new files
  const [imageFiles, setImageFiles] = useState([]); // New uploaded files
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);

  // Initialize formData and images when review changes
  useEffect(() => {
    if (review) {
      setFormData({
        title: review.title || '',
        content: review.content || '',
        restaurant: review.restaurant || '',
        location: review.location || '',
        rating: review.rating || 0,
        tags: Array.isArray(review.tags) ? review.tags.join(',') : review.tags || '',
        category: review.category || '',
        isFeatured: !!review.isFeatured,
      });
      setImages(review.images || []);
      setImageFiles([]);
      setErrors({});
    }
  }, [review]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
    setErrors((prev) => ({ ...prev, [name]: '' }));
  };

  const handleRating = (rating) => {
    setFormData((prev) => ({ ...prev, rating }));
    setErrors((prev) => ({ ...prev, rating: '' }));
  };

  const handleImageChange = (e) => {
    const files = Array.from(e.target.files);
    const validFiles = files.filter((file) => {
      const validTypes = ['image/jpeg', 'image/jpg', 'image/png'];
      const validSize = file.size <= 32 * 1024 * 1024; // 32MB
      if (!validTypes.includes(file.type)) {
        setErrors((prev) => ({
          ...prev,
          images: 'Only JPEG, JPG, or PNG images allowed',
        }));
        return false;
      }
      if (!validSize) {
        setErrors((prev) => ({
          ...prev,
          images: 'Each image must be under 32MB',
        }));
        return false;
      }
      return true;
    });

    setImageFiles((prev) => [...prev, ...validFiles]);
    setImages((prev) => [...prev, ...validFiles.map((file) => URL.createObjectURL(file))]);
    if (validFiles.length === files.length) {
      setErrors((prev) => ({ ...prev, images: '' }));
    }
  };

  const handleRemoveImage = (index) => {
    setImages((prev) => {
      const removedImage = prev[index];
      const newImages = prev.filter((_, i) => i !== index);
      if (removedImage.startsWith('blob:')) {
        setImageFiles((prevFiles) =>
          prevFiles.filter((file) => URL.createObjectURL(file) !== removedImage),
        );
        URL.revokeObjectURL(removedImage); // Clean up Object URL
      }
      return newImages;
    });
  };

  const validateForm = () => {
    const newErrors = {};
    if (!formData.title.trim()) newErrors.title = 'Title is required';
    if (!formData.content.trim()) newErrors.content = 'Content is required';
    if (!formData.restaurant.trim()) newErrors.restaurant = 'Restaurant is required';
    if (!formData.rating) newErrors.rating = 'Rating is required';
    return newErrors;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const newErrors = validateForm();
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setSubmitting(true);
    setErrors((prev) => ({ ...prev, submit: '' }));
    try {
      const updatedBlogData = {
        ...formData,
        images: images.filter((img) => !img.startsWith('blob:')), // Send existing URLs
      };

      console.log('Submitting update:', { updatedBlogData, imageFiles: imageFiles.length });

      const updatedBlog = await updateBlog(review._id, updatedBlogData, imageFiles);
      await onSubmit(updatedBlog);

      // Reset form
      setFormData({
        title: '',
        content: '',
        restaurant: '',
        location: '',
        rating: 0,
        tags: '',
        category: '',
        isFeatured: false,
      });
      setImages([]);
      setImageFiles([]);
      onClose();
    } catch (err) {
      const errorMessage = err.message || 'Failed to update review';
      setErrors((prev) => ({ ...prev, submit: errorMessage }));
      console.error('Update error:', err);
    } finally {
      setSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/30 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl shadow-sm max-w-lg w-full max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-4 border-b border-gray-100">
          <h2 className="text-lg font-medium text-gray-600">Update Review</h2>
          <button
            onClick={onClose}
            className="p-1 hover:bg-gray-100 rounded-full transition-colors"
          >
            <X size={20} className="text-gray-600" />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="p-4 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Title
            </label>
            <input
              type="text"
              name="title"
              value={formData.title}
              onChange={handleChange}
              className="w-full bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary-500"
              placeholder="Enter review title"
            />
            {errors.title && (
              <p className="mt-1 text-xs text-red-500">{errors.title}</p>
            )}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Content
            </label>
            <textarea
              name="content"
              value={formData.content}
              onChange={handleChange}
              rows="4"
              className="w-full bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary-500"
              placeholder="Write your review..."
            />
            {errors.content && (
              <p className="mt-1 text-xs text-red-500">{errors.content}</p>
            )}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Restaurant
            </label>
            <input
              type="text"
              name="restaurant"
              value={formData.restaurant}
              onChange={handleChange}
              className="w-full bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary-500"
              placeholder="Enter restaurant name"
            />
            {errors.restaurant && (
              <p className="mt-1 text-xs text-red-500">{errors.restaurant}</p>
            )}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Location (Optional)
            </label>
            <input
              type="text"
              name="location"
              value={formData.location}
              onChange={handleChange}
              className="w-full bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary-500"
              placeholder="Enter location"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Rating
            </label>
            <div className="flex space-x-1">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  onClick={() => handleRating(star)}
                  className="focus:outline-none"
                >
                  <Star
                    size={24}
                    className={
                      star <= formData.rating
                        ? 'text-yellow-400 fill-yellow-400'
                        : 'text-gray-300'
                    }
                  />
                </button>
              ))}
            </div>
            {errors.rating && (
              <p className="mt-1 text-xs text-red-500">{errors.rating}</p>
            )}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Tags (Optional, comma-separated)
            </label>
            <div className="relative">
              <Tag size={16} className="absolute left-3 top-2.5 text-gray-400" />
              <input
                type="text"
                name="tags"
                value={formData.tags}
                onChange={handleChange}
                className="w-full bg-gray-50 border border-gray-200 rounded-lg pl-10 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary-500"
                placeholder="e.g. Italian, Spicy, Cozy"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Category (Optional)
            </label>
            <input
              type="text"
              name="category"
              value={formData.category}
              onChange={handleChange}
              className="w-full bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary-500"
              placeholder="Enter category"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Images (Optional)
            </label>
            <div className="relative">
              <input
                type="file"
                multiple
                accept="image/jpeg,image/jpg,image/png"
                onChange={handleImageChange}
                className="w-full bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-sm file:mr-4 file:py-1 file:px-3 file:rounded file:border-0 file:bg-primary-100 file:text-primary-700 file:font-medium"
              />
              <ImageIcon
                size={16}
                className="absolute right-3 top-2.5 text-gray-400"
              />
            </div>
            {errors.images && (
              <p className="mt-1 text-xs text-red-500">{errors.images}</p>
            )}
            {images.length > 0 && (
              <div className="mt-2 grid grid-cols-3 gap-2">
                {images.map((img, index) => (
                  <div key={index} className="relative">
                    <img
                      src={img}
                      alt={`Preview ${index + 1}`}
                      className="h-20 w-full object-cover rounded-md"
                    />
                    <button
                      type="button"
                      onClick={() => handleRemoveImage(index)}
                      className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 hover:bg-red-600"
                    >
                      <X size={12} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
          
          {errors.submit && (
            <p className="text-sm text-red-500">{errors.submit}</p>
          )}
          <div className="flex justify-end space-x-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-4 py-2 text-sm font-medium text-white bg-primary-600 rounded-md hover:bg-primary-700 disabled:opacity-50"
            >
              {submitting ? 'Updating...' : 'Update Review'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default UpdateReviewModal;
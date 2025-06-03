import axios from 'axios';

export const getMyNotifications = async () => {
  try {
    const response = await axios.get(
      `${import.meta.env.VITE_API_URL}/notifications`,
      { withCredentials: true },
    );
    return response.data;
  } catch (err) {
    throw new Error(err.response?.data?.message || 'Failed to fetch notifications');
  }
};

export const markNotificationAsRead = async (id) => {
  try {
    const response = await axios.patch(
      `${import.meta.env.VITE_API_URL}/notifications/${id}/read`,
      {},
      { withCredentials: true },
    );
    return response.data;
  } catch (err) {
    throw new Error(err.response?.data?.message || 'Failed to mark notification as read');
  }
};

export const deleteNotification = async (id) => {
  try {
    const response = await axios.delete(
      `${import.meta.env.VITE_API_URL}/notifications/${id}`,
      { withCredentials: true },
    );
    return response.data;
  } catch (err) {
    throw new Error(err.response?.data?.message || 'Failed to delete notification');
  }
};
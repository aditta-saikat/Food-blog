// In src/lib/api/User.js

import axios from 'axios';

export const getUser = async (id) => {
  try {
    const response = await axios.get(
      `${import.meta.env.VITE_API_URL}/users/${id}`,
      { withCredentials: true }
    );
    return response.data;
  } catch (err) {
    console.error('Error fetching user:', err.response?.data || err.message);
    throw new Error(err.response?.data?.message || 'Failed to fetch user');
  }
};

export const updateUser = async (id, formData) => {
  try {
    // Debug formData content 
    console.log('Client: Preparing to send FormData to server');
    for (let [key, value] of formData.entries()) {
      if (key === 'image') {
        console.log(`FormData contains image: ${value.name}, size: ${value.size}, type: ${value.type}`);
      } else {
        console.log(`FormData entry: ${key}=`, value);
      }
    }

    const response = await axios.put(
      `${import.meta.env.VITE_API_URL}/users/${id}`,
      formData,
      {
        withCredentials: true,
        headers: { 'Content-Type': 'multipart/form-data' },
      }
    );
    
    return response.data;
  } catch (err) {
    const errorMessage = err.response?.data?.message || 'Failed to update user';
    console.error('Error updating user:', errorMessage, err.response?.data);
    throw new Error(errorMessage);
  }
};

export const deleteUser = async (id) => {
  try {
    const response = await axios.delete(
      `${import.meta.env.VITE_API_URL}/users/${id}`,
      { withCredentials: true }
    );
    return response.data;
  } catch (err) {
    console.error('Error deleting user:', err.response?.data || err.message);
    throw new Error(err.response?.data?.message || 'Failed to delete user');
  }
};

export const googleSignIn = async (idToken) => {
  try {
    const response = await axios.post(
      `${import.meta.env.VITE_API_URL}/auth/google`,
      { idToken },
      { withCredentials: true }
    );
    return response.data;
  } catch (err) {
    console.error('Error with Google sign-in:', err.response?.data || err.message);
    throw new Error(err.response?.data?.message || 'Google sign-in failed');
  }
};
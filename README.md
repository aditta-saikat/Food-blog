# 🍽️ Food Blog Application

A full-stack web application for food enthusiasts to share, review, and discover restaurant experiences. Users can create profiles, post reviews with images, rate restaurants, add tags, and manage bookmarks, followers, and notifications. The app features a responsive React frontend and a Node.js/Express backend with MongoDB for data storage.

---

## 🚀 Features

- **User Profiles:** Register, log in, and update profiles with username, bio, and profile image (uploaded via ImgBB).
- **Reviews:** Create, view, and search reviews with titles, content, restaurant details, ratings, tags, and images.
- **Social Features:** Comment and like posts.
- **Search:** Filter reviews by title, tags, author, or rating from the dashboard.
- **Responsive UI:** Clean, modern design with modals for creating reviews and editing profiles.
- **Image Uploads:** Upload profile images and review images (JPEG/JPG/PNG, ≤32MB) using ImgBB.
- **Authorization:** Google authentication for login.
- **Authentication:** Secure JWT-based authentication with protected routes.
- **Admin Access:** Admin users can view all users and manage content.

---

## 🎥 Demo

Watch a demo of the application in action: [Google Drive Link](#) *(https://drive.google.com/file/d/1xpIvvADz_kACHvt9bhRr9nOHJHQPjF5c/view?usp=sharing)*

---

## 📦 Installation

### Project Setup

1. **Clone the repository and navigate to the backend directory:**

```bash
git clone <repository-url>
cd Food\ Blog/backend
npm install --legact-peer-deps
```
2. **Clone the repository and navigate to the frontend directory:**

```bash
git clone <repository-url>
cd Food\ Blog/frontend
npm install --legact-peer-deps
```

3. **Backend .env**

```bash
MONGO_URI=mongodb+srv://<accoutn_name:password>@cluster0.2jxyc6x.mongodb.net/foodblog?retryWrites=true&w=majority&appName=Cluster0
JWT_SECRET=a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6
REFRESH_SECRET=1a2b3c4d5e6f1a2b3c4d5e6f1a2b3c4d5e6f1a2b3c4d5e6f1a2b3c4d5e6f1a2b3c4d5e6f1a2b3c4d5e6f1a2b3c4d5e6f
PORT=4000
CLIENT_URL= http://localhost:3000
IMGBB_API_KEY=ae2938f8c4d068225eb3d2c5261561bf  //generate yours one
```

4. **Frontend .env**

```bash
VITE_API_URL=http://localhost:4000/api
```
5. **config/firebase json file**

```bash

//Generate from the firebase console
{
  "type": "service_account",
  "project_id": "foodblog-313a0",
  "private_key_id": "",
  "private_key": "-----BEGIN PRIVATE KEY-----",
  "client_email": "firebase-adminsdk-fbsvc@foodblog-313a0.iam.gserviceaccount.com",
  "client_id": "104782581793275957625",
  "auth_uri": "https://accounts.google.com/o/oauth2/auth",
  "token_uri": "https://oauth2.googleapis.com/token",
  "auth_provider_x509_cert_url": "https://www.googleapis.com/oauth2/v1/certs",
  "client_x509_cert_url": "https://www.googleapis.com/robot/v1/metadata/x509/firebase-adminsdk-fbsvc%40foodblog-313a0.iam.gserviceaccount.com",
  "universe_domain": "googleapis.com"
}

```


   


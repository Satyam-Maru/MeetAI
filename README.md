An updated `README.md` file for the project is below.

# MeetAI 📹

MeetAI is a real-time video conferencing application built with the MERN stack (MongoDB, Express, React, Node.js) and integrated with the LiveKit API for video and audio functionalities. It provides a seamless and interactive video meeting experience with features like user authentication, room management, and a waiting room for hosts to control participant access.

-----

## **Features** ✨

  * **Real-time Communication**: High-quality video and audio streaming powered by LiveKit.
  * **User Authentication**: Secure sign-up and sign-in functionality with both email/password and Google OAuth.
  * **Room Management**: Users can create new rooms with randomly generated names or join existing ones using a room name or invite link.
  * **Waiting Room**: Hosts have control over who joins the meeting, with the ability to approve or reject participants.
  * **Host Menu**: A dedicated menu for hosts to manage the meeting, including access to the waiting room and a list of joined users.
  * **Participant Management**: Hosts can remove participants from the room.
  * **Noise Suppression**: Integrated with Krisp for advanced noise suppression, ensuring clear audio.
  * **Notifications**: Real-time notifications for hosts when a new participant joins the waiting room.
  * **Responsive Design**: A user-friendly interface that works on both desktop and mobile devices.

-----

## **Tech Stack** 🛠️

**Frontend:**

  * React
  * Vite
  * LiveKit Client SDK
  * Krisp Noise Filter SDK
  * Axios
  * React Router

**Backend:**

  * Node.js
  * Express
  * LiveKit Server SDK
  * MongoDB (Mongoose)
  * Redis (ioredis)
  * Bloom Filters
  * JWT (JSON Web Tokens)

-----

## **Getting Started** 🚀

### **Prerequisites**

  * Node.js (v16.20.1 or later)
  * npm or yarn
  * MongoDB instance
  * Redis instance
  * LiveKit server instance

### **Installation**

1.  **Clone the repository**:
    ```bash
    git clone https://github.com/satyam-maru/meetai.git
    cd meetai
    ```
2.  **Install server dependencies**:
    ```bash
    cd server
    npm install
    ```
3.  **Install client dependencies**:
    ```bash
    cd ../client
    npm install
    ```

### **Configuration**

1.  **Create a `.env` file in the `server` directory and add the following environment variables**:
    ```env
    LIVEKIT_API_KEY= # Your LiveKit API Key
    LIVEKIT_API_SECRET= # Your LiveKit API Secret
    LIVEKIT_HOST= # Your LiveKit Host URL
    REDIS_URL= # Your Redis connection URL
    MONGO_ATLAS_URI= # Your MongoDB connection URI
    MONGO_DB_NAME= # Your MongoDB database name
    MONGO_COLLECTION_NAME= # Your MongoDB collection name for the bloom filter
    JWT_SECRET= # A secret key for signing JWTs
    GOOGLE_CLIENT_ID= # Your Google OAuth Client ID
    CLOUDINARY_URL= # Your Cloudinary URL for initial profile pictures
    VITE_LOCALHOST= # Frontend URL for CORS configuration in development (e.g., http://localhost:5173)
    VERCEL_URL= # Deployed frontend URL for CORS configuration in production
    PLATFORM= # 'dev' for development, 'prod' for production
    ```
2.  **Create a `.env` file in the `client` directory and add the following environment variables**:
    ```env
    VITE_GOOGLE_CLIENT_ID= # Your Google OAuth Client ID
    VITE_LIVEKIT_URL= # Your LiveKit server URL
    VITE_LOCALHOST_URL= # Your backend server URL for development (e.g., http://localhost:3001)
    VITE_BACKEND_URL= # Your deployed backend server URL
    VITE_PLATFORM= # 'dev' for development, 'prod' for production
    ```

### **Running the Application**

1.  **Start the backend server**:
    ```bash
    cd server
    npm run dev
    ```
2.  **Start the frontend client**:
    ```bash
    cd client
    npm run dev
    ```

-----

## **Usage** 🧑‍💻

1.  **Authentication**: Sign up or sign in using your email and password or with your Google account.
2.  **Create a Room**: Click on the "Create Room" button to open a modal where you can either enter a custom room name or generate a random one.
3.  **Join a Room**: Enter the room name or paste the invite link into the input field and click "Join Room". The input field will validate if the room exists.
4.  **Host Controls**: As a host, you'll see a floating menu button.
      * **Waiting Room**: Click the menu button to access the waiting room, where you can approve or reject participants.
      * **Joined Users**: From the menu, you can also view a list of all participants currently in the room and remove them if necessary.
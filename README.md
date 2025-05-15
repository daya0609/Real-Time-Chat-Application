# Real-Time Chat Application

A scalable real-time chat app built with Node.js, Express, MongoDB, Redis, and Socket.IO. Users can register, log in, join chat rooms, and chat instantly. Redis Pub/Sub enables multi-instance scaling.

## Features
- JWT-based user authentication (register/login)
- Real-time messaging with Socket.IO
- Multiple chat rooms (General, Sports, Tech, Random)
- Messages stored in MongoDB (with timestamp, room, sender)
- Redis for message broadcasting, caching, and active user tracking
- Redis Pub/Sub for horizontal scaling
- Simple, modern frontend (HTML, CSS, JS)
- Session persists after browser refresh (using localStorage)

## Prerequisites
- Node.js (v18+ recommended)
- MongoDB
- Redis

## Getting Started
1. **Clone the repository**
   ```sh
   git clone <your-repo-url>
   cd chat
   ```
2. **Install dependencies**
   ```sh
   npm install
   ```
3. **Configure environment variables**
   Create a `.env` file in the root directory:
   ```env
   PORT=3000
   MONGO_URI=mongodb://localhost:27017/chat
   JWT_SECRET=your_jwt_secret
   REDIS_URL=redis://localhost:6379
   ```
4. **Start MongoDB and Redis**
   Ensure both MongoDB and Redis servers are running locally.

5. **Run the server**
   ```sh
   node server.js
   ```
6. **Open the app**
   Go to [http://localhost:3000](http://localhost:3000) in your browser.

## Usage
- Register or log in.
- Select a chat room to join.
- Send and receive messages in real time.
- See notifications when users join or leave rooms.
- Stay logged in after refresh (session persists until logout).

## Project Structure
```
chat/
  server.js
  config/
    db.js
    redis.js
  models/
    Message.js
    User.js
  routes/
    auth.js
    rooms.js
  public/
    index.html
    chat.js
    style.css
  package.json
  .env (not committed)
```

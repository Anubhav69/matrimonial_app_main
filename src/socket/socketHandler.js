import { Server } from 'socket.io';
import jwt from 'jsonwebtoken';
import { Op } from 'sequelize';
import { Message, UserInteraction } from '../models/index.js';

const JWT_SECRET = process.env.JWT_SECRET || 'your_secret_key_change_in_production';

// userId -> socketId map (tracks online users)
const onlineUsers = new Map();

const areConnected = async (userA, userB) => {
  const connection = await UserInteraction.findOne({
    where: {
      type: 'accepted',
      [Op.or]: [
        { sender_id: userA, receiver_id: userB },
        { sender_id: userB, receiver_id: userA },
      ],
    },
  });
  return !!connection;
};

const initSocket = (server) => {
  const io = new Server(server, {
    cors: { origin: '*', methods: ['GET', 'POST'] },
  });

  // JWT auth middleware for every socket connection
  io.use((socket, next) => {
    const token = socket.handshake.auth?.token || socket.handshake.headers?.authorization?.split(' ')[1];
    if (!token) return next(new Error('Authentication token required'));

    try {
      const decoded = jwt.verify(token, JWT_SECRET);
      socket.user = decoded; // attach user to socket
      next();
    } catch {
      next(new Error('Invalid or expired token'));
    }
  });

  io.on('connection', (socket) => {
    const userId = String(socket.user.id);

    // Register user as online
    onlineUsers.set(userId, socket.id);

    // Notify all connected sockets that this user is online
    socket.broadcast.emit('user:online', { userId });

    console.log(`User ${userId} connected — socket: ${socket.id}`);

    // ─── Send Message ────────────────────────────────────────────────────────
    socket.on('chat:send', async ({ receiverId, message }, callback) => {
      try {
        if (!receiverId || !message?.trim())
          return callback?.({ success: false, error: 'receiverId and message are required' });

        if (String(userId) === String(receiverId))
          return callback?.({ success: false, error: 'You cannot message yourself' });

        if (message.length > 2000)
          return callback?.({ success: false, error: 'Message cannot exceed 2000 characters' });

        const connected = await areConnected(userId, receiverId);
        if (!connected)
          return callback?.({ success: false, error: 'You can only message connected users' });

        // Save to DB
        const saved = await Message.create({
          sender_id: userId,
          receiver_id: receiverId,
          message: message.trim(),
        });

        const payload = {
          id: saved.id,
          sender_id: saved.sender_id,
          receiver_id: saved.receiver_id,
          message: saved.message,
          is_read: saved.is_read,
          created_at: saved.created_at,
        };

        // Emit to receiver if online
        const receiverSocketId = onlineUsers.get(String(receiverId));
        if (receiverSocketId) {
          io.to(receiverSocketId).emit('chat:receive', payload);
        }

        // Confirm to sender
        callback?.({ success: true, data: payload });

      } catch (err) {
        callback?.({ success: false, error: err.message });
      }
    });

    // ─── Typing Indicator ────────────────────────────────────────────────────
    socket.on('chat:typing', ({ receiverId }) => {
      const receiverSocketId = onlineUsers.get(String(receiverId));
      if (receiverSocketId) {
        io.to(receiverSocketId).emit('chat:typing', { senderId: userId });
      }
    });

    socket.on('chat:stop_typing', ({ receiverId }) => {
      const receiverSocketId = onlineUsers.get(String(receiverId));
      if (receiverSocketId) {
        io.to(receiverSocketId).emit('chat:stop_typing', { senderId: userId });
      }
    });

    // ─── Read Receipt ────────────────────────────────────────────────────────
    socket.on('chat:read', async ({ senderId }) => {
      try {
        await Message.update(
          { is_read: true },
          { where: { sender_id: senderId, receiver_id: userId, is_read: false } }
        );

        // Notify original sender that messages were read
        const senderSocketId = onlineUsers.get(String(senderId));
        if (senderSocketId) {
          io.to(senderSocketId).emit('chat:read_ack', { readBy: userId });
        }
      } catch (err) {
        console.error('chat:read error', err.message);
      }
    });

    // ─── Get Online Status ───────────────────────────────────────────────────
    socket.on('user:status', ({ userIds }, callback) => {
      const statuses = {};
      userIds.forEach(id => {
        statuses[id] = onlineUsers.has(String(id));
      });
      callback?.(statuses);
    });

    // ─── Disconnect ──────────────────────────────────────────────────────────
    socket.on('disconnect', () => {
      onlineUsers.delete(userId);
      socket.broadcast.emit('user:offline', { userId });
      console.log(`User ${userId} disconnected`);
    });
  });

  return io;
};

export default initSocket;

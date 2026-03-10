import { AppDispatch } from "../store";
import api from "../../lib/api";
import {
  SET_CURRENT_USER,
  SET_USERS,
  SET_CHATS,
  SET_ACTIVE_CHAT,
  SET_MESSAGES,
  ADD_MESSAGE,
  SET_LOADING,
  LOGOUT,
} from "./types";
import { User, Chat, Message } from "../../lib/types";
import { socket } from "../../lib/socket";

// Action Creators
export const setCurrentUser = (user: User | null) => ({
  type: SET_CURRENT_USER,
  payload: user,
});
export const setUsers = (users: User[]) => ({
  type: SET_USERS,
  payload: users,
});
export const setChats = (chats: Chat[]) => ({
  type: SET_CHATS,
  payload: chats,
});
export const setActiveChat = (chatId: string | null) => ({
  type: SET_ACTIVE_CHAT,
  payload: chatId,
});
export const setMessages = (messages: Message[]) => ({
  type: SET_MESSAGES,
  payload: messages,
});
export const addMessage = (message: Message) => ({
  type: ADD_MESSAGE,
  payload: message,
});
export const setLoading = (isLoading: boolean) => ({
  type: SET_LOADING,
  payload: isLoading,
});

// Thunks

// Register
export const register =
  (username: string, email: string, password: string) =>
  async (dispatch: AppDispatch) => {
    dispatch(setLoading(true));
    try {
      const { data } = await api.post("/chat/register", {
        username,
        email,
        password,
      });
      dispatch(setCurrentUser(data));
      localStorage.setItem("chat_user", JSON.stringify(data));
      socket.connect();
      dispatch(fetchAllUsers(data._id));
      dispatch(fetchChats(data._id));
      return { success: true };
    } catch (error: any) {
      const message = error.response?.data?.message || "Registration failed";
      alert(message);
      return { success: false, message };
    } finally {
      dispatch(setLoading(false));
    }
  };

// Login
export const login =
  (email: string, password: string) => async (dispatch: AppDispatch) => {
    dispatch(setLoading(true));
    try {
      const { data } = await api.post("/chat/login", { email, password });
      dispatch(setCurrentUser(data));
      localStorage.setItem("chat_user", JSON.stringify(data));
      socket.connect();
      dispatch(fetchAllUsers(data._id));
      dispatch(fetchChats(data._id));
      return { success: true };
    } catch (error: any) {
      const message = error.response?.data?.message || "Login failed";
      alert(message);
      return { success: false, message };
    } finally {
      dispatch(setLoading(false));
    }
  };

// Logout
export const logoutUser = () => (dispatch: AppDispatch) => {
  localStorage.removeItem("chat_user");
  dispatch({ type: LOGOUT });
  socket.disconnect();
};

// Load User from Storage (for persistence)
export const loadUser = () => (dispatch: AppDispatch) => {
  const storedUser = localStorage.getItem("chat_user");
  if (storedUser) {
    const user = JSON.parse(storedUser);
    dispatch(setCurrentUser(user));
    socket.connect();
    dispatch(fetchAllUsers(user._id));
    dispatch(fetchChats(user._id));
  }
};

// Fetch All Users
export const fetchAllUsers =
  (currentUserId: string) => async (dispatch: AppDispatch) => {
    try {
      const { data } = await api.get(`/chat/users/${currentUserId}`);
      dispatch(setUsers(data));
    } catch (error) {
      console.error("Fetch users error:", error);
    }
  };

// Fetch User's Conversation List
export const fetchChats = (userId: string) => async (dispatch: AppDispatch) => {
  try {
    const { data } = await api.get(`/chat/list/${userId}`);
    dispatch(setChats(data));
  } catch (error) {
    console.error("Fetch chats error:", error);
  }
};

// Start or Open Chat with a User
export const startChat =
  (senderId: string, receiverId: string) => async (dispatch: AppDispatch) => {
    try {
      const { data } = await api.post("/chat/start", { senderId, receiverId });
      dispatch(setActiveChat(data._id));
      dispatch(openChat(data._id));
      dispatch(fetchChats(senderId));
    } catch (error) {
      console.error("Start chat error:", error);
    }
  };

// Open a specific Chat ID
export const openChat = (chatId: string) => async (dispatch: AppDispatch) => {
  dispatch(setActiveChat(chatId));
  dispatch(setLoading(true));
  try {
    const { data } = await api.get(`/chat/messages/${chatId}`);
    dispatch(setMessages(data));
    socket.emit("joinChat", chatId);
  } catch (error) {
    console.error("Fetch messages error:", error);
  } finally {
    dispatch(setLoading(false));
  }
};

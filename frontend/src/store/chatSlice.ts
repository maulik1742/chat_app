import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { Chat, Message } from "../lib/types";

interface ChatState {
  chats: Chat[];
  activeChatId: string | null;
  messages: Message[];
  loading: boolean;
}

const initialState: ChatState = {
  chats: [],
  activeChatId: null,
  messages: [],
  loading: false,
};

const chatSlice = createSlice({
  name: "chat",
  initialState,
  reducers: {
    setChats: (state, action: PayloadAction<Chat[]>) => {
      state.chats = action.payload;
    },
    setActiveChat: (state, action: PayloadAction<string | null>) => {
      state.activeChatId = action.payload;
      state.messages = []; // Clear messages when switching chat
    },
    setMessages: (state, action: PayloadAction<Message[]>) => {
      state.messages = action.payload;
    },
    addMessage: (state, action: PayloadAction<Message>) => {
      if (action.payload.chatId === state.activeChatId) {
        state.messages.push(action.payload);
      }

      // Update the chat list's last message
      const chatIndex = state.chats.findIndex(
        (c) => c._id === action.payload.chatId,
      );
      if (chatIndex !== -1) {
        state.chats[chatIndex].lastMessage = action.payload;
        // Optionally move to top of the list
        const [chat] = state.chats.splice(chatIndex, 1);
        state.chats.unshift(chat);
      }
    },
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.loading = action.payload;
    },
  },
});

export const { setChats, setActiveChat, setMessages, addMessage, setLoading } =
  chatSlice.actions;
export default chatSlice.reducer;

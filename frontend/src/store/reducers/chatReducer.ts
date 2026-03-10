import {
  SET_CURRENT_USER,
  SET_USERS,
  SET_CHATS,
  SET_ACTIVE_CHAT,
  SET_MESSAGES,
  ADD_MESSAGE,
  SET_LOADING,
  LOGOUT,
} from "../actions/types";
import { User, Chat, Message } from "../../lib/types";

interface ChatState {
  currentUser: User | null;
  users: User[];
  chats: Chat[];
  activeChatId: string | null;
  messages: Message[];
  loading: boolean;
}

const initialState: ChatState = {
  currentUser: null,
  users: [],
  chats: [],
  activeChatId: null,
  messages: [],
  loading: false,
};

const chatReducer = (state = initialState, action: any): ChatState => {
  switch (action.type) {
    case SET_CURRENT_USER:
      return { ...state, currentUser: action.payload };
    case SET_USERS:
      return { ...state, users: action.payload };
    case SET_CHATS:
      return { ...state, chats: action.payload };
    case SET_ACTIVE_CHAT:
      return { ...state, activeChatId: action.payload, messages: [] };
    case SET_MESSAGES:
      return { ...state, messages: action.payload };
    case ADD_MESSAGE:
      // If message belongs to active chat, add it
      const updatedMessages =
        action.payload.chatId === state.activeChatId
          ? [...state.messages, action.payload]
          : state.messages;

      // Update last message in chat list and move to top
      const chatIndex = state.chats.findIndex(
        (c) => c._id === action.payload.chatId,
      );
      let updatedChats = [...state.chats];
      if (chatIndex !== -1) {
        const chat = {
          ...updatedChats[chatIndex],
          lastMessage: action.payload,
          updatedAt: new Date().toISOString(),
        };
        updatedChats.splice(chatIndex, 1);
        updatedChats.unshift(chat);
      }

      return { ...state, messages: updatedMessages, chats: updatedChats };
    case SET_LOADING:
      return { ...state, loading: action.payload };
    case LOGOUT:
      return initialState;
    default:
      return state;
  }
};

export default chatReducer;

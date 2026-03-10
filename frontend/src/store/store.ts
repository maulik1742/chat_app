import { configureStore } from "@reduxjs/toolkit";
import chatReducer from "./reducers/chatReducer";
import { thunk } from "redux-thunk";

export const store = configureStore({
  reducer: {
    chatStore: chatReducer,
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;

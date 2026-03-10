export interface User {
  _id: string;
  username: string;
  email: string;
  token?: string;
}

export interface Message {
  _id: string;
  chatId: string;
  senderId: string;
  text: string;
  createdAt: string;
}

export interface Chat {
  _id: string;
  participants: (string | User)[];
  lastMessage?: string | Message;
  updatedAt: string;
}

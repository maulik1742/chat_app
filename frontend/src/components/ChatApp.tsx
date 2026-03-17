"use client";

import React, { useEffect, useState, useRef } from "react";
import { useDispatch, useSelector } from "react-redux";
import { RootState, AppDispatch } from "@/store/store";
import {
  login,
  register,
  logoutUser,
  loadUser,
  startChat,
  openChat,
  addMessage,
} from "@/store/actions/chatActions";
import { socket } from "@/lib/socket";
import { Message } from "@/lib/types";
import {
  Send,
  User as UserIcon,
  MessageSquare,
  Search,
  LogOut,
  Users,
  Lock,
  UserPlus,
} from "lucide-react";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export default function ChatApp() {
  const dispatch = useDispatch<AppDispatch>();
  const { currentUser, users, chats, activeChatId, messages, loading } =
    useSelector((state: RootState) => state.chatStore);

  const [inputText, setInputText] = useState("");
  const [userNameInput, setUserNameInput] = useState("");
  const [emailInput, setEmailInput] = useState("");
  const [passwordInput, setPasswordInput] = useState("");
  const [isRegistering, setIsRegistering] = useState(false);
  const [sidebarTab, setSidebarTab] = useState<"recent" | "users">("recent");
  const [searchQuery, setSearchQuery] = useState("");

  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Load user on mount
  useEffect(() => {
    dispatch(loadUser());
  }, [dispatch]);

  // Auto-scroll
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Handle Login/Register
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!emailInput.trim() || !passwordInput.trim()) return;
    if (isRegistering && !userNameInput.trim()) return;

    if (isRegistering) {
      dispatch(
        register(userNameInput.trim(), emailInput.trim(), passwordInput.trim()),
      );
    } else {
      dispatch(login(emailInput.trim(), passwordInput.trim()));
    }
  };

  // Socket setup
  useEffect(() => {
    socket.on("receiveMessage", (message: Message) => {
      dispatch(addMessage(message));
    });

    return () => {
      socket.off("receiveMessage");
    };
  }, [dispatch]);

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim() || !activeChatId || !currentUser) return;

    socket.emit("sendMessage", {
      chatId: activeChatId,
      senderId: currentUser._id,
      text: inputText.trim(),
    });
    setInputText("");
  };

  if (!currentUser) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-neutral-950 text-white p-4">
        <div className="w-full max-w-sm p-10 bg-neutral-900/50 backdrop-blur-xl rounded-3xl border border-neutral-800/50 shadow-2xl">
          <div className="flex flex-col items-center mb-10">
            <div className="p-5 bg-blue-600/30 rounded-3xl mb-6 shadow-xl shadow-blue-500/10">
              <MessageSquare className="w-14 h-14 text-blue-400" />
            </div>
            <h1 className="text-4xl font-extrabold tracking-tighter">
              {isRegistering ? "Join Us" : "Welcome Back"}
            </h1>
            <p className="text-neutral-500 mt-2 text-center text-sm">
              {isRegistering
                ? "Create an account to start chatting"
                : "Sign in to continue your conversations"}
            </p>
          </div>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-3">
              {isRegistering && (
                <div className="relative">
                  <UserIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-600" />
                  <input
                    type="text"
                    placeholder="Username"
                    value={userNameInput}
                    onChange={(e) => setUserNameInput(e.target.value)}
                    disabled={loading}
                    className="w-full pl-12 pr-5 py-4 bg-neutral-900 border border-neutral-800 rounded-2xl focus:ring-2 focus:ring-blue-500 outline-none text-white transition-all placeholder:text-neutral-600"
                  />
                </div>
              )}
              <div className="relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-600" />
                <input
                  type="email"
                  placeholder="Email Address"
                  value={emailInput}
                  onChange={(e) => setEmailInput(e.target.value)}
                  disabled={loading}
                  className="w-full pl-12 pr-5 py-4 bg-neutral-900 border border-neutral-800 rounded-2xl focus:ring-2 focus:ring-blue-500 outline-none text-white transition-all placeholder:text-neutral-600"
                />
              </div>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-600" />
                <input
                  type="password"
                  placeholder="Password"
                  value={passwordInput}
                  onChange={(e) => setPasswordInput(e.target.value)}
                  disabled={loading}
                  className="w-full pl-12 pr-5 py-4 bg-neutral-900 border border-neutral-800 rounded-2xl focus:ring-2 focus:ring-blue-500 outline-none text-white transition-all placeholder:text-neutral-600"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-4 bg-blue-600 hover:bg-blue-500 disabled:bg-neutral-800 rounded-2xl font-bold text-lg transition-all active:scale-[0.98] shadow-lg shadow-blue-600/20 mt-4"
            >
              {loading
                ? isRegistering
                  ? "Registering..."
                  : "Signing in..."
                : isRegistering
                  ? "Register Account"
                  : "Sign In"}
            </button>
          </form>

          <div className="mt-8 text-center">
            <button
              onClick={() => setIsRegistering(!isRegistering)}
              className="text-sm text-neutral-500 hover:text-blue-400 transition-colors font-medium"
            >
              {isRegistering
                ? "Already have an account? Sign In"
                : "Don't have an account? Register Now"}
            </button>
          </div>
        </div>
      </div>
    );
  }

  const activeChat = chats.find((c) => c._id === activeChatId);

  // Robustly find the other participant
  const otherParticipant = activeChat?.participants.find((p) => {
    const pId = typeof p === "string" ? p : p?._id;
    return pId && pId !== currentUser?._id;
  });

  const getParticipantName = (p: any) => {
    if (!p) return "Unknown";
    if (typeof p === "object" && p.username) return p.username;
    // If it's an ID string, try to find in our global users list
    const foundUser = users.find((u) => u._id === p);
    return foundUser?.username || "Unknown";
  };

  const otherParticipantName = getParticipantName(otherParticipant);

  return (
    <>
      <div className="flex h-screen bg-neutral-950 text-neutral-200 overflow-hidden font-sans">
        {/* Sidebar */}
        <aside className="w-[380px] border-r border-neutral-800/50 flex flex-col bg-neutral-900/30 backdrop-blur-3xl z-20">
          {/* User Header */}
          <header className="p-4 border-b border-neutral-800/50">
            <div className="flex justify-between items-center mb-8">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-2xl bg-linear-to-br from-blue-500 to-indigo-600 flex items-center justify-center p-0.5 shadow-xl">
                  <div className="w-full h-full bg-neutral-900 rounded-[14px] flex items-center justify-center">
                    <UserIcon className="w-7 h-7 text-blue-400" />
                  </div>
                </div>
                <div>
                  <h2 className="text-lg font-black tracking-tight leading-none uppercase">
                    {currentUser.username}
                  </h2>
                  <span className="text-[10px] text-emerald-500 font-bold tracking-widest uppercase">
                    Online
                  </span>
                </div>
              </div>
              <button
                onClick={() => dispatch(logoutUser())}
                className="p-3 bg-neutral-800/50 hover:bg-red-500/10 hover:text-red-400 rounded-2xl transition-all group"
              >
                <LogOut className="w-5 h-5" />
              </button>
            </div>

            {/* Tabs */}
            <div className="flex p-1 bg-neutral-900 border border-neutral-800 rounded-2xl overflow-hidden mb-6">
              <button
                onClick={() => setSidebarTab("recent")}
                className={cn(
                  "flex-1 py-3 px-4 rounded-xl text-xs font-bold tracking-tighter transition-all flex items-center justify-center gap-2",
                  sidebarTab === "recent"
                    ? "bg-neutral-800 text-white shadow-lg"
                    : "text-neutral-500 hover:text-neutral-300",
                )}
              >
                <MessageSquare className="w-4 h-4" /> RECENT
              </button>
              <button
                onClick={() => setSidebarTab("users")}
                className={cn(
                  "flex-1 py-3 px-4 rounded-xl text-xs font-bold tracking-tighter transition-all flex items-center justify-center gap-2",
                  sidebarTab === "users"
                    ? "bg-neutral-800 text-white shadow-lg"
                    : "text-neutral-500 hover:text-neutral-300",
                )}
              >
                <Users className="w-4 h-4" /> ALL USERS
              </button>
            </div>

            {/* Search */}
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-600" />
              <input
                type="text"
                placeholder={
                  sidebarTab === "recent"
                    ? "Search message..."
                    : "Find people..."
                }
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-neutral-900 border border-neutral-800 rounded-2xl py-3 pl-12 pr-4 text-sm focus:ring-2 focus:ring-blue-500 outline-none transition-all placeholder:text-neutral-600"
              />
            </div>
          </header>

          {/* Scrollable list */}
          <div className="flex-1 overflow-y-auto px-4 py-6 custom-scrollbar space-y-3">
            {sidebarTab === "recent" ? (
              chats.length > 0 ? (
                chats.map((chat) => {
                  const partner = chat.participants.find((p) => {
                    const pId = typeof p === "string" ? p : p?._id;
                    return pId && pId !== currentUser?._id;
                  });
                  const name = getParticipantName(partner);
                  const isActive = activeChatId === chat._id;

                  return (
                    <button
                      key={chat._id}
                      onClick={() => dispatch(openChat(chat._id))}
                      className={cn(
                        "w-full flex items-center gap-4 p-5 rounded-3xl transition-all border group relative",
                        isActive
                          ? "bg-blue-600/10 border-blue-500/20 shadow-xl"
                          : "bg-transparent border-transparent hover:bg-neutral-800/30 hover:border-neutral-800/50",
                      )}
                    >
                      <div className="w-14 h-14 rounded-2xl bg-neutral-800 flex items-center justify-center border border-neutral-700 overflow-hidden shadow-inner">
                        {isActive ? (
                          <div className="w-full h-full bg-blue-600/20 flex items-center justify-center animate-pulse">
                            <span className="text-blue-400 text-xl font-black capitalize">
                              {name?.[0]}
                            </span>
                          </div>
                        ) : (
                          <UserIcon className="w-6 h-6 text-neutral-500 group-hover:scale-110 transition-transform" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0 text-left">
                        <div className="flex justify-between items-center mb-1">
                          <p className="font-bold text-sm tracking-tight truncate capitalize">
                            {name}
                          </p>
                          <span className="text-[9px] text-neutral-600 font-bold uppercase">
                            {chat.lastMessage
                              ? new Date(chat.updatedAt).toLocaleTimeString(
                                  [],
                                  {
                                    hour: "2-digit",
                                    minute: "2-digit",
                                  },
                                )
                              : ""}
                          </span>
                        </div>
                        <p className="text-xs text-neutral-500 truncate font-medium">
                          {(chat.lastMessage as Message)?.text || (
                            <span className="italic opacity-50 text-[10px]">
                              No messages yet
                            </span>
                          )}
                        </p>
                      </div>
                      {isActive && (
                        <div className="absolute left-2 w-1.5 h-6 bg-blue-500 rounded-full" />
                      )}
                    </button>
                  );
                })
              ) : (
                <div className="flex flex-col items-center justify-center py-10 text-neutral-600">
                  <MessageSquare className="w-12 h-12 mb-4 opacity-10" />
                  <p className="text-xs uppercase font-extrabold tracking-widest text-neutral-700">
                    No active chats
                  </p>
                </div>
              )
            ) : (
              users
                .filter((u) => u.username.includes(searchQuery))
                .map((u) => (
                  <button
                    key={u._id}
                    onClick={() => {
                      dispatch(startChat(currentUser._id, u._id));
                      setSidebarTab("recent");
                    }}
                    className="w-full flex items-center gap-4 p-5 rounded-3xl transition-all border border-transparent hover:bg-neutral-800/30 hover:border-neutral-800/50 group"
                  >
                    <div className="w-12 h-12 rounded-2xl bg-neutral-900 flex items-center justify-center border border-neutral-800 group-hover:bg-blue-600/10 transition-colors">
                      <UserIcon className="w-5 h-5 text-neutral-600 group-hover:text-blue-400" />
                    </div>
                    <div className="text-left">
                      <p className="font-bold text-sm tracking-tight capitalize">
                        {u.username}
                      </p>
                      <p className="text-[10px] text-emerald-500 font-bold tracking-widest uppercase">
                        Start Chat
                      </p>
                    </div>
                  </button>
                ))
            )}
          </div>
        </aside>

        {/* Main Area */}
        <main className="flex-1 flex flex-col bg-neutral-950 relative">
          <div className="absolute inset-0 bg-linear-to-b from-blue-500/5 to-transparent pointer-events-none" />

          {activeChatId ? (
            <>
              {/* Header */}
              <header className="h-[120px] flex items-center px-10 border-b border-neutral-800/50 bg-neutral-950/50 backdrop-blur-3xl sticky top-0 z-10">
                <div className="flex items-center gap-6">
                  <div className="w-[60px] h-[60px] rounded-2xl bg-linear-to-br from-blue-500/20 to-indigo-600/20 flex items-center justify-center border border-blue-500/30 shadow-2xl">
                    <span className="text-2xl font-black text-blue-400 capitalize">
                      {otherParticipantName?.[0]}
                    </span>
                  </div>
                  <div>
                    <h3 className="text-2xl font-black tracking-tighter capitalize">
                      {otherParticipantName}
                    </h3>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.5)] animate-pulse" />
                      <span className="text-[11px] text-neutral-500 uppercase tracking-[0.2em] font-black">
                        Active Conversation
                      </span>
                    </div>
                  </div>
                </div>
              </header>

              {/* Messages */}
              <div className="flex-1 overflow-y-auto p-10 space-y-8 scroll-smooth custom-scrollbar">
                {messages.length > 0 ? (
                  messages.map((msg, idx) => {
                    const isMe = msg.senderId === currentUser._id;
                    return (
                      <div
                        key={msg._id || idx}
                        className={cn(
                          "flex flex-col group",
                          isMe ? "ml-auto items-end" : "mr-auto items-start",
                        )}
                      >
                        <div
                          className={cn(
                            "px-6 py-4 rounded-3xl text-[15px] leading-relaxed max-w-[500px] shadow-2xl transition-all",
                            isMe
                              ? "bg-blue-600 text-white rounded-tr-none border border-blue-500/50 shadow-blue-900/40"
                              : "bg-neutral-900 text-neutral-200 rounded-tl-none border border-neutral-800 shadow-black/50",
                          )}
                        >
                          {msg.text}
                        </div>
                        <div className="flex items-center gap-2 mt-3 px-1">
                          <span className="text-[9px] text-neutral-600 font-black uppercase tracking-widest">
                            {new Date(msg.createdAt).toLocaleTimeString([], {
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </span>
                          {isMe && (
                            <span className="text-[10px] text-blue-400 font-bold uppercase tracking-widest">
                              Sent
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <div className="h-full flex flex-col items-center justify-center text-neutral-700">
                    <MessageSquare className="w-16 h-16 mb-4 opacity-5" />
                    <p className="text-sm font-black uppercase tracking-[0.3em] opacity-30">
                      Send a message to start chatting
                    </p>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Input Overlay */}
              <div className="p-10 bg-neutral-950/80 backdrop-blur-2xl">
                <form
                  onSubmit={handleSendMessage}
                  className="max-w-5xl mx-auto flex gap-6 items-end"
                >
                  <div className="flex-1 relative group">
                    <textarea
                      placeholder="Say something..."
                      rows={1}
                      value={inputText}
                      onChange={(e) => setInputText(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" && !e.shiftKey) {
                          e.preventDefault();
                          handleSendMessage(e as any);
                        }
                      }}
                      className="w-full bg-neutral-900 border border-neutral-800 rounded-3xl px-8 py-5 focus:ring-4 focus:ring-blue-500/10 outline-none text-white transition-all text-sm resize-none overflow-hidden max-h-40 placeholder:text-neutral-600 shadow-2xl"
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={!inputText.trim()}
                    className="bg-blue-600 hover:bg-blue-500 disabled:bg-neutral-800 disabled:opacity-50 text-white p-5 rounded-3xl transition-all shadow-xl shadow-blue-600/30 active:scale-90 shrink-0 group"
                  >
                    <Send className="w-7 h-7 group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
                  </button>
                </form>
              </div>
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center p-20 text-center animate-in fade-in zoom-in duration-1000">
              <div className="relative mb-12">
                <div className="absolute inset-x-0 inset-y-0 bg-blue-500 blur-3xl opacity-10 animate-pulse" />
                <div className="w-[120px] h-[120px] bg-neutral-900/50 backdrop-blur-2xl rounded-[40px] flex items-center justify-center border border-neutral-800/50 relative shadow-2xl">
                  <MessageSquare className="w-16 h-16 text-blue-500 opacity-40" />
                </div>
              </div>
              <h3 className="text-4xl font-extrabold text-neutral-200 tracking-tighter mb-4 uppercase">
                Talksy
              </h3>
              <p className="max-w-md text-neutral-500 font-medium leading-relaxed">
                Select a conversation from the sidebar or find a new contact to
                start messaging in real-time.
              </p>
              <button
                onClick={() => setSidebarTab("users")}
                className="mt-10 px-10 py-4 bg-neutral-900 border border-neutral-800 hover:bg-neutral-800 rounded-2xl text-xs font-black tracking-[0.2em] transition-all uppercase"
              >
                Find People
              </button>
            </div>
          )}
        </main>

        <style jsx global>{`
          .custom-scrollbar::-webkit-scrollbar {
            width: 5px;
          }
          .custom-scrollbar::-webkit-scrollbar-track {
            background: transparent;
          }
          .custom-scrollbar::-webkit-scrollbar-thumb {
            background: #262626;
            border-radius: 10px;
          }
          .custom-scrollbar::-webkit-scrollbar-thumb:hover {
            background: #404040;
          }
        `}</style>
      </div>
    </>
  );
}

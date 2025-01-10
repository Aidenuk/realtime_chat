import { create } from "zustand";
import toast from "react-hot-toast";
import { axiosInstance } from "../lib/axios";
import { useAuthStore } from "./useAuthStore";

export const useChatStore = create((set,get) => ({
  messages: [],
  users: [],
  selectedUser: null,
  senderId: null,
  receiverId: null,
  isUsersLoading: false,
  isMessagesLoading: false,

  getUsers: async () => {
    set({ isUsersLoading: true });
    try {
      const res = await axiosInstance.get("/messages/users");
      set({ users: res.data });
    } catch (error) {
      toast.error(error.response.data.message);
    } finally {
      set({ isUsersLoading: false });
    }
  },

  getMessages: async (userId) => {
    set({ isMessagesLoading: true });
    try {
      const res = await axiosInstance.get(`/messages/${userId}`);
      set({ messages: res.data });
      return res.data; // 반환 추가
    } catch (error) {
      toast.error(error.response.data.message);
      return []; // 실패 시 빈 배열 반환
    } finally {
      set({ isMessagesLoading: false });
    }
  },

  

  sendMessage: async (messageData) => {
    const { selectedUser, messages } = get();
    try {
      const res = await axiosInstance.post(`/messages/send/${selectedUser._id}`, messageData);
      set({ messages: [...messages, res.data] });
    } catch (error) {
      toast.error(error.response.data.message);
    }
  },

  markMessagesAsRead: async (userId) => {
    const { messages } = get();
    try {
      await axiosInstance.post(`/messages/read/${userId}`);
      // 상태 업데이트
      set({
        messages: messages.map((message) =>
          message.receiverId === userId ? { ...message, read: true } : message
        ),
      });
    } catch (error) {
      toast.error("Failed to mark messages as read");
    }
  },
  

  subscribeToMessages: () => {
    const {selectedUser,messages} = get()
    if(!selectedUser) return;
    const socket = useAuthStore.getState().socket;
    socket.on("newMessage", (newMessage) => {
      //내가 보낸 유저만 볼 수 있게
      const isMessageSendfFromSelectedUser = newMessage.senderId === selectedUser._id;
      if(!isMessageSendfFromSelectedUser) return;
      set({
        messages: [...get().messages, newMessage],
      })
    })

    socket.on("newMessage", (newMessage) => {
      if (
        newMessage.senderId === selectedUser._id ||
        newMessage.receiverId === selectedUser._id
      ) {
        set({
          messages: [...get().messages, newMessage],
        });
      }
    });
    // 메시지 읽음 상태 업데이트 처리
    socket.on("messageRead", ({ senderId, receiverId }) => {
      // 현재 대화 상대가 메시지를 읽었는지 확인
      if (receiverId === selectedUser._id) {
        set((state) => ({
          messages: state.messages.map((message) =>
            message.senderId === senderId ? { ...message, read: true } : message
          ),
        }));
      }
    });
  },

  unsubscribeFromMessages: () => {
    const socket = useAuthStore.getState().socket;
    socket.off("newMessage")
  },

  updateMessageReadStatus: (messageId, readStatus) => {
    set((state) => ({
      messages: state.messages.map((message) =>
        message._id === messageId ? { ...message, read: readStatus } : message
      ),
    }));
  },

  setSelectedUser: (selectedUser) => set({ selectedUser }),

}));
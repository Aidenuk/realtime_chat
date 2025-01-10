import { useEffect, useState } from "react";
import { useChatStore } from "../store/useChatStore";
import { useAuthStore } from "../store/useAuthStore";
import SidebarSkeleton from "./skeletons/SidebarSkeleton";
import { Users } from "lucide-react";

const Sidebar = () => {
  const { getUsers, users, selectedUser, setSelectedUser, isUsersLoading, getMessages} = useChatStore();
  const {onlineUsers} = useAuthStore();
  const [lastMessages, setLastMessages] = useState({}); // 각 사용자와의 최근 메시지 저장
  const [unreadCounts, setUnreadCounts] = useState({}); // 각 사용자의 읽지 않은 메시지 개수 저장

  useEffect(() => {
    // 사용자 목록 가져오기
    getUsers();
  }, [getUsers]);

  useEffect(() => {
    // 각 사용자와의 최근 메시지 가져오기
    const fetchLastMessages = async () => {
      const messagesMap = {};
      for (const user of users) {
        try {
          const userMessages = await getMessages(user._id); // 개별 사용자의 메시지 가져오기
          
          if (userMessages && userMessages.length > 0) {
            messagesMap[user._id] = userMessages[userMessages.length - 1]; // 마지막 메시지 저장
          }
        } catch (error) {
          console.error(`Error fetching messages for user ${user._id}:`, error.message);
        }
      }
      setLastMessages(messagesMap);
    };

    if (users.length > 0) {
      fetchLastMessages();
    }
  }, [users, getMessages]);

  useEffect(() => {
    const fetchUnreadCounts = async () => {
      const counts = {};
      for (const user of users) {
        try {
          const userMessages = await getMessages(user._id); // 개별 사용자의 메시지 가져오기
          const unreadMessages = userMessages.filter((message) => !message.read); // 읽지 않은 메시지 필터링
          counts[user._id] = unreadMessages.length; // 읽지 않은 메시지 개수 저장
        } catch (error) {
          console.error(`Error fetching messages for user ${user._id}:`, error.message);
        }
      }
      setUnreadCounts(counts); // 읽지 않은 메시지 개수를 상태로 업데이트
    };

    fetchUnreadCounts();
  }, [users, getMessages]);


  useEffect(() => {
    const socket = useAuthStore.getState().socket;
  
    socket.on("newMessage", (newMessage) => {
      setLastMessages((prevLastMessages) => ({
        ...prevLastMessages,
        [newMessage.senderId]: newMessage,
      }));
    });
  
    return () => {
      socket.off("newMessage");
    };
  }, []);

  
  if (isUsersLoading) return <SidebarSkeleton />;

  return (
    <aside className="h-full w-20 lg:w-72 border-r border-base-300 flex flex-col transition-all duration-200">
      <div className="border-b border-base-300 w-full p-5">
        <div className="flex items-center gap-2">
          <Users className="size-6" />
          <span className="font-medium hidden lg:block">Contacts</span>
        </div>
      </div>

      <div className="overflow-y-auto w-full py-3">
        {users.map((user) => (
          <button
            key={user._id}
            onClick={() => setSelectedUser(user)}
            className={`
              w-full p-3 flex items-center gap-3
              hover:bg-base-300 transition-colors
              ${selectedUser?._id === user._id ? "bg-base-300 ring-1 ring-base-300" : ""}
            `}
          >
            <div className="relative mx-auto lg:mx-0">
              <img
                src={user.profilePic || "/avatar.png"}
                alt={user.name}
                className="size-12 object-cover rounded-full"
              />
              {onlineUsers.includes(user._id) && (
                <span
                  className="absolute bottom-0 right-0 size-3 bg-green-500 
                  rounded-full ring-2 ring-zinc-900"
                />
              )}
            </div>

            <div className="hidden lg:block text-left min-w-0">
              <div className="font-medium truncate">{user.fullName}</div>
              <div className="text-sm text-zinc-400">
                {onlineUsers.includes(user._id) ? "Online" : "Offline"}
              </div>
              {/* 최근 메시지 표시 */}
              <div className="text-sm text-zinc-400 truncate">
                {lastMessages[user._id]?.text || ""}
              </div>
              
            </div>
            
          </button>
        ))}
      </div>
    </aside>
  );
};

export default Sidebar;
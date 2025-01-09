import cloudinary from "../lib/cloudinary.js";
import { getReceiverSocketId,getSenderSocketId,io } from "../lib/socket.js";
import Message from "../models/message.model.js";
import User from "../models/user.model.js"

export const getUsersForSidebar = async(req,res) => {
  try {
    const loggedInUserId = req.user._id
    const filteredUsers = await User.find({_id: {$ne: loggedInUserId}}).select("-password");

    res.status(200).json(filteredUsers);
  } catch (error) {
    console.error("Error in getUsersForSidebar:", error.message);
    res.status(500).json({error: "Internal server error"});
    
  }

}

export const getMessages = async(req,res) => {
  try {
    const {id: userToChatId} = req.params
    const myId = req.user._id;

    const messages = await Message.find({
      $or:[
        {senderId: myId, receiverId: userToChatId },
        {senderId: userToChatId, receiverId: myId },
      ]
    })
    res.status(200).json(messages)
  } catch (error) {
    console.log("Error in getMessages controller:", error.message);
    res.status(500).json({error: "Internal server error"});
  }
}

export const sendMessage = async(req,res) => {
  try {
    const {text,image} = req.body;
    const {id: receiverId} = req.params;
    const senderId = req.user._id;

    let imageUrl;
    if(image){
      const uploadResponse = await cloudinary.uploader.upload(image);
      imageUrl = uploadResponse.secure_url;
    }

    const newMessage = new Message({
      senderId,
      receiverId,
      text,
      image: imageUrl,
      read: false,
    });
    await newMessage.save();

    const receiverSocketId = getReceiverSocketId(receiverId)
    // if a receiver is online or not
    if (receiverSocketId) {
      io.to(receiverSocketId).emit("newMessage", newMessage); // one to one chat : not using to -> group chat
    }

    res.status(201).json(newMessage);


  } catch (error) {
    console.log("Error in sendMessage controller: ", error.message);
    res.status(500).json({error: "Internal server error"});
    
  }
};

export const markMessageAsRead = async (req, res) => {
  try {
    const { id: userId } = req.params; // 요청에서 전달된 상대방 사용자 ID
    const myId = req.user._id; // 현재 로그인한 사용자 ID

    // 읽지 않은 메시지 찾기
    const unreadMessages = await Message.find({
      senderId: userId,
      receiverId: myId,
      read: false,
    });

    if (unreadMessages.length === 0) {
      return res.status(200).json({ success: true, message: "읽지 않은 메시지가 없습니다." });
    }

    // 메시지 읽음 처리
    const updatedMessages = await Message.updateMany(
      { senderId: userId, receiverId: myId, read: false },
      { $set: { read: true } }
    );

    // 클라이언트에 읽음 상태 알림
    const senderSocketId = getReceiverSocketId(userId);
    if (senderSocketId) {
      io.to(senderSocketId).emit("messageRead", {
        senderId: userId,
        receiverId: myId,
        updatedMessages,
      });
    }

    res.status(200).json({ success: true, message: "메시지 읽음 처리 완료" });
  } catch (error) {
    console.error("Error in markMessageAsRead:", error.message);
    res.status(500).json({ success: false, error: "Internal server error" });
  }
};
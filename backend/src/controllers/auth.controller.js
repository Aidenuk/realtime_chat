import User from "../models/user.model.js";
import bcrypt from "bcryptjs";
import { generateToken } from "../lib/util.js";
import cloudinary from "../lib/cloudinary.js";

export const signup = async(req,res) => {
  const {fullName,email,password} = req.body
  try {
    if(!email || !password ||!fullName) {
      return res.status(400).json({message:"You need to fill out the form"})
    }
    // hash password
    if(password.length< 6){
      return res.status(400).json({message: "Password must be over 6 char"});
    }
    const user = await User.findOne({email})

    if(user) return res.status(400).json({message:"Email already exists!"})

    const salt = await bcrypt.genSalt(10)
    const hasedPassword = await bcrypt.hash(password,salt);

    const newUser = new User({
      fullName,
      email,
      password: hasedPassword,
    })

    if(newUser){
      generateToken(newUser._id,res);
      await newUser.save();
      
      res.status(201).json({
        _id: newUser._id,
        fullName: newUser.fullName,
        eamil: newUser.email,
        profilePic: newUser.profilePic,
      })
    } else {
      res.status(400).json({message: "invalid user data!"})
    }
  } catch (error) {
    console.log("Error in signup controller!", error.message)
    
  }
}

export const login = async (req,res) => {
  const {email,password} = req.body
  try {
    if(!email || !password) {
      return res.status(400).json({message:"You need to put email and password!"})
    }
    const user = await User.findOne({email})
    if(!user) {
      return res.status(400).json({message: "Invalid credential!"})
    }
    const isPasswordCorrect = await await bcrypt.compare(password, user.password)
    if(!isPasswordCorrect){
      return res.status(400).json({message: "Invalid credential!"})
    }

    generateToken(user._id,res)

    res.status(200).json({
      _id: user._id,
      fullName: user.fullName,
      email: user.email,
      profilePic: user.profilePic,

    })

  } catch (error) {
    console.log("Error in login Controller",error.message)
    res.status(500).json({message: "Internal Server Error"})
    
  }
  
}

export const logout = (req,res) => {
  try {
    res.cookie("jwt","",{maxAge:0})
    res.status(200).json({message: "Logout Successfully!"})
    
  } catch (error) {
    console.log("Error in login Controller",error.message)
    res.status(500).json({message: "Internal Server Error"})
  }
}

export const updatedProfile = async(req,res) => {
  try {
    const {profilePic} = req.body;
    const userId = req.user_id;

    if(!profilePic){
      return res.status(400).json({message: "Profilepic os required"})
    }
    const uploadResponse = await cloudinary.uploader.upload(profilePic);
    const updatedUser = await User.findByIdAndUpdate(
      userId,
      {profilePic: uploadResponse.secure_url},
      {new: true},
    )
    res.status(200).json(updatedUser);

  } catch (error) {
    console.log("error in update Profile", error.message);
    res.status(500).json({message: "Internal server error"});
  }
}

export const checkAuth = (req, res) => {
  try {
    res.status(200).json(req.user);
  } catch (error) {
    console.log("Error in checkAuth controller", error.message);
    res.status(500).json({ message: "Internal Server Error" });
  }
};
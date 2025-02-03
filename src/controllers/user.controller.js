import {asyncHandler} from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { User } from "../models/user.model.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import { ApiResponse } from "../utils/ApiResponse.js";

const registerUser = asyncHandler(async(req, res) => {
  // console.log(`Incoming request from ${req.ip}`);
  // res.status(200).json({
  //   message: "ok"
  // });
  // get user details from frontend
  //validation not empty
  //check ig user already exist : username,email
  //check for images, check for avatar
  //upload them to cloudinary,avatar
  //create user object - create entry in db
  //send response
  // removed password and refresh token field from response
  //check for user creation
  //return response


  //
// check all fields are not empty in one condition
  const {username,email,fullName,password} = req.body
  console.log('email',email);
  if([username,email,fullName,password].some((value) => value?.trim() === "")){
    throw new ApiError(400,"All fields required")
  }
 const existedUser = await User.findOne({$or:[{ username },{ email }]})

 if(existedUser){
  throw new ApiError(409,"User with username or email already exist")
 }

 const avatarLocalPath = req.files?.avatar[0]?.path;
 const coverPhotoLocalPath = req.files?.coverImage[0]?.path;

 if(!avatarLocalPath){
  throw new ApiError(400,"Avatar is required")
 }

 const avatar = await uploadOnCloudinary(avatarLocalPath)
 const coverImage = await uploadOnCloudinary(coverPhotoLocalPath)

 if(!avatar){
  throw new ApiError(400,"Avatar upload failed")
 }

 const user = await User.create({
  fullName,
  avatar:avatar.url,
  coverImage:coverImage?.url || "",
  email,
  username:username.toLowerCase(),
  password
 })

  const createdUser=await User.findById(user._id).select("-password -refreshToken")
  if(!createdUser){
    throw new ApiError(500,"Something went wrong while registering user")
  }

  return res.status(201).json(
    new ApiResponse (200,createdUser,"User created successfully")
  )

});

export { registerUser };
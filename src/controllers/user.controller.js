import {asyncHandler} from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { User } from "../models/user.model.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import jwt from "jsonwebtoken"
import mongoose from "mongoose";


//creating methods for generating access and refresh token

const generateAccessAndRefreshToken = async(userId) => {
  try {

    const user = await User.findById(userId)
    const accessToken = user.generateAccessToken()
    const refreshToken = user.generateRefreshToken()

    user.refreshToken = refreshToken
    await user.save({ validateBeforeSave:false })

    return {accessToken,refreshToken}

  } catch (error) {
    throw new ApiError(500,"Something went wrong while generating access and refresh token")
  }
}


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
  // console.log('email',email);
  if([username,email,fullName,password].some((value) => value?.trim() === "")){
    throw new ApiError(400,"All fields required")
  }
 const existedUser = await User.findOne({$or:[{ username },{ email }]})

 if(existedUser){
  throw new ApiError(409,"User with username or email already exist")
 }
//  console.log(req.files);

 const avatarLocalPath = req.files?.avatar[0]?.path;
//  const coverPhotoLocalPath = req.files?.coverImage[0]?.path;
let coverPhotoLocalPath;
if(req.files && Array.isArray(req.files.coverImage) && req.files.coverImage.length > 0){
  coverPhotoLocalPath = req.files.coverImage[0].path
}

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

const loginUser = asyncHandler(async(req, res) => {
  // req body -> data
  //username, email
  //find the user
  //check password
  //access and refresh token
  //send cookies
  const {username,email,password}= req.body;

  if(!username && !email){
    throw new ApiError(400,"Username and email required")
  }

  const user = await User.findOne({$or:[{username},{email}]})

  if(!user){
    throw new ApiError(404,"User does not exist")
  }

 const isPasswordValid = await user.isPasswordCorrect(password)

 if(!isPasswordValid){
  throw new ApiError(401,"Invalid password")
 }

 const {accessToken,refreshToken} = await generateAccessAndRefreshToken(user._id)

  const loggedInUser = await User.findById(user._id).select("-password -refreshToken")

  const options = {
    httpOnly:true,
    secure:true,
  }
  return res
  .status(200)
  .cookie('accessToken',accessToken,options)
  .cookie("refreshToken",refreshToken,options)
  .json(new ApiResponse(200,
    {
      user:loggedInUser,accessToken,refreshToken
    },
    "User logged in successfully"
  ))


});

const logoutUser = asyncHandler(async(req, res) => {

  await User.findByIdAndUpdate(
    req.user._id,
    {
      $unset:{refreshToken: 1}//this will remove the field
    },
    {
      new:true
    }
  )
  const options = {
    httpOnly:true,
    secure:true
  }
  return res
  .status(200)
  .clearCookie("accessToken",options)
  .clearCookie("refreshToken",options)
  .json(new ApiResponse(200,"User logged out successfully"))


});


const refreshAccessToken = asyncHandler(async(req, res) => {

 const incomingRefreshToken = req.cookies.refreshToken || req.body.refreshToken

  if(!incomingRefreshToken){
    throw new ApiError(401,"Unauthorized request")
  }


  try {
    const decodedToken = jwt.verify(incomingRefreshToken,
    process.env.REFRESH_TOKEN_SECRET
    )
  
    const user = await User.findById(decodedToken?._id)
  
    if(!user){
      throw new ApiError(401,"Invalid refresh token")
    }
  
    if(user.refreshToken !== incomingRefreshToken){
      throw new ApiError(401,"Refresh token invalid")
    }
  
    const options = {
      httpOnly:true,
      secure:true
    }
    const {accessToken,newRefreshToken} = await generateAccessAndRefreshToken(user._id)
  
    return res
    .status(200)
    .cookie('accessToken',accessToken,options)
    .cookie("refreshToken",newRefreshToken,options)
    .json(new ApiResponse(200,
      {
        accessToken,refreshToken:newRefreshToken
      },
      "Access token refreshed successfully"	
  
    ))
  } catch (error) {
    throw new ApiError(500,error.message || "Something went wrong while refreshing access token")
    
  }
  
});


const changeCurrentPassword = asyncHandler( async ( req,res )=>{

  const {oldPassword,newPassword}= req.body

  const user = await User.findById(req.user?._id)

  const isPasswordCorrect= await user.isPasswordCorrect(oldPassword)

  if(!isPasswordCorrect){
    throw new ApiError(400,"Old password is incorrect")
  }

  user.password = newPassword
  await user.save({validateBeforeSave:false})

  return res.status(200)
  .json(new ApiResponse(200,{},"Password changed successfully"))

})


const getCurrentUser = asyncHandler(async(req,res) =>{

  return res.status(200)
  .json(new ApiResponse(200,req.user,"Current user fetched successfully"))
})


const updateAccountDetails = asyncHandler(async(req,res) =>{

    const {fullName,email}= req.body

    if(!fullName && !email){
      throw new ApiError(400,"Full name and email required")
    }

   const user= await User.findByIdAndUpdate(req.user?._id,
      {
        $set:{
          fullName,
          email:email
        }
      },
      {
        new:true
      }
    ).select("-password")

    return res.status(200)
    .json(new ApiResponse(200,user,"Account details updated successfully"))
  })



const updateUserAvatar = asyncHandler(async(req,res)=>{

   const avatarLocalPath = req.file?.path

   if(!avatarLocalPath){
    throw new ApiError(400,"Avatar required")
   }

   const avatar = await uploadOnCloudinary(avatarLocalPath)

   if(!avatar.url){
    throw new ApiError(400,"Something went wrong while uploading avatar")
   }

    const user = await User.findByIdAndUpdate(
      req.user._id,
      {
        $set:{
          avatar:avatar.url
        }
      },
      {
        new:true
      }
    ).select("-password")

    return res.status(200)
    .json(new ApiResponse(200,user,"Avatar updated successfully"))
})  

const updateUserCoverImage = asyncHandler(async(req,res)=>{

  const coverImageLocalPath = req.file?.path

  if(!coverImageLocalPath){
   throw new ApiError(400,"Cover image required")
  }

  const coverImage = await uploadOnCloudinary(coverImageLocalPath)

  if(!coverImage.url){
   throw new ApiError(400,"Something went wrong while uploading cover image")
  }

    const user =await User.findByIdAndUpdate(
     req.user._id,
     {
       $set:{
         avatar:coverImage.url
       }
     },
     {
       new:true
     }
   ).select("-password")

   return res.status(200)
   .json(new ApiResponse(200,user,"Cover image updated successfully"))
}) 

const getUserChannelProfile = asyncHandler(async(req,res)=>{
  const {username}=req.params
  // const { ObjectId } = mongoose.Types;


  if(!username?.trim()){

    throw new ApiError(400,"Username required")

  }

  const channel = await User.aggregate([
    // const { ObjectId } = mongoose.Types;
    {
      $match:{
        username:username?.toLowerCase()
      }
    },
    {
      $lookup:{
        from:"subscriptions",
        localField:"_id",
        foreignField:"channel",
        as:"subscribers"
      }

    },
    {
      $lookup:{
        from:"subscriptions",
        localField:"_id",
        foreignField:"subscriber",
        as:"subscribedTo"
      }
    },
    {
      $addFields:{
        subscribersCount:{
          $size:"$subscribers"
        },
        subscribedToCount:{

          $size:"$subscribedTo"
        },


        isSubscribedToChannel: {
          $cond: {
            if: {
              $in: [mongoose.Types.ObjectId.createFromHexString(req.user?._id.toString()), "$subscribers.subscriber"]
            },
            then: true,
            else: false
          }
        }
      }
    },
    {
      $project:{
        fullName:1,
        username:1,
        subscribersCount:1,
        subscribedToCount:1,
        isSubscribedToChannel:1,
        avatar:1,
        coverImage:1,
        email:1
      }
    }
  ])
  if(!channel.length){

    throw new ApiError(404,"Channel not found")
  }
  return res.status(200)
  .json(new ApiResponse(200,channel[0],"Channel profile fetched successfully"))
})

const getWatchHistory = asyncHandler(async(req,res) =>{
  
  const user = await User.aggregate([
    {
      $match:{
        _id: new mongoose.Types.ObjectId(req.user._id)
      }
    },
    // {
    //   $addFields: {
    //     watchHistory: {
    //       $cond: {
    //         if: { $isArray: "$watchHistory" },
    //         then: "$watchHistory",
    //         else: [{ $toObjectId: "$watchHistory" }]
    //       }
    //     }
    //   }
    // },
    {
      $lookup:{
        from:"videos",
        localField:"watchHistory",
        foreignField:"_id",
        as:"watchHistory",
        pipeline:[
          {
            $lookup:{
              from:"users",
              localField:"owner",
              foreignField:"_id",
              as:"owner",
              pipeline:[
                {
                  $project:{
                    fullName:1,
                    username:1,
                    avatar:1
                  }
                }
              ]
            }
          },
          {
            $addFields:{
              owner:{
                $first:"$owner"
              }
            }
          }
        ]
      }
    }
  ])

  return res.status(200)
  .json(new ApiResponse(200,user[0].watchHistory,"Watch history fetched successfully"))
})


export {
   registerUser,
   loginUser,
   logoutUser,
   refreshAccessToken,
   changeCurrentPassword,
   getCurrentUser,
   updateAccountDetails,
   updateUserAvatar,
   updateUserCoverImage,
   getUserChannelProfile,
   getWatchHistory

 };
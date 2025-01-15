import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { User } from "../models/user.model.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import {ApiResponse} from "../utils/ApiResponse.js"

const registerUser = asyncHandler(async (req, res) => {
  //get user detail from frontend
  //validation
  //check user if user already : username and email
  //check for images, check for avtar
  //upload them to cloudnary, avtar check
  //create user object - create entry in db
  //remove password and refresh token field from response
  //check for user creation
  //return res

  const { userName, fullName, email, password } = req.body;
  //console.log(req.body)

  //validation
  if (
    [fullName, email, password, userName].some((field) => field?.trim() === "")
  ) {
    throw new ApiError(400, "All field are required");
  }
  //check user if user already : username and email
  const existedUser = User.findOne({
    $or: [{ userName }, { email }],
  });

  if (existedUser) {
    throw new ApiError(409, "user with email and username already exists");
  }
  //multer give files access
  const avatarLocalPath=req.files?.avatar[0]?.path;
  const coverImageLocalPath=req.files?.coverImage[0]?.path;
  if (avatarLocalPath) {
    throw new ApiError(400, "avtar file is required");
  }
  //upload them to cloudnary, avtar check
  const avatar = await uploadOnCloudinary(avatarLocalPath);
  const coverImage = await uploadOnCloudinary(coverImageLocalPath);
  if(!avatar){
    throw new ApiError(400, "avtar file is required");
  }

  //create user object - create entry in db
  const user = await User.create({
    fullName,
    email,
    password,
    userName:userName.toLowerCase(),
    avatar:avatar.url,
    coverImage:coverImage?.url || "",
  })

  //check for user creation
  //remove password and refresh token field from response
  const createdUser = await User.findById(user._id)
  .select("-password -refreshToken")

  if(!createdUser){
    throw new ApiError(500, "Something went wrong while registeing the user");
  }

  //return res
  return res.status(201).json(
    new ApiResponse(200,createdUser,"user register sucessfully")
  )


});

export { registerUser };

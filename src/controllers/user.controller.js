import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { User } from "../models/user.model.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import {ApiResponse} from "../utils/ApiResponse.js"

const generateAccessAndRefereshTokens = async(userId) =>{
  try {
      const user = await User.findById(userId)
      const accessToken = user.generateAccessToken()
      const refreshToken = user.generateRefreshToken()

      user.refreshToken = refreshToken
      await user.save({ validateBeforeSave: false })

      return {accessToken, refreshToken}


  } catch (error) {
      throw new ApiError(500, "Something went wrong while generating referesh and access token")
  }
}

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
  const existedUser = await User.findOne({
    $or: [{ userName }, { email }],
  });

  if (existedUser) {
    throw new ApiError(409, "user with email and username already exists");
  }
  //multer give files access
  const avatarLocalPath=req.files?.avatar[0]?.path;
  if (!avatarLocalPath) {
    throw new ApiError(400, "avtar file is required");
  }

  let coverImageLocalPath;
    if (req.files && Array.isArray(req.files.coverImage) && req.files.coverImage.length > 0) {
        coverImageLocalPath = req.files.coverImage[0].path
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

const loginUser = asyncHandler(async(req,res)=>{
  // req body => Data
  // username or email login
  // find the user
  // password check
  // create access or refresh token
  // send cookie


  // req body => Data
  const {email,userName,password} = req.body;

  // username or email login
  if (!(userName || email)) {
    throw new ApiError(400, "username or email is required")
  }
    
  // find the user 
  // custom method access by this variable 
  const existedUser = await User.findOne({
    $or: [{userName}, {email}]
  })
  
  if (!existedUser) {
    throw new ApiError(400, "user does not exist")
  }

  

  // password check
  const isPasswordValid = await existedUser.isPasswordCorrect(password)


  if (!isPasswordValid) {
    throw new ApiError(401, "password is invalid")
  }

  // create access or refresh token
  const {accessToken,refreshToken } = await generateAccessAndRefereshTokens(existedUser._id);

  // it use becauser existed user does not have refresh and access token beacause call it after 
  const loggedInUser = await User.findById(existedUser._id).select("-password -refreshToken")
  
  // send cookie
  //it modify only by server
  const options = {
    httpOnly: true,
    secure: true
  }

  return res.status(200)
  .cookie("refreshToken", refreshToken, options)
  .cookie("accessToken", accessToken, options)
  .json(
    new ApiResponse(200,{ user: loggedInUser, refreshToken, accessToken}, "user logged in successfully")
  )

})

const logoutUser = asyncHandler(async(req, res) => {
  await User.findByIdAndUpdate(
      req.user._id,
      {
          $unset: {
              refreshToken: 1 // this removes the field from document
          }
      },
      {
          new: true
      }
  )

  const options = {
      httpOnly: true,
      secure: true
  }

  return res
  .status(200)
  .clearCookie("accessToken", options)
  .clearCookie("refreshToken", options)
  .json(new ApiResponse(200, {}, "User logged Out"))
})


export { registerUser,loginUser,logoutUser };

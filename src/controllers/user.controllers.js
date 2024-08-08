import { asyncHandler } from "../utils/asycHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { User } from "../models/user.models.js";
import { uploadCLoudinary } from "../utils/cloudinary.js";
import { ApiResponse } from "../utils/apiresponse.js";
import bcrypt from "bcrypt";

const generateAccessandRefreshToken = async (user_ID) => {
  try {
    const user = await User.findById(user_ID);
    const accessToken = user.generateAccessToken();
    const refreshToken = user.generateRefreshToken();

    user.refreshToken = refreshToken;
    user.save({ validateBeforeSave: false });

    return { accessToken, refreshToken };
  } catch (error) {
    throw new ApiError(
      500,
      "Something went wrong while generating access and refresh token"
    );
  }
};

// Sign Up
const registerUser = asyncHandler(async (req, res) => {
  const { username, email, fullname, password } = req.body;
  if (
    [username, email, fullname, password].some((field) => field?.trim() === "")
  ) {
    throw new ApiError(400, "All fields are compulsory");
  }
  if (!email.includes("@")) {
    throw new ApiError(402, "Email is not correct");
  }

  const existedUser = await User.findOne({
    $or: [{ username }, { email }],
  });

  if (existedUser) {
    throw new ApiError(409, "User with username or email existed");
  }

  const avatarLocalPath = req.files?.avatar[0]?.path;
  let coverImageLocalPath;
  if (
    req.files &&
    Array.isArray(req.files.coverImage) &&
    req.files.coverImage.length > 0
  ) {
    coverImageLocalPath = req.files.coverImage[0].path;
  }

  if (!avatarLocalPath) {
    throw new ApiError(400, "Avatar File is required");
  }

  const avatar = await uploadCLoudinary(avatarLocalPath);
  const coverImage = await uploadCLoudinary(coverImageLocalPath);

  if (!avatar) {
    throw new ApiError(400, "Avatar File is required");
  }

  const user = await User.create({
    fullname,
    avatar: avatar.url,
    coverImage: coverImage?.url || "",
    email,
    password,
    username: username.toLowerCase(),
  });

  const craetedUser = await User.findById(user._id).select(
    "-password -refreshToken"
  );

  if (!craetedUser) {
    throw new ApiError(500, "Something went wrong on registering the user");
  }

  return res
    .status(201)
    .json(new ApiResponse(200, craetedUser, "User Successfully registered"));
});

//login
const loginUser = asyncHandler(async (req, res) => {
  const { username, email, password } = req.body;

  if (!username && !email) {
    throw new ApiError(400, "Username or Email is required");
  }

  const user = await User.findOne({
    $or: [{ username }, { email }],
  });

  if (!user) {
    throw new ApiError(404, "Invalid Username or Email");
  }

  const passwordValid = await user.isPasswordCorrect(password);

  if (!passwordValid) {
    throw new ApiError(401, "Invalid User Credential");
  }

  const { accessToken, refreshToken } = await generateAccessandRefreshToken(
    user._id
  );
  const logedIN = await User.findById(user._id).select(
    "-password -refreshToken"
  );
  const options = {
    httpOnly: true,
    secure: true,
  };

  res
    .status(500)
    .cookie("accessToken : ", accessToken, options)
    .cookie("refreshToken : ", refreshToken, options)
    .json(
      new ApiResponse(
        200,
        {
          user: logedIN,
          accessToken,
          refreshToken,
        },
        "User loggedIn Successfully"
      )
    );
});

const logoutUser = asyncHandler(async (req, res) => {
  await User.findByIdAndUpdate(
    res.user._id,
    {
      $set: {
        refreshToken: undefined,
      },
    },
    {
      new: true,
    }
  );
  const options = {
    httpOnly: true,
    secure: true,
  };

  return res
    .status(200)
    .clearCookie(accessToken, options)
    .cookie(refreshToken, options)
    .json(new ApiResponse(200, {}, "User LogOut Successfully"));
});
export { registerUser, loginUser, logoutUser };

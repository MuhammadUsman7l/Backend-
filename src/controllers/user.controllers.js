import { asyncHandler } from "../utils/asycHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { User } from "../models/user.models.js";
import { uploadCLoudinary } from "../utils/cloudinary.js";
import { ApiResponse } from "../utils/apiresponse.js";

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
  const coverImageLocalPath = req.files?.coverImageLocalPath[0]?.path;

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

export { registerUser };

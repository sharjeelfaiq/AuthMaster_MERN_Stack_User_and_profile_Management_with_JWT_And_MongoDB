import createError from "http-errors";
import User from "../models/user.model.js";
import UserDetails from "../models/userDetails.model.js";
import bcrypt from "bcryptjs";
import { generateAuthToken, revokeToken } from "./token.service.js";
import { sendVerificationEmail } from "./email.service.js";
import { handleError } from "../utils/utils.js";

const createUserResponse = (user, token) => ({
  firstName: user.firstName,
  lastName: user.lastName,
  email: user.email,
  token,
});

export const register = async (userData) => {
  const { email } = userData;
  try {
    const existingUser = await User.findOne({ email });
    if (existingUser) throw createError(409, "User already exists");

    const user = new User(userData);
    user.save();

    const userDetails = new UserDetails({ user: user._id });
    userDetails.save();

    const token = generateAuthToken(user);
    await sendVerificationEmail(token);

    return createUserResponse(user, token);
  } catch (error) {
    throw handleError("Failed to register user", error);
  }
};

export const login = async (email, password) => {
  try {
    const user = await User.findOne({ email });
    if (!user) throw createError(404, "User not found");

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) throw createError(401, "Invalid credentials");

    const token = generateAuthToken(user);

    return createUserResponse(user, token);
  } catch (error) {
    throw handleError("Failed to login user", error);
  }
};

export const logout = async (token) => {
  try {
    // eslint-disable-next-line no-undef
    const JWT_EXPIRATION = Number(process.env.JWT_EXPIRATION) * 1000;
    if (isNaN(JWT_EXPIRATION))
      throw createError(500, "Invalid JWT_EXPIRATION value");

    await revokeToken(token, JWT_EXPIRATION);

    return "Logout successful";
  } catch (error) {
    throw handleError("Failed to logout user", error);
  }
};

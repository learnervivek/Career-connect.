import express from "express";
import { login, logout, register, updateProfile, updateProfilePhoto } from "../controllers/user.controllers.js";
import authUser from "../middlewares/authUser.js";
import { singleUpload } from "../middlewares/multer.js";

const userRouter = express.Router()

userRouter.post("/register", singleUpload, register);
userRouter.post("/login", login)
userRouter.post("/logout", logout);
userRouter.post("/profile/update", authUser, singleUpload, updateProfile);
userRouter.post("/profile/photo", authUser, singleUpload, updateProfilePhoto);

export default userRouter;



import { Router } from "express";
import {registerUser} from"../controllers/user.controller.js"
import { upload } from "../middlewares/multer.middleware.js";

const router = Router();

//https://localhots:8000/apo/v1/users/register
//add middleware upload
router.route("/register").post(
    upload.fields([
        {name:"avatar",maxCount:1},
        {name:"coverImage",maxCount:1}
    ]),
    registerUser)

export default router
import { Router } from "express";
import {registerUser} from"../controllers/user.controller.js"

const router = Router();

//https://localhots:8000/apo/v1/users/register
router.route("/register").post(registerUser)

export default router
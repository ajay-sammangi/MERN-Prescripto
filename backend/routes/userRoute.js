import express from 'express'
import { bookAppointment, cancelAppointment, getProfile, listAppointment, loginUser, paymentRazorPay, registerUser, updateProfile, verifyRazorpay } from '../controllers/userController.js'
import authUser from '../middlewares/authUser.js'
import upload from '../middlewares/multer.js'

const userRouter= express.Router()

userRouter.post('/register',registerUser)
userRouter.post('/login',loginUser)
userRouter.get('/getProfile', authUser, getProfile)
userRouter.post('/updateProfile',upload.single('image'), authUser, updateProfile)
userRouter.post('/bookAppointment', authUser, bookAppointment)
userRouter.get('/appointments', authUser, listAppointment)
userRouter.post('/cancelAppointment', authUser, cancelAppointment)
userRouter.post('/paymentRazorpay', authUser, paymentRazorPay)
userRouter.post('/verifyRazorpay', authUser, verifyRazorpay)

export default userRouter;
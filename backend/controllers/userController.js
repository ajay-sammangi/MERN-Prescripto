import validator from 'validator'
import bcrypt from 'bcrypt'
import userModel from '../models/userModel.js'
import jwt from 'jsonwebtoken'
import {v2 as cloudinary} from 'cloudinary'
import doctorModel from '../models/doctorModel.js'
import appointmentModel from '../models/appointmentModel.js'
import razorpay from 'razorpay'

//API to register user
const registerUser= async(req,res)=>{
    try{
        const {name, email, password}= req.body

        if(!name || !email || !password){
            return res.json({success:false, message:'Missing Details'})
        }

        if(!validator.isEmail(email)){
            return res.json({success:false, message:'Enter a valid Email'})
        }
        //validating strong password
        if(password.length<8){
            return res.json({success:false, message:'Enter a strong password'})
        }

        //hashing user password
        const salt= await bcrypt.genSalt(10)
        const hashedPassword=await bcrypt.hash(password,salt)

        const userData={
            name,
            email,
            password: hashedPassword
        }
        const newUser = new userModel(userData)
        const user = await newUser.save()
        const token = jwt.sign({id:user._id},process.env.JWT_SECRET)
        return res.json({success: true,token})
    }catch(err){
        console.log(err)
        return res.json({success: false,message: err.message})
    }
}


// API for user login
const loginUser=async (req,res)=>{
    try{
        const {email,password} = req.body
        const user= await userModel.findOne({email})
        if(!user){
            return res.json({success:false, message:'User does not exist'})
        }
        const isMatch = await bcrypt.compare(password,user.password)
        if(isMatch){
            const token=jwt.sign({id:user._id},process.env.JWT_SECRET)
            return res.json({success: true,token})
        }else{
            return res.json({success: false,message: 'Invalid Credentials'})
        }
    }catch(err){
        console.log(err)
        return res.json({success: false,message: err.message})
    }
}

//API to get user profile data

const getProfile=async(req,res)=>{
    try {
        const {userId} = req.body
        const userData= await userModel.findById(userId).select('-password')
        return res.json({success:true, userData})
    } catch (err) {
        console.log(err)
        return res.json({success: false,message: err.message})
    }
}

//API to update user profile data
const updateProfile=async(req,res)=>{
    try {
        const {userId, name, phone, address, dob, gender} = req.body
        const imageFile = req.file
        if(!name || !phone || !dob || !gender){
            return res.json({success: false, message: 'Data missing'})
        }
        await userModel.findByIdAndUpdate(userId,{name,phone,address: JSON.parse(address),dob,gender })
        if(imageFile){
            //upload image to cloudinary
            const imageUpload = await cloudinary.uploader.upload(imageFile.path,{resource_type:'image'})
            const imageURL = imageUpload.secure_url

            await userModel.findByIdAndUpdate(userId,{image: imageURL})
        }
        return res.json({success: true, message:'Profile Updated'})
    } catch (err) {
        console.log(err)
        return res.json({success: false,message: err.message})
    }
}

// API to book appointment
const bookAppointment=async (req,res)=>{
    try{
        const {userId, docId, slotDate,slotTime} = req.body

        const docData = await doctorModel.findById(docId).select('-password')
        if(!docData.available){
            return res.json({success: false, message:'Doctor not available'})
        }

        let slots_booked = docData.slots_booked

        //checking for slots availability
        if(slots_booked[slotDate]){
            if(slots_booked[slotDate].includes(slotTime)){
                return res.json({success: false, message:'Slot not available'})
            }else{
                slots_booked[slotDate].push(slotTime)
            }
        }else{
            slots_booked[slotDate] =[]
            slots_booked[slotDate].push(slotTime)
        }
        const userData= await userModel.findById(userId).select('-password')
        delete docData.slots_booked

        const appointmentData ={
            userId,
            docId,
            userData,
            docData,
            amount: docData.fees,
            slotTime,
            slotDate,
            date: Date.now()
        }
        const newAppointment= new appointmentModel(appointmentData)
        await newAppointment.save()

        //save new slots data in docData
        await doctorModel.findByIdAndUpdate(docId,{
            slots_booked
        })
        return res.json({success: true, message: 'Appointment Booked'})
    }catch(err){
        console.log(err)
        return res.json({success: false,message: err.message})
    }
}

//API to get user appointments for frontend my-appointments page
const listAppointment = async(req,res)=>{
    try {
        const {userId} = req.body
        const appointments= await appointmentModel.find({userId})
        return res.json({success: true,appointments })
     } catch(err){
        console.log(err)
        return res.json({success: false,message: err.message})
    }
}

//api to cancel appointment
const cancelAppointment=async(req,res)=>{
    try {
        const {userId, appointmentId}= req.body
        const appointmentData = await appointmentModel.findById(appointmentId)
        //verify appointment user
        if(appointmentData.userId !== userId){
            return res.json({success: false,message: 'Unauthorized action' })
        }
        await appointmentModel.findByIdAndUpdate(appointmentId,{cancelled: true})

        //releasing doctor slot
        const {docId, slotDate,slotTime}= appointmentData
        const doctorData= await doctorModel.findById(docId)
        let slots_booked = doctorData.slots_booked
        slots_booked[slotDate] = slots_booked[slotDate].filter((e)=>e!=slotTime)

        await doctorModel.findByIdAndUpdate(docId,{slots_booked})
        return res.json({success: true,message: 'Appointment Cancelled' })
    } catch(err){
        console.log(err)
        return res.json({success: false,message: err.message})
    }
}

const razorpayInstance= new razorpay({
    key_id: process.env.RAZORPAY_KEY_ID,
    key_secret:  process.env.RAZORPAY_KEY_SECRET
})
//api to make payment of appointment
const paymentRazorPay = async(req,res) =>{

    try {
      const { appointmentId } = req.body;
      const appointmentData = await appointmentModel.findById(appointmentId);

      if (!appointmentData || appointmentData.cancelled) {
        return res.json({
          success: false,
          message: "Appointment cancelled or not found",
        });
      }
      //creating options for RazorPay
      const options = {
        amount: appointmentData.amount * 100,
        currency: process.env.CURRENCY,
        receipt: appointmentId,
      };
      //creation of an order
      const order =await razorpayInstance.orders.create(options);
      return res.json({ success: true, order });
    } catch (err) {
      console.log(err);
      return res.json({ success: false, message: err.message });
    }
}

//API to verify payment of razorpay
const verifyRazorpay= async(req,res)=>{
    try{
        const {razorpay_order_id}= req.body
        const orderInfo= await razorpayInstance.orders.fetch(razorpay_order_id)
        console.log(orderInfo)
        if(orderInfo.status == 'paid'){
            await appointmentModel.findByIdAndUpdate(orderInfo.receipt,{payment: true})
            return res.json({success: true, message: "Payment Successful"})
        }else{
            return res.json({ success: false, message: "Payment failed" });
        }
    }catch(err){
        console.log(err);
      return res.json({ success: false, message: err.message });
    }
}
export {registerUser, loginUser, getProfile, updateProfile, bookAppointment, listAppointment, cancelAppointment, paymentRazorPay, verifyRazorpay}
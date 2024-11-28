import doctorModel from "../models/doctorModel.js"
import bcrtpt from 'bcrypt'
import jwt from 'jsonwebtoken'
import appointmentModel from "../models/appointmentModel.js"
const changeAvailability= async(req,res) =>{
    try{
        const {docId} = req.body
        const docData = await doctorModel.findById(docId)
        await doctorModel.findByIdAndUpdate(docId,{available: !docData.available})
        return res.json({success: true,message: 'Availablity change successful'})
    }catch(err){
        return res.json({success: false,message: err.message})
    }
}

const doctorList=async(req,res)=>{
    try{
        const doctors= await doctorModel.find({}).select(['-password','-email'])
        return res.json({success:true,doctors:doctors})
    }catch(err){
        console.log(err)
         return res.json({success: false,message: err.message})
    }
}

//API for doctor login
const loginDoctor= async(req,res)=>{
    try {
        const {email, password} = req.body
        console.log(req.body)
        const doctor = await doctorModel.findOne({email})
        console.log(doctor,"doctorrrr")
        if(!doctor){
            return res.json({success: false,message: "Invalid Credentials"})
        }
        const isMatch = await bcrtpt.compare(password,doctor.password)
        if(isMatch){
            const token = jwt.sign({id:doctor._id}, process.env.JWT_SECRET)
            return res.json({success: true, token})
        }else{
            return res.json({success: false,message: "Invalid Credentials"})
        }
    }catch(err){
        console.log(err)
        return res.json({success: false,message: err.message})
    }
}

//API to get doctor appointments
const appointmentsDoctor= async(req,res)=>{
    try {
        const {docId} = req.body
        const appointments= await appointmentModel.find({docId})
        
        return res.json({success: true, appointments})
    } catch(err){
        console.log(err)
        return res.json({success: false,message: err.message})
    }
}

//API to mark appointment completed for doctor panel
const appointmentComplete= async(req,res)=>{
    try {
        const {docId,appointmentId} = req.body
        const appointmentData= await appointmentModel.findById(appointmentId)
        if(appointmentData && appointmentData.docId == docId){
            await appointmentModel.findByIdAndUpdate(appointmentId,{isCompleted: true})
            return res.json({success: true, message: 'Appointment completed'})
        }else{
            return res.json({success: false,message: "Mark Failed"})
        }
    } catch(err){
        console.log(err)
        return res.json({success: false,message: err.message})
    }
}

//API to cancel appointment completed for doctor panel
const appointmentCancel= async(req,res)=>{
    try {
        const {docId,appointmentId} = req.body
        const appointmentData= await appointmentModel.findById(appointmentId)
        if(appointmentData && appointmentData.docId == docId){
            await appointmentModel.findByIdAndUpdate(appointmentId,{cancelled: true})
            return res.json({success: true, message: 'Appointment cancelled'})
        }else{
            return res.json({success: false,message: "Cancellation Failed"})
        }
    } catch(err){
        console.log(err)
        return res.json({success: false,message: err.message})
    }
}

//API to get Dahboard data for doctor panel
const doctorDashboard= async(req,res)=>{
    try {
        const {docId} = req.body
        const appointments = await appointmentModel.find({docId})

        let earnings= 0

        appointments.map((item)=>{
            if(item.isCompleted || item.payment){
                earnings+=item.amount
            }
        })
        let patients =[]

        appointments.map((item)=>{
            if(!patients.includes(item.userId)){
                patients.push(item.userId)
            }
        })

        const dashData={
            earnings,
            appointments:appointments.length,
            patients: patients.length,
            latestAppointments: appointments.reverse().slice(0,5)
        }
        return res.json({success: true, dashData})
    }catch(err){
        console.log(err)
        return res.json({success: false,message: err.message})
    }
}

//API to get doctor profile for Doctor Panel
const doctorProfile= async(req,res)=>{
    try {
        const {docId}= req.body
        console.log(req.body)
        const profileData= await doctorModel.findById(docId).select('-password')
        
        return res.json({success: true, profileData})

    } catch(err){
        console.log(err)
        return res.json({success: false,message: err.message})
    }
}

//API to update doctor profile data from doctor panel
const updateDoctorProfile= async(req,res)=>{
    try {
        const { docId, fees, address, available} = req.body
        await doctorModel.findByIdAndUpdate(docId,{
            fees,address,available
        })
        return res.json({success: true, message: 'Profile Updated'})
    } catch(err){
        console.log(err)
        return res.json({success: false,message: err.message})
    }
}
export {changeAvailability, doctorList, loginDoctor, appointmentsDoctor, appointmentComplete, appointmentCancel, doctorDashboard,doctorProfile, updateDoctorProfile}
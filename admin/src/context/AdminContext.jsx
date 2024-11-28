import { useState } from "react";
import { createContext } from "react";
import axios from 'axios'
import {toast} from 'react-toastify'
export const AdminContext=createContext()

const AdminContextProvider= (props)=>{
    const [aToken,setAToken]=useState(localStorage.getItem('aToken')? localStorage.getItem('aToken'):'')
    const backendUrl = import.meta.env.VITE_BACKEND_URL
    const [doctors,setDoctors]= useState([])
    const [appointments,setAppointments]=useState([])
    const [dashData,setDashData] = useState(false)
    const getAllDoctors=async()=>{
        try{
            const {data} = await axios.post(backendUrl+'/api/admin/all-doctors',{},{
                headers:{
                    aToken: aToken
                }
            })
            if(data.success){
                setDoctors(data.doctors)
                console.log(data.doctors)
            }else{
                toast.error(data.message)
            }
        }catch(err){
            toast.error(err.message)
            console.log(err.message)
        }
    }

    const changeAvilability=async(docId)=>{
        try{
          const {data} = await axios.post(backendUrl+'/api/admin/change-availability',{docId},{
            headers:{
              aToken
            }
          })
          if(data.success){
            getAllDoctors()
            toast.success(data.message)
          }else{
            toast.error(data.message)
          }
        }catch(err){
          toast.error(err.message)
        }
      }

    const getAllAppointments= async()=>{
      try {
        const {data}= await axios.get(backendUrl+'/api/admin/appointments',{headers:{aToken}})
        if(data.success){
          setAppointments(data.appointments)
          console.log(data.appointments,"appointments")
        }else{
          toast.error(data.message)
        }
      } catch(err){
        toast.error(err.message)
        console.log(err.message)
    }
    }

    const cancelAppointment = async(appointmentId)=>{
      try {
        const {data} = await axios.post(backendUrl+'/api/admin/cancel-appointment',{appointmentId},{
          headers:{aToken}
        })
        if(data.success){
          toast.success(data.message)
          getAllAppointments()
        }else{
          toast.error(data.message)
        }
      } catch(err){
        toast.error(err.message)
        console.log(err.message)
    }
    }

    const getDashData=async()=>{
      try {
          const {data}= await axios.get(backendUrl+'/api/admin/dashboard',{headers:{aToken}})
          if(data.success){
            setDashData(data.dashData)
            console.log(data.dashData)
          }else{
            toast.error(data.message)
          }
      } catch(err){
        toast.error(err.message)
        console.log(err.message)
    }
    }

    const value={
        aToken,
        setAToken,
        backendUrl,
        getAllDoctors,
        doctors,
        changeAvilability,
        getAllAppointments,
        appointments,
        setAppointments,
        cancelAppointment,
        getDashData,
        dashData
    }
    return(
        <AdminContext.Provider value={value}>
            {props?.children}
        </AdminContext.Provider>
    )
}



export default AdminContextProvider;

 
import {io} from 'socket.io-client'
import { useEffect,useState } from 'react'

function App() {
const [socketStatus,setsocketStatus]= useState('disconnected')
const [mess,setMess]= useState('')
useEffect(()=>{
  const socket= io('http://localhost:3000')
  socket.on('connect', () => {
    setsocketStatus('Connected');
  });

  socket.on('disconnect', () => {
    setsocketStatus('Disconnected');
  });

  socket.on('message', (msg) => {
    setMess(msg);
  });

  return () => {
    socket.disconnect(); // Cleanup
  };
},[])
  return (
    <>
    {socketStatus}
    {mess}
     hello world
    </>
  )
}

export default App

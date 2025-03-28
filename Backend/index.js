  const express= require('express')
const cors= require('cors')
const socketserver= require('socket.io')
  const app= express()

  app.use(cors())

  app.use(express.json())

  app.get('/',(req,res)=>{
    res.send("hello")
  })

const server=   app.listen(3000,()=>{})
  const io= socketserver(server)

  io.on('connection',(socket)=>{
    console.log("user connected")
    socket.emit('message', 'Hello from the server!');
    socket.on('disconnect', () => {
      console.log('A user disconnected');
    });
  })


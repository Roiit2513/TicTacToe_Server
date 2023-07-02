const express = require("express");
const http = require("http");
const cors = require("cors");
const { Server } = require("socket.io");

const mongoose = require("mongoose");
mongoose.set('strictQuery', true);
mongoose.connect("mongodb+srv://Roiit_2513:Rohit_2513@cluster0.uaqm8fk.mongodb.net/roomDB", { useNewUrlParser: true, useUnifiedTopology: true });
// mongoose.connect("mongodb://127.0.0.1:27017/fruitsDB", { useNewUrlParser: true, useUnifiedTopology: true });

const userSchema = mongoose.Schema({
    RoomId: {
        type: String,
        required: [true, "enter userId"]
    },
    User1: { type: String },
    User2: { type: String },
    NumUsers: {
        type: Number,
        required: true
    }
});
const Room = mongoose.model("Room", userSchema);

const app = express();
app.use(cors());

const server = http.createServer(app);
const io = new Server(server, {
    cors: {
        origin: "http://localhost:3000",
        methods: ["GET", "POST"],
    }
})

io.on("connection", (socket) => {
    console.log(`User connected: ${socket.id}`);

    socket.on("join_room", (data) => {
        Room.find({ RoomId: data.roomId }, (err, room) => {
            if (err) {
                console.log(err);
                console.log("No such room present, Create new Room");
            } else {
                if (room[0].NumUsers < 2) {
                    console.log("User 2 is : ", data.username);
                    Room.updateOne({ _id: room[0]._id }, { User2: data.username, NumUsers: 2 }, (err) => {
                        if (err) {
                            console.log(err);
                        } else {
                            console.log("updtaet donneee");
                        }
                    });

                } else {
                    console.log("Room already filled");
                }
            }
        })
    });
    socket.on("handle_join", (data) => {
        Room.find({ RoomId: data.roomId }, (err, room) => {
            if (err) {
                console.log(err);
                console.log("No such room present, Create new Room");
            } else {
                console.log(room[0]);
                socket.join(data.roomId);
                console.log(`User with id : ${socket.id} joined room ${data.roomId}`);
                io.to(data.roomId).emit("room_joined", room[0]);
            }
        })
    });
    socket.on("send_message", (data) => {
        console.log(data);
        socket.to(data.roomId).emit("receive_message", data);
    });
    socket.on("send_gameData", (data) => {
        console.log(data);
        io.to(data.roomId).emit("receive_gameData", data);
    });
    socket.on("create_room", (username) => {
        let newRoomId = "";
        const alphabets = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i', 'j', 'k', 'l', 'm', 'n', 'o', 'p', 'q', 'r', 's', 't', 'u', 'v', 'w', 'x', 'y', 'z'];
        for (let i = 0; i < 5; i++) {
            newRoomId += alphabets[Math.floor(Math.random() * 10000) % 25];
        }
        const createRoom = new Room({
            RoomId: newRoomId,
            User1: username,
            Id_user1: socket.id,
            Id_user2: "",
            User2: "",
            NumUsers: 1
        })
        Room.insertMany([createRoom], (err) => {
            console.log(err);
        })
        socket.join(newRoomId);
        console.log(`User with id : ${socket.id} joined room ${newRoomId}`);
        io.to(socket.id).emit("room_created", newRoomId);
    });
    socket.on("disconnect", () => {
        console.log("User disconnected", socket.id);
    });
});

const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
    console.log("runninggg on port : ", PORT)
});
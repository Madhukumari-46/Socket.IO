import { Server } from "socket.io"
import jwt from "jsonwebtoken"

// Map of socket.id -> userName
const activeSockets = new Map()

export function getOnlineUsers() {
    return Array.from(new Set(activeSockets.values()))
}

function initializeSocket(httpServer) {
    const io = new Server(httpServer, {
        cors: {
            origin: "*",
            methods: ["GET", "POST"]
        }
    })

    // Authentication middleware
    io.use((socket, next) => {
        const token = socket.handshake.auth?.token || socket.handshake.headers?.token
        if (!token) {
            return next(new Error("Authentication token is required"))
        }

        const secret = process.env.JWT_SECRET || "default_jwt_secret"
        try {
            const decoded = jwt.verify(token, secret)
            socket.user = decoded
            next()
        } catch (err) {
            return next(new Error("Invalid or expired authentication token"))
        }
    })

    io.on("connection", (socket) => {
        const userName = socket.user?.name
        console.log(`User connected: ${userName} (Socket: ${socket.id})`)

        const wasOnline = Array.from(activeSockets.values()).includes(userName)
        activeSockets.set(socket.id, userName)

        // Only broadcast online if this is the user's first active tab/connection
        if (!wasOnline) {
            socket.broadcast.emit("online", { name: userName })
        }

        socket.on("message", (message) => {
            if (typeof message === "string" && message.trim() !== "") {
                socket.broadcast.emit("message", {
                    name: userName,
                    message: message.trim()
                })
            }
        })

        socket.on("disconnect", () => {
            console.log(`User disconnected: ${userName} (Socket: ${socket.id})`)
            activeSockets.delete(socket.id)

            // Only broadcast offline if the user has no remaining active connections
            const isStillOnline = Array.from(activeSockets.values()).includes(userName)
            if (!isStillOnline) {
                socket.broadcast.emit("offline", { name: userName })
            }
        })
    })

    return io
}

// Keep export for backward compatibility
export const users = getOnlineUsers()
export default initializeSocket
import { io } from "socket.io-client"

let socket = null

export function initializeSocket(token) {
    if (socket) {
        socket.disconnect()
    }

    // Connect to backend server on port 3000 with auth payload
    socket = io("http://localhost:3000", {
        auth: {
            token: token
        },
        extraHeaders: {
            token: token
        }
    })

    return socket
}

export function getSocket() {
    return socket
}

export function listenToOnlineEvent(callback) {
    if (!socket) return () => {}
    socket.on("online", callback)
    return () => socket?.off("online", callback)
}

export function listenToOfflineEvent(callback) {
    if (!socket) return () => {}
    socket.on("offline", callback)
    return () => socket?.off("offline", callback)
}

export function listenToMessageEvent(callback) {
    if (!socket) return () => {}
    socket.on("message", callback)
    return () => socket?.off("message", callback)
}

export function emitMessage(message) {
    if (socket) {
        socket.emit("message", message)
    }
}

export function disconnectSocket() {
    if (socket) {
        socket.disconnect()
        socket = null
    }
}
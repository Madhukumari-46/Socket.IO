import "dotenv/config"
import { createServer } from "node:http"
import app from "./app/app.js"
import initializeSocket from "./sockets/server.socket.js"

const PORT = process.env.PORT || 3000
const httpServer = createServer(app)

initializeSocket(httpServer)

httpServer.listen(PORT, () => {
    console.log(`Server is listening on port ${PORT}`)
})
import { Router } from "express"
import jwt from "jsonwebtoken"
import { getOnlineUsers } from "../sockets/server.socket.js"

const router = Router()

router.post("/join", (req, res) => {
    try {
        const { name } = req.body
        if (!name || typeof name !== "string" || name.trim() === "") {
            return res.status(400).json({ error: "Name must be a non-empty string" })
        }

        const trimmedName = name.trim()
        const secret = process.env.JWT_SECRET || "default_jwt_secret"
        const token = jwt.sign({ name: trimmedName }, secret)

        return res.status(200).json({ token, name: trimmedName })
    } catch (err) {
        return res.status(500).json({ error: "Failed to generate token" })
    }
})

router.get("/users", (req, res) => {
    return res.status(200).json({ users: getOnlineUsers() })
})

export default router
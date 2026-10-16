import React, { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router'
import {
    initializeSocket,
    listenToOnlineEvent,
    listenToOfflineEvent,
    listenToMessageEvent,
    emitMessage,
    disconnectSocket
} from '../sockets/index.socket'
import axios from 'axios'

const Chat = () => {
    const navigate = useNavigate()
    const [users, setUsers] = useState([])
    const [messages, setMessages] = useState([])
    const [message, setMessage] = useState('')
    const [currentUser, setCurrentUser] = useState('')
    const messagesEndRef = useRef(null)

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
    }

    useEffect(() => {
        scrollToBottom()
    }, [messages])

    useEffect(() => {
        const token = localStorage.getItem('token')
        const savedUserName = localStorage.getItem('userName') || 'Anonymous'

        if (!token) {
            navigate('/join')
            return
        }

        setCurrentUser(savedUserName)

        async function fetchUsers() {
            try {
                const response = await axios.get('/api/chat/users')
                if (Array.isArray(response.data.users)) {
                    setUsers(response.data.users)
                }
            } catch (err) {
                console.error('Failed to fetch online users:', err)
            }
        }

        fetchUsers()
        initializeSocket(token)

        const cleanupOnline = listenToOnlineEvent((user) => {
            if (user?.name) {
                setUsers((prevUsers) => Array.from(new Set([...prevUsers, user.name])))
            }
        })

        const cleanupOffline = listenToOfflineEvent((user) => {
            if (user?.name) {
                setUsers((prevUsers) => prevUsers.filter((u) => u !== user.name))
            }
        })

        const cleanupMessage = listenToMessageEvent((incomingMsg) => {
            setMessages((prevMessages) => [...prevMessages, incomingMsg])
        })

        return () => {
            cleanupOnline?.()
            cleanupOffline?.()
            cleanupMessage?.()
            disconnectSocket()
        }
    }, [navigate])

    const handleSendMessage = () => {
        const trimmedMessage = message.trim()
        if (trimmedMessage === '') return

        emitMessage(trimmedMessage)
        setMessages((prevMessages) => [
            ...prevMessages,
            { name: currentUser, message: trimmedMessage, isMe: true }
        ])
        setMessage('')
    }

    const handleLogout = () => {
        disconnectSocket()
        localStorage.removeItem('token')
        localStorage.removeItem('userName')
        navigate('/join')
    }

    return (
        <main className="h-screen w-screen flex bg-slate-950 text-slate-100 overflow-hidden">
            {/* Chat Area */}
            <section className="flex-1 flex flex-col h-full bg-slate-900 border-r border-slate-800">
                {/* Header */}
                <header className="h-16 px-6 border-b border-slate-800 flex items-center justify-between bg-slate-900/60 backdrop-blur-md">
                    <div className="flex items-center gap-3">
                        <div className="w-3 h-3 rounded-full bg-emerald-500 animate-pulse" />
                        <h1 className="font-semibold text-lg text-white">General Room</h1>
                    </div>
                    <div className="flex items-center gap-3">
                        <span className="text-xs text-slate-400">
                            Logged in as <strong className="text-indigo-400">{currentUser}</strong>
                        </span>
                        <button
                            onClick={handleLogout}
                            className="text-xs px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-red-500/20 hover:text-red-400 border border-slate-700 hover:border-red-500/30 transition-all cursor-pointer"
                        >
                            Leave Room
                        </button>
                    </div>
                </header>

                {/* Messages List */}
                <div className="flex-1 overflow-y-auto p-6 space-y-4">
                    {messages.length === 0 ? (
                        <div className="h-full flex flex-col items-center justify-center text-slate-500">
                            <svg className="w-12 h-12 mb-2 stroke-current opacity-40" fill="none" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                            </svg>
                            <p className="text-sm">No messages yet. Say hello to everyone!</p>
                        </div>
                    ) : (
                        messages.map((msg, index) => {
                            const isMe = msg.isMe || msg.name === currentUser
                            return (
                                <div
                                    key={index}
                                    className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}
                                >
                                    <span className="text-[11px] text-slate-400 mb-1 px-1">
                                        {isMe ? 'You' : msg.name}
                                    </span>
                                    <div
                                        className={`max-w-md px-4 py-2.5 rounded-2xl text-sm leading-relaxed ${
                                            isMe
                                                ? 'bg-indigo-600 text-white rounded-br-xs'
                                                : 'bg-slate-800 text-slate-200 border border-slate-700/80 rounded-bl-xs'
                                        }`}
                                    >
                                        {msg.message}
                                    </div>
                                </div>
                            )
                        })
                    )}
                    <div ref={messagesEndRef} />
                </div>

                {/* Input Bar */}
                <div className="p-4 border-t border-slate-800 bg-slate-900/80">
                    <form
                        onSubmit={(e) => {
                            e.preventDefault()
                            handleSendMessage()
                        }}
                        className="flex gap-2"
                    >
                        <input
                            type="text"
                            placeholder="Type your message..."
                            value={message}
                            onChange={(e) => setMessage(e.target.value)}
                            className="flex-1 px-4 py-3 rounded-xl bg-slate-800 border border-slate-700 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                        />
                        <button
                            type="submit"
                            disabled={!message.trim()}
                            className="px-6 py-3 rounded-xl font-semibold text-white bg-indigo-600 hover:bg-indigo-500 active:bg-indigo-700 disabled:opacity-40 disabled:cursor-not-allowed shadow-md shadow-indigo-600/20 transition-all cursor-pointer"
                        >
                            Send
                        </button>
                    </form>
                </div>
            </section>

            {/* Sidebar: Online Users */}
            <aside className="w-80 h-full bg-slate-950 flex flex-col">
                <div className="h-16 px-6 border-b border-slate-800 flex items-center justify-between">
                    <h2 className="font-semibold text-sm uppercase tracking-wider text-slate-300">
                        Online Users ({users.length})
                    </h2>
                </div>
                <div className="flex-1 overflow-y-auto p-4 space-y-1">
                    {users.length === 0 ? (
                        <p className="text-xs text-slate-500 px-2 py-4">No other users online</p>
                    ) : (
                        users.map((userName, index) => {
                            const isMe = userName === currentUser
                            return (
                                <div
                                    key={index}
                                    className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-colors ${
                                        isMe ? 'bg-slate-900/80 text-indigo-400 font-medium' : 'text-slate-300 hover:bg-slate-900/50'
                                    }`}
                                >
                                    <div className="relative">
                                        <div className="w-8 h-8 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-xs font-semibold uppercase text-slate-300">
                                            {userName.charAt(0)}
                                        </div>
                                        <div className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-emerald-500 border-2 border-slate-950" />
                                    </div>
                                    <span className="truncate">
                                        {userName} {isMe ? '(You)' : ''}
                                    </span>
                                </div>
                            )
                        })
                    )}
                </div>
            </aside>
        </main>
    )
}

export default Chat
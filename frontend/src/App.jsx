import { useEffect, useRef, useState } from 'react';
import { connectWS } from './ws';

export default function App() {
    const timer = useRef(null);
    const socket = useRef(null);
    const messagesEndRef = useRef(null);
    const [userName, setUserName] = useState('');
    const [showNamePopup, setShowNamePopup] = useState(true);
    const [inputName, setInputName] = useState('');
    const [typers, setTypers] = useState([]);
    const [onlineUsers, setOnlineUsers] = useState(1);
    const [isConnected, setIsConnected] = useState(false);
    const [connectionError, setConnectionError] = useState(false);

    const [messages, setMessages] = useState([]);
    const [text, setText] = useState('');

    // Auto scroll to bottom
    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    useEffect(() => {
        if (!socket.current) {
            socket.current = connectWS();

            socket.current.on('connect', () => {
                console.log('Connected to server');
                setIsConnected(true);
                setConnectionError(false);
            });

            socket.current.on('disconnect', () => {
                console.log('Disconnected from server');
                setIsConnected(false);
            });

            socket.current.on('connect_error', (error) => {
                console.error('Connection error:', error);
                setConnectionError(true);
                setIsConnected(false);
            });

            socket.current.on('roomNotice', (userName) => {
                console.log(`${userName} joined to group!`);
                setOnlineUsers(prev => prev + 1);
                
                // Add system message
                const systemMsg = {
                    id: Date.now() + Math.random(),
                    sender: 'System',
                    text: `${userName} joined the chat`,
                    ts: Date.now(),
                    isSystem: true
                };
                setMessages(prev => [...prev, systemMsg]);
            });

            socket.current.on('chatMessage', (msg) => {
                setMessages((prev) => [...prev, msg]);
            });

            socket.current.on('typing', (userName) => {
                setTypers((prev) => {
                    const isExist = prev.find((typer) => typer === userName);
                    if (!isExist) {
                        return [...prev, userName];
                    }
                    return prev;
                });
            });

            socket.current.on('stopTyping', (userName) => {
                setTypers((prev) => prev.filter((typer) => typer !== userName));
            });
        }

        return () => {
            if (socket.current) {
                socket.current.off('connect');
                socket.current.off('disconnect');
                socket.current.off('connect_error');
                socket.current.off('roomNotice');
                socket.current.off('chatMessage');
                socket.current.off('typing');
                socket.current.off('stopTyping');
            }
        };
    }, []);

    useEffect(() => {
        if (text && userName && socket.current?.connected) {
            socket.current.emit('typing', userName);
            
            clearTimeout(timer.current);
            timer.current = setTimeout(() => {
                if (userName && socket.current?.connected) {
                    socket.current.emit('stopTyping', userName);
                }
            }, 1000);
        }

        return () => {
            clearTimeout(timer.current);
        };
    }, [text, userName]);

    function formatTime(ts) {
        const d = new Date(ts);
        const hh = String(d.getHours()).padStart(2, '0');
        const mm = String(d.getMinutes()).padStart(2, '0');
        return `${hh}:${mm}`;
    }

    function getInitials(name) {
        if (!name) return '?';
        return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
    }

    function getAvatarColor(name) {
        if (!name) return 'bg-gray-500';
        const colors = [
            'bg-blue-500', 'bg-green-500', 'bg-purple-500', 'bg-pink-500',
            'bg-indigo-500', 'bg-red-500', 'bg-yellow-500', 'bg-teal-500'
        ];
        const index = name.charCodeAt(0) % colors.length;
        return colors[index];
    }

    function handleNameSubmit(e) {
        e.preventDefault();
        const trimmed = inputName.trim();
        if (!trimmed) return;

        if (socket.current?.connected) {
            socket.current.emit('joinRoom', trimmed);
            setUserName(trimmed);
            setShowNamePopup(false);
            
            // Add welcome message
            const welcomeMsg = {
                id: Date.now() + Math.random(),
                sender: 'System',
                text: `Welcome to the chat, ${trimmed}! 👋`,
                ts: Date.now(),
                isSystem: true
            };
            setMessages([welcomeMsg]);
        } else {
            alert('Not connected to server. Please try again.');
        }
    }

    function sendMessage() {
        const t = text.trim();
        if (!t || !socket.current?.connected) return;

        const msg = {
            id: Date.now() + Math.random(),
            sender: userName,
            text: t,
            ts: Date.now(),
        };
        setMessages((m) => [...m, msg]);
        socket.current.emit('chatMessage', msg);
        setText('');
    }

    function handleKeyDown(e) {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            sendMessage();
        }
    }

    function handleTextareaInput(e) {
        setText(e.target.value);
        // Auto-resize textarea
        e.target.style.height = 'auto';
        e.target.style.height = Math.min(e.target.scrollHeight, 128) + 'px';
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 p-4 font-sans">
            {/* Background Pattern */}
            <div className="fixed inset-0 opacity-10 pointer-events-none">
                <div className="absolute inset-0 bg-[url('data:image/svg+xml,%3Csvg width="60" height="60" viewBox="0 0 60 60" xmlns="http://www.w3.org/2000/svg"%3E%3Cg fill="none" fill-rule="evenodd"%3E%3Cg fill="%239C92AC" fill-opacity="0.4"%3E%3Ccircle cx="30" cy="30" r="1.5"/%3E%3C/g%3E%3C/g%3E%3C/svg%3E')]"></div>
            </div>

            {/* Name Entry Modal */}
            {showNamePopup && (
                <div className="fixed inset-0 flex items-center justify-center z-50 backdrop-blur-sm bg-black/50">
                    <div className="bg-white/95 backdrop-blur-xl rounded-2xl shadow-2xl max-w-md w-full mx-4 p-8 border border-white/20">
                        <div className="text-center mb-6">
                            <div className="w-16 h-16 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full mx-auto mb-4 flex items-center justify-center">
                                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                                </svg>
                            </div>
                            <h1 className="text-2xl font-bold text-gray-800 mb-2">Join the Conversation</h1>
                            <p className="text-gray-600">Enter your name to start chatting with others</p>
                            
                            {connectionError && (
                                <div className="mt-4 p-3 bg-red-100 border border-red-300 rounded-lg">
                                    <p className="text-red-700 text-sm">Connection failed. Please check your internet connection.</p>
                                </div>
                            )}
                            
                            {!isConnected && !connectionError && (
                                <div className="mt-4 p-3 bg-yellow-100 border border-yellow-300 rounded-lg">
                                    <p className="text-yellow-700 text-sm">Connecting to server...</p>
                                </div>
                            )}
                        </div>
                        
                        <form onSubmit={handleNameSubmit} className="space-y-4">
                            <div className="relative">
                                <input
                                    autoFocus
                                    value={inputName}
                                    onChange={(e) => setInputName(e.target.value)}
                                    className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 text-lg outline-none focus:border-purple-500 focus:ring-4 focus:ring-purple-500/20 transition-all duration-200 placeholder-gray-400"
                                    placeholder="Your display name"
                                    maxLength={30}
                                />
                                <div className="absolute inset-y-0 right-0 flex items-center pr-3">
                                    <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                    </svg>
                                </div>
                            </div>
                            
                            <button
                                type="submit"
                                disabled={!inputName.trim() || !isConnected}
                                className="w-full bg-gradient-to-r from-purple-500 to-pink-500 text-white font-semibold py-3 px-6 rounded-xl hover:from-purple-600 hover:to-pink-600 focus:ring-4 focus:ring-purple-500/20 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed transform hover:scale-[1.02] active:scale-[0.98]">
                                {isConnected ? 'Start Chatting' : 'Connecting...'}
                            </button>
                        </form>
                    </div>
                </div>
            )}

            {/* Main Chat Interface */}
            {!showNamePopup && (
                <div className="max-w-4xl mx-auto h-[95vh] flex flex-col">
                    {/* Chat Container */}
                    <div className="bg-white/10 backdrop-blur-xl rounded-2xl shadow-2xl border border-white/20 flex flex-col h-full overflow-hidden">
                        {/* Header */}
                        <div className="bg-gradient-to-r from-purple-600/20 to-pink-600/20 backdrop-blur-xl border-b border-white/10 p-6">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center space-x-4">
                                    <div className="relative">
                                        <div className="w-12 h-12 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center text-white font-bold text-lg shadow-lg">
                                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8h2a2 2 0 012 2v6a2 2 0 01-2 2h-2v4l-4-4H9a1.994 1.994 0 01-2-2V10a2 2 0 012-2h2m2-4h6a2 2 0 012 2v6a2 2 0 01-2 2h-6l-4 4V8a2 2 0 012-2z" />
                                            </svg>
                                        </div>
                                        <div className={`absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 border-white transition-colors duration-300 ${isConnected ? 'bg-green-500' : 'bg-red-500'}`}></div>
                                    </div>
                                    
                                    <div>
                                        <h1 className="text-xl font-bold text-white">Global Chat</h1>
                                        <div className="flex items-center space-x-4 text-sm">
                                            <span className="text-white/70 flex items-center">
                                                <div className={`w-2 h-2 rounded-full mr-2 transition-colors duration-300 ${isConnected ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`}></div>
                                                {isConnected ? `${onlineUsers} online` : 'Disconnected'}
                                            </span>
                                            {typers.length > 0 && (
                                                <span className="text-purple-300 flex items-center animate-pulse">
                                                    <div className="flex space-x-1 mr-2">
                                                        <div className="w-1 h-1 bg-purple-400 rounded-full animate-bounce"></div>
                                                        <div className="w-1 h-1 bg-purple-400 rounded-full animate-bounce" style={{animationDelay: '0.1s'}}></div>
                                                        <div className="w-1 h-1 bg-purple-400 rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
                                                    </div>
                                                    {typers.slice(0, 2).join(', ')}{typers.length > 2 ? ` and ${typers.length - 2} others` : ''} typing...
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                </div>
                                
                                <div className="flex items-center space-x-3">
                                    <div className="text-right">
                                        <div className="text-white font-medium truncate max-w-32">{userName}</div>
                                        <div className="text-white/60 text-sm">You</div>
                                    </div>
                                    <div className={`w-10 h-10 ${getAvatarColor(userName)} rounded-full flex items-center justify-center text-white font-semibold shadow-lg`}>
                                        {getInitials(userName)}
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Messages Area */}
                        <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-gradient-to-b from-transparent to-black/5 custom-scrollbar">
                            {messages.length === 0 && (
                                <div className="text-center py-12">
                                    <div className="w-16 h-16 bg-white/10 rounded-full mx-auto mb-4 flex items-center justify-center">
                                        <svg className="w-8 h-8 text-white/50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                                        </svg>
                                    </div>
                                    <p className="text-white/60">No messages yet. Start the conversation!</p>
                                </div>
                            )}
                            
                            {messages.map((m, index) => {
                                const mine = m.sender === userName;
                                const isSystem = m.isSystem;
                                const showAvatar = !mine && !isSystem && (index === 0 || messages[index - 1].sender !== m.sender);
                                
                                if (isSystem) {
                                    return (
                                        <div key={m.id} className="flex justify-center message-enter">
                                            <div className="bg-white/10 backdrop-blur-sm text-white/70 px-4 py-2 rounded-full text-sm border border-white/10">
                                                {m.text}
                                            </div>
                                        </div>
                                    );
                                }
                                
                                return (
                                    <div key={m.id} className={`flex ${mine ? 'justify-end' : 'justify-start'} group message-enter`}>
                                        <div className={`flex items-end space-x-2 max-w-[75%] ${mine ? 'flex-row-reverse space-x-reverse' : ''}`}>
                                            {!mine && (
                                                <div className={`w-8 h-8 ${getAvatarColor(m.sender)} rounded-full flex items-center justify-center text-white text-xs font-semibold flex-shrink-0 transition-opacity duration-200 ${showAvatar ? 'opacity-100' : 'opacity-0'}`}>
                                                    {getInitials(m.sender)}
                                                </div>
                                            )}
                                            
                                            <div className={`relative px-4 py-3 rounded-2xl shadow-lg backdrop-blur-sm border transition-all duration-200 hover:scale-[1.02] ${
                                                mine 
                                                    ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white border-white/20 rounded-br-md' 
                                                    : 'bg-white/90 text-gray-800 border-white/30 rounded-bl-md'
                                            }`}>
                                                <div className="break-words whitespace-pre-wrap leading-relaxed">
                                                    {m.text}
                                                </div>
                                                
                                                <div className={`flex items-center justify-between mt-2 gap-3 text-xs ${mine ? 'text-white/80' : 'text-gray-500'}`}>
                                                    {!mine && <span className="font-medium truncate max-w-24">{m.sender}</span>}
                                                    <span className="opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                                                        {formatTime(m.ts)}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                            <div ref={messagesEndRef} />
                        </div>

                        {/* Input Area */}
                        <div className="p-6 bg-white/5 backdrop-blur-xl border-t border-white/10">
                            <div className="flex items-end space-x-4">
                                <div className="flex-1 relative">
                                    <textarea
                                        rows={1}
                                        value={text}
                                        onChange={handleTextareaInput}
                                        onKeyDown={handleKeyDown}
                                        placeholder={isConnected ? "Type your message..." : "Connecting..."}
                                        disabled={!isConnected}
                                        className="w-full resize-none bg-white/90 backdrop-blur-sm border border-white/20 rounded-2xl px-4 py-3 pr-12 text-gray-800 placeholder-gray-500 outline-none focus:ring-4 focus:ring-purple-500/20 focus:border-purple-500/50 transition-all duration-200 max-h-32 disabled:opacity-50 disabled:cursor-not-allowed"
                                        style={{
                                            minHeight: '48px',
                                            height: 'auto'
                                        }}
                                        maxLength={1000}
                                    />
                                    
                                    <div className="absolute right-3 bottom-3 flex items-center space-x-2">
                                        <span className="text-xs text-gray-400">
                                            {text.length}/1000
                                        </span>
                                    </div>
                                </div>
                                
                                <button
                                    onClick={sendMessage}
                                    disabled={!text.trim() || !isConnected}
                                    className="bg-gradient-to-r from-purple-500 to-pink-500 text-white p-3 rounded-2xl hover:from-purple-600 hover:to-pink-600 focus:ring-4 focus:ring-purple-500/20 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed transform hover:scale-105 active:scale-95 shadow-lg"
                                    title={isConnected ? "Send message" : "Not connected"}>
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                                    </svg>
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
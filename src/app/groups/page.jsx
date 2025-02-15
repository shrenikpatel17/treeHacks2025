"use client"

import Image from "next/image";
import React, { useState, useRef, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { authActions } from '../state/reducers/authSlice';
import { useRouter } from "next/navigation";


export default function Dashboard() {
    const user = useSelector((state) => state.auth.user);
    const router = useRouter();

    useEffect(() => {
        if(!user) {
        router.push("/login")
        return;
        }

        //FETCH ALL PROJECTS HERE!!!!!!!!!!
        const fetchProjects = async () => {
        try {
            const response = await fetch("/api/projects", {
                method: "GET",
                headers: { "Content-Type": "application/json" },
            });

            const data = await response.json();
            if (response.ok) {
                setAllProjects(data.data);

                const userProjects = data.data.filter(project => 
                    user.projects.includes(project._id)
                );
                setUserProjects(userProjects); 
            }
        } catch (error) {
            console.error("Error fetching projects:", error);
        }
    };
    fetchProjects();

    //FETCH ALL GROUPS HERE!!!!!!!!!!
    const fetchGroups = async () => {
        const response = await fetch("/api/groups", {
            method: "GET",
            headers: { "Content-Type": "application/json" },
        });

        const data = await response.json();
        if (response.ok) {
            setAllGroups(data.data);
        }
    }
    fetchGroups();

    }, [user])
  
  const dispatch = useDispatch();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [allProjects, setAllProjects] = useState([]);
  const [userProjects, setUserProjects] = useState([]);
  const [allGroups, setAllGroups] = useState([]);

  const [messages, setMessages] = useState([]);
  const [currentMessage, setCurrentMessage] = useState("");
  const chatContainerRef = useRef(null);

  useEffect(() => {
    if (chatContainerRef.current) {
        chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!currentMessage.trim()) return;

    // Add user message to chat
    const userMessage = {
        role: 'user',
        content: currentMessage
    };
    setMessages(prev => [...prev, userMessage]);
    setCurrentMessage("");

    try {
        const response = await fetch('/api/elasticChat', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                messages: [...messages, userMessage]
            }),
        });

        if (!response.ok) {
            throw new Error('Failed to get response');
        }

        const data = await response.json();
        setMessages(prev => [...prev, {
            role: 'assistant',
            content: data.message
        }]);
    } catch (error) {
        console.error('Error sending message:', error);
        // Optionally add error message to chat
        setMessages(prev => [...prev, {
            role: 'assistant',
            content: "Sorry, I encountered an error processing your message."
        }]);
    }
  };



  return (
   <>
        <div className="relative w-screen h-screen">
        <div className="flex h-screen bg-light-color p-4">

            
            {/* Main Content Area */}
            <div className="flex flex-col flex-1 mr-4">
            <nav className="bg-transparent border border-dark-green rounded-full px-8 py-2 flex space-x-8 text-green-900 font-mono justify-center w-fit mx-auto mb-8">
                    <button onClick={() => router.push("/dashboard")} className="hover:underline">Home</button>
                    <button onClick={() => router.push("/projects")} className="hover:underline">Projects</button>
                    <button onClick={() => router.push("/groups")} className="hover:underline">Groups</button>
                </nav>

                {/* Groups Grid */}
                <div className="flex-1 overflow-y-auto pr-4">
                    <div className="grid gap-4">
                        {allGroups.map((group) => (
                            <button
                                key={group._id}
                                className="bg-light-color font-mono border border-dark-green h-44 w-full rounded-xl shadow-sm cursor-pointer hover:bg-light-hover-color focus:outline-none p-4 text-left relative"
                            >
                                <h3 className="text-lg font-semibold text-green-900">{group.name}</h3>
                                {/* Add more group details here if needed */}
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            {/* Chat Panel */}
            <div className="w-1/5 mt-16 border border-dark-green bg-gradient-to-b from-grad-light via-grad-light to-grad-dark rounded-2xl p-4 flex flex-col">
                <h2 className="text-lg font-mono text-green-900 mb-4">Chat Assistant</h2>
                
                {/* Chat Messages Container */}
                <div 
                    ref={chatContainerRef}
                    className="flex-grow overflow-y-auto mb-4 space-y-4"
                >
                    {messages.map((message, index) => (
                        <div 
                            key={index} 
                            className={`p-3 rounded-xl max-w-[90%] ${
                                message.role === 'user' 
                                    ? 'bg-dark-green text-white ml-auto' 
                                    : 'bg-white border border-dark-green mr-auto'
                            }`}
                        >
                            <p className="font-mono text-sm">{message.content}</p>
                        </div>
                    ))}
                </div>

                {/* Chat Input Form */}
                <form onSubmit={handleSendMessage} className="flex items-center gap-2">
                    <input
                        type="text"
                        value={currentMessage}
                        onChange={(e) => setCurrentMessage(e.target.value)}
                        placeholder="Ask a question..."
                        className="flex-grow bg-white p-2 border border-dark-green rounded-xl shadow-sm text-green-900 font-mono"
                    />
                    <button 
                        type="submit"
                        className="bg-dark-green font-mono text-white p-2 rounded-xl hover:bg-opacity-90"
                    >
                        Send
                    </button>
                </form>
            </div>
        </div>
        </div>
   </>
  );
}

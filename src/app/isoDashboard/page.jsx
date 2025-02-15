"use client"

import Image from "next/image";
import React, { useState, useRef, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { authActions } from '../state/reducers/authSlice';
import { useRouter } from "next/navigation";
import { Pie } from 'react-chartjs-2';
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js';

// Register ChartJS components
ChartJS.register(ArcElement, Tooltip, Legend);

export default function Dashboard() {
    const user = useSelector((state) => state.auth.user);
    const router = useRouter();

    useEffect(() => {
        if(!user && !user.iso) {
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

  const [selectedGroup, setSelectedGroup] = useState(null);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);

  const [isGroupModalOpen, setIsGroupModalOpen] = useState(false);
  const [groupName, setGroupName] = useState("");
  const [connectionCoordinate, setConnectionCoordinate] = useState("");
  const [substationCoordinate, setSubstationCoordinate] = useState("");

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

  const handleDetailsClick = (e, group) => {
    e.stopPropagation(); // Prevent the button click from triggering the parent button
    setSelectedGroup(group);
    setIsDetailsModalOpen(true);
  };

  // Add this function to process group project data
  const getGroupProjectsData = (group) => {
    if (!group || !group.projects || !allProjects) return null;

    // Filter projects that belong to this group
    const groupProjects = allProjects.filter(project => 
        group.projects.includes(project._id)
    );

    // Calculate total budget
    const totalBudget = groupProjects.reduce((sum, project) => 
        sum + (Number(project.metadata.budget.replace(/,/g, '')) || 0), 0
    );

    // Aggregate generation types and their capacities
    const generationData = groupProjects.reduce((acc, project) => {
        // Process generation type 1
        if (project.metadata.generationType1) {
            const type1 = project.metadata.generationType1;
            const size1 = Number(project.metadata.generationSize1) || 0;
            acc[type1] = (acc[type1] || 0) + size1;
        }
        // Process generation type 2
        if (project.metadata.generationType2) {
            const type2 = project.metadata.generationType2;
            const size2 = Number(project.metadata.generationSize2) || 0;
            acc[type2] = (acc[type2] || 0) + size2;
        }
        return acc;
    }, {});

    // Prepare data for Chart.js
    const labels = Object.keys(generationData);
    const data = Object.values(generationData);
    const backgroundColor = labels.map(type => getColorForType(type));

    const chartData = {
        labels: labels,
        datasets: [{
            data: data,
            backgroundColor: backgroundColor,
            borderColor: backgroundColor.map(color => color.replace('0.8', '1')),
            borderWidth: 1,
        }]
    };

    const chartOptions = {
        plugins: {
            legend: {
                position: 'right',
                labels: {
                    font: {
                        family: 'monospace',
                        size: 12
                    },
                    color: '#065f46' // green-900
                }
            },
            tooltip: {
                callbacks: {
                    label: function(context) {
                        const label = context.label || '';
                        const value = context.raw || 0;
                        return `${label}: ${value} MW`;
                    }
                }
            }
        },
        maintainAspectRatio: false
    };

    return {
        totalBudget,
        chartData,
        chartOptions,
        projects: groupProjects
    };
  };

  // Add this function to get colors for different generation types
  const getColorForType = (type) => {
    const colors = {
        Solar: 'rgba(255, 215, 0, 0.8)',    // Golden
        Wind: 'rgba(135, 206, 235, 0.8)',   // Sky Blue
        Battery: 'rgba(128, 128, 128, 0.8)', // Gray
        Hydro: 'rgba(65, 105, 225, 0.8)',   // Royal Blue
        Nuclear: 'rgba(255, 107, 107, 0.8)', // Coral
        Biomass: 'rgba(144, 238, 144, 0.8)', // Light Green
        Geothermal: 'rgba(255, 140, 0, 0.8)', // Dark Orange
        Other: 'rgba(221, 160, 221, 0.8)'    // Plum
    };
    return colors[type] || 'rgba(153, 153, 153, 0.8)';
  };

  // Add this function to handle status updates
  const handleStatusChange = async (projectId, newStatus) => {
    try {
        const response = await fetch(`/api/projects/${projectId}`, {
            method: 'PATCH',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                'metadata.status': newStatus
            }),
        });

        if (response.ok) {
            // Update the project in allProjects
            setAllProjects(prevProjects => 
                prevProjects.map(project => 
                    project._id === projectId 
                        ? { ...project, metadata: { ...project.metadata, status: newStatus } }
                        : project
                )
            );
        }
    } catch (error) {
        console.error('Error updating project status:', error);
    }
  };

  // Add this function to get status color
  const getStatusColor = (status) => {
    const colors = {
        pending: 'bg-yellow-100 text-yellow-800 border-yellow-200',
        approved: 'bg-green-100 text-green-800 border-green-200',
        rejected: 'bg-red-100 text-red-800 border-red-200',
        in_progress: 'bg-blue-100 text-blue-800 border-blue-200',
        completed: 'bg-purple-100 text-purple-800 border-purple-200'
    };
    return colors[status] || 'bg-gray-100 text-gray-800 border-gray-200';
  };

  const formatStatus = (status) => {
    return status
        .replace(/_/g, ' ') // Replace underscores with spaces
        .split(' ') // Split into words
        .map(word => word.charAt(0).toUpperCase() + word.slice(1)) // Capitalize first letter of each word
        .join(' '); // Join back into a single string
  };

  const handleCreateGroup = async() => {
  
      const newGroup = {
          userID: user._id,
          name: groupName,
          connectionCoordinate: connectionCoordinate,
          substationCoordinate: substationCoordinate,
      };
  
      try {
          const response = await fetch('/api/groups', {
            method: 'POST',
            body: JSON.stringify(newGroup),
          });
    
          if (!response.ok) {
            throw new Error('Failed to create group');
          }
    
          const data = await response.json();
          console.log(data)
    
          if (response.ok) {
            dispatch(
                authActions.addGroupToUser(data.data._id)
            )
            }

            const response2 = await fetch('/api/elasticLine', {
              method: 'POST',
              body: JSON.stringify({ connectionCoordinate, substationCoordinate, groupId: data.data._id, groupName: groupName }),
            });

            console.log(response2);

        } catch (error) {
          console.error('Error creating group', error);
        } 
  
      setIsGroupModalOpen(false);
      setGroupName("");
      setConnectionCoordinate("");
      setSubstationCoordinate("");
      };


  return (
   <>
        <div className="relative w-screen h-screen">
        <div className="flex h-screen bg-light-color p-4">

            {/* Main Content Area */}
            <div className="flex flex-col flex-1 mr-4">
                <div className="flex items-center justify-between mb-4">
                    <h1 className="text-2xl font-bold font-mono text-green-900">ISO Dashboard</h1>
                    <button onClick={() => setIsGroupModalOpen(true)} className="mt-0 w-1/6 bg-dark-green text-white font-mono py-2 rounded-xl shadow-md">
                        Start New Group
                    </button>
                </div>

                {/* Groups Grid */}
                <div className="flex-1 overflow-y-auto pr-4 mt-4">
                    <div className="grid gap-4">
                        {allGroups.map((group) => (
                            <div
                                key={group._id}
                                className="bg-light-color font-mono border border-dark-green rounded-xl shadow-sm p-4 text-left relative mb-8"
                            >
                                {/* Group Header */}
                                <div className="flex justify-between items-center mb-6">
                                    <h3 className="text-xl font-semibold text-green-900">{group.name}</h3>
                                    <div className="flex items-center gap-4">
                                        <p className="text-sm text-gray-600">Projects: {group.projects.length}</p>
                                        <p className="text-sm text-gray-600">Capacity: {group.maxCapacity} MW</p>
                                        <button 
                                            onClick={(e) => handleDetailsClick(e, group)}
                                            className="bg-dark-green text-white p-2 rounded-xl hover:bg-opacity-90"
                                        >
                                            Analytics
                                        </button>
                                    </div>
                                </div>

                                {/* Project Cards Grid */}
                                <div className="overflow-x-auto">
                                    <div className="flex gap-4 min-w-min pb-4">
                                        {allProjects
                                            .filter(project => group.projects.includes(project._id))
                                            .map(project => (
                                                <div 
                                                    key={project._id}
                                                    className="bg-white border border-dark-green rounded-lg p-4 shadow-sm w-80 flex-shrink-0 relative"
                                                >
                                                    {/* Status Tag */}
                                                    <div className={`absolute top-2 right-2 px-2 py-1 rounded-lg text-xs font-medium border ${getStatusColor(project.metadata.status)}`}>
                                                        {formatStatus(project.metadata.status)}
                                                    </div>

                                                    <h4 className="font-semibold text-green-900 mb-6">{project.name}</h4>
                                                    
                                                    {/* Project Details */}
                                                    <div className="space-y-2 text-sm">
                                                        <p className="text-gray-600">
                                                            <b>Budget:</b> ${Number(project.metadata.budget.replace(/,/g, '')).toLocaleString()}
                                                        </p>
                                                        <p className="text-gray-600">
                                                            <b>Location:</b> {project.metadata.location.split('|')[0]}
                                                        </p>
                                                        
                                                        {/* Generation Types */}
                                                        <div className="space-y-1">
                                                            {project.metadata.generationType1 && (
                                                                <p className="text-gray-600">
                                                                    <b>{project.metadata.generationType1}:</b> {project.metadata.generationSize1} MW
                                                                </p>
                                                            )}
                                                            {project.metadata.generationType2 && (
                                                                <p className="text-gray-600">
                                                                    <b>{project.metadata.generationType2}:</b> {project.metadata.generationSize2} MW
                                                                </p>
                                                            )}
                                                        </div>

                                                        {/* Completion Date */}
                                                        <p className="text-gray-600">
                                                            <b>Projected Completion:</b> {project.metadata.requestedCompletionDate}
                                                        </p>

                                                        {/* Status Selector */}
                                                        <div className="mt-4 sticky bottom-0">
                                                            <label className="block text-gray-700 mb-1"><b>Change Status:</b></label>
                                                            <select
                                                                value={project.metadata.status}
                                                                onChange={(e) => handleStatusChange(project._id, e.target.value)}
                                                                className="w-full p-2 border border-dark-green rounded-lg bg-light-color text-green-900 focus:outline-none focus:ring-2 focus:ring-dark-green"
                                                            >
                                                                <option value="pending">Pending</option>
                                                                <option value="approved">Approved</option>
                                                                <option value="rejected">Rejected</option>
                                                                <option value="in_progress">In Progress</option>
                                                                <option value="completed">Completed</option>
                                                            </select>
                                                        </div>
                                                    </div>
                                                </div>
                                            ))}
                                    </div>
                                </div>
                            </div>
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

        {isDetailsModalOpen && selectedGroup && (
            <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
                <div className="bg-white p-8 rounded-xl shadow-lg w-3/4 max-h-[80vh] overflow-y-auto">
                    <div className="flex justify-between items-center mb-6">
                        <h2 className="text-2xl font-mono text-green-900">{selectedGroup.name}</h2>
                        <button 
                            onClick={() => setIsDetailsModalOpen(false)}
                            className="text-gray-500 hover:text-gray-700"
                        >
                            <span className="text-2xl">×</span>
                        </button>
                    </div>

                    {(() => {
                        const groupData = getGroupProjectsData(selectedGroup);
                        if (!groupData) return <p>No project data available</p>;

                        return (
                            <div className="grid grid-cols-2 gap-8">
                                {/* Left Column - Summary Data */}
                                <div className="space-y-6">
                                    <div className="bg-light-color p-4 rounded-xl border border-dark-green">
                                        <h3 className="text-lg font-bold font-mono text-green-900 mb-2">Group Summary</h3>
                                        <p className="font-mono text-gray-600">Total Projects: {groupData.projects.length}</p>
                                        <p className="font-mono text-gray-600">Total Budget: ${groupData.totalBudget.toLocaleString()}</p>
                                        <p className="font-mono text-gray-600">Location: {selectedGroup.location || "Multiple Locations"}</p>
                                    </div>

                                    {/* Pie Chart */}
                                    <div className="bg-light-color p-4 rounded-xl border border-dark-green">
                                        <h3 className="text-lg font-bold font-mono text-green-900 mb-4">Generation Mix</h3>
                                        <div className="h-64">
                                            <Pie 
                                                data={groupData.chartData}
                                                options={groupData.chartOptions}
                                            />
                                        </div>
                                    </div>
                                </div>

                                {/* Right Column - Project List */}
                                <div className="bg-light-color p-4 rounded-xl border border-dark-green">
                                    <h3 className="text-lg font-mono font-bold text-green-900 mb-4">Projects</h3>
                                    <div className="space-y-4">
                                        {groupData.projects.map(project => (
                                            <div key={project._id} className="bg-white p-4 rounded-lg border border-dark-green">
                                                <h4 className="font-mono text-green-900 font-semibold">{project.name}</h4>
                                                <p className="text-sm font-mono text-gray-600">Budget: ${Number(project.metadata.budget.replace(/,/g, '')).toLocaleString()}</p>
                                                <div className="grid grid-cols-2 gap-2 mt-2">
                                                    {project.metadata.generationType1 && (
                                                        <p className="text-sm font-mono text-gray-600">
                                                            {project.metadata.generationType1}: {project.metadata.generationSize1} MW
                                                        </p>
                                                    )}
                                                    {project.metadata.generationType2 && (
                                                        <p className="text-sm font-mono text-gray-600">
                                                            {project.metadata.generationType2}: {project.metadata.generationSize2} MW
                                                        </p>
                                                    )}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        );
                    })()}
                </div>
            </div>
        )}

        {isGroupModalOpen && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50">
            <div className="bg-white p-6 rounded-xl shadow-lg w-1/3">
                <h2 className="text-lg font-mono text-green-900 mb-4">Propose New Group</h2>
                <input type="text" placeholder="Group Name" className="w-full font-mono p-2 border border-gray-300 rounded mb-2" value={groupName} onChange={(e) => setGroupName(e.target.value)} />
                <input type="text" placeholder="Connection Coordinate" className="w-full font-mono p-2 border border-gray-300 rounded mb-2" value={connectionCoordinate} onChange={(e) => setConnectionCoordinate(e.target.value)} />
                <input type="text" placeholder="Substation Coordinate" className="w-full font-mono p-2 border border-gray-300 rounded mb-2" value={substationCoordinate} onChange={(e) => setSubstationCoordinate(e.target.value)} />

                <div className="flex justify-end space-x-2">
                    <button onClick={() => setIsGroupModalOpen(false)} className="bg-gray-100 font-mono hover:bg-gray-200 text-gray-700 px-4 py-2 rounded-xl">Cancel</button>
                    <button onClick={handleCreateGroup} className="bg-dark-green font-mono hover:bg-text-green text-white px-4 py-2 rounded-xl">Create Group</button>
                </div>
            </div>
        </div>
    )}
   </>
  );
}

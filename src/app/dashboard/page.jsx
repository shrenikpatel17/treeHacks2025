"use client"

import Image from "next/image";
import React, { useState, useRef, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { authActions } from '../state/reducers/authSlice';
import { useRouter } from "next/navigation";
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
  

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
    }, [user])
  
  const dispatch = useDispatch();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isGroupModalOpen, setIsGroupModalOpen] = useState(false);
  const [allProjects, setAllProjects] = useState([]);
  const [userProjects, setUserProjects] = useState([]);

  // STATES FOR NEW PROJECT CREATION
  const [projectName, setProjectName] = useState("");
  const [groupName, setGroupName] = useState("");
  const [location, setLocation] = useState("");
  const [generationType1, setGenerationType1] = useState("");
  const [generationType2, setGenerationType2] = useState("");
  const [generationSize1, setGenerationSize1] = useState("");
  const [generationSize2, setGenerationSize2] = useState("");
  const [requestedCompletionDate, setRequestedCompletionDate] = useState("");
  const [budget, setBudget] = useState("");
//   const [transmissionBid, setTransmissionBid] = useState("");

  const [messages, setMessages] = useState([]);
  const [currentMessage, setCurrentMessage] = useState("");
  const chatContainerRef = useRef(null);

  // Add map refs after other state declarations
  const mapContainer = useRef(null);
  const map = useRef(null);

  // Add this function to parse coordinates from project location
  const parseProjectCoordinates = (locationString) => {
    if (!locationString) return null;
    try {
        const coordinates = locationString.split("|")[0]
            .match(/[-+]?\d*\.?\d+/g)
            .map(Number);
        return coordinates;
    } catch (error) {
        console.error("Error parsing coordinates:", error);
        return null;
    }
};

  // Add this useEffect for map initialization
  useEffect(() => {
    mapboxgl.accessToken = 'pk.eyJ1Ijoic2hyZW5pa3BhdGVsIiwiYSI6ImNtNzZ5c2djaDEyY2gybXBybDhlMXY2bmMifQ.Gse4PXbgo5TydviHbdsM9Q';
    
    console.log(mapContainer.current)

    // Check if mapContainer.current is valid before initializing the map
    if (mapContainer.current) {
        map.current = new mapboxgl.Map({
            container: mapContainer.current,
            style: 'mapbox://styles/shrenikpatel/cm76zveu300a901rf2lbdhgsu', // Add a default style
            center: [-122.1, 37.4], // Add a default center
            zoom: 7 // Add a default zoom level
        });

        // Add navigation controls
        map.current.addControl(new mapboxgl.NavigationControl(), 'top-right');

        // Add project points when map loads
        map.current.on('load', () => {
            // Add transmission lines source and layer
            map.current.addSource('Electric__Power_Transmission_-abcl2z', {
                type: 'vector',
                url: 'mapbox://shrenikpatel.97uttm42' 
            });

            map.current.addSource('substationsWithCoordinates_1-98toln', {
                type: 'vector',
                url: 'mapbox://shrenikpatel.8qz3rtqa' 
            });

            map.current.addSource('Filtered_Updated_Capacity_Dat-clflrg', {
                type: 'vector',
                url: 'mapbox://shrenikpatel.3py0eb24' 
            });

            // Add a source for project points
            map.current.addSource('project-points', {
                type: 'geojson',
                data: {
                    type: 'FeatureCollection',
                    features: allProjects
                        .map(project => {
                            const coords = parseProjectCoordinates(project.metadata.location);
                            if (!coords) return null;
                            return {
                                type: 'Feature',
                                geometry: {
                                    type: 'Point',
                                    coordinates: [coords[1], coords[0]] // [longitude, latitude]
                                },
                                properties: {
                                    title: project.name,
                                    description: `${project.metadata.generationType1}: ${project.metadata.generationSize1} MW`
                                }
                            };
                        })
                        .filter(feature => feature !== null)
                }
            });

            // Add transmission lines layer
            map.current.addLayer({
                'id': 'transmission-lines-layer',
                'type': 'line',
                'source': 'Electric__Power_Transmission_-abcl2z',
                'source-layer': 'Electric__Power_Transmission_-abcl2z',
                'paint': {
                    'line-color': '#088',
                    'line-width': 2
                }
            });

            // Add substations layer
            map.current.addLayer({
                'id': 'substation-points-layer',
                'type': 'circle',
                'source': 'substationsWithCoordinates_1-98toln',
                'source-layer': 'substationsWithCoordinates_1-98toln',
                'paint': {
                    'circle-color': '#088',
                    'circle-radius': 2
                }
            });

            map.current.addLayer({
                'id': 'capacity-points-layer',
                'type': 'circle',
                'source': 'Filtered_Updated_Capacity_Dat-clflrg',
                'source-layer': 'Filtered_Updated_Capacity_Dat-clflrg',
                'paint': {
                    'circle-color':  '#5fea1f', 
                    'circle-radius': 3
                }
            });

            // Add project points layer
            map.current.addLayer({
                'id': 'project-points-layer',
                'type': 'circle',
                'source': 'project-points',
                'paint': {
                    'circle-radius': 6,
                    'circle-color': '#ff0000',
                    'circle-opacity': 0.7,
                    'circle-stroke-width': 2,
                    'circle-stroke-color': '#ffffff'
                }
            });

            // Add popup on hover
            map.current.on('mouseenter', 'project-points-layer', (e) => {
                const coordinates = e.features[0].geometry.coordinates.slice();
                const { title, description } = e.features[0].properties;

                console.log(e.features)
                
                new mapboxgl.Popup()
                    .setLngLat(coordinates)
                    .setHTML(`<h3>${title}</h3><p>${description}</p>`)
                    .addTo(map.current);
            });

            map.current.on('mouseleave', 'project-points-layer', () => {
                const popups = document.getElementsByClassName('mapboxgl-popup');
                if (popups[0]) popups[0].remove();
            });
        });
    } else {
        console.error("Map container is not available.");
    }

    // Cleanup on unmount
    return () => map.current?.remove();
  }, [allProjects]);

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

  const generateCoordinates = async () => {
    const response = await fetch('/api/generateCoordinates', {
      method: 'POST',
      body: JSON.stringify({ userPrompt: location }),
    });
 
 
    const data = await response.json();
    console.log(data);
 
 
    return data.res;
  }
 
  const generateGeoPoint = async(location, projectId) => {
    const [lat, long] = location.split("|")[0]
    .match(/[-+]?\d*\.?\d+/g)
    .map(Number);
 
    const response = await fetch('/api/elasticGeo', {
      method: 'POST',
      body: JSON.stringify({ lat: lat, long: long, projectId: projectId }),
    });
 
    return response;
  }
 

  const handleCreateProject = async() => {
    const coordinates = await generateCoordinates();
 
    const newProject = {
        userID: user._id,
        name: projectName,
        metadata: {
            location: coordinates,
            generationType1: generationType1,
            generationType2: generationType2,
            generationSize1: generationSize1,
            generationSize2: generationSize2,
            requestedCompletionDate: requestedCompletionDate,
            budget: budget,
            // transmissionBid: transmissionBid,
            status: "pending",
        },
    };
 
 
    try {
        const response = await fetch('/api/projects', {
          method: 'POST',
          body: JSON.stringify(newProject),
        });
         if (!response.ok) {
          throw new Error('Failed to create project');
        }
         const data = await response.json();
        console.log(data)
         if (response.ok) {
          dispatch(
              authActions.addProjectToUser(data.data._id)
          )
        }
        generateGeoPoint(data.data.metadata.location, data.data._id);
        
        router.push("/groups")
 
      } catch (error) {
        console.error('Error creating project', error);
      }
 
 
    setIsModalOpen(false);
    setProjectName("");
    setLocation("");
    setGenerationType1("");
    setGenerationType2("");
    setGenerationSize1("");
    setGenerationSize2("");
    setRequestedCompletionDate("");
    setBudget("");
    };
 

    // const handleCreateGroup = async() => {
  
    //   const newGroup = {
    //       userID: user._id,
    //       name: groupName,
    //   };
  
    //   try {
    //       const response = await fetch('/api/groups', {
    //         method: 'POST',
    //         body: JSON.stringify(newGroup),
    //       });
    
    //       if (!response.ok) {
    //         throw new Error('Failed to create group');
    //       }
    
    //       const data = await response.json();
    //       console.log(data)
    
    //       if (response.ok) {
    //         dispatch(
    //             authActions.addGroupToUser(data.data._id)
    //         )
    //     }
    //     } catch (error) {
    //       console.error('Error creating group', error);
    //     } 
  
    //   setIsGroupModalOpen(false);
    //   setGroupName("");
    //   };

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
        .replace(/_/g, ' ')
        .split(' ')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ');
  };

  return (
   <>
   <div className="relative w-screen h-screen">
   <div className="flex h-screen bg-light-color p-4">
      {/* Sidebar */}
      <div className="w-1/5 mt-16 border border-dark-green rounded-2xl p-4 flex flex-col bg-gradient-to-b from-grad-light via-grad-light to-grad-dark">
        <h2 className="text-lg font-mono text-green-900 mb-4">My Projects</h2>
        <div className="flex flex-col space-y-4 flex-grow overflow-y-auto max-h-[calc(100vh-4rem)]">
            {userProjects.map((project) => (
                <button
                    key={project._id}
                    className="bg-light-color font-mono border border-dark-green h-36 w-full rounded-xl shadow-sm cursor-pointer hover:bg-light-hover-color focus:outline-none relative"
                >
                    {/* Status Tag */}
                    <div className={`absolute top-2 right-2 px-2 py-1 rounded-lg text-xs font-medium border ${getStatusColor(project.metadata.status)}`}>
                        {formatStatus(project.metadata.status)}
                    </div>

                    {/* Project Name */}
                    <div className="absolute top-4 left-4">
                        <h4 className="font-semibold text-green-900">{project.name}</h4>
                    </div>

                    {/* Project Details */}
                    <div className="absolute bottom-4 left-4 text-sm text-gray-600">
                        {project.metadata.parameter1}
                    </div>
                </button>
            ))}
        </div>
        <button onClick={() => setIsModalOpen(true)} className="mt-4 bg-dark-green text-white font-mono py-2 rounded-xl shadow-md">
            Start New Project
        </button>
        {/* <button onClick={() => setIsGroupModalOpen(true)} className="mt-4 bg-dark-green text-white font-mono py-2 rounded-xl shadow-md">
            Start New Group
        </button> */}
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col items-center justify-start">
        <nav className="bg-transparent border border-dark-green rounded-full px-8 py-2 flex space-x-8 text-green-900 font-mono justify-center">
          <button onClick={() => router.push("/dashboard")} className="hover:underline">Home</button>
          <button onClick={() => router.push("/projects")} className="hover:underline">Projects</button>
          <button onClick={() => router.push("/groups")} className="hover:underline">Groups</button>
        </nav>
      </div>

      {/* Centered Projects (Absolute Positioning) */}
      <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 flex flex-wrap justify-center space-x-4 space-y-4">
        <div 
            ref={mapContainer} 
            className="map-container w-[1200px] h-[900px] rounded-xl"
        />
      </div>

      {/* Updated Query Panel with Chat UI */}
      <div className="mt-16 w-1/5 border border-dark-green bg-gradient-to-b from-grad-light via-grad-light to-grad-dark rounded-2xl p-4 flex flex-col">
        <h2 className="text-lg font-mono text-green-900 mb-4">Ask Link (your grid expert)...</h2>
        
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


    {/* Modal */}
    {isModalOpen && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50">
            <div className="bg-white p-6 rounded-xl shadow-lg w-1/3">
                <h2 className="text-lg font-mono text-green-900 mb-4">Propose New Project</h2>
                <input type="text" placeholder="Project Name" className="w-full font-mono p-2 border border-gray-300 rounded mb-2" value={projectName} onChange={(e) => setProjectName(e.target.value)} />
                <input type="text" placeholder="Location" className="w-full font-mono p-2 border border-gray-300 rounded mb-2" value={location} onChange={(e) => setLocation(e.target.value)} />
                <select className="w-full font-mono p-2 border border-gray-300 rounded mb-2" value={generationType1} onChange={(e) => setGenerationType1(e.target.value)}>
                    <option value="">Select Generation Type 1</option>
                    <option value="Solar">Solar</option>
                    <option value="Wind">Wind</option>
                    <option value="Battery">Battery</option>
                    <option value="Hydro">Hydro</option>
                    <option value="Nuclear">Nuclear</option>
                    <option value="Biomass">Biomass</option>
                    <option value="Geothermal">Geothermal</option>
                    <option value="Other">Other</option>
                </select>
                <input type="text" placeholder="Generation Size 1 (MW)" className="w-full font-mono p-2 border border-gray-300 rounded mb-4" value={generationSize1} onChange={(e) => setGenerationSize1(e.target.value)} />
                <select className="w-full font-mono p-2 border border-gray-300 rounded mb-2" value={generationType2} onChange={(e) => setGenerationType2(e.target.value)}>
                    <option value="">Select Generation Type 2</option>
                    <option value="Solar">Solar</option>
                    <option value="Wind">Wind</option>
                    <option value="Battery">Battery</option>
                    <option value="Hydro">Hydro</option>
                    <option value="Nuclear">Nuclear</option>
                    <option value="Biomass">Biomass</option>
                    <option value="Geothermal">Geothermal</option>
                    <option value="Other">Other</option>
                </select>
                <input type="text" placeholder="Generation Size 2 (MW)" className="w-full font-mono p-2 border border-gray-300 rounded mb-4" value={generationSize2} onChange={(e) => setGenerationSize2(e.target.value)} />
                <input type="text" placeholder="Requested Completion Date" className="w-full font-mono p-2 border border-gray-300 rounded mb-4" value={requestedCompletionDate} onChange={(e) => setRequestedCompletionDate(e.target.value)} />
                <input type="text" placeholder="Budget (USD)" className="w-full font-mono p-2 border border-gray-300 rounded mb-4" value={budget} onChange={(e) => setBudget(e.target.value)} />
                {/* <input type="text" placeholder="Transmission Contribution Bid (USD)" className="w-full font-mono p-2 border border-gray-300 rounded mb-4" value={transmissionBid} onChange={(e) => setTransmissionBid(e.target.value)} /> */}

                <div className="flex justify-end space-x-2">
                    <button onClick={() => setIsModalOpen(false)} className="bg-gray-100 font-mono hover:bg-gray-200 text-gray-700 px-4 py-2 rounded-xl">Cancel</button>
                    <button onClick={handleCreateProject} className="bg-dark-green font-mono hover:bg-text-green text-white px-4 py-2 rounded-xl">Create Project</button>
                </div>
            </div>
        </div>
    )}

{/* {isGroupModalOpen && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50">
            <div className="bg-white p-6 rounded-xl shadow-lg w-1/3">
                <h2 className="text-lg font-mono text-green-900 mb-4">Propose New Group</h2>
                <input type="text" placeholder="Group Name" className="w-full font-mono p-2 border border-gray-300 rounded mb-2" value={groupName} onChange={(e) => setGroupName(e.target.value)} />

                <div className="flex justify-end space-x-2">
                    <button onClick={() => setIsModalOpen(false)} className="bg-gray-100 font-mono hover:bg-gray-200 text-gray-700 px-4 py-2 rounded-xl">Cancel</button>
                    <button onClick={handleCreateGroup} className="bg-dark-green font-mono hover:bg-text-green text-white px-4 py-2 rounded-xl">Create Group</button>
                </div>
            </div>
        </div>
    )} */}
   </>
  );
}

"use client"

import Image from "next/image";
import React, { useState, useRef, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { authActions } from '../state/reducers/authSlice';
import { useRouter } from "next/navigation";
import { Pie } from 'react-chartjs-2';
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';

// Register ChartJS components
ChartJS.register(ArcElement, Tooltip, Legend);


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
                // Set the most recent project
                if (data.data.length > 0) {
                    setMostRecentProject(data.data[data.data.length - 1]);
                }

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

    recommendationAlgorithm();

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
  const [orderedGroups, setOrderedGroups] = useState([]);

  // Add this state to track the most recent project
  const [mostRecentProject, setMostRecentProject] = useState(null);

  useEffect(() => {
    if (allProjects && allProjects.length > 0 && allGroups && allGroups.length > 0) {
      const recommendedOrder = recommendationAlgorithm();
      setOrderedGroups(recommendedOrder);
    }
  }, [allProjects, allGroups]);

  function parseCoordinate(coordString) {
    const [lat, lon] = coordString.replace(/[()]/g, '').split(',').map(Number);
    return { lat, lon };
  }

  function getDistance(lat1, lon1, lat2, lon2) {
    const R = 6371;
    const dLat = (lat2 - lat1) * (Math.PI / 180);
    const dLon = (lon2 - lon1) * (Math.PI / 180);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(lat1 * (Math.PI / 180)) *
        Math.cos(lat2 * (Math.PI / 180)) *
        Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  function recommendationAlgorithm() {
    if (!allProjects || allProjects.length === 0) {
      return [];
    }

    const project = allProjects[allProjects.length - 1];
    console.log("Most recent project:", project);

    const projectCompletionStr = project.metadata?.requestedCompletionDate || "";
    const projectGenSize1 = Number(project.metadata?.generationSize1 || 0);
    const projectGenSize2 = Number(project.metadata?.generationSize2 || 0);

    let projectLat = 0;
    let projectLon = 0;
    let locationWeight = 1;
    if (project.metadata?.location) {
      const [coordPart, weightPart] = project.metadata.location.split("|");
      const coords = parseCoordinate(coordPart);
      projectLat = coords.lat;
      projectLon = coords.lon;
      locationWeight = weightPart ? parseFloat(weightPart) : 1;
    }

    let projectCompletionDate = new Date(projectCompletionStr);
    if (isNaN(projectCompletionDate.getTime())) {
      projectCompletionDate = new Date();
    }

    const groupScores = allGroups.map((group) => {
      let compatibility = 0;

      if (group.isPotential) {
        const groupCompDate = new Date(group.completionDate);
        if (!isNaN(groupCompDate.getTime())) {
          const diffInMs = Math.abs(groupCompDate - projectCompletionDate);
          const diffInDays = diffInMs / (1000 * 3600 * 24);
          compatibility += diffInDays;
        }
      } else {
        const neededCapacity = projectGenSize1 + projectGenSize2;
        if (group.capacityLeft < neededCapacity) {
          compatibility += 999999;
        }
      }

      let groupLat = 0;
      let groupLon = 0;
      if (group.substationCoordinate) {
        const parsed = parseCoordinate(group.substationCoordinate);
        groupLat = parsed.lat;
        groupLon = parsed.lon;
      }
      const distanceKm = getDistance(projectLat, projectLon, groupLat, groupLon);
      compatibility += distanceKm * locationWeight;

      return {
        groupId: group._id,
        compatibility
      };
    });

    groupScores.sort((a, b) => a.compatibility - b.compatibility);
    console.log("Sorted group scores:", groupScores);

    return groupScores.map(gs => gs.groupId);
  }

  const mapContainer = useRef(null);
  const map = useRef(null);

//   useEffect(() => {
//     if (!mapContainer.current) return;
    
//     mapboxgl.accessToken = 'pk.eyJ1Ijoic2hyZW5pa3BhdGVsIiwiYSI6ImNtNzZ5c2djaDEyY2gybXBybDhlMXY2bmMifQ.Gse4PXbgo5TydviHbdsM9Q';
    
//     map.current = new mapboxgl.Map({
//         container: mapContainer.current,
//         style: 'mapbox://styles/shrenikpatel/cm76zveu300a901rf2lbdhgsu',
//         center: [-122.1, 37.4],
//         zoom: 7
//     });

//     // Add navigation controls
//     map.current.addControl(new mapboxgl.NavigationControl(), 'top-right');

//     // Add project points when map loads
//     map.current.on('load', () => {
//         // Add transmission lines source and layer
//         map.current.addSource('Electric__Power_Transmission_-abcl2z', {
//             type: 'vector',
//             url: 'mapbox://shrenikpatel.97uttm42' 
//         });

//         map.current.addSource('substationsWithCoordinates_1-98toln', {
//             type: 'vector',
//             url: 'mapbox://shrenikpatel.8qz3rtqa' 
//         });

//         // Add a source for project points
//         map.current.addSource('project-points', {
//             type: 'geojson',
//             data: {
//                 type: 'FeatureCollection',
//                 features: allProjects
//                     .map(project => {
//                         const coords = parseProjectCoordinates(project.metadata.location);
//                         if (!coords) return null;
//                         return {
//                             type: 'Feature',
//                             geometry: {
//                                 type: 'Point',
//                                 coordinates: [coords[1], coords[0]] // [longitude, latitude]
//                             },
//                             properties: {
//                                 title: project.name,
//                                 description: `${project.metadata.generationType1}: ${project.metadata.generationSize1} MW`
//                             }
//                         };
//                     })
//                     .filter(feature => feature !== null)
//             }
//         });

//         // Add transmission lines layer
//         map.current.addLayer({
//             'id': 'transmission-lines-layer',
//             'type': 'line',
//             'source': 'Electric__Power_Transmission_-abcl2z',
//             'source-layer': 'Electric__Power_Transmission_-abcl2z',
//             'paint': {
//                 'line-color': '#088',
//                 'line-width': 2
//             }
//         });

//         // Add substations layer
//         map.current.addLayer({
//             'id': 'substation-points-layer',
//             'type': 'circle',
//             'source': 'substationsWithCoordinates_1-98toln',
//             'source-layer': 'substationsWithCoordinates_1-98toln',
//             'paint': {
//                 'circle-color': '#088',
//                 'circle-radius': 2
//             }
//         });

//         // Add project points layer
//         map.current.addLayer({
//             'id': 'project-points-layer',
//             'type': 'circle',
//             'source': 'project-points',
//             'paint': {
//                 'circle-radius': 6,
//                 'circle-color': '#ff0000',
//                 'circle-opacity': 0.7,
//                 'circle-stroke-width': 2,
//                 'circle-stroke-color': '#ffffff'
//             }
//         });

//         // Add popup on hover
//         map.current.on('mouseenter', 'project-points-layer', (e) => {
//             const coordinates = e.features[0].geometry.coordinates.slice();
//             const { title, description } = e.features[0].properties;

//             console.log(e.features)
            
//             new mapboxgl.Popup()
//                 .setLngLat(coordinates)
//                 .setHTML(`<h3>${title}</h3><p>${description}</p>`)
//                 .addTo(map.current);
//         });

//         map.current.on('mouseleave', 'project-points-layer', () => {
//             const popups = document.getElementsByClassName('mapboxgl-popup');
//             if (popups[0]) popups[0].remove();
//         });
//     });

//     // Cleanup on unmount
//     return () => map.current?.remove();
//   }, [allProjects]);

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

  const GroupDetailsModal = ({ group, onClose }) => {
    const mapContainer = useRef(null);
    const map = useRef(null);
    
    useEffect(() => {
        if (!mapContainer.current || !group) return;
        
        mapboxgl.accessToken = 'pk.eyJ1Ijoic2hyZW5pa3BhdGVsIiwiYSI6ImNtNzZ5c2djaDEyY2gybXBybDhlMXY2bmMifQ.Gse4PXbgo5TydviHbdsM9Q';
        
        const groupData = getGroupProjectsData(group);
        if (!groupData) return;

        // Initialize map
        map.current = new mapboxgl.Map({
            container: mapContainer.current,
            style: 'mapbox://styles/shrenikpatel/cm76zveu300a901rf2lbdhgsu',
            center: [-122.1, 37.4],
            zoom: 7
        });

        // Add navigation controls
        map.current.addControl(new mapboxgl.NavigationControl(), 'top-right');

        // Set up map data when map loads
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

            // Add a source for group's project points
            map.current.addSource('project-points', {
                type: 'geojson',
                data: {
                    type: 'FeatureCollection',
                    features: groupData.projects
                        .map(project => {
                            const coords = parseProjectCoordinates(project.metadata.location);
                            if (!coords) return null;
                            return {
                                type: 'Feature',
                                geometry: {
                                    type: 'Point',
                                    coordinates: [coords[1], coords[0]]
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

            // Add layers
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

            // Add popup functionality
            map.current.on('mouseenter', 'project-points-layer', (e) => {
                const coordinates = e.features[0].geometry.coordinates.slice();
                const { title, description } = e.features[0].properties;
                
                new mapboxgl.Popup()
                    .setLngLat(coordinates)
                    .setHTML(`<h3>${title}</h3><p>${description}</p>`)
                    .addTo(map.current);
            });

            map.current.on('mouseleave', 'project-points-layer', () => {
                const popups = document.getElementsByClassName('mapboxgl-popup');
                if (popups[0]) popups[0].remove();
            });

            // Fit map to project points
            const features = map.current.getSource('project-points')._data.features;
            if (features.length > 0) {
                const bounds = new mapboxgl.LngLatBounds();
                features.forEach(feature => {
                    bounds.extend(feature.geometry.coordinates);
                });
                map.current.fitBounds(bounds, { padding: 50 });
            }
        });

        // Cleanup
        return () => {
            if (map.current) {
                map.current.remove();
                map.current = null;
            }
        };
    }, [group]);

    const groupData = getGroupProjectsData(group);
    if (!groupData) return null;

    return (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
            <div className="bg-white p-8 rounded-xl shadow-lg w-3/4 max-h-[90vh] overflow-y-auto">
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-2xl font-mono text-green-900">{group.name}</h2>
                    <button 
                        onClick={onClose}
                        className="text-gray-500 hover:text-gray-700"
                    >
                        <span className="text-2xl">×</span>
                    </button>
                </div>

                <div className="grid grid-cols-2 gap-8">
                    {/* Left Column - Summary Data */}
                    <div className="space-y-6">
                        <div className="bg-light-color p-4 rounded-xl border border-dark-green">
                            <h3 className="text-lg font-bold font-mono text-green-900 mb-2">Group Summary</h3>
                            <p className="font-mono text-gray-600">Total Projects: {groupData.projects.length}</p>
                            <p className="font-mono text-gray-600">Total Budget: ${groupData.totalBudget.toLocaleString()}</p>
                            <p className="font-mono text-gray-600">Location: {group.location || "Multiple Locations"}</p>
                        </div>

                        <div className="mt-6">
                            <h3 className="text-lg font-bold font-mono text-green-900 mb-4">Project Locations</h3>
                            <div className="w-full h-[400px] rounded-xl overflow-hidden border border-dark-green">
                                <div ref={mapContainer} className="w-full h-full" />
                            </div>
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
            </div>
        </div>
    );
};


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

  const handleEnterClick = async (e, group) => {
    e.stopPropagation(); // Prevent event bubbling

    if (!mostRecentProject) {
        alert("No project available to add to group");
        return;
    }

    try {
        // Update the group with the new project
        const response = await fetch(`/api/groups/${group._id}`, {
            method: 'PATCH',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                projectId: mostRecentProject._id
            }),
        });

        if (!response.ok) {
            throw new Error('Failed to update group');
        }

        // Update local state
        setAllGroups(prevGroups => 
            prevGroups.map(g => {
                if (g._id === group._id) {
                    return {
                        ...g,
                        projects: [...g.projects, mostRecentProject._id]
                    };
                }
                return g;
            })
        );

        // Show success message
        alert(`Project ${mostRecentProject.name} added to group ${group.name}`);

    } catch (error) {
        console.error('Error updating group:', error);
        alert('Failed to add project to group');
    }
  };

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
                        { orderedGroups != [] && orderedGroups.map((groupId) => {
                            const group = allGroups.find(g => g._id === groupId);
                            if (!group) return null;
                            return (
                                <button
                                    key={group._id}
                                    className="bg-light-color font-mono border border-dark-green h-44 w-full rounded-xl shadow-sm cursor-pointer hover:bg-light-hover-color focus:outline-none p-4 text-left relative"
                                >
                                    <h3 className="text-lg font-semibold text-green-900 absolute top-4 left-4">{group.name}</h3>
                                    <p className="text-sm text-gray-600 absolute top-4 right-4">Num projects: {group.projects.length}</p>
                                    <p className="text-sm text-gray-600 absolute bottom-4 left-4">Remaining capacity: {group.maxCapacity} MW</p>
                                    <button 
                                        onClick={(e) => handleEnterClick(e, group)}
                                        className="bg-transparent border border-dark-green absolute bottom-4 right-28 font-mono text-dark-green p-2 rounded-xl hover:bg-opacity-90 ml-auto hover:bg-green-900 hover:text-white"
                                    >
                                        Enter
                                    </button>
                                    <button 
                                        onClick={(e) => handleDetailsClick(e, group)}
                                        className="bg-dark-green absolute bottom-4 right-4 font-mono text-white p-2 rounded-xl hover:bg-opacity-90 ml-auto"
                                    >
                                        Details
                                    </button>
                                </button>
                            );
                        })}
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
            <GroupDetailsModal 
            group={selectedGroup} 
            onClose={() => setIsDetailsModalOpen(false)} 
        />)};
   </>
  );
}

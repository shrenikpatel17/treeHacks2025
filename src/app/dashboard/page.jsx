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
    }, [user])
  
  const dispatch = useDispatch();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [allProjects, setAllProjects] = useState([]);
  const [userProjects, setUserProjects] = useState([]);

  // STATES FOR NEW PROJECT CREATION
  const [projectName, setProjectName] = useState("");
  const [parameter1, setParameter1] = useState("");
  const [parameter2, setParameter2] = useState("");
  const [parameter3, setParameter3] = useState("");

  const handleCreateProject = async() => {
    const newProject = {
        userID: user._id,
        name: projectName,
        metadata: {
            parameter1,
            parameter2,
            parameter3,
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
      } catch (error) {
        console.error('Error creating project', error);
      } 

    setIsModalOpen(false);
    setProjectName("");
    setParameter1("");
    setParameter2("");
    setParameter3("");
    };

  return (
   <>
   <div className="relative w-screen h-screen">
   <div className="flex h-screen bg-light-color p-4">
      {/* Sidebar */}
      <div className="w-1/5 mt-16 border border-dark-green rounded-2xl p-4 flex flex-col bg-gradient-to-b from-grad-light via-grad-light to-grad-dark">
        <h2 className="text-lg font-mono text-green-900 mb-4">My Projects</h2>
        <div className="flex flex-col space-y-4 flex-grow overflow-y-auto max-h-screen">
            {userProjects.map((project) => (
                <button
                    key={project._id}
                    className="bg-light-color font-mono border border-dark-green h-36 w-full rounded-xl shadow-sm cursor-pointer hover:bg-light-hover-color focus:outline-none"
                >
                    {project.name}
                    <div>
                    {project.metadata.parameter1}
                    </div>
                </button>
            ))}
        </div>
        <button onClick={() => setIsModalOpen(true)} className="mt-4 bg-dark-green text-white font-mono py-2 rounded-xl shadow-md">
            Start New Project
        </button>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col items-center justify-start">
        <nav className="bg-transparent border border-dark-green rounded-full px-8 py-2 flex space-x-8 text-green-900 font-mono">
          <button className="hover:underline">Home</button>
          <button className="hover:underline">Projects</button>
          <button className="hover:underline">Groups</button>
        </nav>
      </div>

      {/* Centered Projects (Absolute Positioning) */}
      <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 flex flex-wrap justify-center space-x-4 space-y-4">
        {allProjects.map((project) => (
          <button
            key={project._id}
            className="bg-light-color font-mono border border-dark-green h-36 w-64 rounded-xl shadow-sm cursor-pointer hover:bg-light-hover-color focus:outline-none"
          >
            {project.name}
            <div>{project.metadata.parameter1}</div>
          </button>
        ))}
      </div>

      {/* Query Panel */}
      <div className="mt-16 w-1/5 border border-dark-green bg-gradient-to-b from-grad-light via-grad-light to-grad-dark rounded-2xl p-4 flex flex-col">
        <h2 className="text-lg font-mono text-green-900 mb-4">Query</h2>
        <div className="flex-grow"></div>
        <input
          type="text"
          placeholder="Ask a question..."
          className="mt-4 bg-white p-2 border border-dark-green rounded-xl shadow-sm text-green-900 font-mono"
        />
      </div>
    </div>
    </div>


    {/* Modal */}
    {isModalOpen && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50">
            <div className="bg-white p-6 rounded-xl shadow-lg w-1/3">
                <h2 className="text-lg font-mono text-green-900 mb-4">Create New Project</h2>
                <input type="text" placeholder="Project Name" className="w-full font-mono p-2 border border-gray-300 rounded mb-2" value={projectName} onChange={(e) => setProjectName(e.target.value)} />
                <input type="text" placeholder="Parameter 1" className="w-full font-mono p-2 border border-gray-300 rounded mb-2" value={parameter1} onChange={(e) => setParameter1(e.target.value)} />
                <input type="text" placeholder="Parameter 2" className="w-full font-mono p-2 border border-gray-300 rounded mb-2" value={parameter2} onChange={(e) => setParameter2(e.target.value)} />
                <input type="text" placeholder="Parameter 3" className="w-full font-mono p-2 border border-gray-300 rounded mb-4" value={parameter3} onChange={(e) => setParameter3(e.target.value)} />
                <div className="flex justify-end space-x-2">
                    <button onClick={() => setIsModalOpen(false)} className="bg-gray-100 font-mono hover:bg-gray-200 text-gray-700 px-4 py-2 rounded-xl">Cancel</button>
                    <button onClick={handleCreateProject} className="bg-dark-green font-mono hover:bg-text-green text-white px-4 py-2 rounded-xl">Create Project</button>
                </div>
            </div>
        </div>
    )}
   </>
  );
}

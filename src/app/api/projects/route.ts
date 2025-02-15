import { connectMongoDB } from "@/app/lib/mongodb";
import { NextResponse } from "next/server";
import { User } from "@/app/models/User"
import { Project } from "@/app/models/Project";
import mongoose from 'mongoose';

export async function POST( req: Request ) {
    try {
        const { userID, name, metadata } = await req.json();
        
        await connectMongoDB();

        var newProjectObject = {
            name: name,
            metadata: metadata,
        };

        const newProject = await Project.create(newProjectObject);

        await User.findByIdAndUpdate(userID, {
            $push: {
              projects: newProject._id
            },
          });

        return NextResponse.json(
            { data: newProject },
            { status: 201 }
            );
        } 
    catch (error: unknown) {
        return NextResponse.json(
            error,
            { status: 500 }
        );
    }
}

//GET ALL PROJECTS
export async function GET() {
    try {
        await connectMongoDB();

        const projects = await Project.find();

        return NextResponse.json(
            { data: projects },
            { status: 200 }
        );
    } catch (error: unknown) {
        return NextResponse.json(
            { error: "An error occurred while fetching projects." },
            { status: 500 }
        );
    }
}
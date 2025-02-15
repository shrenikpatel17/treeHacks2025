import { NextRequest, NextResponse } from "next/server";
import { connectMongoDB } from "../../../lib/mongodb";
import Project from "@/app/models/Project";

export async function PATCH(
    req: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        await connectMongoDB();
        const updates = await req.json();
        
        const project = await Project.findByIdAndUpdate(
            params.id,
            { $set: updates },
            { new: true }
        );

        if (!project) {
            return NextResponse.json(
                { error: "Project not found" },
                { status: 404 }
            );
        }

        return NextResponse.json({ data: project });
    } catch (error) {
        console.error('Error updating project:', error);
        return NextResponse.json(
            { error: "Failed to update project" },
            { status: 500 }
        );
    }
} 
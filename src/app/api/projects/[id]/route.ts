import { NextRequest, NextResponse } from "next/server";
import { connectMongoDB } from "../../../lib/mongodb";
import Project from "@/app/models/Project";

export async function PATCH(
    req: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        await connectMongoDB();
        const { id } = params;
        const updateData = await req.json();

        const updatedProject = await Project.findByIdAndUpdate(
            id,
            { $set: updateData },
            { new: true }
        );

        if (!updatedProject) {
            return NextResponse.json(
                { error: "Project not found" },
                { status: 404 }
            );
        }

        return NextResponse.json({ 
            success: true, 
            data: updatedProject 
        });

    } catch (error) {
        console.error('Error updating project:', error);
        return NextResponse.json(
            { error: "Failed to update project" },
            { status: 500 }
        );
    }
} 
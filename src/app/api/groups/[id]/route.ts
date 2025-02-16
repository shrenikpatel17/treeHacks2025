import { NextRequest, NextResponse } from "next/server";
import { connectMongoDB } from "../../../lib/mongodb";
import Group from "@/app/models/Group";

export async function PATCH(
    req: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        await connectMongoDB();
        const { id } = params;
        const { projectId } = await req.json();

        // Find and update the group
        const updatedGroup = await Group.findByIdAndUpdate(
            id,
            { $addToSet: { projects: projectId } }, // $addToSet ensures no duplicates
            { new: true }
        );

        if (!updatedGroup) {
            return NextResponse.json(
                { error: "Group not found" },
                { status: 404 }
            );
        }

        return NextResponse.json({ 
            success: true, 
            data: updatedGroup 
        });

    } catch (error) {
        console.error('Error updating group:', error);
        return NextResponse.json(
            { error: "Failed to update group" },
            { status: 500 }
        );
    }
} 
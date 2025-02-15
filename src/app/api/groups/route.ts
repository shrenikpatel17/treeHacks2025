import { connectMongoDB } from "@/app/lib/mongodb";
import { NextResponse } from "next/server";
import { User } from "@/app/models/User"
import { Group } from "@/app/models/Group";
import mongoose from 'mongoose';

export async function POST( req: Request ) {
    try {
        const { userID, name } = await req.json();
        
        await connectMongoDB();

        var newGroupObject = {
            name: name,
        };

        const newGroup = await Group.create(newGroupObject);

        await User.findByIdAndUpdate(userID, {
            $push: {
              groups: newGroup._id
            },
          });

        return NextResponse.json(
            { data: newGroup },
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

        const groups = await Group.find();

        return NextResponse.json(
            { data: groups },
            { status: 200 }
        );
    } catch (error: unknown) {
        return NextResponse.json(
            { error: "An error occurred while fetching groups." },
            { status: 500 }
        );
    }
}

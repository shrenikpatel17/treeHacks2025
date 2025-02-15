import { connectMongoDB } from "../../lib/mongodb";
import { NextResponse } from "next/server";
import bcrypt from "bcrypt";
import {User} from "../../models/User";

export async function POST(req: Request) {
  try {
    const { firstName, lastName, email, password, npi } = await req.json();

    const salt = await bcrypt.genSalt();
    const hashedPassword = await bcrypt.hash(password, salt);
    
    await connectMongoDB();
    await User.create({ 
      firstName, 
      lastName, 
      email, 
      password: hashedPassword,
    });

    return NextResponse.json({ message: "User signed up." }, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { message: "An error occurred during user sign up." },
      { status: 500 }
    );
  }
}
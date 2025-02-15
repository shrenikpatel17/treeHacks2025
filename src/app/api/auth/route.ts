import { connectMongoDB } from "../../lib/mongodb";
import { NextResponse } from "next/server";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { User } from "../../models/User";
import { env } from 'node:process';

export async function POST(req: Request) {
  try{
    const {email, password} = await req.json();

    await connectMongoDB();
    
    const user = await User.findOne({ email: email })
    if (!user) return NextResponse.json({msg: "User does not exist. "}, {status: 400});

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return NextResponse.json({msg: "Invalid credentials. "}, {status: 400});

    const token = jwt.sign({ id: user._id }, env.JWT!)

    return NextResponse.json({ token, user }, {status: 201});

} catch (err: any){
  return NextResponse.json({ error: err.message });
}
}
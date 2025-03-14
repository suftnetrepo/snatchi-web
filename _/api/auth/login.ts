import { mongoConnect } from '../../../utils/connectDb';
import User from '../models/user';
import { errorHandler } from '../../../utils/errors';
import bcrypt from 'bcrypt';
import { serialize } from 'cookie';
import { getAccessToken, getRefreshToken } from '../../../utils/generateToken';

import { NextResponse } from 'next/server';

mongoConnect();

export async function POST(req: Request) {


            console.log('..................................................................req', req);

    try {
        // Parse the request body
        const { email, password } = await req.json();
        const emailAddress = email.toLowerCase();

        // Find user in the database
        const user = await User.findOne({ email: emailAddress });
        if (!user) {
            return NextResponse.json(
                {
                    error: 'User not found. Please sign up for a plan to create a new account.',
                },
                { status: 401 }
            );
        }

        // Compare the password
        const match = await bcrypt.compare(password, user.password);
        if (!match) {
            return NextResponse.json(
                {
                    error: 'Incorrect email or password.',
                },
                { status: 401 }
            );
        }

        // Generate access and refresh tokens
        const accessToken = getAccessToken({
            id: user._id,
            email: user.email,
            role: user.role,
            integrator: user.integrator,
        });

        const refreshToken = getRefreshToken({
            id: user._id,
            email: user.email,
            role: user.role,
            integrator: user.integrator,
        });

        // Set cookies
        const accessTokenCookie = serialize('authToken', accessToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'strict',
            maxAge: 60 * 15, // 15 minutes
            path: '/',
        });

        const refreshTokenCookie = serialize('refreshToken', refreshToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'strict',
            maxAge: 60 * 60 * 24 * 7, // 7 days
            path: '/',
        });

        const payload = {
            user_id: user._id,
            first_name: user.first_name,
            last_name: user.last_name,
            email: user.email,
            role: user.role,
        };

        console.log("..................................................................")

        const response = NextResponse.json({ data: payload });

        // Append cookies to the response
        response.headers.append('Set-Cookie', accessTokenCookie);
        response.headers.append('Set-Cookie', refreshTokenCookie);

        return response;
    } catch (err) {
        return NextResponse.json(
            {
                error: errorHandler(err),
            },
            { status: 500 }
        );
    }
}
import { NextFunction, Response, Request } from "express";
import jwt from 'jsonwebtoken';
import { Types } from "mongoose";


function jwtPayload(userId: Types.ObjectId) {
    const payload = {
        iss: null,
        sub: userId,
        aud: userId, // represent a specific audience that will consume the token
        exp: Math.floor(Date.now() / 1000) + 60 * 60 * 60, // Expiration time: current time + 60 hours
        iat: Math.floor(Date.now() / 1000) // Issued at: current time
    };

    return payload;
}
export function signAccessToken(userid: Types.ObjectId) {
    const payload = jwtPayload(userid);
    const key = process.env.JWT_TOKEN_KEY as string;
    return new Promise((resolve, reject) => {
        (jwt as any).sign(payload, key, (error: Error, token: string) => {
            if (error) {
                reject(error);
            } else {
                resolve(token);
            }
        });
    })
}
export function signRefreshToken(userid: Types.ObjectId) {
    const payload = jwtPayload(userid);
    const key = process.env.REFRESH_TOKEN_KEY as string;
    return new Promise((resolve, reject) => {
        (jwt as any).sign(payload, key, (error: Error, token: string) => {
            if (error) {
                reject(error);
            } else {
                resolve(token);
            }
        });
    })
}

export function verifyAccessToken(req: Request, res: Response, next: NextFunction) {
    try {
        const token = req.headers?.authorization as string;
        const accessToken = token.split(" ")[1];

        const key = process.env.JWT_TOKEN_KEY as string;

        jwt.verify(accessToken, key, (error, payload) => {
            if (error) {
                throw new Error('Unauthorized');
            } else {
                next();
            }
        });

    } catch (error) {
        res.status(401).json({ message: "Unauthorized" })

    }

}
export async function generateTokens(userId: Types.ObjectId) {
  const [accessToken, refreshToken] = await Promise.all([
    signAccessToken(userId),
    signRefreshToken(userId)
  ]);

  return {
    accessToken,
    refreshToken
  };
}

/**
 * Decode and verify a JWT token (returns decoded payload or null)
 */
export function decodeAccessToken(token: string): any {
    try {
        const key = process.env.JWT_TOKEN_KEY as string;
        const decoded = jwt.verify(token, key);
        return decoded;
    } catch (error) {
        return null;
    }
}
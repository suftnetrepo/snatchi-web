import jwt from 'jsonwebtoken'

export const getAccessToken = (payload) => {
    return jwt.sign(payload, process.env.NEXT_PUBLIC_ACCESS_TOKEN_SECRET, {expiresIn: '30m'})
}

export const getRefreshToken = (payload) => {
    return jwt.sign(payload, process.env.NEXT_PUBLIC_REFRESH_TOKEN_SECRET, {expiresIn: '7d'})
}
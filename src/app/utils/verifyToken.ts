import jwt, { JwtPayload, Secret } from "jsonwebtoken";
import { IJwtPayload } from "../modules/auth/auth.interface ";

export const verifyToken = (token: string, secret: Secret) => {
  return jwt.verify(token, secret) as JwtPayload;
};
export const createToken = (
  jwtPayload: IJwtPayload,
  secret: string,
  expiresIn: string
) => {
  return jwt.sign(
    jwtPayload,
    secret as jwt.Secret,
    {
      expiresIn: expiresIn as string,
    } as jwt.SignOptions
  );
};

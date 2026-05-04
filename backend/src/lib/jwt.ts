import jwt from "jsonwebtoken";

const SECRET = () => {
  const secret = process.env["JWT_SECRET"];
  if (!secret) throw new Error("JWT_SECRET não definida no .env");
  return secret;
};

export function signToken(payload: object, expiresIn: string = "1h"): string {
  return jwt.sign(payload, SECRET() as jwt.Secret, {
    expiresIn: expiresIn as jwt.SignOptions["expiresIn"],
  });
}

export function verifyToken(token: string): jwt.JwtPayload {
  return jwt.verify(token, SECRET()) as jwt.JwtPayload;
}

import { randomBytes, createHash } from "crypto";

const generateVerificationToken = (): string => {
  return randomBytes(32).toString("hex");
};

const hashVerificationToken = (token: string): string => {
  return createHash("sha256").update(token).digest("hex");
};

export { generateVerificationToken, hashVerificationToken };

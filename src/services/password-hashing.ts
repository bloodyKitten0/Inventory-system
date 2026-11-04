import { hash, verify } from "argon2";

const hashPassword = (password: string) => {
  return hash(password);
};

const verifyPassword = (storedHash: string, password: string) => {
  return verify(storedHash, password);
};

export { hashPassword, verifyPassword };

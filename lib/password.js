import "server-only";

import argon2 from "argon2";

const ARGON_OPTS = {
  type: argon2.argon2id,
  memoryCost: 19_456,
  hashLength: 32,
  parallelism: 1,
  timeCost: 3,
};

export async function hashPassword(password) {
  return argon2.hash(password, ARGON_OPTS);
}

export async function verifyPassword(hash, password) {
  try {
    return await argon2.verify(hash, password);
  } catch {
    return false;
  }
}

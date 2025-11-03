import "server-only";

const ARGON_OPTS = {
  memoryCost: 19_456,
  hashLength: 32,
  parallelism: 1,
  timeCost: 3,
};

async function getArgon() {
  // Dynamic import keeps the native module out of Next.js client bundles.
  return import("@node-rs/argon2");
}

export async function hashPassword(password) {
  const { hash } = await getArgon();
  return hash(password, ARGON_OPTS);
}

export async function verifyPassword(hashValue, password) {
  try {
    const { verify } = await getArgon();
    return await verify(hashValue, password);
  } catch {
    return false;
  }
}

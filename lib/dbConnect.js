import mongoose from "mongoose";

let cached = global.mongoose || { conn: null, promise: null };

async function dbConnect() {
  let uri = process.env.MONGODB_URI;

  if (!uri) {
    throw new Error("Please define MONGODB_URI in your environment or .env.local");
  }

  // Safeguard: Ensure percent signs in passwords are properly URL-encoded (% -> %25)
  // if not already encoded (% followed by two hex digits)
  try {
    // If decodeURI fails or it's malformed, fix unescaped '%' characters in credentials
    uri = uri.replace(/%([^0-9A-Fa-f]|.[^0-9A-Fa-f]|$)/g, "%25$1");
  } catch {
    // Keep original uri if regex substitution fails
  }

  if (cached.conn) {
    return cached.conn;
  }

  if (!cached.promise) {
    cached.promise = mongoose
      .connect(uri, {
        bufferCommands: false,
      })
      .then((m) => m);
  }

  try {
    cached.conn = await cached.promise;
  } catch (e) {
    cached.promise = null;
    throw e;
  }

  return cached.conn;
}

global.mongoose = cached;

export default dbConnect;

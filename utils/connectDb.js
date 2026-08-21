import mongoose, { ConnectOptions } from 'mongoose';

export const mongoConnect = async () => {
  if (mongoose.connection.readyState >= 1) {
    return;
  }

  const connectionUrl = process.env.MONGODB_URL || process.env.NEXT_PUBLIC_MONGODB_URL;

  if (!connectionUrl) {
    console.error('MONGODB_URL is not configured');
    return;
  }

  const options = {  
    serverSelectionTimeoutMS: 30000, 
    socketTimeoutMS: 30000 
  };

  try {
    await mongoose.connect(connectionUrl, options);
    mongoose.set('strictQuery', false); 
    console.log('Database connected successfully');
  } catch (err) {
    console.error(`Error connecting to the database: ${err.message}`);
  }
};

// Backwards-compatible name used by older route modules.
export const connectDb = mongoConnect;



// const MONGODB_URI = process.env.MONGODB_URI;

// if (!MONGODB_URI) {
//     throw new Error("Please define MONGODB_URI in environment variables");
// }

// let cached = global.mongoose || { conn: null, promise: null };

// export async function mongoConnect() {
//     if (cached.conn) return cached.conn;

//     if (!cached.promise) {
//         cached.promise = mongoose.connect(MONGODB_URI, {
//             useNewUrlParser: true,
//             useUnifiedTopology: true,
//         }).then((mongoose) => mongoose);
//     }

//     cached.conn = await cached.promise;
//     return cached.conn;
// }

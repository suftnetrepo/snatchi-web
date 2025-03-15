import mongoose, { ConnectOptions } from 'mongoose';

export const mongoConnect = async () => {
  const connectionUrl = process.env.NEXT_PUBLIC_MONGODB_URL || "mongodb+srv://sr72:Kcmkcm12345!@cluster0.ihqj3.mongodb.net/snatchi_dev?retryWrites=true&w=majority";

  if (!connectionUrl) {
    console.error('Error: MONGO_URI is not defined in environment variables.');
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


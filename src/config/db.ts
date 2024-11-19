import mongoose, { Connection } from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

// export const connectToDatabase = async () => {
// 	try {
// 		const dbUri = process.env.MONGO_URI!;
// 		console.log('MongoDB connected successfully.');
// 		return await mongoose.connect(dbUri); // Options no longer needed
// 	} catch (error) {
// 		console.error('MongoDB connection failed:', error);
// 		process.exit(1);
// 	}
// };

const connections: Record<string, Connection> = {}; // Cache connections by database name

export const fcdbUri = process.env.MONGO_URI!;

export const connectToDatabase = async (dbName: string, uri: string): Promise<Connection> => {
	try {
		if (connections[dbName]) {
			console.log(`Reusing existing connection to ${dbName}.`);
			return connections[dbName];
		}

		console.log(`Connecting to ${dbName}...`);
		const connection = await mongoose.createConnection(uri, { dbName }).asPromise();

		connections[dbName] = connection; // Cache the connection
		console.log(`Connected to ${dbName} successfully.`);

		mongoose.set('bufferTimeoutMS', 20000); // Increase timeout to 20 seconds
		return connection;
	} catch (error) {
		console.error(`Error connecting to ${dbName}:`, error);
		throw error;
	}
};

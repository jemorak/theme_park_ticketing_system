'use strict'

import { MongoClient } from 'mongodb';
import dotenv from 'dotenv';
dotenv.config();

const dbName = process.env.MONGODB_DB_NAME;
const dbUName = encodeURIComponent(process.env.MONGODB_USERNAME);
const dbPass = encodeURIComponent(process.env.MONGODB_PASSWORD);
const cluster = process.env.MONGODB_CLUSTER;
const options = process.env.MONGODB_OPTIONS;

const url = `mongodb+srv://${dbUName}:${dbPass}@${cluster}/${options}`;

const dbClient = new MongoClient(url);

let conn;
let db;

try{
    conn = await dbClient.connect();
}
catch(err){
    console.error(err);
}
db = conn.db(dbName);

export default db;
'use strict'

import { MongoClient } from 'mongodb';

const dbName = "theme_park";
const dbUName = encodeURIComponent("jemima");
const dbPass = encodeURIComponent("7KRMN2xZuq8utatJ");
const url = `mongodb+srv://${dbUName}:${dbPass}@ssp.we7lfez.mongodb.net/?retryWrites=true&w=majority&appName=SSP`;

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
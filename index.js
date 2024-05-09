'use strict';

import express from "express";
import * as path from "path";
import { fileURLToPath } from "url";
import ridesRouter from "./routes/rides.js";
import usersRouter from "./routes/users.js/";
import db from './db/connection.js';

const app = express();
const port = 8080;
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

app.set("view engine", "ejs");
app.set("views", path.join(__dirname,"views"));

//-------- FUNCTIONS --------
function handle_401(req, res, next) { //user not authenticated function
    res.status(401);
    res.format(
        {
            html: () =>
            {
                res.render("401",{ url: req.protocol + "://" + req.hostname + req.originalUrl });
            },
            json: () =>
            {
                res.json({ error: "Unauthorised" });
            },
            default: () =>
            {
                res.type("txt").send("Unauthorised");
            }
        }
    )
}

function handle_500(req, res, next) { //server error function
    res.status(500);
    res.format(
        {
            html: () =>
            {
                res.render("500",{ url: req.protocol + "://" + req.hostname + req.originalUrl });
            },
            json: () =>
            {
                res.json({ error: "Internal Server Error" });
            },
            default: () =>
            {
                res.type("txt").send("Internal Server Error");
            }
        }
    )
}



//----------------- APP MIDDLEWARE -----------------


app.use("/rides", ridesRouter);
app.use("/users", usersRouter);

app.get("/", async (req, res) =>{
    let collection = await db.collection("Rides");
    let results = await collection.find({}).toArray();
    res.render("view-rides", {rides: results});
});



//---------------- ERROR MIDDLEWARE ----------------

app.get("/not-user",(req, res, next) => 
{
    const error = new Error("Unauthorised it");
    error.status = 401;
    throw error;
});

app.get("/broken",(req, res, next) => 
{
    throw new Error("Broken");
});


//-----------------  ERROR HANDLERS -----------------

app.use((req, res, next) => {
    res.status(404);
    res.format(
    {
        html: () => {
            res.render("404", { url: req.url });
        },
        json: () => {
            res.json({ error: "Not found" });
        },
        default: () => {
            res.type("txt").send("Not found");
        }
    });
});




app.use((err, req, res, next) => 
{
    switch (err.status)
    {
        case 401:
            handle_401(req, res, next);
            break;
        default:
            handle_500(req, res, next);
            break;
    }
    console.error(`The error that was handled was: ${err.stack}`); 
});

app.listen(port, () => 
{
    console.log(`server listening on port ${port}`);
});
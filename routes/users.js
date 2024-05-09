import bodyParser from "body-parser";
import cookieParser from "cookie-parser";
import express from "express";
import multer from "multer";
import { initializeApp } from "firebase/app";
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword } from "firebase/auth";
import admin from "firebase-admin";
import * as path from "path";
import { fileURLToPath } from "url";
import { createRequire } from "module";
import { error } from "console";
import { ObjectId } from 'mongodb';
import fb from "../../fb/firebase.js";
import db from '../../db/connection.js';

const ticketCost = 20;
let fastTrackCost = 0;
let totalCost = 20;



const firebaseConfig = {
    apiKey: "AIzaSyBfLAagqttK3tLwoMeWAs5ZKCn1JREMzto",
    authDomain: "ssp-rides.firebaseapp.com",
    projectId: "ssp-rides",
    storageBucket: "ssp-rides.appspot.com",
    messagingSenderId: "1062116643752",
    appId: "1:1062116643752:web:888463cf59ab298b63439d",
    measurementId: "G-KB245HTLWC"
};

//Router objects
const firebaseApp = initializeApp(firebaseConfig);
const firebaseAuth = getAuth();
const router = express.Router();
const upload = multer();



function create_cookie(req, res, next) {

    const expiresIn = 1000 * 60 * 60 * 24 * 5;
    const idToken = req.body.idToken.toString();
    const options = { maxAge: expiresIn, httpOnly: true };
    fb.auth().createSessionCookie(idToken, { expiresIn })
        .then((sessionCookie) => {
            res.cookie("session", sessionCookie, options);
            next();
        })
        .catch((error) => {
            console.error("Error creating session cookie:", error);
            res.status(500).json({ error: "Internal server error" })
        });
}

function create(req, res, next) {
    createUserWithEmailAndPassword(firebaseAuth, req.body.email, req.body.password).then(async (userCredential) => {
        const expiresIn = 60 * 60 * 24 * 5 * 1000;
        const idToken = await userCredential.user.getIdToken();

        admin.auth().createSessionCookie(idToken, { expiresIn }).then((sessionCookie) => {
            const options = { maxAge: expiresIn, httpOnly: true };
            res.cookie("session", sessionCookie, options);
            next();
        })
            .catch((error) => {
                console.error("Error creating session cookie:", error);
            });
    })
        .catch((error) => {
            const errorCode = error.code;
            const errorMessage = error.message;

            console.error("Failed to create user: " + req.body.email);
            res.status(409);
        });
}

function allowed(req, res, next) {
    if (req.cookies.session) {
        fb.auth().verifySessionCookie(req.cookies.session, true)
            .then((decodedClaims) => {
                res.locals.uid = decodedClaims.uid;
                next();
            })
            .catch(function (error) {
                console.error(error);
                res.redirect(403, "/users/login");
            });
    }
    else {
        res.redirect(401, "/users/login");
    }
}


router.use(bodyParser.json());
router.use(bodyParser.urlencoded({ extended: true }));
router.use(cookieParser());
router.use(upload.array());


router.get('/', (req, res) => {
    console.log("Render");
    res.redirect("/users/view-tickets");
});

router.get('/session-login', (req, res) => {
    res.render("login");
});

router.post('/session-login', create_cookie, (req, res, next) => {
    res.status(200);
    res.redirect("/users/logged-in-rides");
});

router.post("/session-register", create, (req, res, next) => {
    res.status(201);
    res.redirect("/users/logged-in-rides");
});
router.get('/session-register', (req, res) => {
    res.render("register");
});

router.get("/start-order", allowed, async (req, res, next) => {
    console.log("Render start-order");
    let collection = await db.collection("Rides");
    let results = await collection.find({}).toArray();
    let userID;

    fb.auth().getUser(res.locals.uid).then(async (userRecord) => {
        userID = userRecord.uid;
        res.render("start-order", { ticketCost: ticketCost, rides: results, user: userID });
    });
});

router.post('/ticket-order', async (req, res, next) => {

    let newDoc = {};
    let date = req.body.date;
    let user = req.body.user;

    let collection = await db.collection("Rides");
    let rides = await collection.find({}).toArray();
    let prices = [];

    newDoc.ticket = [];
    newDoc.user = user;

    Object.keys(req.body.ride).forEach((key) => {
        let price = 0;
        for (let i = 0; i < rides.length; i++) {
            if (rides[i]._id == key) {
                fastTrackCost += rides[i].price;
                totalCost += rides[i].price;
                price = rides[i].price;
                prices.push(rides[i].price);
            }
        }
        newDoc.ticket.push({ "id": key, "name": req.body.ride[key], price: price, "used": false });
    })

    newDoc.date = date;
    newDoc.totalCost = totalCost;
    let results = newDoc.ticket;

    res.render("ticket-order", { ticket: newDoc, rides: results, date: date, ticketCost: ticketCost, fastTrackCost: fastTrackCost, totalCost: totalCost, prices: prices, user: user });

});
router.get("/logged-in-rides", async (req, res) => {
    let collection = await db.collection("Rides");
    let results = await collection.find({}).toArray();
    res.render("logged-in-rides", { rides: results });
});




router.post('/complete-order', allowed, async (req, res, next) => {
    console.log(req.body);
    let result;
    let userID;
    let collection = await db.collection("Tickets");
    let order = req.body;

    let ridesData = [];
    fb.auth().getUser(res.locals.uid).then(async (userRecord) => {
        userID = userRecord.uid;
        for (let i = 0; i < Object.keys(order.ticket).length; i++) {
            ridesData.push({
                id: order.ticket[i].id,
                name: order.ticket[i].name,
                price: order.ticket[i].price,
                used: order.ticket[i].used,
            });
        }
        try {
            order.ticket = ridesData;
            let ticket = await collection.findOne({ user: userID, date: order.date });
            if (ticket != null) {
                
                res.render("/users/view-tickets");
            } else {
                result = await collection.insertOne(order);
                res.render("complete-order");
            }
        }
        catch (error) {
            console.error("Error occured creating the ticket: ", error);
            res.status(500).send("Error occurred while processing the request.");
        }
    })
        .catch((error) => {
            res.status(409).end();
        });

});

// router.get('/complete-order', allowed, async (req, res, next) => {
//     res.redirect("/users/view-tickets");
// });


router.get("/view-tickets", allowed, async (req, res, next) => {
    let collection = await db.collection("Tickets");
    let tickets;
    let findID;
    let todayDate = new Date();
    const formattedDate = formatDate(todayDate);

    function formatDate(date) {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    }

    fb.auth().getUser(res.locals.uid).then(async (userRecord) => {
        findID = userRecord.uid;
        tickets = await collection.find({ "user": findID }).toArray();
        console.log(tickets);
        let todayTicket;

        let upcomingTickets = tickets.filter(ticket => ticket.date > formattedDate);
        let pastTickets = tickets.filter(ticket => ticket.date < formattedDate);

        for (let i = 0; i < tickets.length; i++) {
            if (tickets[i].date == formattedDate) {
                todayTicket = tickets[i];
            }
        }

        upcomingTickets = upcomingTickets.sort((a, b) => new Date(a.date) - new Date(b.date));
        pastTickets = pastTickets.sort((a, b) => new Date(a.date) - new Date(b.date));

        res.status(200);
        res.render("view-tickets", { today: todayTicket, upcoming: upcomingTickets, past: pastTickets });

    })
        .catch((error) => {
            console.error(error);
            res.status(418).end();
        })
});

router.post("/edit-ticket/:ticketId", allowed, async (req, res, next) => {

    let collection = await db.collection("Tickets");
    let rides = await db.collection("Rides");
    let ridesResult = await rides.find({}).toArray();
    let findId = new ObjectId(req.params.ticketId);
    let ticketCost = 20;
    let ridesIds = []
    const selectedRides = ridesIds;

    try {
        let ticket = await collection.findOne({ "_id": findId });

        for (let i = 0; i < ticket.ticket.length; i++) {
            ridesIds.push(ticket.ticket[i].id);
        }
        if (!ticket) {
            res.send("Ticket not found");
        } else {
            res.render("edit-ticket", { ticket: ticket, rides: ridesResult, selectedRides: selectedRides, standard: ticketCost });
        }
    }
    catch (error) {
        console.error("Error occured while trying to edit the ticket: ", error);
        next(error);
    }


});

router.get("/edit-ticket/:ticketId", async (req, res, next) => {
    res.render("edit-ticket");
});

router.post("/update-ticket/:ticketId", allowed, async (req, res, next) => {

    try {
        let tickets = await db.collection("Tickets");
        let ridesDb = await db.collection("Rides");
        let rides = await ridesDb.find({}).toArray();
        let date = req.body.date;

        let totalCost = 20;
        let prices = [];
        let result;
        let findId = new ObjectId(req.params.ticketId);
        let newTickets = [];

        console.log(req.body);
        console.log(req.body.ride);

        Object.keys(req.body.ride).forEach((key) => {
            let price = 0;
            for (let i = 0; i < rides.length; i++) {
                if (rides[i]._id == key) {
                    totalCost += rides[i].price;
                    price = rides[i].price;
                    prices.push(rides[i].price);
                }
            }
            newTickets.push({ "id": key, "name": req.body.ride[key], price: price, "used": false });
        })

        let updateDoc = {
            "$set": {
                "date": date,
                "ticket": newTickets,
                "totalCost": totalCost
            }
        };

        result = await tickets.updateOne(
            { "_id": findId },
            updateDoc
        );

        res.redirect("/users/view-tickets");
    } catch (error) {
        console.error("There was an issue trying to update the ticket:", error);
        res.status(500).send("Error occurred while processing the request.");
    }

});

router.post("/use-ticket/:ticketId", allowed, async (req, res, next) => {
    try {
        let findRideTicketId = new ObjectId(req.params.ticketId);
        let collection = await db.collection("Tickets");
        let findTicketId = new ObjectId(req.body.id);
        let result;

        const filter = {
            "_id": findTicketId,
            "ticket.id": req.params.ticketId
        };

        const update = {
            "$set": {
                "ticket.$.used": true
            }
        };
        result = await collection.updateOne(filter, update);
        res.redirect("/users/view-tickets");

    } catch (error) {
        console.error("Error occured when trying to use the ticket: ", error);
        res.status(500).send("Error occurred while processing the request.");
    }
});


router.post('/logout', (req, res) => {
    const sessionCookie = req.cookies.session || "";
    res.clearCookie("session");
    admin.auth().verifySessionCookie(sessionCookie).then((decodedClaims) => {
        admin.auth().revokeRefreshTokens(decodedClaims.sub);
    })
        .then(() => {
            res.redirect("/users/session-login");
        })
        .catch((error) => {
            res.redirect("/users/session-login");
        });
});

export default router; 
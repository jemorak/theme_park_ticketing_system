'use strict'

import bodyParser from 'body-parser';
import express from 'express';
import db from '../db/connection.js';
import { ObjectId } from 'mongodb';

const router = express.Router();

const ticketCost = 20;
let fastTrackCost = 0;
let totalCost = 20;



router.use(bodyParser.json());
router.use(bodyParser.urlencoded({ extended: true }));


router.get('/view-rides', async (req, res) => {
    // local variables
    let collection = await db.collection("Rides");
    let results = await collection.find({}).toArray();

    res.render("view-rides", { rides: results });
});

router.get('/start-order', async (req, res) => {
    let collection = await db.collection("Rides");
    let results = await collection.find({}).toArray();
    res.render("start-order", { ticketCost: ticketCost, rides: results });


});

router.post('/ticket-order', async (req, res, next) => {

    let newDoc = {};
    let date = req.body.date;

    let collection = await db.collection("Rides");
    let rides = await collection.find({}).toArray();
    let prices = [];
    newDoc.ticket = [];


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

    console.log(newDoc);

    newDoc.date = date;
    newDoc.totalCost = totalCost;


    //console.log(rides[0].price);
    let results = newDoc.ticket;

    res.render("ticket-order", { ticket: newDoc, rides: results, date: date, ticketCost: ticketCost, fastTrackCost: fastTrackCost, totalCost: totalCost, prices: prices });

});


router.get('/complete-order', async (req, res) => {

    res.render("complete-order");
});

router.post('/complete-order', async (req, res) => {
    console.log(req.body);
    let result;

    let collection = await db.collection("Tickets");
    let order = req.body;

    // Accessing individual rides within ticket object
    let ridesData = [];
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
        let ticket = await collection.findOne({ "date": order.date });
        if (ticket != null) {
            res.send("Ticket already exists for this date");
        } else {
            result = await collection.insertOne(order);
            res.redirect("/rides/view-tickets");
        }
    }

    catch (error) {
        console.error("Error occured creating the ticket: ", error);
        res.status(500).send("Error occurred while processing the request.");
    }
});

router.get("/orders/:orderId", async (req, res, next) => {
    let collection = await db.collection("Tickets");
    let rides = await db.collection("Rides");
    let findId = new ObjectId(req.params.orderId);
    console.log(req.params.orderId);

    try {
        let result = await collection.findOne({ "_id": findId });

        if (!result) {
            res.send("Ticket not found");
        } else {
            console.log(result);
            res.render("ticket", { ticket: result });
        }
    } catch (error) {
        console.error("Error occured while trying to view the ticket: ", error);
        res.status(500).send("Error occurred while processing the request.");
        next(error);
    }
});

router.get("/view-tickets", async (req, res, next) => {
    let collection = await db.collection("Tickets");
    let tickets = await collection.find({}).toArray();
    let todayDate = new Date();
    const formattedDate = formatDate(todayDate);


    function formatDate(date) {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    }

    let todayTicket;
    let upcomingTickets = await collection.find({ date: { $gt: formattedDate } }).toArray();
    let pastTickets = await collection.find({ date: { $lt: formattedDate } }).toArray();


    for (let i = 0; i < tickets.length; i++) {

        if (tickets[i].date == formattedDate) {
            todayTicket = tickets[i];
        }
    }

    upcomingTickets = upcomingTickets.sort((a, b) => new Date(a.date) - new Date(b.date));
    pastTickets = pastTickets.sort((a, b) => new Date(a.date) - new Date(b.date));

    res.render("view-tickets", { today: todayTicket, upcoming: upcomingTickets, past: pastTickets });
});

router.post("/edit-ticket/:ticketId", async (req, res, next) => {

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

router.post("/update-ticket/:ticketId", async (req, res, next) => {

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



        // let result = await collection.updateOne({ "_id": findId }, updateDoc);
        res.send("Ticket has been updated");
    } catch (error) {
        console.error("There was an issue trying to update the ticket:", error);
        res.status(500).send("Error occurred while processing the request.");
    }

});

router.post("/use-ticket/:ticketId", async (req, res, next) => {
    try {
        let findRideTicketId = new ObjectId(req.params.ticketId);
        let collection = await db.collection("Tickets");
        let findTicketId = new ObjectId(req.body.id);
        let result;

        console.log("findTicketId:", req.body.id);
        console.log("findRideTicketId:", req.params.ticketId);

        let TICKET = await collection.findOne({ "_id": findTicketId });
        console.log("TICKET:", TICKET);

        let updateDoc = {
            "$set": {
                "ticket.$[elem].used": true
            }
        };

        result = await collection.updateOne(
            { "_id": req.body.id },
            { "$set": { "ticket.0.used": "true" } }
        );


        console.log("Update result:", result);
        let updatedTicket = await collection.findOne({ "_id": findTicketId });
        console.log("Updated Ticket:", updatedTicket);


        //console.log("Update result:", result);

        res.redirect("/rides/view-tickets");
    } catch (error) {
        console.error("Error occured when trying to use the ticket: ", error);
        res.status(500).send("Error occurred while processing the request.");
    }
});



export default router;
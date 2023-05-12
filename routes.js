"use strict";

/** Routes for Lunchly */

const express = require("express");

const { BadRequestError } = require("./expressError");
const Customer = require("./models/customer");
const Reservation = require("./models/reservation");

const router = new express.Router();


//////////////////// Customer Routes ////////////////////

/** Homepage: show list of customers. */

router.get("/", async function (req, res, next) {
  const customers = await Customer.searchCustomers(req.query.search);
  return res.render("customer_list.html", { customers });
});


/** Top Ten: show list of top ten customers with most reviews. */

router.get("/top-ten", async function (req, res, next) {
  const customers = await Customer.getTopTenByMostReservations();

  return res.render("customer_top.html", { customers });
});


/** Form to add a new customer. */

router.get("/add/", async function (req, res, next) {
  return res.render("customer_new_form.html");
});

/** Handle adding a new customer. */

router.post("/add/", async function (req, res, next) {
  if (req.body === undefined) {
    throw new BadRequestError();
  }
  const { firstName, lastName, phone, notes } = req.body;
  const customer = new Customer({ firstName, lastName, phone, notes });
  await customer.save();

  return res.redirect(`/${customer.id}/`);
});

/** Show a customer, given their ID. */

router.get("/:id/", async function (req, res, next) {
  const customer = await Customer.get(req.params.id);

  const reservations = await customer.getReservations();

  return res.render("customer_detail.html", { customer, reservations });
});

/** Show form to edit a customer. */

router.get("/:id/edit/", async function (req, res, next) {
  const customer = await Customer.get(req.params.id);

  res.render("customer_edit_form.html", { customer });
});

/** Handle editing a customer. */

router.post("/:id/edit/", async function (req, res, next) {
  if (req.body === undefined) {
    throw new BadRequestError();
  }
  const customer = await Customer.get(req.params.id);
  customer.firstName = req.body.firstName;
  customer.lastName = req.body.lastName;
  customer.phone = req.body.phone;
  customer.notes = req.body.notes;
  await customer.save();

  return res.redirect(`/${customer.id}/`);
});


//////////////////// Reservation Routes ////////////////////

/** Show form to edit a reservation. */

router.get("/:customerId/edit-reservation/:reservationId", async function (req, res, next) {
  const customer = await Customer.get(req.params.customerId);
  const reservation = await Reservation.get(req.params.reservationId);

  res.render("customer_edit_reservation.html", { customer, reservation });
});

/** Handle edit reservation form submission. */

router.post("/:customerId/edit-reservation/:reservationId", async function (req, res, next) {
  const customerId = req.params.customerId

  if (req.body === undefined) {
    throw new BadRequestError();
  }

  const reservation = await Reservation.get(req.params.reservationId);

  reservation.startAt = req.body.startAt;
  reservation.numGuests = req.body.numGuests;
  reservation.notes = req.body.notes;
  await reservation.save();

  return res.redirect(`/${customerId}`);
});


/** Handle adding a new reservation. */

router.post("/:id/add-reservation/", async function (req, res, next) {
  if (req.body === undefined) {
    throw new BadRequestError();
  }
  const customerId = req.params.id;
  const startAt = new Date(req.body.startAt);
  const numGuests = req.body.numGuests;
  const notes = req.body.notes;

  const reservation = new Reservation({
    customerId,
    startAt,
    numGuests,
    notes,
  });
  await reservation.save();

  return res.redirect(`/${customerId}/`);
});



module.exports = router;

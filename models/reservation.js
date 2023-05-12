"use strict";

/** Reservation for Lunchly */

const moment = require("moment");

const db = require("../db");
const { NotFoundError, BadRequestError } = require("../expressError");

/** A reservation for a party */

class Reservation {
  constructor({ id, customerId, numGuests, startAt, notes }) {
    this.id = id;
    this.customerId = customerId;
    this.numGuests = numGuests;
    this.startAt = startAt;
    this.notes = notes;

  }

  /** formatter for startAt */

  getFormattedStartAt() {
    return moment(this.startAt).format("MMMM Do YYYY, h:mm a");
  }

  /** reverse formatter for startAt */

  getUnformattedStartAt() {
    return moment(this.startAt).format("YYYY-MM-DD HH:mm A");
  }

  /** Gets or sets reservation customerId. Ensures customerId cannot be
   * reassigned if it already has a value. */

  get customerId() {
    return this._customerId;
  }

  set customerId(id) {
    if (this._customerId)
      throw new BadRequestError("Reservations are not transferable.");
    this._customerId = id;
  }

  /** Gets or sets reservation start date. Ensures startAt is a Date object. */

  get startAt() {
    return this._startAt;
  }

  set startAt(date) {
    if (!date instanceof Date)
      throw new BadRequestError("Date must be a Date object.");
    this._startAt = date;
  }

  /** Gets or sets number of guests */

  get numGuests() {
    return this._numGuests;
  }

  set numGuests(val) {
    if (val < 1)
      throw new BadRequestError("Cannot make reservation for less than 1 guest.");
    this._numGuests = val;
  }

  /** Gets or sets reservation note */

  get notes() {
    return this._notes;
  }

  set notes(val) {
    if (!val) {
      this._notes = '';
    }
    this._notes = val;
  }


  /** get a reservation by ID. */

  static async get(id) {
    const results = await db.query(
      `SELECT id,
                  customer_id AS "customerId",
                  num_guests AS "numGuests",
                  start_at AS "startAt",
                  notes AS "notes"
           FROM reservations
           WHERE id = $1`,
      [id],
    );

    const reservation = results.rows[0];

    if (reservation === undefined) {
      throw new NotFoundError(`No such reservation: ${id}`);
    }

    return new Reservation(reservation);
  }



  /** given a customer id, find their reservations. */

  static async getReservationsForCustomer(customerId) {
    const results = await db.query(
      `SELECT id,
                  customer_id AS "customerId",
                  num_guests AS "numGuests",
                  start_at AS "startAt",
                  notes AS "notes"
           FROM reservations
           WHERE customer_id = $1`,
      [customerId],
    );

    return results.rows.map(row => new Reservation(row));
  }


  /** save this reservation. */

  async save() {
    if (this.id === undefined) {
      const result = await db.query(
        `INSERT INTO reservations (customer_id, num_guests, start_at, notes)
             VALUES ($1, $2, $3, $4)
             RETURNING id`,
        [this.customerId, this.numGuests, this.startAt, this.notes],
      );
      this.id = result.rows[0].id;
    } else {
      await db.query(
        `UPDATE reservations
             SET customer_id=$1,
                num_guests=$2,
                start_at=$3,
                notes=$4
             WHERE id = $5`, [
        this.customerId,
        this.numGuests,
        this.startAt,
        this.notes,
        this.id,
      ],
      );
    }
  }
}


module.exports = Reservation;

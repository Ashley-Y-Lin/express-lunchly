"use strict";

/** Customer for Lunchly */

const db = require("../db");
const Reservation = require("./reservation");
const { NotFoundError } = require("../expressError");


/** Customer of the restaurant. */

class Customer {
  constructor({ id, firstName, lastName, phone, notes }) {
    this.id = id;
    this.firstName = firstName;
    this.lastName = lastName;
    this.fullName = this.getFullName();
    this.phone = phone;
    this.notes = notes;
  }

  /** get the full name of a customer. */
  getFullName() {
    return this.firstName + ' ' + this.lastName;
  }

  // /** find all customers. */

  // static async all() {
  //   const results = await db.query(
  //     `SELECT id,
  //                 first_name AS "firstName",
  //                 last_name  AS "lastName",
  //                 phone,
  //                 notes
  //          FROM customers
  //          ORDER BY last_name, first_name`,
  //   );
  //   return results.rows.map(c => new Customer(c));
  // }

  /** given a string, find all customers with the string in their first or
   * last name.
   *
   * if no customers are found, throws 404 NotFoundError
  */
  static async searchCustomers(str) {
    const searchString = str ? `%${str}%` : `%`;
    const results = await db.query(
      `SELECT id,
                  first_name AS "firstName",
                  last_name  AS "lastName",
                  phone,
                  notes
           FROM customers
           WHERE CONCAT(first_name,' ', last_name) ILIKE $1
           ORDER BY last_name, first_name`,
      [searchString]
    );

    if (!results.rows[0]) {
      return {};
    }

    return results.rows.map(c => new Customer(c));
  }


  /** get a customer by ID. */

  static async get(id) {
    const results = await db.query(
      `SELECT id,
                  first_name AS "firstName",
                  last_name  AS "lastName",
                  phone,
                  notes
           FROM customers
           WHERE id = $1`,
      [id],
    );

    const customer = results.rows[0];

    if (customer === undefined) {
      const err = new Error(`No such customer: ${id}`);
      err.status = 404;
      throw err;
    }

    return new Customer(customer);
  }


  /** get top 10 customers with most reservations. */

  static async getTopTenByMostReservations() {
    const results = await db.query(
      `SELECT c.id,
                  c.first_name AS "firstName",
                  c.last_name  AS "lastName",
                  c.phone,
                  c.notes,
                  COUNT(r.customer_id) as "numReservations"
           FROM customers AS c
           INNER JOIN reservations AS r
           ON r.customer_id = c.id
           GROUP BY c.id
           ORDER BY COUNT(r.customer_id) DESC
           LIMIT 10`
    );

    const topTenCustomers = results.rows;

    return topTenCustomers.map(c => new Customer(c));
  }

  /** get all reservations for this customer. */

  async getReservations() {
    return await Reservation.getReservationsForCustomer(this.id);
  }

  /** save this customer. */

  async save() {
    if (this.id === undefined) {
      const result = await db.query(
        `INSERT INTO customers (first_name, last_name, phone, notes)
             VALUES ($1, $2, $3, $4)
             RETURNING id`,
        [this.firstName, this.lastName, this.phone, this.notes],
      );
      this.id = result.rows[0].id;
    } else {
      await db.query(
        `UPDATE customers
             SET first_name=$1,
                 last_name=$2,
                 phone=$3,
                 notes=$4
             WHERE id = $5`, [
        this.firstName,
        this.lastName,
        this.phone,
        this.notes,
        this.id,
      ],
      );
    }
  }
}

module.exports = Customer;

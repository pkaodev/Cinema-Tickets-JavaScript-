import TicketTypeRequest from './lib/TicketTypeRequest.js';
import InvalidPurchaseException from './lib/exceptions/InvalidPurchaseException.js';
import InvalidTicketServiceSetupException from './lib/exceptions/InvalidTicketServiceSetupException.js';
import TicketPaymentService from '../thirdparty/paymentgateway/TicketPaymentService.js';
import SeatReservationService from '../thirdparty/seatbooking/SeatReservationService.js';
import defaultTicketServicePolicy from './defaultTicketServicePolicy.js';

/** Represents a ticket service. */
export default class TicketService {
  #ticketPaymentService;
  #seatReservationService;

  #maximumTickets;

  #ticketTypes;

  /**
   * Creates a TicketService instance which is connected to particular payment- and seat reservation services, and has a particular ticket service policy.
   * @param {ticketPaymentService} ticketPaymentService - Instance of 3rd party payment service.
   * @param {seatReservationService} seatReservationService - Instance of 3rd party seat reservation service.
   * @param {ticketServicePolicy} [ticketServicePolicy] - Optional ticket service policy object.  The default policy will be used if not provided.
   */
  constructor(ticketPaymentService, seatReservationService, ticketServicePolicy = defaultTicketServicePolicy) {
    this.#validateTicketServiceSetup(ticketPaymentService, seatReservationService, ticketServicePolicy);

    this.#ticketPaymentService = ticketPaymentService;
    this.#seatReservationService = seatReservationService;

    this.#maximumTickets = ticketServicePolicy.maximumTickets;

    this.#ticketTypes = ticketServicePolicy.ticketTypes;

    Object.freeze(this);
  };

  /**
   * Purchases ticket(s).
   * @param {number} accountId - Account ID of the customer.
   * @param  {...TicketTypeRequest} ticketTypeRequests - Request(s) for ticket(s) to be purchased.
   * @returns {{text: string, tickets: number, price: number, seats: number}} - text: confirmation message, tickets: number of tickets purchased, price: total cost of purchase in pounds, seats: number of seats reserved.
   */
  purchaseTickets(accountId, ...ticketTypeRequests) {
    this.#validatePurchaseRequest(accountId, ...ticketTypeRequests);

    const totalNoOfTickets = this.#calculateTotalNoOfTickets(ticketTypeRequests);

    const totalCostInPounds = this.#calculateTotalCostInPounds(ticketTypeRequests);

    const totalSeatsToReserve = this.#calculateTotalSeatsToReserve(ticketTypeRequests);

    this.#makeRequestToPaymentService(accountId, totalCostInPounds);

    this.#makeRequestToSeatReservationService(accountId, totalSeatsToReserve);

    return {
      text: `You have purchased ${totalNoOfTickets} ticket${totalNoOfTickets > 1 ? 's' : ''} for a total of £${totalCostInPounds / 100} and reserved ${totalSeatsToReserve} seat${totalSeatsToReserve > 1 ? 's' : ''}.`,
      tickets: totalNoOfTickets,
      price: totalCostInPounds,
      seats: totalSeatsToReserve
    };
  };

  /** Throws an error if TicketService is not correctly instantiated. */
  #validateTicketServiceSetup(ticketPaymentService, seatReservationService, ticketServicePolicy) {
    if (!(ticketPaymentService instanceof TicketPaymentService)) {
      throw new InvalidTicketServiceSetupException('TicketPaymentService instance must be provided');
    };

    if (!(seatReservationService instanceof SeatReservationService)) {
      throw new InvalidTicketServiceSetupException('SeatReservationService instance must be provided');
    };

    if (!Number.isInteger(ticketServicePolicy.maximumTickets) || ticketServicePolicy.maximumTickets <= 0) {
      throw new InvalidTicketServiceSetupException('maximumTickets must be a positive integer');
    };

    if (!ticketServicePolicy.ticketTypes || Object.keys(ticketServicePolicy.ticketTypes).length === 0) {
      throw new InvalidTicketServiceSetupException('ticketTypes must be provided');
    };

    Object.values(ticketServicePolicy.ticketTypes).forEach((ticketType) => {
      if (!Number.isInteger(ticketType.price) || ticketType.price < 0) {
        throw new InvalidTicketServiceSetupException('ticketType price must be a non-negative integer');
      };
      if (!Number.isInteger(ticketType.seatAllocation) || ticketType.seatAllocation < 0) {
        throw new InvalidTicketServiceSetupException('ticketType seatAllocation must be a non-negative integer');
      };
    });
  };

  /** Throws an error if the purchase request is invalid. */
  #validatePurchaseRequest(accountId, ...ticketTypeRequests) {
    if (arguments.length < 2) {
      throw new InvalidPurchaseException('accountId and at least one ticketTypeRequest must be provided');
    };

    if (!Number.isInteger(accountId) || accountId <= 0) {
      throw new InvalidPurchaseException('accountId must be an integer greater than 0');
    };

    ticketTypeRequests.forEach((ticketTypeRequest) => {
      if (!(ticketTypeRequest instanceof TicketTypeRequest)) {
        throw new InvalidPurchaseException('ticketTypeRequest must be an instance of TicketTypeRequest');
      }
    });

    if (!ticketTypeRequests.some((ticketTypeRequest) => ticketTypeRequest.getTicketType() === 'ADULT')) {
      throw new InvalidPurchaseException('at least one ADULT ticket must be purchased');
    };

    if (this.#calculateTotalNoOfTickets(ticketTypeRequests) > this.#maximumTickets) {
      throw new InvalidPurchaseException(`maximum number of tickets allowed to be purchased at a time is ${this.#maximumTickets}`);
    };
  };

  /** Returns the total number of tickets to be purchased. */
  #calculateTotalNoOfTickets(ticketTypeRequests) {
    return ticketTypeRequests.reduce((total, ticketTypeRequest) => total + ticketTypeRequest.getNoOfTickets(), 0);
  };

  /** Returns the total cost of purchase in pounds. */
  #calculateTotalCostInPounds(ticketTypeRequests) {
    const costInPence = ticketTypeRequests.reduce((total, ticketTypeRequest) => {
      return total + this.#ticketTypes[ticketTypeRequest.getTicketType()].price * ticketTypeRequest.getNoOfTickets();
    }, 0);

    return costInPence / 100;
  };

  /** Returns the total number of seats to reserve. */
  #calculateTotalSeatsToReserve(ticketTypeRequests) {
    return ticketTypeRequests.reduce((total, ticketTypeRequest) => {
      return total + this.#ticketTypes[ticketTypeRequest.getTicketType()].seatAllocation * ticketTypeRequest.getNoOfTickets();
    }, 0);
  };

  /** Makes a request to the 3rd party payment service. */
  #makeRequestToPaymentService(accountId, totalAmountToPayInPounds) {
    try {
      this.#ticketPaymentService.makePayment(accountId, totalAmountToPayInPounds);
    } catch (error) {
      throw new InvalidPurchaseException(`payment failed with details: ${error}`);
    };
  };

  /** Makes a request to the 3rd party seat reservation service. */
  #makeRequestToSeatReservationService(accountId, totalSeatsToReserve) {
    try {
      this.#seatReservationService.reserveSeat(accountId, totalSeatsToReserve);
    } catch (error) {
      throw new InvalidPurchaseException(`seat reservation failed with details: ${error}`);
    };
  };
};
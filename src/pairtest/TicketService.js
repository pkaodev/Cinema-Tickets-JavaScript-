import TicketTypeRequest from './lib/TicketTypeRequest.js';
import InvalidPurchaseException from './lib/exceptions/InvalidPurchaseException.js';
import InvalidTicketServiceSetupException from './lib/exceptions/InvalidTicketServiceSetupException.js';
import TicketPaymentService from '../thirdparty/paymentgateway/TicketPaymentService.js';
import SeatReservationService from '../thirdparty/seatbooking/SeatReservationService.js';
import defaultTicketServicePolicy from './defaultTicketServicePolicy.js';

export default class TicketService {
  #ticketPaymentService;
  #seatReservationService;

  #maximumTickets;

  // #ticketTypes;
  // #ticketPrices;
  // #seatAllocations;

  #ticketTypes;

  constructor(ticketPaymentService, seatReservationService, ticketServicePolicy = defaultTicketServicePolicy) {
    this.#validateTicketServiceSetup(ticketPaymentService, seatReservationService, ticketServicePolicy);

    this.#ticketPaymentService = ticketPaymentService;
    this.#seatReservationService = seatReservationService;

    this.#maximumTickets = ticketServicePolicy.maximumTickets;

    // this.#ticketTypes = Object.keys(ticketServicePolicy.ticketTypes);
    // this.#ticketPrices = Object.values(ticketServicePolicy.ticketTypes).map((ticketType) => ticketType.price);
    // this.#seatAllocations = Object.values(ticketServicePolicy.ticketTypes).map((ticketType) => ticketType.seatAllocation);

    this.#ticketTypes = ticketServicePolicy.ticketTypes;

    Object.freeze(this);
  };

  purchaseTickets(accountId, ...ticketTypeRequests) {
    this.#validatePurchaseRequest(accountId, ...ticketTypeRequests);

    const totalNoOfTickets = this.#calculateTotalNoOfTickets(ticketTypeRequests);

    const totalAmountToPay = this.#calculateTotalAmountToPay(ticketTypeRequests);
    const costInPounds = totalAmountToPay / 100;

    const totalSeatsToReserve = this.#calculateTotalSeatsToReserve(ticketTypeRequests);


    this.#contactPaymentService(accountId, costInPounds);

    this.#contactSeatReservationService(accountId, totalSeatsToReserve);
      
    return {
      text: `You have purchased ${totalNoOfTickets} ticket${totalNoOfTickets > 1 ? 's' : ''} for a total of £${totalAmountToPay / 100} and reserved ${totalSeatsToReserve} seat${totalSeatsToReserve > 1 ? 's' : ''}.`,
      tickets: totalNoOfTickets,
      price: costInPounds,
      seats: totalSeatsToReserve
    };
  };

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

  #calculateTotalNoOfTickets(ticketTypeRequests) {
    return ticketTypeRequests.reduce((total, ticketTypeRequest) => total + ticketTypeRequest.getNoOfTickets(), 0);
  };

  #calculateTotalAmountToPay(ticketTypeRequests) {
    // return ticketTypeRequests.reduce((total, ticketTypeRequest) => {
    //   const ticketTypeIndex = this.#ticketTypes.findIndex((ticketType) => ticketType === ticketTypeRequest.getTicketType());
    //   return total + this.#ticketPrices[ticketTypeIndex] * ticketTypeRequest.getNoOfTickets();
    // }, 0);

    return ticketTypeRequests.reduce((total, ticketTypeRequest) => {
      return total + this.#ticketTypes[ticketTypeRequest.getTicketType()].price * ticketTypeRequest.getNoOfTickets();
    }, 0);
  };

  #calculateTotalSeatsToReserve(ticketTypeRequests) {
    // return ticketTypeRequests.reduce((total, ticketTypeRequest) => {
    //   const ticketTypeIndex = this.#ticketTypes.findIndex((ticketType) => ticketType === ticketTypeRequest.getTicketType());
    //   return total + this.#seatAllocations[ticketTypeIndex] * ticketTypeRequest.getNoOfTickets();
    // }, 0);

    return ticketTypeRequests.reduce((total, ticketTypeRequest) => {
      return total + this.#ticketTypes[ticketTypeRequest.getTicketType()].seatAllocation * ticketTypeRequest.getNoOfTickets();
    }, 0);
  };

  #contactPaymentService(accountId, totalAmountToPay) {
    try {
      this.#ticketPaymentService.makePayment(accountId, totalAmountToPay);
    } catch (error) {
      throw new InvalidPurchaseException(`payment failed with details: ${error}`);
    };
  };

  #contactSeatReservationService(accountId, totalSeatsToReserve) {
    try {
      this.#seatReservationService.reserveSeat(accountId, totalSeatsToReserve);
    } catch (error) {
      throw new InvalidPurchaseException(`seat reservation failed with details: ${error}`);
    };
  };
};
import TicketTypeRequest from './lib/TicketTypeRequest.js';
import InvalidPurchaseException from './lib/InvalidPurchaseException.js';
import InvalidTSPolicyException from './lib/InvalidTSPolicyException.js';
import InvalidTSSetupException from './lib/InvalidTSSetupException.js';

// default maximum tickets, price, and seat allocation values as described in the given problem
// prices are in pence
const defaultTicketSystemPolicy = {
  maximumTickets: 20,
  adultPrice: 2000,
  childPrice: 1000,
  infantPrice: 0,
  adultSeat: 1,
  childSeat: 1,
  infantSeat: 0,
};

export default class TicketService {
  #ticketPaymentService;
  #seatReservationService;

  #maximumTickets;

  #adultPrice;
  #childPrice;
  #infantPrice;

  #adultSeat;
  #childSeat;
  #infantSeat;

  constructor({TicketPaymentService, SeatReservationService, ticketSystemPolicy = defaultTicketSystemPolicy}) {
    if (!TicketPaymentService || !SeatReservationService) {
      throw new InvalidTSSetupException('TicketPaymentService and SeatReservationService must be provided');
    }

    this.#validateTicketSystemPolicy(ticketSystemPolicy);

    this.#ticketPaymentService = new TicketPaymentService();
    this.#seatReservationService = new SeatReservationService();

    this.#maximumTickets = ticketSystemPolicy.maximumTickets;

    this.#adultPrice = ticketSystemPolicy.adultPrice;
    this.#childPrice = ticketSystemPolicy.childPrice;
    this.#infantPrice = ticketSystemPolicy.infantPrice;

    this.#adultSeat = ticketSystemPolicy.adultSeat;
    this.#childSeat = ticketSystemPolicy.childSeat;
    this.#infantSeat = ticketSystemPolicy.infantSeat;
  }

  purchaseTickets(accountId, ...ticketTypeRequests) {

    this.#validatePurchaseRequest(accountId, ...ticketTypeRequests);

    const totalNoOfTickets = this.#calculateTotalNoOfTickets(ticketTypeRequests);

    const totalAmountToPay = this.#calculateTotalAmountToPay(ticketTypeRequests);

    const totalSeatsToReserve = this.#calculateTotalSeatsToReserve(ticketTypeRequests);

    this.#seatReservationService.reserveSeat(accountId, totalSeatsToReserve);
    this.#ticketPaymentService.makePayment(accountId, totalAmountToPay);

    return `You have purchased ${totalNoOfTickets} tickets for a total of £${totalAmountToPay / 100} and reserved ${totalSeatsToReserve} seats.`;
  }

  #validateTicketSystemPolicy(ticketSystemPolicy) {
    if (!Number.isInteger(ticketSystemPolicy.maximumTickets) || ticketSystemPolicy.maximumTickets <= 0) {
      throw new InvalidTSPolicyException('maximumTickets must be a positive integer');
    }

    if (!Number.isInteger(ticketSystemPolicy.adultPrice) || ticketSystemPolicy.adultPrice < 0) {
      throw new InvalidTSPolicyException('adultPrice must be a non-negative integer');
    }

    if (!Number.isInteger(ticketSystemPolicy.childPrice) || ticketSystemPolicy.childPrice < 0) {
      throw new InvalidTSPolicyException('childPrice must be a non-negative integer');
    }

    if (!Number.isInteger(ticketSystemPolicy.infantPrice) || ticketSystemPolicy.infantPrice < 0) {
      throw new InvalidTSPolicyException('infantPrice must be a non-negative integer');
    }

    if (!Number.isInteger(ticketSystemPolicy.adultSeat) || ticketSystemPolicy.adultSeat < 1) {
      throw new InvalidTSPolicyException('adultSeat must be a positive integer');
    }

    if (!Number.isInteger(ticketSystemPolicy.childSeat) || ticketSystemPolicy.childSeat < 1) {
      throw new InvalidTSPolicyException('childSeat must be a positive integer');
    }

    if (!Number.isInteger(ticketSystemPolicy.infantSeat) || ticketSystemPolicy.infantSeat < 0) {
      throw new InvalidTSPolicyException('infantSeat must be a non-negative integer');
    }
  }

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
  }

  #calculateTotalNoOfTickets(ticketTypeRequests) {
    return ticketTypeRequests.reduce((total, ticketTypeRequest) => total + ticketTypeRequest.getNoOfTickets(), 0);
  }

  //!!!refactor
  #calculateTotalAmountToPay(ticketTypeRequests) {
    let totalAmountToPay = 0;

    ticketTypeRequests.forEach((ticketTypeRequest) => {
      switch (ticketTypeRequest.getTicketType()) {
        case 'ADULT':
          totalAmountToPay += this.#adultPrice * ticketTypeRequest.getNoOfTickets();
          break;
        case 'CHILD':
          totalAmountToPay += this.#childPrice * ticketTypeRequest.getNoOfTickets();
          break;
        case 'INFANT':
          totalAmountToPay += this.#infantPrice * ticketTypeRequest.getNoOfTickets();
          break;
      }
    });

    return totalAmountToPay;
  }

  //!!!refactor
  #calculateTotalSeatsToReserve(ticketTypeRequests) {
    let totalSeatsToReserve = 0;

    ticketTypeRequests.forEach((ticketTypeRequest) => {
      switch (ticketTypeRequest.getTicketType()) {
        case 'ADULT':
          totalSeatsToReserve += this.#adultSeat * ticketTypeRequest.getNoOfTickets();
          break;
        case 'CHILD':
          totalSeatsToReserve += this.#childSeat * ticketTypeRequest.getNoOfTickets();
          break;
        case 'INFANT':
          totalSeatsToReserve += this.#infantSeat * ticketTypeRequest.getNoOfTickets();
          break;
      }
    });

    return totalSeatsToReserve;
  }
};
/**
 * Default values for TicketService's ticket service policies.
 * Same object shape must be used for custom ticket service policies.
 * @typedef {object} ticketServicePolicy
 * @property {number} maximumTickets - Maximum number of tickets allowed to be purchased at a time.
 * @property {object} ticketTypes - All allowed ticket types.
 * @property {number} ticketTypes.<TICKETTYPE>.price - Price of particular ticket type in pence.
 * @property {number} ticketTypes.<TICKETTYPE>.seatAllocation - Number of seats allocated to particular ticket type.
 */
const defaultTicketServicePolicy = {
  maximumTickets: 20,
  ticketTypes: {
    ADULT: { price: 2000, seatAllocation: 1 },
    CHILD: { price: 1000, seatAllocation: 1 },
    INFANT: { price: 0, seatAllocation: 0 },
  }
};

export default defaultTicketServicePolicy;
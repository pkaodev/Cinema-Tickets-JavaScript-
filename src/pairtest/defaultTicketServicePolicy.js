const defaultTicketServicePolicy = {
    maximumTickets: 20,
    ticketTypes: {
      ADULT: { price: 2000, seatAllocation: 1 },
      CHILD: { price: 1000, seatAllocation: 1 },
      INFANT: { price: 0, seatAllocation: 0 },
    }
  };

export default defaultTicketServicePolicy;
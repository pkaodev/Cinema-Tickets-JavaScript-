import TicketService from "../src/pairtest/TicketService.js";
import TicketPaymentService from "../src/thirdparty/paymentgateway/TicketPaymentService.js";
import SeatReservationService from "../src/thirdparty/seatbooking/SeatReservationService.js";

const ticketPaymentService = new TicketPaymentService();
const seatReservationService = new SeatReservationService();


describe("TicketService", () => {

    //class exists
    //has properties

    //no ticket payment service
    //no seat reservation service
    //no ticket system policy

    //incorrect ticket system policy (each property)

    //correct seat allocation

    //correct price

    //correct number of tickets

    //errors:
    //not id + ticket requests
    //invalid ticket request
    //invalid account id
    //too many tickets
    //no adult

    //mutations:
    //ticketPaymentService
    //seatReservationService
    //ticketTypeRequest

});


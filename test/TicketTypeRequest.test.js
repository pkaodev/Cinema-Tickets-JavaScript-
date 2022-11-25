import TicketTypeRequest from "../src/pairtest/lib/TicketTypeRequest";

describe("TicketTypeRequest", () => {

    it("should be a class", () => {
        expect(Error).toBeInstanceOf(Function);
        expect(new TicketTypeRequest('ADULT', 1)).toBeInstanceOf(TicketTypeRequest);
    });

    it("should be immutable", () => {
        const ticketTypeRequest = new TicketTypeRequest('ADULT', 1);
        expect(() => ticketTypeRequest.type = 'CHILD').toThrow(TypeError);
        expect(() => ticketTypeRequest.noOfTickets = 2).toThrow(TypeError);
    });

    it("should have a constructor that takes two arguments", () => {
        expect(TicketTypeRequest).toHaveLength(2);
    });

    it("should throw an error if the first argument is not a string", () => {
        const notStrings = [1, 1.1, true, {}, [], () => { }, null, undefined, NaN, Symbol(), new Date(), new Map(), new Set(), new WeakMap(), new WeakSet(), BigInt(1), new Proxy({}, {})];
        notStrings.forEach(notString => {
            expect(() => new TicketTypeRequest(notString, 1)).toThrow(TypeError);
        });
    });

    it("should throw an error if the first argument is not 'ADULT', 'CHILD', or 'INFANT'", () => {
        const incorrectStrings = ['', ' ', 'adult', 'child', 'infant', 'ADULTS', 'CHILDREN', 'INFANTS', 'ADULT ', ' CHILD ', ' INFANT '];
        incorrectStrings.forEach(incorrectString => {
            expect(() => new TicketTypeRequest(incorrectString, 1)).toThrow(TypeError);
        });
    });

     it("should throw an error if the second argument is not a positive integer", () => {
        const notNonNegativeIntegers = ['string', 0, -1, 1.1, true, {}, [], () => { }, null, undefined, NaN, Symbol(), new Date(), new Map(), new Set(), new WeakMap(), new WeakSet(), BigInt(1), new Proxy({}, {})];
        notNonNegativeIntegers.forEach(notNonNegativeInteger => {
            expect(() => new TicketTypeRequest('ADULT', notNonNegativeInteger)).toThrow(TypeError);
        });
    });

    it("should have a getNoOfTickets method that returns the number of tickets", () => {
        const numberOfTickets = [1, 5, 10, 20, 21];
        numberOfTickets.forEach(numberOfTicket => {
            const ticketTypeRequest = new TicketTypeRequest('ADULT', numberOfTicket);
            expect(ticketTypeRequest.getNoOfTickets()).toBe(numberOfTicket);
        });
    });

    it("should have a getTicketType method that returns the ticket type", () => {
        const ticketTypes = ['ADULT', 'CHILD', 'INFANT'];
        ticketTypes.forEach(ticketType => {
            const ticketTypeRequest = new TicketTypeRequest(ticketType, 1);
            expect(ticketTypeRequest.getTicketType()).toBe(ticketType);
        });
    });
});


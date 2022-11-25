import TicketService from "../src/pairtest/TicketService.js";
import TicketPaymentService from "../src/thirdparty/paymentgateway/TicketPaymentService.js";
import SeatReservationService from "../src/thirdparty/seatbooking/SeatReservationService.js";
import InvalidPurchaseException from "../src/pairtest/lib/exceptions/InvalidPurchaseException.js";
import InvalidTicketServiceSetupException from "../src/pairtest/lib/exceptions/InvalidTicketServiceSetupException.js";
import defaultTicketServicePolicy from "../src/pairtest/defaultTicketServicePolicy.js";
import TicketTypeRequest from "../src/pairtest/lib/TicketTypeRequest.js";
import cloneDeep from "lodash/cloneDeep";


describe("TicketService", () => {
    const ticketPaymentService = new TicketPaymentService();
    const seatReservationService = new SeatReservationService();

    describe("basic", () => {

        it("should be a class", () => {
            expect(TicketService).toBeInstanceOf(Function);
            expect(new TicketService(ticketPaymentService, seatReservationService)).toBeInstanceOf(TicketService);
        });

        it("should be immutable", () => {
            const ticketService = new TicketService(ticketPaymentService, seatReservationService);
            expect(() => ticketService.ticketPaymentService = new TicketPaymentService()).toThrow(TypeError);
            expect(() => ticketService.seatReservationService = new SeatReservationService()).toThrow(TypeError);
        });
    });

    describe("constructor - required arguments", () => {

        it("should have a constructor that takes two required arguments", () => {
            expect(TicketService).toHaveLength(2);
        });

        it("should throw an error if the first ticketPaymentService argument is not an instance of TicketPaymentService", () => {
            const notTicketPaymentServices = ['string', 0, -1, 1, 1.1, true, {}, [], () => { }, null, undefined, NaN, Symbol(), new Date(), new Map(), new Set(), new WeakMap(), new WeakSet(), BigInt(1), new Proxy({}, {}), new TicketService(ticketPaymentService, seatReservationService), new SeatReservationService()];
            notTicketPaymentServices.forEach(notTicketPaymentService => {
                expect(() => new TicketService(notTicketPaymentService, seatReservationService)).toThrow(InvalidTicketServiceSetupException);
            });
        });

        it("should throw an error if the second seatReservationService argument is not an instance of SeatReservationService", () => {
            const notSeatReservationServices = ['string', 0, -1, 1, 1.1, true, {}, [], () => { }, null, undefined, NaN, Symbol(), new Date(), new Map(), new Set(), new WeakMap(), new WeakSet(), BigInt(1), new Proxy({}, {}), new TicketService(ticketPaymentService, seatReservationService), new TicketPaymentService()];
            notSeatReservationServices.forEach(notSeatReservationService => {
                expect(() => new TicketService(ticketPaymentService, notSeatReservationService)).toThrow(InvalidTicketServiceSetupException);
            });
        });

    });

    describe("purchaseTickets method", () => {

        const ticketService = new TicketService(ticketPaymentService, seatReservationService);
        const adultTicketRequest = new TicketTypeRequest('ADULT', 1);
        const childTicketRequest = new TicketTypeRequest('CHILD', 1);
        const infantTicketRequest = new TicketTypeRequest('INFANT', 1);

        it("should have a method called purchaseTickets", () => {
            expect(ticketService.purchaseTickets).toBeInstanceOf(Function);
        });

        it("should have a first argument accountId that is a positive integer", () => {
            const positiveIntegers = [1, 5, 10, 100, 999, 9999999];
            positiveIntegers.forEach(positiveInteger => {
                expect(() => ticketService.purchaseTickets(positiveInteger, adultTicketRequest)).not.toThrow();
            });
        });

        describe("correctly calculate number of tickets, price, and seats reserved", () => {

            it("for a single ADULT ticket", () => {
                const returnMessage = ticketService.purchaseTickets(1, adultTicketRequest);
                expect(returnMessage.tickets).toBe(1);
                expect(returnMessage.price).toBe(20);
                expect(returnMessage.seats).toBe(1);
            });

            it("for multiple ADULT tickets with a single request", () => {
                const returnMessage = ticketService.purchaseTickets(1, new TicketTypeRequest('ADULT', 20));
                expect(returnMessage.tickets).toBe(20);
                expect(returnMessage.price).toBe(400);
                expect(returnMessage.seats).toBe(20);
            });

            it("for multiple ADULT tickets with multiple requests", () => {
                const returnMessage = ticketService.purchaseTickets(1, adultTicketRequest, adultTicketRequest, adultTicketRequest);
                expect(returnMessage.tickets).toBe(3);
                expect(returnMessage.price).toBe(60);
                expect(returnMessage.seats).toBe(3);
            });

            it("for a single ADULT, CHILD, and INFANT each", () => {
                const returnMessage = ticketService.purchaseTickets(1, adultTicketRequest, childTicketRequest, infantTicketRequest);
                expect(returnMessage.tickets).toBe(3);
                expect(returnMessage.price).toBe(30);
                expect(returnMessage.seats).toBe(2);
            });

            it("for multiple ADULT, CHILD, and INFANT tickets with single requests", () => {
                const returnMessage = ticketService.purchaseTickets(1, new TicketTypeRequest('ADULT', 5), new TicketTypeRequest('CHILD', 5), new TicketTypeRequest('INFANT', 5));
                expect(returnMessage.tickets).toBe(15);
                expect(returnMessage.price).toBe(150);
                expect(returnMessage.seats).toBe(10);
            });

            it("for multiple ADULT, CHILD, and INFANT tickets with multiple requests", () => {
                const returnMessage = ticketService.purchaseTickets(1, adultTicketRequest, adultTicketRequest, adultTicketRequest, childTicketRequest, childTicketRequest, childTicketRequest, infantTicketRequest, infantTicketRequest, infantTicketRequest);
                expect(returnMessage.tickets).toBe(9);
                expect(returnMessage.price).toBe(90);
                expect(returnMessage.seats).toBe(6);
            });

            it("for 19 INFANTS and an adult with a very big lap", () => {
                const returnMessage = ticketService.purchaseTickets(1, new TicketTypeRequest('ADULT', 1), new TicketTypeRequest('INFANT', 19));
                expect(returnMessage.tickets).toBe(20);
                expect(returnMessage.price).toBe(20);
                expect(returnMessage.seats).toBe(1);
            });
        });

        describe("errors", () => {

            it("should throw an error if the first accountId argument is not a positive integer", () => {
                const notPositiveIntegers = ['string', 0, -1, 1.1, true, {}, [], () => { }, null, undefined, NaN, Symbol(), new Date(), new Map(), new Set(), new WeakMap(), new WeakSet(), BigInt(1), new Proxy({}, {})];
                notPositiveIntegers.forEach(notPositiveInteger => {
                    expect(() => ticketService.purchaseTickets(notPositiveInteger, adultTicketRequest)).toThrow(InvalidPurchaseException);
                });
            });

            it("should throw an error if any subsequent ticketType argument is not an instance of TicketTypeRequest", () => {
                const notTicketTypeRequests = ['string', 0, -1, 1, 1.1, true, {}, [], () => { }, null, undefined, NaN, Symbol(), new Date(), new Map(), new Set(), new WeakMap(), new WeakSet(), BigInt(1), new Proxy({}, {})];
                notTicketTypeRequests.forEach(notTicketTypeRequest => {
                    expect(() => ticketService.purchaseTickets(1, notTicketTypeRequest, adultTicketRequest)).toThrow(InvalidPurchaseException);
                });
            });

            it("should throw an error if the total number of tickets exceeds the maximum number of tickets allowed", () => {
                const tooManyTicketsRequest = new TicketTypeRequest('ADULT', 21);
                expect(() => ticketService.purchaseTickets(1, tooManyTicketsRequest)).toThrow(InvalidPurchaseException);
            });

            it("should throw an error if there is no ADULT ticket purchased", () => {
                expect(() => ticketService.purchaseTickets(1, childTicketRequest)).toThrow(InvalidPurchaseException);
                expect(() => ticketService.purchaseTickets(1, infantTicketRequest)).toThrow(InvalidPurchaseException);
                expect(() => ticketService.purchaseTickets(1, childTicketRequest, infantTicketRequest)).toThrow(InvalidPurchaseException);
            });
        });
    });

    describe("mutations", () => {

        it("should not mutate the ticketPaymentService or seatReservationService", () => {
            const ticketPaymentService = new TicketPaymentService();
            const seatReservationService = new SeatReservationService();

            const ticketPaymentServiceClone = cloneDeep(ticketPaymentService);
            const seatReservationServiceClone = cloneDeep(seatReservationService);

            const ticketService = new TicketService(ticketPaymentService, seatReservationService);

            ticketService.purchaseTickets(1, new TicketTypeRequest('ADULT', 1));

            expect(ticketPaymentService).toEqual(ticketPaymentServiceClone);
            expect(seatReservationService).toEqual(seatReservationServiceClone);
        });
    });

    describe("constructor - optional ticket service policy", () => {

        it("should take an optional third 'ticketServicePolicy' argument", () => {
            const optionalticketServicePolicy = {
                maximumTickets: 10,
                ticketTypes: {
                    ADULT: { price: 1000, seatAllocation: 2 },
                    CHILD: { price: 500, seatAllocation: 2 },
                    INFANT: { price: 250, seatAllocation: 1 },
                    STUDENT: { price: 800, seatAllocation: 2 }
                }
            };
            const ticketService = new TicketService(ticketPaymentService, seatReservationService, optionalticketServicePolicy);
            expect(ticketService).toBeInstanceOf(TicketService);
        });

        it("should affect the maximum number of tickets, price, number of seats reserved when purchasing tickets", () => {
            const optionalticketServicePolicy = {
                maximumTickets: 50,
                ticketTypes: {
                    ADULT: { price: 1000, seatAllocation: 2 },
                    CHILD: { price: 500, seatAllocation: 1 },
                    INFANT: { price: 250, seatAllocation: 1 }
                }
            };
            const ticketService = new TicketService(ticketPaymentService, seatReservationService, optionalticketServicePolicy);
            const returnMessage = ticketService.purchaseTickets(1, new TicketTypeRequest('ADULT', 20), new TicketTypeRequest('CHILD', 20), new TicketTypeRequest('INFANT', 10));
            expect(returnMessage.tickets).toBe(50);
            expect(returnMessage.price).toBe(325);
            expect(returnMessage.seats).toBe(70);
        });



        it("should throw an error if the ticketServicePolicy is missing the maximumTickets property", () => {
            const missingMaximumTickets = {
                ticketTypes: {
                    ADULT: { price: 1000, seatAllocation: 1 },
                }
            };
            expect(() => new TicketService(ticketPaymentService, seatReservationService, missingMaximumTickets)).toThrow(InvalidTicketServiceSetupException);
        });

        it("should throw an error if maximumTickets is not a positive integer", () => {
            const zeroMaximumTickets = {
                maximumTickets: 0,
                ticketTypes: {
                    ADULT: { price: 1000, seatAllocation: 1 },
                }
            };
            const negativeMaximumTickets = {
                maximumTickets: -1,
                ticketTypes: {
                    ADULT: { price: 1000, seatAllocation: 1 },
                }
            };
            const nonIntegerMaximumTickets = {
                maximumTickets: 1.1,
                ticketTypes: {
                    ADULT: { price: 1000, seatAllocation: 1 },
                }
            };
            const notANumberMaximumTickets = {
                maximumTickets: NaN,
                ticketTypes: {
                    ADULT: { price: 1000, seatAllocation: 1 },
                }
            };
            const notAPositiveIntegerMaximumTickets = [zeroMaximumTickets, negativeMaximumTickets, nonIntegerMaximumTickets, notANumberMaximumTickets];
            notAPositiveIntegerMaximumTickets.forEach(notAPositiveIntegerMaximumTicket => {
                expect(() => new TicketService(ticketPaymentService, seatReservationService, notAPositiveIntegerMaximumTicket)).toThrow(InvalidTicketServiceSetupException);
            });
        });

        it("should throw an error if the ticketServicePolicy is missing the ticketTypes property", () => {
            const missingTicketTypes = {
                maximumTickets: 10,
            };
            expect(() => new TicketService(ticketPaymentService, seatReservationService, missingTicketTypes)).toThrow(InvalidTicketServiceSetupException);
        });

        it("should throw an error if a ticketType is missing the price property", () => {
            const missingPrice = {
                maximumTickets: 10,
                ticketTypes: {
                    ADULT: { seatAllocation: 1 },
                    CHILD: { price: 500, seatAllocation: 1 },
                }
            };
            expect(() => new TicketService(ticketPaymentService, seatReservationService, missingPrice)).toThrow(InvalidTicketServiceSetupException);
        });

        it("should throw an error if a ticketType is missing the seatAllocation property", () => {
            const missingSeatAllocation = {
                maximumTickets: 10,
                ticketTypes: {
                    ADULT: { price: 1000 },
                    CHILD: { price: 500, seatAllocation: 1 },
                }
            };
            expect(() => new TicketService(ticketPaymentService, seatReservationService, missingSeatAllocation)).toThrow(InvalidTicketServiceSetupException);
        });
    });
});
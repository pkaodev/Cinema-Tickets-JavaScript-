import TicketService from "../src/pairtest/TicketService.js";
import TicketPaymentService from "../src/thirdparty/paymentgateway/TicketPaymentService.js";
import SeatReservationService from "../src/thirdparty/seatbooking/SeatReservationService.js";
import InvalidPurchaseException from "../src/pairtest/lib/exceptions/InvalidPurchaseException.js";
import InvalidTicketServiceSetupException from "../src/pairtest/lib/exceptions/InvalidTicketServiceSetupException.js";
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
            expect(() => ticketService.maximumTickets = 10).toThrow(TypeError);
            expect(() => ticketService.ticketTypes = { ADULT: { price: 2000, seatAllocation: 1 } }).toThrow(TypeError);
        });
    });

    describe("constructor - required arguments", () => {

        it("should have a constructor that takes two required arguments", () => {
            expect(TicketService).toHaveLength(2);
        });

        it("should throw an error if the first ticketPaymentService argument is not an instance of TicketPaymentService", () => {
            expect(() => new TicketService('incorrectDataType', seatReservationService)).toThrow(InvalidTicketServiceSetupException);
        });

        it("should throw an error if the second seatReservationService argument is not an instance of SeatReservationService", () => {
            expect(() => new TicketService(ticketPaymentService, 'incorrectDataType')).toThrow(InvalidTicketServiceSetupException);
        });
    });

    describe("purchaseTickets method", () => {

        let  ticketService;

        beforeEach(() => {
            ticketService = new TicketService(ticketPaymentService, seatReservationService);
        });

        const adultTicketRequest = new TicketTypeRequest('ADULT', 1);
        const childTicketRequest = new TicketTypeRequest('CHILD', 1);
        const infantTicketRequest = new TicketTypeRequest('INFANT', 1);

        it("should have a method called purchaseTickets", () => {
            expect(ticketService.purchaseTickets).toBeInstanceOf(Function);
        });

        it("should have a first argument accountId that accepts a positive integer", () => {
            const positiveIntegers = [1, 5, 10, 100, 999, 9999999];
            positiveIntegers.forEach(positiveInteger => {
                expect(() => ticketService.purchaseTickets(positiveInteger, adultTicketRequest)).not.toThrow();
            });
        });

        it("should have a second argument ticketTypeRequests that accepts a ticketTypeRequest object", () => {
            expect(() => ticketService.purchaseTickets(1, adultTicketRequest)).not.toThrow();
        });

        it("should return an object with text, price, tickets and seats values", () => {
            const returnMessage = ticketService.purchaseTickets(1, adultTicketRequest);
            expect(returnMessage).toContainAllEntries([['text', expect.any(String)], ['price', expect.any(Number)], ['tickets', expect.any(Number)], ['seats', expect.any(Number)]]);
        });

        describe("correctly calculate number of tickets, price, and seats reserved", () => {


            it("for a single ADULT ticket", () => {
                const returnMessage = ticketService.purchaseTickets(1, adultTicketRequest);
                expect(returnMessage).toContainEntries([['price', 20], ['tickets', 1], ['seats', 1]]);
            });

            it("for multiple ADULT tickets with a single request", () => {
                const returnMessage = ticketService.purchaseTickets(1, new TicketTypeRequest('ADULT', 20));
                expect(returnMessage).toContainEntries([['price', 400], ['tickets', 20], ['seats', 20]]);
            });

            it("for multiple ADULT tickets with multiple requests", () => {
                const returnMessage = ticketService.purchaseTickets(1, adultTicketRequest, adultTicketRequest, adultTicketRequest);
                expect(returnMessage).toContainEntries([['price', 60], ['tickets', 3], ['seats', 3]]);
            });

            it("for a single ADULT, CHILD, and INFANT each", () => {
                const returnMessage = ticketService.purchaseTickets(1, adultTicketRequest, childTicketRequest, infantTicketRequest);
                expect(returnMessage).toContainEntries([['price', 30], ['tickets', 3], ['seats', 2]]);
            });

            it("for multiple ADULT, CHILD, and INFANT tickets with single requests", () => {
                const returnMessage = ticketService.purchaseTickets(1, new TicketTypeRequest('ADULT', 5), new TicketTypeRequest('CHILD', 5), new TicketTypeRequest('INFANT', 5));
                expect(returnMessage).toContainEntries([['price', 150], ['tickets', 15], ['seats', 10]]);
            });

            it("for multiple ADULT, CHILD, and INFANT tickets with multiple requests", () => {
                const returnMessage = ticketService.purchaseTickets(1, adultTicketRequest, adultTicketRequest, adultTicketRequest, childTicketRequest, childTicketRequest, childTicketRequest, infantTicketRequest, infantTicketRequest, infantTicketRequest);
                expect(returnMessage).toContainEntries([['price', 90], ['tickets', 9], ['seats', 6]]);
            });

            it("for 19 INFANTS and an ADULT with a very big lap", () => {
                const returnMessage = ticketService.purchaseTickets(1, new TicketTypeRequest('ADULT', 1), new TicketTypeRequest('INFANT', 19));
                expect(returnMessage).toContainEntries([['price', 20], ['tickets', 20], ['seats', 1]]);
            });

            it("for multiple purchases", () => {
                const returnMessage1 = ticketService.purchaseTickets(1, adultTicketRequest, childTicketRequest);
                const returnMessage2 = ticketService.purchaseTickets(2, adultTicketRequest, infantTicketRequest);
                const returnMessage3 = ticketService.purchaseTickets(3, adultTicketRequest, childTicketRequest, infantTicketRequest);
                expect(returnMessage1).toContainEntries([['price', 30], ['tickets', 2], ['seats', 2]]);
                expect(returnMessage2).toContainEntries([['price', 20], ['tickets', 2], ['seats', 1]]);
                expect(returnMessage3).toContainEntries([['price', 30], ['tickets', 3], ['seats', 2]]);
            });
        });

        describe("errors", () => {

            it("should throw an error if the first accountId argument is not a positive integer", () => {
                const notPositiveIntegers = ['1', 0, -1, 1.1];
                notPositiveIntegers.forEach(notPositiveInteger => {
                    expect(() => ticketService.purchaseTickets(notPositiveInteger, adultTicketRequest)).toThrow(InvalidPurchaseException);
                });
            });

            it("should throw an error if any subsequent ticketType argument is not an instance of TicketTypeRequest", () => {
                const notTicketTypeRequests = ['ticketTypeRequest', -1, 0, 1, 1.1];
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

        it("should not mutate the ticketTypeRequest objects", () => {
            const ticketService = new TicketService(new TicketPaymentService(), new SeatReservationService());

            const adultTicketRequest = new TicketTypeRequest('ADULT', 1);
            const ticketTypeRequestClone = cloneDeep(adultTicketRequest);

            ticketService.purchaseTickets(1, adultTicketRequest);

            expect(adultTicketRequest).toEqual(ticketTypeRequestClone);
        });

    });

    describe("constructor - optional ticket service policy", () => {

        it("should take an optional third 'ticketServicePolicy' argument", () => {
            const optionalticketServicePolicy = {
                maximumTickets: 10,
                ticketTypes: {
                    ADULT: { price: 1000, seatAllocation: 2 },
                    CHILD: { price: 500, seatAllocation: 1 },
                    INFANT: { price: 250, seatAllocation: 1 },
                    STUDENT: { price: 800, seatAllocation: 2 }
                }
            };
            expect(() => new TicketService(ticketPaymentService, seatReservationService, optionalticketServicePolicy)).not.toThrow();
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
            expect(returnMessage).toContainEntries([['price', 325], ['tickets', 50], ['seats', 70]]);
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
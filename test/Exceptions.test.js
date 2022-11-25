import InvalidPurchaseException from "../src/pairtest/lib/exceptions/InvalidPurchaseException";
import InvalidTicketServiceSetupException from "../src/pairtest/lib/exceptions/InvalidTicketServiceSetupException";


describe("Exceptions", () => {

    describe("InvalidPurchaseException", () => {

        it("should be an instance of Error", () => {
            const exception = new InvalidPurchaseException();
            expect(exception).toBeInstanceOf(Error);
        });
        it("should have a name of InvalidPurchaseException", () => {
            const exception = new InvalidPurchaseException();
            expect(exception.name).toBe("InvalidPurchaseException");
        });
    });

    describe("InvalidTicketServiceSetupException", () => {

        it("should be an instance of Error", () => {
            const exception = new InvalidTicketServiceSetupException();
            expect(exception).toBeInstanceOf(Error);
        });
        it("should have a name of InvalidTicketServiceSetupException", () => {
            const exception = new InvalidTicketServiceSetupException();
            expect(exception.name).toBe("InvalidTicketServiceSetupException");
        });
    });
});
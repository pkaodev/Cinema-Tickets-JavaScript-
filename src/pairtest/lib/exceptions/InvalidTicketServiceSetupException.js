export default class InvalidTicketServiceSetupException extends Error {
    constructor(message) {
      super(message);
      this.name = "InvalidTicketServiceSetupException";
    }
  }
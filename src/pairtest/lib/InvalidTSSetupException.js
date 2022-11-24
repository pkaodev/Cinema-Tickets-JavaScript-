// for not calling TicketService constructor with needed argument object
export default class InvalidTSSetupException extends Error {
    constructor(message) {
      super(message);
      this.name = "InvalidTSSetupException";
    }
  }
// for invalid optional ticket system policy object
export default class InvalidTSPolicyException extends Error {
  constructor(message) {
    super(message);
    this.name = "InvalidTSPolicyException";
  }
}
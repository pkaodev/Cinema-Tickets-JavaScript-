/** Represents an invalid purchase request. */
export default class InvalidPurchaseException extends Error {
	constructor(message) {
		super(message);
		this.name = "InvalidPurchaseException";
	}
}

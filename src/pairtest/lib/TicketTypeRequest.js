/**
 * Represents a request for single/multiple tickets of a specific ticket type.
 * @typedef {object} ticketTypeRequest
 */
export default class TicketTypeRequest {
	#type;

	#noOfTickets;

	constructor(type, noOfTickets) {
		if (!this.#allowedTypes.includes(type)) {
			throw new TypeError(`type must be ${this.#allowedTypes.slice(0, -1).join(', ')}, or ${this.#allowedTypes.slice(-1)}`);
		}

		if (!Number.isInteger(noOfTickets) || noOfTickets <= 0) {
			throw new TypeError('noOfTickets must be a postive integer');
		}

		this.#type = type;
		this.#noOfTickets = noOfTickets;

		Object.freeze(this);
	}

	getNoOfTickets() {
		return this.#noOfTickets;
	}

	getTicketType() {
		return this.#type;
	}

	#allowedTypes = ['ADULT', 'CHILD', 'INFANT'];
}

# Cinema Tickets (JavaScript)
This is my submission for the cinema tickets coding exercise.

To see the code working install the dependencies and run the tests from the root directory with the command:
```
npm i && npm t
```

You will need **node version 16.15.1 or higher** installed.

<br />

# Design overview
Interfaces which were already provided (e.g. the parameters for the ticket service's `purchaseTickets` public method) have been left them as they were.

<br />

## Infant seat allocation assumption
From the task README:
> "Infants... are not allocated a seat. They will be sitting on an Adult's lap."

Has been interpreted literally as any number of infants can sit on an adult's lap.  If we wanted to enforce a maximum number of infants per adult, a `maxInfantsPerAdult` property could be added to the `TicketService` class along with an additional check in the `#validatePurchaseRequest` method.



<br />

## TicketService class
- Is passed **instances** of the payment/seat reservation classes in the constructor
- Has an optional policy parameter in the constructor to set the maximum tickets that can be purchased, ticket types, prices, and seats allocated.  If it is left empty, the default policy is used (all the values given in the task README).
- Has one public method, `purchaseTickets` which (if the purchase request is successful) returns a response object:
<br/><pre><code>{
    text: "You have purchased 2 tickets for a total of £30 and reserved 2 seats",
    tickets: 2,
    price: 30,
    seats: 2
    }</code></pre>

- Has several private methods which are used to validate ticket system instantiation and ticket purchase requests, calculate price/seat allocation/number of tickets, and make payments/seat reservations.
- Throws exceptions if the class is incorrectly instantiated or if the purchase request is invalid (see **Future improvements** below for comments on this).

<br />

## TicketTypeRequest class
- The second check in the constructor is now more strict and only allows positive integers for `noOfTickets`.
- Instances are now immutable.

<br />

## Exceptions
- Added `InvalidTicketSystemSetupException` and made both custom exceptions extensions of the `Error` class.

<br />

## Testing
`Jest` is used for testing along with additional matchers provided by `jest-extended`.  Tests have been split for:
- `TicketService` class
- `TicketTypeRequest` class
- Custom exceptions `InvalidTicketServiceSetupException` and `InvalidPurchaseException`


<br />

## Future improvements
- Currently failed purchase attepts using the `purchaseTickets` method simply throw an exception.  It might be better to handle those errors differently and have the method still return a response object.  The response object could have a `success` property which is set to `true` or `false` depending on the outcome, and the `text` property could be set to the exception's error message if the purchase failed.
- Static type checking (e.g. TypeScript) to ensure correct types are passed in and returned, and reduce the number of validation checks/tests which currently have to be made.
- It would be beneficial to have a single source of truth for allowed ticket types.  Currently if  more ticket types were to be added, this would have to be done in 2 places, the ticket service policy and the TicketTypeRequest class.  
 - Expand the ticket service policy object to include conditions like "1 adult is needed for each infant".  This would allow us to more easily make checks in the `#validatePurchaseRequest` method.

var stripe = Stripe(
  'pk_test_51KrPAEIoaoPo9JImxNYIozE8UMFyN28Wd5QNVVKLOo1370pTucwH0Arg8gTNbVlvQoP893e7zAVIVBRnrraNKYJb000xrvhaxL'
);

var elements = stripe.elements();
// Set up Stripe.js and Elements to use in checkout form
var style = {
  base: {
    color: '#32325d',
    fontFamily: '"Helvetica Neue", Helvetica, sans-serif',
    fontSmoothing: 'antialiased',
    fontSize: '16px',
    '::placeholder': {
      color: '#aab7c4',
    },
  },
  invalid: {
    color: '#fa755a',
    iconColor: '#fa755a',
  },
};

var cardElement = elements.create('card', { style: style });
cardElement.mount('#card-element');

var form = document.getElementById('payment-form');

form.addEventListener('submit', function (event) {
  // We don't want to let default form submission happen here,
  // which would refresh the page.
  event.preventDefault();

  stripe
    .createPaymentMethod({
      type: 'card',
      card: cardElement,
      billing_details: {
        // Include any additional collected billing details.
        name: 'Jenny Rosen',
      },
    })
    .then(stripePaymentMethodHandler);
});

function stripePaymentMethodHandler(result) {
  if (result.error) {
    // Show error in payment form
    console.log(result.error);
  } else {
    console.log('method-id', result.paymentMethod.id);
    // Otherwise send paymentMethod.id to your server (see Step 4)
    fetch('http://localhost:8000/api/stripe/pay', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        payment_method_id: result.paymentMethod.id,
        restaurantId: '2054946f-5589-4cf7-b83e-490ce41e020e',
        amount: 542100,
      }),
    })
      .then(function (result) {
        // Handle server response (see Step 4)
        console.log(result);
        result.json().then(function (json) {
          handleServerResponse(json);
        });
      })
      .catch(function (result) {
        console.log(result);
      });
  }
}

function handleServerResponse(response) {
  console.log('server response: ' + JSON.stringify(response));
  if (response.error) {
    // Show error from server on payment form
  } else if (response.requires_action) {
    // Use Stripe.js to handle required card action
    stripe.handleCardAction(response.client_secret).then(handleStripeJsResult);
  } else {
    // Show success message
  }
}

function handleStripeJsResult(result) {
  console.log('heere');
  console.log('result: ' + JSON.stringify(result));
  if (result.error) {
    // Show error in payment form
  } else {
    // The card action has been handled
    // The PaymentIntent can be confirmed again on the server
    fetch('http://localhost:8000/api/stripe/pay', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ payment_intent_id: result.paymentIntent.id }),
    })
      .then(function (confirmResult) {
        return confirmResult.json();
      })
      .then(handleServerResponse);
  }
}

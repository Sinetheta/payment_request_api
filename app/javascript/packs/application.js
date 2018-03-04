/* eslint no-console:0 */
// This file is automatically compiled by Webpack, along with any other files
// present in this directory. You're encouraged to place your actual application logic in
// a relevant structure within app/javascript and only use these pack files to reference
// that code so it'll be compiled.
//
// To reference this file, add <%= javascript_pack_tag 'application' %> to the appropriate
// layout file, like app/views/layouts/application.html.erb

console.log('Hello World from Webpacker')

function status(response) {
  if (response.status >= 200 && response.status < 300) {
    return Promise.resolve(response);
  } else {
    return Promise.reject(new Error(response.statusText));
  }
}

function fetchData(url, options) {
  let opts = Object.assign({ credentials: 'same-origin' }, options);
  return fetch(url, opts)
    .then(status)
    .then(response => response.json());
}

function postData(url, data) {
  return fetchData(url, {
    method: 'PUT',
    headers: {
      'content-type': 'application/json'
    },
    body: JSON.stringify(data)
  });
}

// import { Application } from "stimulus"
// import { definitionsFromContext } from "stimulus/webpack-helpers"
//
// const application = Application.start()
// const context = require.context("controllers", true, /.js$/)
// application.load(definitionsFromContext(context))

let paymentMethods = [
  { supportedMethods: ['basic-card'] }
];

let buildPaymentOptions = function(currentOrder) {
  return {
    requestPayerName: true,
    requestPayerPhone: true,
    requestPayerEmail: true,
    requestShipping: true,
    shippingType: 'shipping', // 'shipping', 'delivery', or 'pickup'
    // shippingOptions: buildShippingOptions(shippingOptions, shippingOptionId)
  };
};

let displaySubtotal = function(currentOrder) {
  return {
    label: 'Subtotal',
    amount: {
      currency: currentOrder.currency,
      value: currentOrder.item_total
    }
  };
};

let displayShipping = function(currentOrder) {
  return {
    label: 'Shipping',
    amount: {
      currency: currentOrder.currency,
      value: currentOrder.ship_total
    }
  };
};

let displayTax = function(currentOrder, isFinal) {
  return {
    label: 'Tax',
    pending: !isFinal,
    amount: {
      currency: currentOrder.currency,
      value: currentOrder.tax_total
    }
  };
};

let displayTotal = function(currentOrder) {
  return {
    label: 'Total',
    amount: {
      currency: currentOrder.currency,
      value: currentOrder.total
    }
  };
};

let buildShippingOptions = function(shippingOptions, shippingOptionId) {
  debugger;
  return shippingOptions.map(function(option) {
    return {
      id: option.id,
      label: option.label,
      amount: { currency: 'USD', value: String(option.price) },
      selected: option.id === shippingOptionId
    };
  });
};

let buildPaymentDetails = function(currentOrder, shippingOptions, shippingOptionId) {
  let allDisplayItems = []
  let hasSelectedShipping = !!shippingOptionId;

  allDisplayItems.push(displaySubtotal(currentOrder));
  allDisplayItems.push(displayTax(currentOrder, hasSelectedShipping));
  if(hasSelectedShipping) allDisplayItems.push(displayShipping(currentOrder));

  return {
    allDisplayItems: allDisplayItems,
    total: displayTotal(currentOrder)
  };
}

let getCurrentOrder = function() {
  return fetchData('/api/orders/current');
};

let updateOrder = function(orderId, orderData) {
  return postData(`/api/orders/${orderId}`, { order: orderData });
};

/**
 * Updates a Spree::Order#ship_address from a PaymentAddress
 *
 * @async
 * @function updateShipAddress
 * @param {string} orderId - The id of the spree order to update.
 * @param {PaymentAddress} shipAddress - The new ship address information.
 * @return {Promise<Object>} The new order data.
 */
let updateShipAddress = function(orderId, shipAddress) {
  let firstName = shipAddress.recipient.split(' ').slice(0, -1).join(' ');
  let lastName = shipAddress.recipient.split(' ').slice(-1);
  return updateOrder(orderId, {
    ship_address_attributes: {
      firstname: firstName,
      lastname: lastName,
      address1: shipAddress.addressLine[0],
      address2: shipAddress.addressLine[1],
      city: shipAddress.city,
      zipcode: shipAddress.postalCode,
      phone: shipAddress.phone,
      organization: shipAddress.organization,
      country_code: shipAddress.country,
      state_code: shipAddress.region
    }
  });
}

let requestPayment = function(currentOrder) {
  let details = buildPaymentDetails(currentOrder);
  let options = buildPaymentOptions(currentOrder);
  let paymentRequest = new PaymentRequest(paymentMethods, details, options)
  paymentRequest.addEventListener('shippingaddresschange', (e) => {
    e.updateWith((_ => {
      let shippingAddress = paymentRequest.shippingAddress // send to server
      updateShipAddress(currentOrder.id, paymentRequest.shippingAddress);
      return Promise.resolve(buildPaymentDetails(currentOrder));
    })());
  });
  return  paymentRequest.show()
};

// Show a native Payment Request UI and handle the result
let onClickCheckout = function(e) {
  let currentOrder = e.data;
  e.preventDefault();
  requestPayment(currentOrder)
    .then(console.log)
    .catch(console.error);
}

let setupRequestPaymentButton = function(checkoutLink) {
  getCurrentOrder().then(function(currentOrder) {
    console.log(currentOrder)
    checkoutLink.on('click', null, currentOrder, onClickCheckout);
  });
}

$(function() {
  let $checkoutLink = $('#checkout-link');
  if($checkoutLink.length && window.PaymentRequest) setupRequestPaymentButton($checkoutLink);
});

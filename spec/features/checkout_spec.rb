# frozen_string_literal: true

require 'rails_helper'

describe 'Checkout', js: true do
  include_context 'checkout setup'

  let!(:payment_method) { create(:credit_card_payment_method) }

  scenario 'guest checkout' do
    add_mug_to_cart

    click_on 'Checkout'
    fill_in 'order_email', with: 'test@example.com'
    click_on 'Continue'
    fill_in_address
    click_on 'Save and Continue'
    click_on 'Save and Continue'

    fill_in_credit_card(number: '4111 1111 1111 1111')
    click_on 'Save and Continue'

    click_on 'Place Order'
    expect(page).to have_content('Your order has been processed successfully')
  end

  def fill_in_credit_card(number:)
    fill_in 'Card Number', with: number
    fill_in 'Expiration', with: '12 / 24'
    fill_in 'Card Code', with: '123'
  end

  def fill_in_address
    address = 'order_bill_address_attributes'
    fill_in "#{address}_firstname", with: 'Ryan'
    fill_in "#{address}_lastname", with: 'Bigg'
    fill_in "#{address}_address1", with: '143 Swan Street'
    fill_in "#{address}_city", with: 'Richmond'
    select 'United States of America', from: "#{address}_country_id"
    select 'Alabama', from: "#{address}_state_id"
    fill_in "#{address}_zipcode", with: '12345'
    fill_in "#{address}_phone", with: '(555) 555-5555'
  end

  def add_mug_to_cart
    visit spree.root_path
    click_link mug.name
    click_button 'add-to-cart-button'
  end
end

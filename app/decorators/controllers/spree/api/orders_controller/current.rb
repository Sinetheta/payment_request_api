module Spree::Api
  module OrdersControllers
    module Current
      def self.prepended(klass)
        klass.skip_before_action :authenticate_user, only: [:apply_coupon_code, :current]
      end

      def current
        @order = Spree::Order.incomplete.find_or_initialize_by(guest_token: cookies.signed[:guest_token])
        respond_with(@order, default_template: :show, locals: { root_object: @order })
      end

      OrdersController.prepend(self)
    end
  end
end

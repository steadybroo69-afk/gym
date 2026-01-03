import React from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { Button } from '../components/ui/button';
import { Trash2, Plus, Minus, Tag, Truck } from 'lucide-react';

const FREE_SHIPPING_THRESHOLD = 100;

const Cart = () => {
  const navigate = useNavigate();
  const { cart, removeFromCart, updateQuantity, getCartTotals, getCartCount } = useCart();

  const handleCheckout = () => {
    navigate('/checkout');
  };

  const { subtotal, discount, discountDescription, total } = getCartTotals();
  const amountToFreeShipping = FREE_SHIPPING_THRESHOLD - total;
  const hasFreeShipping = total >= FREE_SHIPPING_THRESHOLD;

  if (cart.length === 0) {
    return (
      <div className="cart-page">
        <div className="container">
          <div className="cart-empty">
            <h1 className="cart-title">Your Cart</h1>
            <p className="cart-empty-message">Your cart is empty</p>
            <Link to="/#collection">
              <Button className="btn-primary">Continue Shopping</Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="cart-page">
      <div className="container">
        <h1 className="cart-title">Your Cart ({getCartCount()} {getCartCount() === 1 ? 'item' : 'items'})</h1>

        {/* Free Shipping Progress Bar */}
        <div className="free-shipping-banner">
          {hasFreeShipping ? (
            <div className="free-shipping-unlocked">
              <Truck size={20} />
              <span>You've unlocked <strong>FREE shipping!</strong></span>
            </div>
          ) : (
            <div className="free-shipping-progress">
              <div className="shipping-message">
                <Truck size={18} />
                <span>You're <strong>${amountToFreeShipping.toFixed(2)}</strong> away from <strong>FREE shipping!</strong></span>
              </div>
              <div className="shipping-progress-bar">
                <div 
                  className="shipping-progress-fill" 
                  style={{ width: `${Math.min((total / FREE_SHIPPING_THRESHOLD) * 100, 100)}%` }}
                ></div>
              </div>
              <Link to="/#collection" className="add-more-link">Add another item →</Link>
            </div>
          )}
        </div>

        <div className="cart-grid">
          {/* Cart Items */}
          <div className="cart-items-section">
            {cart.map((item, index) => (
              <div key={index} className="cart-item">
                <div className="cart-item-image">
                  {item.image ? (
                    <img src={item.image} alt={item.productName} />
                  ) : (
                    <div className="cart-item-placeholder">{item.productName}</div>
                  )}
                </div>

                <div className="cart-item-details">
                  <h3 className="cart-item-name">{item.productName}</h3>
                  <p className="cart-item-variant">
                    {item.color} / {item.size}
                  </p>
                  <p className="cart-item-price">${item.price}</p>
                </div>

                <div className="cart-item-quantity">
                  <button
                    className="quantity-btn"
                    onClick={() => updateQuantity(item.productId, item.color, item.size, item.quantity - 1)}
                  >
                    <Minus size={16} />
                  </button>
                  <span className="quantity-value">{item.quantity}</span>
                  <button
                    className="quantity-btn"
                    onClick={() => updateQuantity(item.productId, item.color, item.size, item.quantity + 1)}
                  >
                    <Plus size={16} />
                  </button>
                </div>

                <div className="cart-item-total">
                  <p className="item-total-price">${(item.price * item.quantity).toFixed(2)}</p>
                  <button
                    className="remove-btn"
                    onClick={() => removeFromCart(item.productId, item.color, item.size)}
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Order Summary */}
          <div className="cart-summary">
            <h2 className="summary-title">Order Summary</h2>

            <div className="summary-line">
              <span>Subtotal</span>
              <span>${subtotal.toFixed(2)}</span>
            </div>

            {discount > 0 && (
              <div className="summary-line discount">
                <span className="discount-label">
                  <Tag size={14} />
                  {discountDescription.split('|')[0].trim()}
                </span>
                <span>-${discount.toFixed(2)}</span>
              </div>
            )}

            <div className="summary-line">
              <span>Shipping</span>
              <span>Calculated at checkout</span>
            </div>

            <div className="summary-divider"></div>

            <div className="summary-line summary-total">
              <span>Total</span>
              <span>${total.toFixed(2)}</span>
            </div>

            {/* Discount hints */}
            <div className="discount-hints">
              <p><Tag size={12} /> Buy 2 shirts, get 20% off</p>
              <p><Tag size={12} /> Buy 3+ shirts, get 35% off</p>
              <p><Tag size={12} /> Shirt + Shorts bundle: $69</p>
            </div>

            <Button 
              className="btn-primary btn-large"
              onClick={handleCheckout}
            >
              Proceed to Checkout
            </Button>

            <Link to="/#products" className="continue-shopping">
              Continue Shopping
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Cart;
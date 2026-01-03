import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { User, Package, ChevronRight, LogOut, Loader2, Gift, Tag } from 'lucide-react';

const Dashboard = () => {
  const navigate = useNavigate();
  const { user, logout, getUserOrders, isAuthenticated, loading, hasFirstOrderDiscount } = useAuth();
  const [orders, setOrders] = useState([]);
  const [ordersLoading, setOrdersLoading] = useState(true);

  // Redirect if not authenticated
  useEffect(() => {
    if (!loading && !isAuthenticated) {
      navigate('/login');
    }
  }, [loading, isAuthenticated, navigate]);

  // Fetch orders
  useEffect(() => {
    const fetchOrders = async () => {
      if (!isAuthenticated) return;
      
      try {
        const userOrders = await getUserOrders();
        setOrders(userOrders || []);
      } catch (error) {
        console.error('Failed to fetch orders:', error);
      } finally {
        setOrdersLoading(false);
      }
    };

    fetchOrders();
  }, [isAuthenticated, getUserOrders]);

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'confirmed': return '#4A9FF5';
      case 'processing': return '#F59E0B';
      case 'shipped': return '#8B5CF6';
      case 'delivered': return '#10B981';
      case 'cancelled': return '#EF4444';
      default: return '#888';
    }
  };

  const formatDate = (dateStr) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric', 
      year: 'numeric' 
    });
  };

  if (loading) {
    return (
      <div className="dashboard-page">
        <div className="container">
          <div style={{ textAlign: 'center', padding: '100px 0' }}>
            <Loader2 size={48} style={{ animation: 'spin 1s linear infinite', color: 'var(--brand-primary)' }} />
            <p style={{ marginTop: '16px', color: 'var(--text-secondary)' }}>Loading...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="dashboard-page">
        <div className="container">
          <div className="dashboard-empty">
            <h2>Please log in to view your dashboard</h2>
            <Link to="/login" className="btn-cta">Log In</Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="dashboard-page">
      <div className="container">
        <div className="dashboard-header">
          <h1 className="dashboard-title">My Account</h1>
          <p className="dashboard-subtitle">Welcome back, {user.name || 'Athlete'}</p>
        </div>

        {/* First Order Discount Banner */}
        {hasFirstOrderDiscount && hasFirstOrderDiscount() && (
          <div className="discount-banner">
            <div className="discount-banner-content">
              <Gift size={24} />
              <div className="discount-banner-text">
                <h3>Your First Order Discount!</h3>
                <p>Use code <strong>{user.first_order_discount_code}</strong> at checkout for 10% off</p>
              </div>
              <div className="discount-code-box">
                <Tag size={16} />
                <span>{user.first_order_discount_code}</span>
              </div>
            </div>
          </div>
        )}

        <div className="dashboard-grid">
          {/* Profile Card */}
          <div className="dashboard-card">
            <div className="card-header">
              <User size={20} />
              <h3>Profile</h3>
            </div>
            <div className="card-content">
              <div className="profile-info">
                <p className="profile-name">{user.name}</p>
                <p className="profile-email">{user.email}</p>
                {user.auth_provider === 'google' && (
                  <span className="auth-badge">Google Account</span>
                )}
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="dashboard-card">
            <div className="card-header">
              <Package size={20} />
              <h3>Quick Actions</h3>
            </div>
            <div className="card-content">
              <Link to="/products" className="card-link">
                Shop Products <ChevronRight size={16} />
              </Link>
              <Link to="/cart" className="card-link">
                View Cart <ChevronRight size={16} />
              </Link>
            </div>
          </div>
        </div>

        {/* Order History */}
        <div className="dashboard-section">
          <div className="section-header">
            <Package size={20} />
            <h2>Order History</h2>
          </div>
          
          {ordersLoading ? (
            <div style={{ textAlign: 'center', padding: '40px 0' }}>
              <Loader2 size={24} style={{ animation: 'spin 1s linear infinite', color: 'var(--brand-primary)' }} />
            </div>
          ) : orders.length === 0 ? (
            <div className="orders-empty">
              <p>No orders yet</p>
              <Link to="/products" className="btn-cta">Browse Products</Link>
            </div>
          ) : (
            <div className="orders-list">
              {orders.map((order) => (
                <div key={order.id} className="order-item">
                  <div className="order-info">
                    <span className="order-number">{order.order_number}</span>
                    <span className="order-date">{formatDate(order.created_at)}</span>
                  </div>
                  <div className="order-items-preview">
                    {order.items?.slice(0, 2).map((item, idx) => (
                      <span key={idx} className="order-item-name">
                        {item.product_name} ({item.color}, {item.size})
                        {idx < order.items.length - 1 && order.items.length <= 2 ? ', ' : ''}
                      </span>
                    ))}
                    {order.items?.length > 2 && (
                      <span className="order-more">+{order.items.length - 2} more</span>
                    )}
                  </div>
                  <div 
                    className="order-status"
                    style={{ color: getStatusColor(order.status) }}
                  >
                    {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                  </div>
                  <div className="order-total">${order.total?.toFixed(2)}</div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Logout Button */}
        <div className="dashboard-actions">
          <button onClick={handleLogout} className="logout-btn">
            <LogOut size={18} />
            Log Out
          </button>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;

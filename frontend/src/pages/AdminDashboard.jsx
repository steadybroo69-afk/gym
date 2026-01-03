import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Users, 
  Mail, 
  ShoppingBag, 
  Clock, 
  Send, 
  Trash2, 
  LogOut,
  RefreshCw,
  ChevronDown,
  Check,
  X
} from 'lucide-react';

const API_URL = process.env.REACT_APP_BACKEND_URL;

const AdminDashboard = () => {
  const navigate = useNavigate();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [password, setPassword] = useState('');
  const [loginError, setLoginError] = useState('');
  const [activeTab, setActiveTab] = useState('overview');
  const [loading, setLoading] = useState(false);
  
  // Data states
  const [stats, setStats] = useState(null);
  const [users, setUsers] = useState([]);
  const [subscribers, setSubscribers] = useState([]);
  const [waitlist, setWaitlist] = useState([]);
  const [orders, setOrders] = useState([]);
  
  // Email form state
  const [emailForm, setEmailForm] = useState({
    subject: '',
    html_content: '',
    target: 'all'
  });
  const [sendingEmail, setSendingEmail] = useState(false);
  const [emailResult, setEmailResult] = useState(null);

  // Check if already authenticated
  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    // Check localStorage first
    const storedToken = localStorage.getItem('admin_token');
    if (storedToken) {
      try {
        const res = await fetch(`${API_URL}/api/admin/verify`, {
          
          headers: { 'X-Admin-Token': storedToken }
        });
        const data = await res.json();
        setIsAuthenticated(data.authenticated);
        if (data.authenticated) {
          loadStats();
        } else {
          localStorage.removeItem('admin_token');
        }
      } catch (error) {
        console.error('Auth check failed:', error);
        localStorage.removeItem('admin_token');
      }
    }
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoginError('');
    
    try {
      const res = await fetch(`${API_URL}/api/admin/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        
        body: JSON.stringify({ password })
      });
      
      const data = await res.json();
      
      if (res.ok && data.success) {
        // Store token in localStorage as fallback
        if (data.token) {
          localStorage.setItem('admin_token', data.token);
        }
        setIsAuthenticated(true);
        setPassword('');
        loadStats();
      } else {
        setLoginError(data.detail || 'Invalid password');
      }
    } catch (error) {
      console.error('Login error:', error);
      setLoginError('Login failed. Please try again.');
    }
  };

  const handleLogout = async () => {
    const token = localStorage.getItem('admin_token');
    try {
      await fetch(`${API_URL}/api/admin/logout`, {
        method: 'POST',
        
        headers: token ? { 'X-Admin-Token': token } : {}
      });
      localStorage.removeItem('admin_token');
      setIsAuthenticated(false);
      navigate('/');
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  const getAuthHeaders = () => {
    const token = localStorage.getItem('admin_token');
    return token ? { 'X-Admin-Token': token } : {};
  };

  const loadStats = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/api/admin/stats`, {
        
        headers: getAuthHeaders()
      });
      const data = await res.json();
      setStats(data);
    } catch (error) {
      console.error('Failed to load stats:', error);
    }
    setLoading(false);
  };

  const loadUsers = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/api/admin/users`, {
        
        headers: getAuthHeaders()
      });
      const data = await res.json();
      setUsers(data.users || []);
    } catch (error) {
      console.error('Failed to load users:', error);
    }
    setLoading(false);
  };

  const loadSubscribers = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/api/admin/subscribers`, {
        
        headers: getAuthHeaders()
      });
      const data = await res.json();
      setSubscribers(data.subscribers || []);
    } catch (error) {
      console.error('Failed to load subscribers:', error);
    }
    setLoading(false);
  };

  const loadWaitlist = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/api/admin/waitlist`, {
        
        headers: getAuthHeaders()
      });
      const data = await res.json();
      setWaitlist(data.waitlist || []);
    } catch (error) {
      console.error('Failed to load waitlist:', error);
    }
    setLoading(false);
  };

  const loadOrders = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/api/admin/orders`, {
        
        headers: getAuthHeaders()
      });
      const data = await res.json();
      setOrders(data.orders || []);
    } catch (error) {
      console.error('Failed to load orders:', error);
    }
    setLoading(false);
  };

  const deleteSubscriber = async (email) => {
    if (!window.confirm(`Delete subscriber ${email}?`)) return;
    
    try {
      await fetch(`${API_URL}/api/admin/subscriber/${encodeURIComponent(email)}`, {
        method: 'DELETE',
        
        headers: getAuthHeaders()
      });
      loadSubscribers();
    } catch (error) {
      console.error('Failed to delete subscriber:', error);
    }
  };

  const deleteUser = async (userId, email) => {
    if (!window.confirm(`Delete user ${email}?`)) return;
    
    try {
      await fetch(`${API_URL}/api/admin/user/${userId}`, {
        method: 'DELETE',
        
        headers: getAuthHeaders()
      });
      loadUsers();
    } catch (error) {
      console.error('Failed to delete user:', error);
    }
  };

  const sendBulkEmail = async (e) => {
    e.preventDefault();
    if (!emailForm.subject || !emailForm.html_content) {
      alert('Please fill in subject and content');
      return;
    }
    
    if (!window.confirm(`Send email to ${emailForm.target} recipients?`)) return;
    
    setSendingEmail(true);
    setEmailResult(null);
    
    try {
      const res = await fetch(`${API_URL}/api/admin/send-bulk-email`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          ...getAuthHeaders()
        },
        
        body: JSON.stringify(emailForm)
      });
      const data = await res.json();
      setEmailResult(data);
      
      if (data.success) {
        setEmailForm({ subject: '', html_content: '', target: 'all' });
      }
    } catch (error) {
      setEmailResult({ success: false, message: 'Failed to send emails' });
    }
    setSendingEmail(false);
  };

  // Load data when tab changes
  useEffect(() => {
    if (!isAuthenticated) return;
    
    switch (activeTab) {
      case 'users':
        loadUsers();
        break;
      case 'subscribers':
        loadSubscribers();
        break;
      case 'waitlist':
        loadWaitlist();
        break;
      case 'orders':
        loadOrders();
        break;
      default:
        loadStats();
    }
  }, [activeTab, isAuthenticated]);

  // Login Screen
  if (!isAuthenticated) {
    return (
      <div className="admin-login-page">
        <div className="admin-login-container">
          <h1>Admin Access</h1>
          <p>Enter admin password to continue</p>
          
          <form onSubmit={handleLogin}>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Admin Password"
              className="admin-password-input"
              autoFocus
            />
            {loginError && <p className="admin-error">{loginError}</p>}
            <button type="submit" className="admin-login-btn">
              Access Dashboard
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="admin-dashboard">
      {/* Header */}
      <div className="admin-header">
        <h1>RAZE Admin Dashboard</h1>
        <button onClick={handleLogout} className="admin-logout-btn">
          <LogOut size={18} />
          Logout
        </button>
      </div>

      {/* Tabs */}
      <div className="admin-tabs">
        {[
          { id: 'overview', label: 'Overview', icon: <ChevronDown size={18} /> },
          { id: 'users', label: 'Users', icon: <Users size={18} /> },
          { id: 'subscribers', label: 'Subscribers', icon: <Mail size={18} /> },
          { id: 'waitlist', label: 'Waitlist', icon: <Clock size={18} /> },
          { id: 'orders', label: 'Orders', icon: <ShoppingBag size={18} /> },
          { id: 'email', label: 'Send Email', icon: <Send size={18} /> }
        ].map(tab => (
          <button
            key={tab.id}
            className={`admin-tab ${activeTab === tab.id ? 'active' : ''}`}
            onClick={() => setActiveTab(tab.id)}
          >
            {tab.icon}
            {tab.label}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="admin-content">
        {loading && <div className="admin-loading">Loading...</div>}

        {/* Overview Tab */}
        {activeTab === 'overview' && stats && (
          <div className="admin-overview">
            <div className="stats-grid">
              <div className="stat-card">
                <Users className="stat-icon" />
                <div className="stat-info">
                  <h3>{stats.total_users}</h3>
                  <p>Total Users</p>
                  <span className="stat-sub">+{stats.recent_users_7d} this week</span>
                </div>
              </div>
              <div className="stat-card">
                <Mail className="stat-icon" />
                <div className="stat-info">
                  <h3>{stats.total_subscribers}</h3>
                  <p>Email Subscribers</p>
                  <span className="stat-sub">+{stats.recent_subscribers_7d} this week</span>
                </div>
              </div>
              <div className="stat-card">
                <Clock className="stat-icon" />
                <div className="stat-info">
                  <h3>{stats.total_waitlist}</h3>
                  <p>Waitlist Entries</p>
                </div>
              </div>
              <div className="stat-card">
                <ShoppingBag className="stat-icon" />
                <div className="stat-info">
                  <h3>{stats.total_orders}</h3>
                  <p>Total Orders</p>
                </div>
              </div>
            </div>
            <button onClick={loadStats} className="refresh-btn">
              <RefreshCw size={16} /> Refresh Stats
            </button>
          </div>
        )}

        {/* Users Tab */}
        {activeTab === 'users' && (
          <div className="admin-table-container">
            <div className="table-header">
              <h2>Registered Users ({users.length})</h2>
              <button onClick={loadUsers} className="refresh-btn">
                <RefreshCw size={16} /> Refresh
              </button>
            </div>
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Email</th>
                  <th>Name</th>
                  <th>Provider</th>
                  <th>Created</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.map((user, i) => (
                  <tr key={i}>
                    <td>{user.email}</td>
                    <td>{user.name || '-'}</td>
                    <td>{user.auth_provider}</td>
                    <td>{new Date(user.created_at).toLocaleDateString()}</td>
                    <td>
                      <button 
                        onClick={() => deleteUser(user.user_id, user.email)}
                        className="delete-btn"
                      >
                        <Trash2 size={16} />
                      </button>
                    </td>
                  </tr>
                ))}
                {users.length === 0 && (
                  <tr><td colSpan="5" className="empty-row">No users found</td></tr>
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* Subscribers Tab */}
        {activeTab === 'subscribers' && (
          <div className="admin-table-container">
            <div className="table-header">
              <h2>Email Subscribers ({subscribers.length})</h2>
              <button onClick={loadSubscribers} className="refresh-btn">
                <RefreshCw size={16} /> Refresh
              </button>
            </div>
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Email</th>
                  <th>Source</th>
                  <th>Product</th>
                  <th>Date</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {subscribers.map((sub, i) => (
                  <tr key={i}>
                    <td>{sub.email}</td>
                    <td><span className={`source-badge ${sub.source}`}>{sub.source}</span></td>
                    <td>{sub.product_id || '-'}</td>
                    <td>{new Date(sub.timestamp).toLocaleDateString()}</td>
                    <td>
                      <button 
                        onClick={() => deleteSubscriber(sub.email)}
                        className="delete-btn"
                      >
                        <Trash2 size={16} />
                      </button>
                    </td>
                  </tr>
                ))}
                {subscribers.length === 0 && (
                  <tr><td colSpan="5" className="empty-row">No subscribers found</td></tr>
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* Waitlist Tab */}
        {activeTab === 'waitlist' && (
          <div className="admin-table-container">
            <div className="table-header">
              <h2>Waitlist Entries ({waitlist.length})</h2>
              <button onClick={loadWaitlist} className="refresh-btn">
                <RefreshCw size={16} /> Refresh
              </button>
            </div>
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Email</th>
                  <th>Product</th>
                  <th>Variant</th>
                  <th>Size</th>
                  <th>Position</th>
                </tr>
              </thead>
              <tbody>
                {waitlist.map((entry, i) => (
                  <tr key={i}>
                    <td>{entry.email}</td>
                    <td>{entry.product_name}</td>
                    <td>{entry.variant}</td>
                    <td>{entry.size}</td>
                    <td>#{entry.position || i + 1}</td>
                  </tr>
                ))}
                {waitlist.length === 0 && (
                  <tr><td colSpan="5" className="empty-row">No waitlist entries found</td></tr>
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* Orders Tab */}
        {activeTab === 'orders' && (
          <div className="admin-table-container">
            <div className="table-header">
              <h2>Orders ({orders.length})</h2>
              <button onClick={loadOrders} className="refresh-btn">
                <RefreshCw size={16} /> Refresh
              </button>
            </div>
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Order ID</th>
                  <th>Customer</th>
                  <th>Items</th>
                  <th>Total</th>
                  <th>Status</th>
                  <th>Date</th>
                </tr>
              </thead>
              <tbody>
                {orders.map((order, i) => (
                  <tr key={i}>
                    <td className="order-id">{order.order_id?.slice(0, 12)}...</td>
                    <td>{order.shipping?.email || order.customer_email || '-'}</td>
                    <td>{order.items?.length || 0} items</td>
                    <td>${order.total?.toFixed(2) || '0.00'}</td>
                    <td><span className={`status-badge ${order.status}`}>{order.status}</span></td>
                    <td>{new Date(order.created_at).toLocaleDateString()}</td>
                  </tr>
                ))}
                {orders.length === 0 && (
                  <tr><td colSpan="6" className="empty-row">No orders found</td></tr>
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* Send Email Tab */}
        {activeTab === 'email' && (
          <div className="admin-email-form">
            <h2>Send Bulk Email</h2>
            
            <form onSubmit={sendBulkEmail}>
              <div className="form-group">
                <label>Target Audience</label>
                <select 
                  value={emailForm.target}
                  onChange={(e) => setEmailForm({...emailForm, target: e.target.value})}
                >
                  <option value="all">All (Subscribers + Users)</option>
                  <option value="subscribers">All Subscribers</option>
                  <option value="users">Registered Users Only</option>
                  <option value="waitlist">Waitlist Only</option>
                  <option value="early_access">Early Access Subscribers</option>
                </select>
              </div>
              
              <div className="form-group">
                <label>Subject</label>
                <input
                  type="text"
                  value={emailForm.subject}
                  onChange={(e) => setEmailForm({...emailForm, subject: e.target.value})}
                  placeholder="Email subject..."
                />
              </div>
              
              <div className="form-group">
                <label>HTML Content</label>
                <textarea
                  value={emailForm.html_content}
                  onChange={(e) => setEmailForm({...emailForm, html_content: e.target.value})}
                  placeholder="<h1>Hello!</h1><p>Your email content here...</p>"
                  rows={10}
                />
              </div>
              
              <button type="submit" disabled={sendingEmail} className="send-email-btn">
                {sendingEmail ? (
                  <>Sending...</>
                ) : (
                  <><Send size={18} /> Send Email</>
                )}
              </button>
            </form>
            
            {emailResult && (
              <div className={`email-result ${emailResult.success ? 'success' : 'error'}`}>
                {emailResult.success ? <Check size={20} /> : <X size={20} />}
                <div>
                  <strong>{emailResult.success ? 'Success!' : 'Failed'}</strong>
                  <p>{emailResult.message}</p>
                  {emailResult.sent_count !== undefined && (
                    <p>Sent: {emailResult.sent_count} / {emailResult.total_recipients}</p>
                  )}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminDashboard;

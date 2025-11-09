import './NavSidebar.css';

function NavSidebar({ activeTab, onTabChange }) {
  const navItems = [
    { id: 'swiping', label: 'Swiping' },
    { id: 'metrics', label: 'Metrics' },
    { id: 'gym', label: 'Gym' },
    { id: 'chatbot', label: 'Chatbot' }
  ];

  return (
    <div className="nav-sidebar">
      <div className="nav-sidebar-header">
        <div className="app-logo">
          <span className="logo-text">MealSwipeRight</span>
        </div>
      </div>
      <nav className="nav-menu">
        {navItems.map((item) => (
          <button
            key={item.id}
            className={`nav-item ${activeTab === item.id ? 'active' : ''}`}
            onClick={() => onTabChange(item.id)}
          >
            <span className="nav-label">{item.label}</span>
          </button>
        ))}
      </nav>
    </div>
  );
}

export default NavSidebar;


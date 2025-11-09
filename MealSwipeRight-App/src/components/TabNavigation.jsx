import './TabNavigation.css';

function TabNavigation({ activeTab, onTabChange }) {
  const tabs = [
    { id: 'swiping', label: 'Swiping', icon: '💳' },
    { id: 'metrics', label: 'Metrics', icon: '📊' },
    { id: 'gym', label: 'Gym', icon: '💪' },
    { id: 'chatbot', label: 'Chat', icon: '💬' }
  ];

  return (
    <nav className="tab-navigation">
      {tabs.map(tab => (
        <button
          key={tab.id}
          className={`tab-button ${activeTab === tab.id ? 'active' : ''}`}
          onClick={() => onTabChange(tab.id)}
          aria-label={tab.label}
        >
          <span className="tab-icon">{tab.icon}</span>
          <span className="tab-label">{tab.label}</span>
        </button>
      ))}
    </nav>
  );
}

export default TabNavigation;


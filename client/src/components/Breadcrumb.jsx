const Breadcrumb = ({ path = [], onNavigate }) => {
  if (!path || path.length === 0) return null;

  return (
    <nav className="breadcrumb">
      <button className="breadcrumb-item" onClick={() => onNavigate(null)}>
        📚 All Documents
      </button>
      {path.map((item, index) => (
        <div key={item._id} className="breadcrumb-segment">
          <span className="breadcrumb-separator">/</span>
          <button
            className="breadcrumb-item"
            onClick={() => onNavigate(item._id)}
          >
            <span style={{ color: item.color }}>{item.icon}</span>
            {item.name}
          </button>
        </div>
      ))}
    </nav>
  );
};

export default Breadcrumb;
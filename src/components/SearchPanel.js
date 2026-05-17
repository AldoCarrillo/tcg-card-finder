"use client";

export default function SearchPanel({
  cardId,
  setCardId,
  loading,
  handleSearch,
  quantity,
  handleQuantityChange,
  card,
  handleAdd,
}) {
  return (
    <div className="panel search-panel">
      <div className="panel-title-row">
        <div>
          <h2>Search</h2>
          <p>Enter a Yu-Gi-Oh! passcode and choose how many copies to preview.</p>
        </div>
      </div>

      <div className="search-grid">
        <div className="search-left">
          <div className="form-group">
            <label>Card ID / Passcode</label>
            <div className="search-row">
              <input
                value={cardId}
                onChange={(e) => setCardId(e.target.value)}
                placeholder="Example: 89631139"
                onKeyDown={(e) => e.key === "Enter" && handleSearch()}
              />
              <button className="primary-button" onClick={handleSearch} disabled={loading}>
                {loading ? "Searching..." : "Search"}
              </button>
            </div>
          </div>
        </div>

        <div className="search-right">
          <div className="form-group">
            <label>Quantity</label>
            <div className="quantity-buttons">
              {[1, 2, 3].map((value) => (
                <button
                  key={value}
                  type="button"
                  className={`qty-button ${quantity === value ? "active" : ""}`}
                  onClick={() => handleQuantityChange(value)}
                >
                  {value}
                </button>
              ))}
            </div>
          </div>
          <button className="add-button-search" onClick={handleAdd} disabled={!card}>
            Add to Preview
          </button>
        </div>
      </div>
    </div>
  );
}

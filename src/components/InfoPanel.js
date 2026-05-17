"use client";

export default function InfoPanel({
  card,
  miniImageUrl,
  selectedSetIndex,
  setSelectedSetIndex,
  showSetBadge,
  setShowSetBadge,
}) {
  return (
    <div className="panel info-panel">
      <div className="info-header organized">
        <div>
          <p className="section-label">Card Information</p>
          <h2>{card?.name || "No card loaded"}</h2>
        </div>

        {miniImageUrl ? (
          <img className="mini-card" src={miniImageUrl} alt={card?.name || "Card"} />
        ) : (
          <div className="mini-placeholder">No card</div>
        )}
      </div>

      <div className="info-fields compact">
        <div>
          <span>ID</span>
          <strong>{card?.id || "—"}</strong>
        </div>
        <div>
          <span>Sets</span>
          <strong>{card?.card_sets?.length || 0} found</strong>
        </div>
        <div>
          <span>Arts</span>
          <strong>{card?.card_images?.length || 0} found</strong>
        </div>
      </div>

      <div className="selectors-stack">
        <div className="form-group">
          <div className="set-label-row">
            <label>Set</label>
            <label className="badge-toggle">
              <input
                type="checkbox"
                checked={showSetBadge}
                onChange={(e) => setShowSetBadge(e.target.checked)}
              />
              Show badge
            </label>
          </div>
          <select
            value={selectedSetIndex}
            onChange={(e) => setSelectedSetIndex(Number(e.target.value))}
            disabled={!card?.card_sets?.length}
          >
            {card?.card_sets?.length ? (
              card.card_sets.map((set, index) => (
                <option key={`${set.set_code}-${index}`} value={index}>
                  {set.set_code} — {set.set_name}
                </option>
              ))
            ) : (
              <option>No sets loaded</option>
            )}
          </select>
        </div>
      </div>
    </div>
  );
}

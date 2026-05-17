"use client";

export default function PreviewSection({
  previewRef,
  previewCards,
  showSetBadge,
  downloading,
  handleDownloadImage,
  handleClear,
}) {
  return (
    <section className="panel preview-section">
      <div className="preview-header">
        <div>
          <h2>Card Preview</h2>
          <p>Only this white preview box is downloaded.</p>
        </div>
        <div className="preview-actions">
          <button className="download-button" onClick={handleDownloadImage} disabled={downloading}>
            {downloading ? "Downloading..." : "Download Image"}
          </button>
          <button className="clear-button" onClick={handleClear}>Clear</button>
        </div>
      </div>

      <div className="preview-frame" ref={previewRef}>
        {previewCards.length > 0 ? (
          previewCards.map((previewCard, index) => (
            <div
              key={`${previewCard.previewId}-${previewCard.copy}`}
              className="preview-card-item"
              style={{ zIndex: previewCards.length - index }}
            >
              <img src={previewCard.imageUrl} alt={previewCard.name} />
              {showSetBadge && index === 0 && previewCard.setCode && (
                <div className="set-badge">{previewCard.setCode}</div>
              )}
            </div>
          ))
        ) : (
          <div className="empty-preview">
            Search for a card, choose quantity, then click Add to Preview.
          </div>
        )}
      </div>
    </section>
  );
}

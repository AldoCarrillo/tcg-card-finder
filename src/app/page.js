"use client";

import { useRef, useState, useEffect } from "react";
import { toPng } from "html-to-image";
import { getYugiohCard } from "@/services/yugiohApi";
import { getProxiedImageUrl } from "@/utils/imageUtils";
import AppHeader from "@/components/AppHeader";
import SearchPanel from "@/components/SearchPanel";
import InfoPanel from "@/components/InfoPanel";
import PreviewSection from "@/components/PreviewSection";
import AppFooter from "@/components/AppFooter";

export default function Home() {
  const previewRef = useRef(null);

  const [cardId, setCardId] = useState("");
  const [card, setCard] = useState(null);
  const [selectedArtworkIndex, setSelectedArtworkIndex] = useState(0);
  const [selectedSetIndex, setSelectedSetIndex] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [previewCards, setPreviewCards] = useState([]);
  const [previewCardName, setPreviewCardName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [downloading, setDownloading] = useState(false);
  const [showSetBadge, setShowSetBadge] = useState(true);
  const [savedImageUrl, setSavedImageUrl] = useState(null);

  const selectedImageUrl = card?.card_images?.[selectedArtworkIndex]?.image_url || "";
  const selectedSet = card?.card_sets?.[selectedSetIndex];
  const miniImageUrl = selectedImageUrl ? getProxiedImageUrl(selectedImageUrl) : "";

  useEffect(() => {
    if (previewCards.length > 0 && card?.card_sets?.[selectedSetIndex]) {
      const newSet = card.card_sets[selectedSetIndex];
      setPreviewCards((prev) =>
        prev.map((c) => ({ ...c, setName: newSet.set_name, setCode: newSet.set_code }))
      );
    }
  }, [selectedSetIndex]);

  async function handleSearch() {
    try {
      setLoading(true);
      setError("");
      setCard(null);
      setSelectedArtworkIndex(0);
      setSelectedSetIndex(0);

      const result = await getYugiohCard(cardId);
      setCard(result);
      const preloadUrl = getProxiedImageUrl(result.card_images?.[0]?.image_url || "");
      if (preloadUrl) new Image().src = preloadUrl;
    } catch (err) {
      setError(err.message || "Something went wrong.");
    } finally {
      setLoading(false);
    }
  }

  function handleQuantityChange(value) {
    setQuantity(value);
    if (previewCards.length > 0) {
      const template = previewCards[0];
      setPreviewCards(Array.from({ length: value }, (_, i) => ({ ...template, copy: i + 1 })));
    }
  }

  function handleAdd() {
    if (!card || !selectedImageUrl) {
      setError("Search for a card before adding it to the preview.");
      return;
    }

    const proxiedImageUrl = getProxiedImageUrl(selectedImageUrl);
    const uniquePreviewId = Date.now();

    setPreviewCards(
      Array.from({ length: Number(quantity) || 1 }, (_, index) => ({
        id: card.id,
        cardId: card.id,
        previewId: uniquePreviewId,
        copy: index + 1,
        name: card.name,
        fullCardData: card,
        artworkIndex: selectedArtworkIndex,
        setIndex: selectedSetIndex,
        imageUrl: proxiedImageUrl,
        setName: selectedSet?.set_name || "",
        setCode: selectedSet?.set_code || "",
      }))
    );
    setPreviewCardName(card.name);
    setError("");
  }

  async function handleDownloadImage() {
    if (!previewRef.current || previewCards.length === 0) {
      setError("Add at least one card to the preview before downloading.");
      return;
    }

    const isIOS =
      /iPad|iPhone|iPod/.test(navigator.userAgent) ||
      (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);

    try {
      setDownloading(true);
      setError("");

      const imgElements = Array.from(previewRef.current.querySelectorAll("img"));

      await Promise.all(
        imgElements.map(async (img, index) => {
          const sourceUrl = previewCards[index]?.imageUrl;
          if (!sourceUrl) return;
          const res = await fetch(sourceUrl, { cache: "no-store" });
          const blob = await res.blob();
          const freshDataUrl = await new Promise((resolve) => {
            const reader = new FileReader();
            reader.onload = () => resolve(reader.result);
            reader.readAsDataURL(blob);
          });
          img.src = freshDataUrl;
          await new Promise((resolve) => {
            if (img.complete && img.naturalHeight !== 0) resolve();
            else { img.onload = resolve; img.onerror = resolve; }
          });
        })
      );

      const dataUrl = await toPng(previewRef.current, {
        cacheBust: false,
        backgroundColor: "#ffffff",
        pixelRatio: window.devicePixelRatio > 1 ? 1.5 : 2,
      });

      const cardFileName = previewCardName?.replace(/[^a-z0-9]/gi, "-").toLowerCase() || "card-preview";

      if (isIOS) {
        // iOS Safari blocks programmatic downloads — show image in an overlay instead.
        // User long-presses the image and taps "Save to Photos".
        setSavedImageUrl(dataUrl);
      } else {
        const blob = await fetch(dataUrl).then((r) => r.blob());
        const blobUrl = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.download = `${cardFileName}.png`;
        link.href = blobUrl;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(blobUrl);
      }
    } catch (err) {
      setError("Download failed. Try clicking Add again, then Download Image.");
    } finally {
      setDownloading(false);
    }
  }

  function handleClear() {
    setCardId("");
    setCard(null);
    setPreviewCards([]);
    setPreviewCardName("");
    setSelectedArtworkIndex(0);
    setSelectedSetIndex(0);
    setQuantity(1);
    setError("");
    setDownloading(false);
  }

  return (
    <main className="page-shell">
      <AppHeader />

      <section className="top-grid">
        <SearchPanel
          cardId={cardId}
          setCardId={setCardId}
          loading={loading}
          handleSearch={handleSearch}
          quantity={quantity}
          handleQuantityChange={handleQuantityChange}
          card={card}
          handleAdd={handleAdd}
        />
        <InfoPanel
          card={card}
          miniImageUrl={miniImageUrl}
          selectedSetIndex={selectedSetIndex}
          setSelectedSetIndex={setSelectedSetIndex}
          showSetBadge={showSetBadge}
          setShowSetBadge={setShowSetBadge}
        />
      </section>

      {error && <div className="error-message">{error}</div>}

      <PreviewSection
        previewRef={previewRef}
        previewCards={previewCards}
        showSetBadge={showSetBadge}
        downloading={downloading}
        handleDownloadImage={handleDownloadImage}
        handleClear={handleClear}
      />

      <AppFooter />

      {savedImageUrl && (
        <div className="ios-save-overlay" onClick={() => setSavedImageUrl(null)}>
          <div className="ios-save-box" onClick={(e) => e.stopPropagation()}>
            <p className="ios-save-hint">Long press the image and tap <strong>Save to Photos</strong></p>
            <img src={savedImageUrl} alt="Card preview" className="ios-save-image" />
            <button className="ios-save-close" onClick={() => setSavedImageUrl(null)}>Close</button>
          </div>
        </div>
      )}
    </main>
  );
}

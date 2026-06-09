"use client";

import { useRef, useState, useEffect } from "react";
import { toPng } from "html-to-image";
import { getYugiohCard, searchYugiohCardsByName } from "@/services/yugiohApi";
import { getProxiedImageUrl } from "@/utils/imageUtils";
import AppHeader from "@/components/AppHeader";
import SearchPanel from "@/components/SearchPanel";
import InfoPanel from "@/components/InfoPanel";
import PreviewSection from "@/components/PreviewSection";
import AppFooter from "@/components/AppFooter";

export default function Home() {
  const previewRef = useRef(null);
  const skipNameSearch = useRef(false);

  const [cardId, setCardId] = useState("");
  const [cardName, setCardName] = useState("");
  const [nameResults, setNameResults] = useState([]);
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
  const [shareUnsupported, setShareUnsupported] = useState(false);

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

  useEffect(() => {
    if (skipNameSearch.current) {
      skipNameSearch.current = false;
      return;
    }
    const query = cardName.trim();
    if (query.length < 2) {
      setNameResults([]);
      return;
    }
    const timer = setTimeout(async () => {
      try {
        const results = await searchYugiohCardsByName(query);
        setNameResults(results);
      } catch {
        setNameResults([]);
      }
    }, 350);
    return () => clearTimeout(timer);
  }, [cardName]);

  function loadCard(result) {
    setCard(result);
    setSelectedArtworkIndex(0);
    setSelectedSetIndex(0);
    const preloadUrl = getProxiedImageUrl(result.card_images?.[0]?.image_url || "");
    if (preloadUrl) new Image().src = preloadUrl;
  }

  function handleSelectResult(cardData) {
    skipNameSearch.current = true;
    setNameResults([]);
    setCardName(cardData.name);
    loadCard(cardData);
  }

  async function handleSearch() {
    const hasId = cardId.trim();
    const hasName = cardName.trim();

    if (!hasId && !hasName) {
      setError("Enter a card name or ID to search.");
      return;
    }

    if (!hasId) return; // name search is handled live by the useEffect

    try {
      setLoading(true);
      setError("");
      setCard(null);
      setNameResults([]);
      const result = await getYugiohCard(cardId);
      loadCard(result);
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

  async function capturePreviewForIOS() {
    const CARD_W = 200;
    const CARD_H = Math.round(CARD_W * (614 / 421));
    const OVERLAP = 55;
    const PAD = 20;
    const n = previewCards.length;
    const scale = 2;

    const canvasW = PAD * 2 + CARD_W + (n - 1) * (CARD_W - OVERLAP);
    const canvasH = PAD * 2 + CARD_H;

    const canvas = document.createElement("canvas");
    canvas.width = canvasW * scale;
    canvas.height = canvasH * scale;
    const ctx = canvas.getContext("2d");
    ctx.scale(scale, scale);
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, canvasW, canvasH);

    for (let i = 0; i < n; i++) {
      const res = await fetch(previewCards[i].imageUrl, { cache: "no-store" });
      const blob = await res.blob();
      const dataUrl = await new Promise((resolve) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result);
        reader.readAsDataURL(blob);
      });
      await new Promise((resolve, reject) => {
        const img = new Image();
        img.onload = () => {
          ctx.drawImage(img, PAD + i * (CARD_W - OVERLAP), PAD, CARD_W, CARD_H);
          resolve();
        };
        img.onerror = reject;
        img.src = dataUrl;
      });
    }

    if (showSetBadge && previewCards[0]?.setCode) {
      const text = previewCards[0].setCode;
      ctx.font = "bold 11px -apple-system, sans-serif";
      const textW = ctx.measureText(text).width;
      const bw = textW + 10;
      const bh = 18;
      const bx = PAD + CARD_W - bw - 4;
      const by = PAD + 4;
      ctx.fillStyle = "rgba(0,0,0,0.72)";
      ctx.fillRect(bx, by, bw, bh);
      ctx.fillStyle = "#ffffff";
      ctx.fillText(text, bx + 5, by + 13);
    }

    return canvas.toDataURL("image/png");
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

      if (isIOS) {
        const dataUrl = await capturePreviewForIOS();
        setSavedImageUrl(dataUrl);
      } else {
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

  async function handleShareImage() {
    if (!savedImageUrl) return;
    const arr = savedImageUrl.split(",");
    const bstr = atob(arr[1]);
    const u8arr = new Uint8Array(bstr.length);
    for (let i = 0; i < bstr.length; i++) u8arr[i] = bstr.charCodeAt(i);
    const fileName = (previewCardName?.replace(/[^a-z0-9]/gi, "-").toLowerCase() || "card-preview") + ".png";
    const file = new File([u8arr], fileName, { type: "image/png" });

    if (!navigator.canShare?.({ files: [file] })) {
      setShareUnsupported(true);
      return;
    }
    try {
      await navigator.share({ files: [file] });
    } catch (err) {
      if (err?.name !== "AbortError") {
        setShareUnsupported(true);
      }
    }
  }

  function handleClear() {
    setCardId("");
    setCardName("");
    setNameResults([]);
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
          cardName={cardName}
          setCardName={setCardName}
          nameResults={nameResults}
          handleSelectResult={handleSelectResult}
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
        <div className="ios-save-overlay" onClick={() => { setSavedImageUrl(null); setShareUnsupported(false); }}>
          <div className="ios-save-box" onClick={(e) => e.stopPropagation()}>
            {shareUnsupported ? (
              <p className="ios-save-hint">
                Saving is not supported in this browser.<br />
                Tap <strong>···</strong> or the browser menu and select <strong>Open in Safari</strong>, then download from there.
              </p>
            ) : (
              <p className="ios-save-hint">Tap <strong>Share</strong> to save the image to your phone</p>
            )}
            <img src={savedImageUrl} alt="Card preview" className="ios-save-image" />
            <div className="ios-save-actions">
              {!shareUnsupported && (
                <button className="ios-share-button" onClick={handleShareImage}>Share / Save Image</button>
              )}
              <button className="ios-save-close" onClick={() => { setSavedImageUrl(null); setShareUnsupported(false); }}>Close</button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}

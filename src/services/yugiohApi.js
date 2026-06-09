export async function getYugiohCard(cardId) {
  const cleanId = String(cardId || "").trim();

  if (!cleanId) {
    throw new Error("Please enter a Yu-Gi-Oh! card ID / passcode.");
  }

  const response = await fetch(
    `https://db.ygoprodeck.com/api/v7/cardinfo.php?id=${encodeURIComponent(cleanId)}`
  );

  if (!response.ok) {
    throw new Error("Card not found. Please check the card ID / passcode.");
  }

  const json = await response.json();

  if (!json?.data?.length) {
    throw new Error("Card not found.");
  }

  return json.data[0];
}

export async function searchYugiohCardsByName(query) {
  const clean = String(query || "").trim();

  if (!clean) {
    throw new Error("Please enter a card name.");
  }

  const response = await fetch(
    `https://db.ygoprodeck.com/api/v7/cardinfo.php?fname=${encodeURIComponent(clean)}`
  );

  if (!response.ok) {
    throw new Error("No cards found. Check the spelling and try again.");
  }

  const json = await response.json();

  if (!json?.data?.length) {
    throw new Error("No cards found.");
  }

  return json.data;
}

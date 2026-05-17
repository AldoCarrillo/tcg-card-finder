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

export function getProxiedImageUrl(imageUrl) {
  return `/api/image?url=${encodeURIComponent(imageUrl)}`;
}

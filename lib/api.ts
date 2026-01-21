export const API_BASE_URL = 'https://api.musshk.com/api';

/**
 * Get the full image URL
 * If the image URL is already a full URL (starts with http:// or https://), return it as is
 * Otherwise, prepend the base URL (without /api)
 */
export function getImageUrl(imagePath: string | undefined | null): string {
  if (!imagePath) return '';
  
  // If it's already a full URL (starts with http:// or https://), return as is
  if (imagePath.startsWith('http://') || imagePath.startsWith('https://')) {
    return imagePath;
  }
  
  // Otherwise, prepend the base URL (remove /api from the base URL)
  const baseUrl = API_BASE_URL.replace('/api', '');
  return `${baseUrl}${imagePath.startsWith('/') ? '' : '/'}${imagePath}`;
}


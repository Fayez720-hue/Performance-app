export function getApiUrl(path: string): string {
  const baseUrl = process.env.NEXT_PUBLIC_API_URL || '';
  // Ensure path starts with /
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;

  // If we are in a browser/app environment and have a base URL, use it
  if (typeof window !== 'undefined' && baseUrl) {
    return `${baseUrl}${normalizedPath}`;
  }

  return normalizedPath;
}

export const fetcher = (url: string) => fetch(getApiUrl(url)).then((res) => res.json());

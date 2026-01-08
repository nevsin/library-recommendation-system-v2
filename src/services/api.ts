import { Book } from '@/types';
import { fetchAuthSession } from 'aws-amplify/auth';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

async function handleResponse<T>(res: Response): Promise<T> {
  if (!res.ok) {
    const text = await res.text();
    throw new Error(text || `API request failed (${res.status})`);
  }
  return res.json();
}

async function getIdToken(): Promise<string | null> {
  try {
    const session = await fetchAuthSession();
    const token = session.tokens?.idToken?.toString();
    return token ?? null;
  } catch {
    return null;
  }
}

async function getAuthHeadersOrThrow() {
  const token = await getIdToken();
  if (!token) {
    throw new Error('Not authenticated');
  }
  return {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${token}`,
  };
}

/* ============ PUBLIC ============ */

export async function getBooks(): Promise<Book[]> {
  const res = await fetch(`${API_BASE_URL}/books`);
  return handleResponse<Book[]>(res);
}

export async function getBook(id: string): Promise<Book | null> {
  const res = await fetch(`${API_BASE_URL}/books/${id}`);
  if (!res.ok) return null;

  const data = await res.json();

  if (Array.isArray(data)) {
    return data.find((b: Book) => b.id === id) ?? null;
  }

  return data;
}

/* ============ PROTECTED (needs token) ============ */

export async function getRecommendations(query: string) {
  const headers = await getAuthHeadersOrThrow();
  const res = await fetch(`${API_BASE_URL}/recommendations`, {
    method: 'POST',
    headers,
    body: JSON.stringify({ query }),
  });
  return handleResponse(res);
}

export async function getReadingLists(userId: string) {
  const headers = await getAuthHeadersOrThrow(); // sende hangi helper varsa o
  const url = `${API_BASE_URL}/reading-lists?userId=${encodeURIComponent(userId)}`;

  const res = await fetch(url, { headers });
  return handleResponse(res);
}

export async function createReadingList(payload: {
  userId: string;
  name: string;
  bookIds?: string[];
}) {
  const headers = await getAuthHeadersOrThrow();
  const res = await fetch(`${API_BASE_URL}/reading-lists`, {
    method: 'POST',
    headers,
    body: JSON.stringify(payload),
  });
  return handleResponse(res);
}

export async function updateReadingList(
  id: string,
  payload: { userId: string; name?: string; bookIds?: string[] }
) {
  const headers = await getAuthHeadersOrThrow();
  const res = await fetch(`${API_BASE_URL}/reading-lists/${encodeURIComponent(id)}`, {
    method: 'PUT',
    headers,
    body: JSON.stringify(payload),
  });
  return handleResponse(res);
}

export async function deleteReadingList(id: string, userId: string) {
  const headers = await getAuthHeadersOrThrow();
  const res = await fetch(
    `${API_BASE_URL}/reading-lists/${encodeURIComponent(id)}?userId=${encodeURIComponent(userId)}`,
    { method: 'DELETE', headers }
  );
  return handleResponse(res);
}

/* Admin endpoints (if protected) */
export async function createBook(payload: Book) {
  const headers = await getAuthHeadersOrThrow();
  const res = await fetch(`${API_BASE_URL}/books`, {
    method: 'POST',
    headers,
    body: JSON.stringify(payload),
  });
  return handleResponse(res);
}

export async function updateBook(id: string, payload: Partial<Book>) {
  const headers = await getAuthHeadersOrThrow();
  const res = await fetch(`${API_BASE_URL}/books/${encodeURIComponent(id)}`, {
    method: 'PUT',
    headers,
    body: JSON.stringify(payload),
  });
  return handleResponse(res);
}

export async function deleteBook(id: string) {
  const headers = await getAuthHeadersOrThrow();
  const res = await fetch(`${API_BASE_URL}/books/${encodeURIComponent(id)}`, {
    method: 'DELETE',
    headers,
  });
  return handleResponse(res);
}

/* Add-to-list: use createReadingList for now (backend expects userId/name/bookIds) */
export async function addToReadingList(userId: string, bookId: string) {
  return createReadingList({
    userId,
    name: 'My Reading List',
    bookIds: [bookId],
  });
}

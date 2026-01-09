import { Book } from '@/types';
import { fetchAuthSession } from 'aws-amplify/auth';

/* ==============================
   API BASE
================================ */
const API_URL = import.meta.env.VITE_API_URL;

if (!API_URL) {
  throw new Error('API_URL is not defined');
}

/* ==============================
   HELPERS
================================ */
async function handleResponse<T = any>(res: Response): Promise<T> {
  const text = await res.text();

  if (!res.ok) {
    throw new Error(text || `API request failed (${res.status})`);
  }

  if (!text) return undefined as T;

  try {
    return JSON.parse(text) as T;
  } catch {
    return text as unknown as T;
  }
}

async function getIdToken(): Promise<string | null> {
  try {
    const session = await fetchAuthSession();
    return session.tokens?.idToken?.toString() ?? null;
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

/* ==============================
   BOOKS
================================ */
export async function getBooks(): Promise<Book[]> {
  const res = await fetch(`${API_URL}/books`);
  return handleResponse<Book[]>(res);
}

export async function getBook(id: string): Promise<Book | null> {
  const res = await fetch(`${API_URL}/books/${encodeURIComponent(id)}`);
  if (!res.ok) return null;
  return handleResponse<Book>(res);
}

/* ==============================
   AI RECOMMENDATIONS
================================ */
export async function getRecommendations(query: string): Promise<any> {
  const headers = await getAuthHeadersOrThrow();

  const res = await fetch(`${API_URL}/recommendations`, {
    method: 'POST',
    headers,
    body: JSON.stringify({ query }),
  });

  return handleResponse(res);
}

/* ==============================
   READING LISTS
================================ */
export async function getReadingLists(userId: string) {
  const headers = await getAuthHeadersOrThrow();
  const res = await fetch(
    `${API_URL}/reading-lists?userId=${encodeURIComponent(userId)}`,
    { headers }
  );
  return handleResponse(res);
}

export async function createReadingList(payload: {
  userId: string;
  name: string;
  bookIds?: string[];
}) {
  const headers = await getAuthHeadersOrThrow();
  const res = await fetch(`${API_URL}/reading-lists`, {
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
  const res = await fetch(`${API_URL}/reading-lists/${encodeURIComponent(id)}`, {
    method: 'PUT',
    headers,
    body: JSON.stringify(payload),
  });
  return handleResponse(res);
}

export async function deleteReadingList(id: string, userId: string) {
  const headers = await getAuthHeadersOrThrow();
  const res = await fetch(
    `${API_URL}/reading-lists/${encodeURIComponent(id)}?userId=${encodeURIComponent(userId)}`,
    { method: 'DELETE', headers }
  );
  return handleResponse(res);
}

/* ==============================
   BOOK CRUD
================================ */
export type CreateBookPayload = Omit<Book, 'id'>;

export async function createBook(payload: CreateBookPayload) {
  const headers = await getAuthHeadersOrThrow();
  const res = await fetch(`${API_URL}/books`, {
    method: 'POST',
    headers,
    body: JSON.stringify(payload),
  });
  return handleResponse(res);
}

export async function updateBook(id: string, payload: Partial<Book>) {
  const headers = await getAuthHeadersOrThrow();
  const res = await fetch(`${API_URL}/books/${encodeURIComponent(id)}`, {
    method: 'PUT',
    headers,
    body: JSON.stringify(payload),
  });
  return handleResponse(res);
}

export async function deleteBook(id: string) {
  const headers = await getAuthHeadersOrThrow();
  const res = await fetch(`${API_URL}/books/${encodeURIComponent(id)}`, {
    method: 'DELETE',
    headers,
  });
  return handleResponse(res);
}

/* ==============================
   REVIEWS
================================ */
export async function createReview(data: {
  bookId: string;
  userId: string;
  username: string;
  rating: number;
  comment: string;
}) {
  const res = await fetch(`${API_URL}/reviews`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  });

  if (!res.ok) {
    throw new Error('Failed to create review');
  }

  return res.json();
}

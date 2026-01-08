import { Book } from '@/types';
import { fetchAuthSession } from 'aws-amplify/auth';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

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

export async function getBooks(): Promise<Book[]> {
  const res = await fetch(`${API_BASE_URL}/books`);
  return handleResponse<Book[]>(res);
}

export async function getBook(id: string): Promise<Book | null> {
  const res = await fetch(`${API_BASE_URL}/books/${encodeURIComponent(id)}`);
  if (!res.ok) return null;

  const data: any = await handleResponse(res);

  if (Array.isArray(data)) {
    return data.find((b: Book) => b.id === id) ?? null;
  }

  return data as Book;
}

export async function getRecommendations(query: string): Promise<any> {
  const headers = await getAuthHeadersOrThrow();

  const res = await fetch(`${API_BASE_URL}/recommendations`, {
    method: 'POST',
    headers,
    body: JSON.stringify({ query }),
  });

  const data: any = await handleResponse(res);

  if (Array.isArray(data)) return data;

  if (Array.isArray(data?.recommendations)) return data;

  if (typeof data?.body === 'string') {
    try {
      return JSON.parse(data.body);
    } catch {
      return { recommendations: [] };
    }
  }

  if (typeof data === 'string') {
    try {
      return JSON.parse(data);
    } catch {
      return { recommendations: [] };
    }
  }

  return { recommendations: [] };
}

export async function getReadingLists(userId: string) {
  const headers = await getAuthHeadersOrThrow();
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

export type CreateBookPayload = Omit<Book, 'id'>;

export async function createBook(payload: CreateBookPayload) {
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

export async function addToReadingList(userId: string, bookId: string) {
  return createReadingList({
    userId,
    name: 'My Reading List',
    bookIds: [bookId],
  });
}

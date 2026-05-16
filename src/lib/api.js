const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

export const getApiUrl = () => API_URL;

export const fetchFinanceData = async () => {
  const response = await fetch(`${API_URL}/api/finance`, {
    method: 'GET',
    credentials: 'include',
    headers: {
      'Accept': 'application/json'
    }
  });

  if (!response.ok) {
    throw new Error('Nie udało się pobrać danych finansowych z API.');
  }

  return response.json();
};

export const saveFinanceDataOnServer = async (data) => {
  const response = await fetch(`${API_URL}/api/finance`, {
    method: 'PUT',
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json'
    },
    body: JSON.stringify({ data })
  });

  if (!response.ok) {
    throw new Error('Nie udało się zapisać danych finansowych w API.');
  }

  return response.json();
};

// ===== Per-row endpointy: transactions (Phase 1) =====

export class ConflictError extends Error {
  constructor(current) {
    super('Conflict');
    this.name = 'ConflictError';
    this.current = current;
  }
}

export const createTransaction = async (body) => {
  const res = await fetch(`${API_URL}/api/transactions`, {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const detail = await res.json().catch(() => ({}));
    throw new Error(detail.error || `POST /api/transactions: ${res.status}`);
  }
  return res.json();
};

export const patchTransaction = async (id, updatedAt, changes) => {
  const res = await fetch(`${API_URL}/api/transactions/${id}`, {
    method: 'PATCH',
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      'If-Match': updatedAt,
    },
    body: JSON.stringify(changes),
  });
  if (res.status === 409) {
    const body = await res.json();
    throw new ConflictError(body.current);
  }
  if (!res.ok) {
    const detail = await res.json().catch(() => ({}));
    throw new Error(detail.error || `PATCH /api/transactions/${id}: ${res.status}`);
  }
  return res.json();
};

export const deleteTransaction = async (id, updatedAt) => {
  const res = await fetch(`${API_URL}/api/transactions/${id}`, {
    method: 'DELETE',
    credentials: 'include',
    headers: { 'If-Match': updatedAt },
  });
  if (res.status === 409) {
    throw new ConflictError(null);
  }
  if (!res.ok && res.status !== 204) {
    const detail = await res.json().catch(() => ({}));
    throw new Error(detail.error || `DELETE /api/transactions/${id}: ${res.status}`);
  }
};


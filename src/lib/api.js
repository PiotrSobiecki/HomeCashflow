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


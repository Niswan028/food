const API_BASE = (import.meta.env.VITE_API_BASE_URL as string) || 'http://localhost:4000/api';

async function apiRequest<T>(method: string, path: string, body?: Record<string, unknown> | FormData, query?: Record<string, string | number | boolean | undefined>) {
  const url = new URL(`${API_BASE}${path}`);
  Object.entries(query ?? {}).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') url.searchParams.set(key, String(value));
  });

  const headers: Record<string, string> = {};
  let payload: BodyInit | undefined;

  if (body instanceof FormData) {
    payload = body;
  } else if (body !== undefined) {
    headers['Content-Type'] = 'application/json';
    payload = JSON.stringify(body);
  }

  const response = await fetch(url.toString(), {
    method,
    headers,
    body: payload,
  });

  const text = await response.text();
  const data = text ? JSON.parse(text) : { data: null, error: null };

  if (!response.ok) {
    return { data: null as T | null, error: data?.error ?? 'Request failed', count: data?.count ?? null };
  }

  return {
    data: data?.data as T | null,
    error: data?.error ?? null,
    count: data?.count ?? null,
  };
}

class QueryBuilder {
  private table: string;
  private filters: Record<string, any> = {};
  private sort: { field: string; ascending: boolean } | null = null;
  private limitValue: number | null = null;
  private selectFields: string | null = null;
  private options: Record<string, any> = {};
  private action: 'select' | 'insert' | 'update' = 'select';
  private payload: any = null;
  private singleMode = false;

  constructor(table: string) {
    this.table = table;
  }

  select(fields = '*', options: Record<string, any> = {}) {
    this.selectFields = fields;
    this.options = options;
    return this;
  }

  eq(field: string, value: any) {
    this.filters[field] = value;
    return this;
  }

  order(field: string, options?: { ascending?: boolean }) {
    this.sort = { field, ascending: options?.ascending !== false };
    return this;
  }

  limit(value: number) {
    this.limitValue = value;
    return this;
  }

  maybeSingle() {
    this.singleMode = true;
    return this;
  }

  single() {
    this.singleMode = true;
    return this;
  }

  insert(payload: any) {
    this.action = 'insert';
    this.payload = payload;
    return this;
  }

  update(payload: any) {
    this.action = 'update';
    this.payload = payload;
    return this;
  }

  then<TResult1 = any, TResult2 = never>(
    onfulfilled?: ((value: any) => TResult1 | PromiseLike<TResult1>) | null,
    onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | null,
  ) {
    return this.execute().then(onfulfilled, onrejected);
  }

  async execute() {
    try {
      if (this.action === 'insert') {
        const result = await apiRequest<any>('POST', `/${this.table}`, this.payload);
        if (this.selectFields) {
          return { data: result.data, error: result.error, count: result.count };
        }
        return { data: result.data, error: result.error };
      }

      if (this.action === 'update') {
        const id = this.filters.id;
        const result = await apiRequest<any>('PUT', id ? `/${this.table}/${id}` : `/${this.table}/unknown`, this.payload);
        return { data: result.data, error: result.error };
      }

      const query: Record<string, string | number | boolean | undefined> = { ...this.options };
      if (this.limitValue) query.limit = this.limitValue;
      if (this.sort) {
        query.order_by = this.sort.field;
        query.order_dir = this.sort.ascending ? 'asc' : 'desc';
      }
      if (this.singleMode) query.head = true;

      Object.entries(this.filters).forEach(([key, value]) => {
        query[key] = value;
      });

      const result = await apiRequest<any>('GET', `/${this.table}`, undefined, query);
      if (this.singleMode) {
        return { data: Array.isArray(result.data) ? result.data[0] ?? null : result.data ?? null, error: result.error, count: result.count };
      }
      return { data: result.data ?? [], error: result.error, count: result.count };
    } catch (error) {
      return { data: null, error: error instanceof Error ? error.message : 'Request failed' };
    }
  }
}

const auth = {
  async getSession() {
    try {
      const saved = localStorage.getItem('farmtrace_auth_user');
      if (!saved) return { data: { session: null } };
      const user = JSON.parse(saved);
      return { data: { session: { user } } };
    } catch {
      return { data: { session: null } };
    }
  },

  onAuthStateChange(_callback: (event: string, session: any) => void) {
    return { data: { subscription: { unsubscribe: () => undefined } } };
  },

  async signInWithPassword({ email, password }: { email: string; password: string }) {
    const result = await apiRequest<{ user: any; session: any }>('POST', '/auth/signin', { email, password });
    if (result.error || !result.data?.user) {
      return { data: { user: null }, error: result.error ?? 'Invalid email or password' };
    }
    localStorage.setItem('farmtrace_auth_user', JSON.stringify(result.data.user));
    return { data: { user: result.data.user }, error: null };
  },

  async signUp({ email, password, options }: { email: string; password: string; options?: { data?: Record<string, any> } }) {
    const result = await apiRequest<{ user: any; session: any }>('POST', '/auth/signup', {
      email,
      password,
      full_name: options?.data?.full_name,
      role: options?.data?.role,
      phone: options?.data?.phone,
    });
    if (result.error || !result.data?.user) {
      return { data: { user: null }, error: result.error ?? 'Unable to create account' };
    }
    localStorage.setItem('farmtrace_auth_user', JSON.stringify(result.data.user));
    return { data: { user: result.data.user }, error: null };
  },

  async signOut() {
    localStorage.removeItem('farmtrace_auth_user');
    return { error: null };
  },
};

const storage = {
  from(table: string) {
    return {
      async upload(fileName: string, file: any) {
        const result = await apiRequest<{ path: string }>('POST', '/storage/upload', {
          fileName,
          file,
          table,
        });
        return { data: result.data, error: result.error };
      },
      getPublicUrl(fileName: string) {
        return { data: { publicUrl: `${API_BASE.replace('/api', '')}/uploads/${fileName}` }, error: null };
      },
    };
  },
};

export const supabase = {
  auth,
  storage,
  from(table: string) {
    return new QueryBuilder(table);
  },
};

export const SUPABASE_URL = API_BASE;

// src/services/SpeedyIndexService.ts
// Service to interact with the SpeedyIndex API via the Vercel proxy.

export type SpeedyIndexSearchEngine = 'google' | 'yandex';
export type SpeedyIndexTaskType = 'indexer' | 'checker';

export interface SpeedyIndexBalance {
  indexer: number;
  checker: number;
}

export interface SpeedyIndexAccountResponse {
  code: number;
  balance: SpeedyIndexBalance;
}

export interface SpeedyIndexTaskListItem {
  task_id: string;
  type: string;
  status: string;
  created_at: string;
}

export interface SpeedyIndexTaskListResponse {
  code: number;
  tasks: SpeedyIndexTaskListItem[];
}

export interface SpeedyIndexCreateTaskResponse {
  code: number;
  task_id: string;
  type: string;
}

export interface SpeedyIndexTaskResultLink {
  url: string;
  indexed?: boolean;
  message?: string;
}

export interface SpeedyIndexTaskDetails {
  task_id: string;
  title: string;
  urls_total: number;
  urls_done: number;
  urls_failed: number;
  status: string;
  results?: SpeedyIndexTaskResultLink[];
}

export interface SpeedyIndexTaskStatusResponse {
  code: number;
  task: SpeedyIndexTaskDetails;
}

export class SpeedyIndexService {
  private static readonly API_PROXY_BASE_URL = '/api/speedyindex-proxy';

  private static getApiKey(): string | null {
    if (typeof window === 'undefined') {
      return null;
    }

    const storedKey = localStorage.getItem('speedyindex_key');
    return storedKey && storedKey.trim().length > 0 ? storedKey.trim() : null;
  }

  /**
   * Makes a request to the SpeedyIndex proxy.
   * @param endpoint The SpeedyIndex API endpoint (e.g., /v2/account).
   * @param method HTTP method (GET, POST).
   * @param body Request body for POST requests.
   * @returns The JSON response from the API.
   */
  private static async makeRequest<T>(endpoint: string, method: 'GET' | 'POST', body?: Record<string, unknown>): Promise<T> {
    const url = `${this.API_PROXY_BASE_URL}${endpoint}`;
    const apiKey = this.getApiKey();

    if (!apiKey) {
      throw new Error('La clé API SpeedyIndex n\'est pas configurée.');
    }

    const options: RequestInit = {
      method: method,
      headers: {
        Accept: 'application/json',
        Authorization: apiKey,
      },
      body: body ? JSON.stringify(body) : undefined,
    };

    if (body) {
      (options.headers as Record<string, string>)['Content-Type'] = 'application/json';
    }

    const response = await fetch(url, options);

    const responseText = await response.text();
    let parsedBody: unknown = null;

    if (responseText) {
      try {
        parsedBody = JSON.parse(responseText);
      } catch {
        parsedBody = responseText;
      }
    }

    if (!response.ok) {
      const errorMessage = typeof parsedBody === 'string'
        ? parsedBody
        : (parsedBody as { error?: string })?.error || `SpeedyIndex API Error: ${response.status} ${response.statusText}`;
      throw new Error(errorMessage);
    }

    return parsedBody as T;
  }

  /**
   * Gets the account balance.
   */
  static async getAccountBalance(): Promise<SpeedyIndexAccountResponse> {
    return this.makeRequest('/v2/account', 'GET');
  }

  /**
   * Creates an indexing task.
   * @param urls Array of URLs to index.
   * @param title Task title (optional).
   */
  static async createIndexingTask(
    urls: string[],
    title?: string,
    searchEngine: SpeedyIndexSearchEngine = 'google',
  ): Promise<SpeedyIndexCreateTaskResponse> {
    return this.createTask(searchEngine, 'indexer', urls, title);
  }

  /**
   * Creates an indexation checking task.
   * @param urls Array of URLs to check.
   * @param title Task title (optional).
   */
  static async createCheckingTask(
    urls: string[],
    title?: string,
    searchEngine: SpeedyIndexSearchEngine = 'google',
  ): Promise<SpeedyIndexCreateTaskResponse> {
    return this.createTask(searchEngine, 'checker', urls, title);
  }

  /**
   * Creates a task on SpeedyIndex.
   * @param searchEngine Search engine ('google' | 'yandex').
   * @param taskType Task type ('indexer' | 'checker').
   * @param urls URLs to send to the task.
   * @param title Optional task title.
   */
  static async createTask(
    searchEngine: SpeedyIndexSearchEngine,
    taskType: SpeedyIndexTaskType,
    urls: string[],
    title?: string,
  ): Promise<SpeedyIndexCreateTaskResponse> {
    if (!Array.isArray(urls) || urls.length === 0) {
      throw new Error('Veuillez fournir au moins une URL.');
    }

    const sanitizedUrls = urls
      .map((url) => url?.trim())
      .filter((url): url is string => Boolean(url));

    if (sanitizedUrls.length === 0) {
      throw new Error('Toutes les URLs fournies sont vides.');
    }

    if (sanitizedUrls.length > 10_000) {
      throw new Error('Le maximum autorisé est de 10 000 URLs par tâche.');
    }

    const endpoint = `/v2/task/${searchEngine}/${taskType}/create`;
    const body: Record<string, unknown> = { urls: sanitizedUrls };

    if (title && title.trim().length > 0) {
      body.title = title.trim();
    }

    return this.makeRequest(endpoint, 'POST', body);
  }

  /**
   * Gets the list of tasks.
   * @param searchEngine 'google' or 'yandex'.
   * @param page Page number (starts from 0).
   */
  static async getTaskList(
    searchEngine: SpeedyIndexSearchEngine,
    page: number = 0,
  ): Promise<SpeedyIndexTaskListResponse> {
    if (!Number.isInteger(page) || page < 0) {
      throw new Error('Le numéro de page doit être un entier positif.');
    }

    const endpoint = `/v2/task/${searchEngine}/list/${page}`;
    return this.makeRequest(endpoint, 'GET');
  }

  /**
   * Gets the status of a specific task.
   * @param searchEngine 'google' or 'yandex'.
   * @param taskType 'indexer' or 'checker'.
   * @param taskId The task ID to retrieve.
   */
  static async getTaskStatus(
    searchEngine: SpeedyIndexSearchEngine,
    taskType: SpeedyIndexTaskType,
    taskId: string,
  ): Promise<SpeedyIndexTaskStatusResponse> {
    const sanitizedTaskId = taskId.trim();

    if (!sanitizedTaskId) {
      throw new Error('Identifiant de tâche invalide.');
    }

    const endpoint = `/v2/task/${searchEngine}/${taskType}/get/${encodeURIComponent(sanitizedTaskId)}`;
    return this.makeRequest(endpoint, 'GET');
  }
}

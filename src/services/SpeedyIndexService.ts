// src/services/SpeedyIndexService.ts
// Service to interact with the SpeedyIndex API via the Vercel proxy.

interface SpeedyIndexBalance {
  indexer: number;
  checker: number;
}

interface SpeedyIndexTask {
  id: string;
  size: number;
  processed_count: number;
  indexed_count?: number; // For checker tasks
  type: string;
  title: string;
  is_completed?: boolean; // For checker tasks
  created_at: string;
}

interface SpeedyIndexReportLink {
  url: string;
  title?: string; // Only for Google indexer tasks
  error_code?: number; // Only for indexer tasks
}

interface SpeedyIndexFullReport {
  id: string;
  size: number;
  processed_count: number;
  indexed_links: SpeedyIndexReportLink[];
  unindexed_links: SpeedyIndexReportLink[];
  type: string;
  title: string;
  created_at: string;
}

export class SpeedyIndexService {
  private static readonly API_PROXY_BASE_URL = '/api/speedyindex-proxy';

  /**
   * Makes a request to the SpeedyIndex proxy.
   * @param endpoint The SpeedyIndex API endpoint (e.g., /v2/account).
   * @param method HTTP method (GET, POST).
   * @param body Request body for POST requests.
   * @returns The JSON response from the API.
   */
  private static async makeRequest<T>(endpoint: string, method: 'GET' | 'POST', body?: any): Promise<T> {
    const url = `${this.API_PROXY_BASE_URL}${endpoint}`;
    const options: RequestInit = {
      method: method,
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: body ? JSON.stringify(body) : undefined,
    };

    const response = await fetch(url, options);

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || `SpeedyIndex API Error: ${response.status} ${response.statusText}`);
    }

    return response.json();
  }

  /**
   * Gets the account balance.
   */
  static async getAccountBalance(): Promise<{ code: number; balance: SpeedyIndexBalance }> {
    return this.makeRequest('/v2/account', 'GET');
  }

  /**
   * Creates an indexing task.
   * @param urls Array of URLs to index.
   * @param title Task title (optional).
   * @param isVip Whether to add to VIP queue (costs more).
   */
  static async createIndexingTask(urls: string[], title?: string, isVip: boolean = false): Promise<{ code: number; task_id: string; type: string }> {
    if (isVip && urls.length > 100) {
      throw new Error('VIP queue limit is 100 links.');
    }
    const endpoint = `/v2/task/google/indexer/create`;
    const body = { title, urls };
    const response = await this.makeRequest<{ code: number; task_id: string; type: string }>(endpoint, 'POST', body);

    if (isVip && response.code === 0) {
      // If VIP, add to VIP queue immediately
      await this.addToVipQueue(response.task_id);
    }
    return response;
  }

  /**
   * Creates an indexation checking task.
   * @param urls Array of URLs to check.
   * @param title Task title (optional).
   */
  static async createCheckingTask(urls: string[], title?: string): Promise<{ code: number; task_id: string; type: string }> {
    const endpoint = `/v2/task/google/checker/create`;
    const body = { title, urls };
    return this.makeRequest(endpoint, 'POST', body);
  }

  /**
   * Adds a task to the VIP queue.
   * @param taskId The ID of the task to add to VIP queue.
   */
  static async addToVipQueue(taskId: string): Promise<{ code: number; message: string }> {
    const endpoint = `/v2/task/google/indexer/vip`;
    const body = { task_id: taskId };
    return this.makeRequest(endpoint, 'POST', body);
  }

  /**
   * Gets the list of tasks.
   * @param searchEngine 'google' or 'yandex'.
   * @param taskType 'indexer' or 'checker'.
   * @param page Page number (starts from 0).
   */
  static async getTaskList(searchEngine: 'google' | 'yandex', taskType: 'indexer' | 'checker', page: number = 0): Promise<{ code: number; page: number; last_page: number; result: SpeedyIndexTask[] }> {
    const endpoint = `/v2/task/${searchEngine}/list/${taskType}/${page}`;
    return this.makeRequest(endpoint, 'GET');
  }

  /**
   * Gets the status of specific tasks.
   * @param searchEngine 'google' or 'yandex'.
   * @param taskType 'indexer' or 'checker'.
   * @param taskIds Array of task IDs.
   */
  static async getTaskStatus(searchEngine: 'google' | 'yandex', taskType: 'indexer' | 'checker', taskIds: string[]): Promise<{ code: number; result: SpeedyIndexTask[] }> {
    const endpoint = `/v2/task/${searchEngine}/${taskType}/status`;
    const body = { task_ids: taskIds };
    return this.makeRequest(endpoint, 'POST', body);
  }

  /**
   * Downloads a full task report.
   * @param searchEngine 'google' or 'yandex'.
   * @param taskType 'indexer' or 'checker'.
   * @param taskId Task ID.
   */
  static async downloadTaskReport(searchEngine: 'google' | 'yandex', taskType: 'indexer' | 'checker', taskId: string): Promise<{ code: number; result: SpeedyIndexFullReport }> {
    const endpoint = `/v2/task/${searchEngine}/${taskType}/fullreport`;
    const body = { task_id: taskId };
    return this.makeRequest(endpoint, 'POST', body);
  }

  /**
   * Indexes a single link.
   * @param searchEngine 'google' or 'yandex'.
   * @param url The URL to index.
   */
  static async indexSingleLink(searchEngine: 'google' | 'yandex', url: string): Promise<{ code: number }> {
    const endpoint = `/v2/${searchEngine}/url`;
    const body = { url };
    return this.makeRequest(endpoint, 'POST', body);
  }
}

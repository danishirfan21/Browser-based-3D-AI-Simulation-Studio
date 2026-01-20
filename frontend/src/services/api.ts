import axios, { AxiosInstance, AxiosError } from 'axios';
import type {
  ActionResponse,
  PromptRequest,
  AuthToken,
  User,
  SavedScene,
  SavedSceneListItem,
  SceneData,
} from '../types';

const API_BASE_URL = '/api/v1';

class ApiService {
  private client: AxiosInstance;
  private token: string | null = null;

  constructor() {
    this.client = axios.create({
      baseURL: API_BASE_URL,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // Add request interceptor for auth
    this.client.interceptors.request.use((config) => {
      if (this.token) {
        config.headers.Authorization = `Bearer ${this.token}`;
      }
      return config;
    });

    // Load token from localStorage
    const storedToken = localStorage.getItem('auth_token');
    if (storedToken) {
      this.token = storedToken;
    }
  }

  setToken(token: string | null): void {
    this.token = token;
    if (token) {
      localStorage.setItem('auth_token', token);
    } else {
      localStorage.removeItem('auth_token');
    }
  }

  getToken(): string | null {
    return this.token;
  }

  // Authentication endpoints
  async login(username: string, password: string): Promise<AuthToken> {
    const formData = new URLSearchParams();
    formData.append('username', username);
    formData.append('password', password);

    const response = await this.client.post<AuthToken>('/auth/login', formData, {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
    });

    this.setToken(response.data.access_token);
    return response.data;
  }

  async register(
    email: string,
    username: string,
    password: string
  ): Promise<User> {
    const response = await this.client.post<User>('/auth/register', {
      email,
      username,
      password,
    });
    return response.data;
  }

  logout(): void {
    this.setToken(null);
  }

  // Prompt endpoint
  async parsePrompt(request: PromptRequest): Promise<ActionResponse> {
    // Use demo endpoint if not authenticated
    const endpoint = this.token ? '/prompt' : '/prompt/demo';
    const response = await this.client.post<ActionResponse>(endpoint, request);
    return response.data;
  }

  // Scene endpoints
  async saveScene(
    name: string,
    sceneData: SceneData,
    description?: string
  ): Promise<SavedScene> {
    const response = await this.client.post<SavedScene>('/scene/save', {
      name,
      description,
      scene_data: sceneData,
    });
    return response.data;
  }

  async loadScene(sceneId: number): Promise<SavedScene> {
    const response = await this.client.get<SavedScene>(`/scene/load/${sceneId}`);
    return response.data;
  }

  async listScenes(): Promise<SavedSceneListItem[]> {
    const response = await this.client.get<SavedSceneListItem[]>('/scene/list');
    return response.data;
  }

  async deleteScene(sceneId: number): Promise<void> {
    await this.client.delete(`/scene/delete/${sceneId}`);
  }

  // Error handling helper
  static getErrorMessage(error: unknown): string {
    if (error instanceof AxiosError) {
      if (error.response?.data?.detail) {
        return error.response.data.detail;
      }
      if (error.message) {
        return error.message;
      }
    }
    if (error instanceof Error) {
      return error.message;
    }
    return 'An unknown error occurred';
  }
}

export const apiService = new ApiService();
export default apiService;

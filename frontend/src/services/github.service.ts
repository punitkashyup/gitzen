/**
 * GitHub Service
 * 
 * API calls for GitHub integration endpoints.
 */
import apiClient from '../lib/api-client';

export interface GitHubProfile {
  name: string;
  bio: string | null;
  location: string | null;
  company: string | null;
  blog: string | null;
  public_repos: number;
  followers: number;
  following: number;
  html_url: string;
  avatar_url: string;
  login: string;
}

export interface GitHubRepository {
  id: number;
  name: string;
  full_name: string;
  description: string | null;
  private: boolean;
  html_url: string;
  language: string | null;
  stargazers_count: number;
  forks_count: number;
  updated_at: string;
  pushed_at: string;
}

/**
 * Get GitHub profile for the authenticated user
 */
export const getGitHubProfile = async (): Promise<GitHubProfile> => {
  const response = await apiClient.get<GitHubProfile>('/github/profile');
  return response.data;
};

/**
 * Get repositories for the authenticated user
 */
export const getGitHubRepositories = async (): Promise<GitHubRepository[]> => {
  const response = await apiClient.get<GitHubRepository[]>('/github/repositories');
  return response.data;
};

/**
 * Get a specific repository by name
 */
export const getGitHubRepository = async (repoName: string): Promise<GitHubRepository> => {
  const response = await apiClient.get<GitHubRepository>(`/github/repository/${repoName}`);
  return response.data;
};

/**
 * GitHub service object
 */
const githubService = {
  getGitHubProfile,
  getGitHubRepositories,
  getGitHubRepository,
};

export default githubService;
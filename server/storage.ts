import { 
  users, alerts, searchResults, generatedReplies, faqs, socialMetrics,
  type User, type InsertUser, type Alert, type InsertAlert,
  type SearchResult, type InsertSearchResult,
  type GeneratedReply, type InsertGeneratedReply,
  type Faq, type InsertFaq, type SocialMetric, type InsertSocialMetric
} from "@shared/schema";

export interface IStorage {
  // Users
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  
  // Alerts
  getAlerts(): Promise<Alert[]>;
  getAlert(id: number): Promise<Alert | undefined>;
  createAlert(alert: InsertAlert): Promise<Alert>;
  updateAlert(id: number, alert: Partial<Alert>): Promise<Alert | undefined>;
  deleteAlert(id: number): Promise<boolean>;
  
  // Search Results
  getSearchResults(type?: string): Promise<SearchResult[]>;
  createSearchResult(result: InsertSearchResult): Promise<SearchResult>;
  
  // Generated Replies
  getGeneratedReplies(): Promise<GeneratedReply[]>;
  createGeneratedReply(reply: InsertGeneratedReply): Promise<GeneratedReply>;
  
  // Social Metrics
  getSocialMetrics(url?: string, platform?: string): Promise<SocialMetric[]>;
  createSocialMetric(metric: InsertSocialMetric): Promise<SocialMetric>;
  getLatestMetrics(url: string): Promise<SocialMetric | undefined>;
}

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private alerts: Map<number, Alert>;
  private searchResults: Map<number, SearchResult>;
  private generatedReplies: Map<number, GeneratedReply>;
  private socialMetrics: Map<number, SocialMetric>;
  private currentUserId: number;
  private currentAlertId: number;
  private currentSearchResultId: number;
  private currentReplyId: number;
  private currentMetricId: number;

  constructor() {
    this.users = new Map();
    this.alerts = new Map();
    this.searchResults = new Map();
    this.generatedReplies = new Map();
    this.socialMetrics = new Map();
    this.currentUserId = 1;
    this.currentAlertId = 1;
    this.currentSearchResultId = 1;
    this.currentReplyId = 1;
    this.currentMetricId = 1;
  }

  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username,
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.currentUserId++;
    const user: User = { ...insertUser, id };
    this.users.set(id, user);
    return user;
  }

  async getAlerts(): Promise<Alert[]> {
    return Array.from(this.alerts.values());
  }

  async getAlert(id: number): Promise<Alert | undefined> {
    return this.alerts.get(id);
  }

  async createAlert(insertAlert: InsertAlert): Promise<Alert> {
    const id = this.currentAlertId++;
    const now = new Date();
    const alert: Alert = { 
      ...insertAlert,
      maxResults: insertAlert.maxResults ?? 10,
      minOpportunityScore: insertAlert.minOpportunityScore ?? "medium",
      includeNegativeSentiment: insertAlert.includeNegativeSentiment ?? false,
      emailNotifications: insertAlert.emailNotifications ?? true,
      email: insertAlert.email ?? null,
      reportUrl: insertAlert.reportUrl ?? null,
      webhookUrl: insertAlert.webhookUrl ?? null,
      isActive: true,
      id,
      createdAt: now,
      lastRun: null
    };
    this.alerts.set(id, alert);
    return alert;
  }

  async updateAlert(id: number, alertUpdate: Partial<Alert>): Promise<Alert | undefined> {
    const existingAlert = this.alerts.get(id);
    if (!existingAlert) return undefined;
    
    const updatedAlert = { ...existingAlert, ...alertUpdate };
    this.alerts.set(id, updatedAlert);
    return updatedAlert;
  }

  async deleteAlert(id: number): Promise<boolean> {
    return this.alerts.delete(id);
  }

  async getSearchResults(type?: string): Promise<SearchResult[]> {
    const results = Array.from(this.searchResults.values());
    return type ? results.filter(r => r.type === type) : results;
  }

  async createSearchResult(insertResult: InsertSearchResult): Promise<SearchResult> {
    const id = this.currentSearchResultId++;
    const result: SearchResult = { 
      ...insertResult, 
      id,
      createdAt: new Date()
    };
    this.searchResults.set(id, result);
    return result;
  }

  async getGeneratedReplies(): Promise<GeneratedReply[]> {
    return Array.from(this.generatedReplies.values())
      .sort((a, b) => new Date(b.createdAt!).getTime() - new Date(a.createdAt!).getTime());
  }

  async createGeneratedReply(insertReply: InsertGeneratedReply): Promise<GeneratedReply> {
    const id = this.currentReplyId++;
    const reply: GeneratedReply = { 
      ...insertReply,
      brandName: insertReply.brandName ?? null,
      brandContext: insertReply.brandContext ?? null,
      brandUrl: insertReply.brandUrl ?? null,
      creativity: insertReply.creativity ?? "0.7",
      aiProvider: insertReply.aiProvider ?? "openai",
      model: insertReply.model ?? "gpt-4o",
      feedback: insertReply.feedback ?? null,
      id,
      createdAt: new Date()
    };
    this.generatedReplies.set(id, reply);
    return reply;
  }

  async getSocialMetrics(url?: string, platform?: string): Promise<SocialMetric[]> {
    let metrics = Array.from(this.socialMetrics.values());
    
    if (url) {
      metrics = metrics.filter(m => m.url === url);
    }
    
    if (platform) {
      metrics = metrics.filter(m => m.platform === platform);
    }
    
    return metrics.sort((a, b) => 
      new Date(b.createdAt!).getTime() - new Date(a.createdAt!).getTime()
    );
  }

  async createSocialMetric(insertMetric: InsertSocialMetric): Promise<SocialMetric> {
    const id = this.currentMetricId++;
    const metric: SocialMetric = { 
      ...insertMetric,
      id,
      createdAt: new Date()
    };
    this.socialMetrics.set(id, metric);
    return metric;
  }

  async getLatestMetrics(url: string): Promise<SocialMetric | undefined> {
    const metrics = await this.getSocialMetrics(url);
    return metrics[0]; // First item is the latest due to sorting
  }
}

export const storage = new MemStorage();

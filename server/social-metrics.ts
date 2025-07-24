/**
 * Real-time Social Media Metrics Collection
 * Fetches live engagement data from Reddit, Quora, and Twitter
 */

import { config } from "./config";

export interface SocialMetrics {
  platform: string;
  url: string;
  metrics: {
    // Reddit metrics
    upvotes?: number;
    downvotes?: number;
    comments?: number;
    awards?: number;
    
    // Quora metrics
    views?: number;
    upvotes_quora?: number;
    shares?: number;
    
    // Twitter metrics
    likes?: number;
    retweets?: number;
    replies?: number;
    quotes?: number;
    bookmarks?: number;
  };
  timestamp: string;
  success: boolean;
  error?: string;
}

/**
 * Extract Reddit post metrics using Reddit API
 */
async function getRedditMetrics(url: string): Promise<SocialMetrics> {
  try {
    // Extract Reddit post ID from URL
    const redditMatch = url.match(/reddit\.com\/r\/[^/]+\/comments\/([^/]+)/);
    if (!redditMatch) {
      throw new Error("Invalid Reddit URL format");
    }
    
    const postId = redditMatch[1];
    const apiUrl = `https://www.reddit.com/comments/${postId}.json`;
    
    const response = await fetch(apiUrl, {
      headers: {
        'User-Agent': 'SocialMonitor-AI/1.0 (Social Media Analytics Tool)',
        'Accept': 'application/json'
      }
    });
    
    if (!response.ok) {
      throw new Error(`Reddit API error: ${response.statusText}`);
    }
    
    const data = await response.json();
    const postData = data[0]?.data?.children[0]?.data;
    
    if (!postData) {
      throw new Error("Reddit post data not found");
    }
    
    return {
      platform: 'reddit',
      url,
      metrics: {
        upvotes: postData.ups || 0,
        downvotes: postData.downs || 0,
        comments: postData.num_comments || 0,
        awards: postData.total_awards_received || 0
      },
      timestamp: new Date().toISOString(),
      success: true
    };
    
  } catch (error) {
    return {
      platform: 'reddit',
      url,
      metrics: {},
      timestamp: new Date().toISOString(),
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

/**
 * Extract Quora metrics using web scraping (Quora doesn't have public API)
 */
async function getQuoraMetrics(url: string): Promise<SocialMetrics> {
  try {
    // Use Serper API to get Quora page data
    const response = await fetch('https://google.serper.dev/search', {
      method: 'POST',
      headers: {
        'X-API-KEY': config.serper.apiKey,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        q: `site:quora.com "${url}"`,
        num: 1
      }),
    });
    
    if (!response.ok) {
      throw new Error(`Serper API error: ${response.statusText}`);
    }
    
    const data = await response.json();
    const result = data.organic?.[0];
    
    if (!result) {
      throw new Error("Quora post not found in search results");
    }
    
    // Extract metrics from snippet (basic implementation)
    const snippet = result.snippet || "";
    const viewsMatch = snippet.match(/(\d+(?:,\d+)*)\s*views?/i);
    const upvotesMatch = snippet.match(/(\d+(?:,\d+)*)\s*upvotes?/i);
    
    return {
      platform: 'quora',
      url,
      metrics: {
        views: viewsMatch ? parseInt(viewsMatch[1].replace(/,/g, '')) : 0,
        upvotes_quora: upvotesMatch ? parseInt(upvotesMatch[1].replace(/,/g, '')) : 0,
        shares: 0 // Quora doesn't expose share counts easily
      },
      timestamp: new Date().toISOString(),
      success: true
    };
    
  } catch (error) {
    return {
      platform: 'quora',
      url,
      metrics: {},
      timestamp: new Date().toISOString(),
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

/**
 * Extract Twitter metrics using Twitter API v2
 * Note: Requires Twitter API access - falling back to web scraping approach
 */
async function getTwitterMetrics(url: string): Promise<SocialMetrics> {
  try {
    // Extract tweet ID from URL
    const twitterMatch = url.match(/twitter\.com\/[^/]+\/status\/(\d+)|x\.com\/[^/]+\/status\/(\d+)/);
    if (!twitterMatch) {
      throw new Error("Invalid Twitter/X URL format");
    }
    
    const tweetId = twitterMatch[1] || twitterMatch[2];
    
    // Use Serper API to get Twitter engagement data
    const response = await fetch('https://google.serper.dev/search', {
      method: 'POST',
      headers: {
        'X-API-KEY': config.serper.apiKey,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        q: `site:twitter.com OR site:x.com "${tweetId}" engagement metrics`,
        num: 1
      }),
    });
    
    if (!response.ok) {
      throw new Error(`Serper API error: ${response.statusText}`);
    }
    
    const data = await response.json();
    const result = data.organic?.[0];
    
    // Extract metrics from search results (basic implementation)
    const snippet = result?.snippet || "";
    const likesMatch = snippet.match(/(\d+(?:,\d+)*)\s*likes?/i);
    const retweetsMatch = snippet.match(/(\d+(?:,\d+)*)\s*retweets?/i);
    const repliesMatch = snippet.match(/(\d+(?:,\d+)*)\s*replies?/i);
    
    return {
      platform: 'twitter',
      url,
      metrics: {
        likes: likesMatch ? parseInt(likesMatch[1].replace(/,/g, '')) : 0,
        retweets: retweetsMatch ? parseInt(retweetsMatch[1].replace(/,/g, '')) : 0,
        replies: repliesMatch ? parseInt(repliesMatch[1].replace(/,/g, '')) : 0,
        quotes: 0, // Requires Twitter API
        bookmarks: 0 // Not publicly available
      },
      timestamp: new Date().toISOString(),
      success: true
    };
    
  } catch (error) {
    return {
      platform: 'twitter',
      url,
      metrics: {},
      timestamp: new Date().toISOString(),
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

/**
 * Get metrics for any social media URL
 */
export async function getSocialMetrics(url: string): Promise<SocialMetrics> {
  const normalizedUrl = url.toLowerCase();
  
  if (normalizedUrl.includes('reddit.com')) {
    return getRedditMetrics(url);
  } else if (normalizedUrl.includes('quora.com')) {
    return getQuoraMetrics(url);
  } else if (normalizedUrl.includes('twitter.com') || normalizedUrl.includes('x.com')) {
    return getTwitterMetrics(url);
  } else {
    return {
      platform: 'unknown',
      url,
      metrics: {},
      timestamp: new Date().toISOString(),
      success: false,
      error: 'Unsupported platform. Supported: Reddit, Quora, Twitter/X'
    };
  }
}

/**
 * Get metrics for multiple URLs in parallel
 */
export async function getBulkSocialMetrics(urls: string[]): Promise<SocialMetrics[]> {
  const promises = urls.map(url => getSocialMetrics(url));
  return Promise.all(promises);
}

/**
 * Real-time metrics monitoring with periodic updates
 */
export class MetricsMonitor {
  private intervals: Map<string, NodeJS.Timeout> = new Map();
  
  /**
   * Start monitoring a URL for metrics changes
   */
  startMonitoring(url: string, intervalMs: number = 300000, callback: (metrics: SocialMetrics) => void) {
    // Clear existing interval if any
    this.stopMonitoring(url);
    
    // Initial fetch
    getSocialMetrics(url).then(callback);
    
    // Set up periodic monitoring
    const interval = setInterval(async () => {
      const metrics = await getSocialMetrics(url);
      callback(metrics);
    }, intervalMs);
    
    this.intervals.set(url, interval);
  }
  
  /**
   * Stop monitoring a specific URL
   */
  stopMonitoring(url: string) {
    const interval = this.intervals.get(url);
    if (interval) {
      clearInterval(interval);
      this.intervals.delete(url);
    }
  }
  
  /**
   * Stop all monitoring
   */
  stopAllMonitoring() {
    this.intervals.forEach((interval) => {
      clearInterval(interval);
    });
    this.intervals.clear();
  }
}

export const metricsMonitor = new MetricsMonitor();
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';
import { 
  Activity, 
  BarChart3, 
  Clock, 
  Eye, 
  Heart, 
  MessageCircle, 
  Repeat2, 
  Share, 
  TrendingUp,
  RefreshCw,
  Play,
  Pause
} from 'lucide-react';

interface SocialMetrics {
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

interface MonitoringStatus {
  [url: string]: {
    isMonitoring: boolean;
    intervalMinutes: number;
  };
}

export default function SocialMetrics() {
  const [url, setUrl] = useState('');
  const [bulkUrls, setBulkUrls] = useState('');
  const [metrics, setMetrics] = useState<SocialMetrics | null>(null);
  const [bulkMetrics, setBulkMetrics] = useState<SocialMetrics[]>([]);
  const [history, setHistory] = useState<SocialMetrics[]>([]);
  const [loading, setLoading] = useState(false);
  const [monitoring, setMonitoring] = useState<MonitoringStatus>({});
  const { toast } = useToast();

  const fetchSingleMetrics = async () => {
    if (!url.trim()) {
      toast({
        title: "Error",
        description: "Please enter a URL",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      const response = await apiRequest('/api/metrics/get', {
        method: 'POST',
        body: JSON.stringify({ url: url.trim() }),
      });

      setMetrics(response);
      
      if (response.success) {
        toast({
          title: "Success",
          description: `Retrieved ${response.platform} metrics successfully`,
        });
      } else {
        toast({
          title: "Error",
          description: response.error || "Failed to fetch metrics",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to fetch social media metrics",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchBulkMetrics = async () => {
    const urls = bulkUrls.split('\n').map(u => u.trim()).filter(Boolean);
    
    if (urls.length === 0) {
      toast({
        title: "Error",
        description: "Please enter at least one URL",
        variant: "destructive",
      });
      return;
    }

    if (urls.length > 20) {
      toast({
        title: "Error",
        description: "Maximum 20 URLs allowed",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      const response = await apiRequest('/api/metrics/bulk', {
        method: 'POST',
        body: JSON.stringify({ urls }),
      });

      setBulkMetrics(response.results);
      toast({
        title: "Success",
        description: `Processed ${response.totalProcessed} URLs, ${response.successfulCount} successful`,
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to fetch bulk metrics",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchHistory = async (historyUrl: string) => {
    try {
      const encodedUrl = encodeURIComponent(historyUrl);
      const response = await apiRequest(`/api/metrics/history/${encodedUrl}?limit=20`);
      setHistory(response.metrics);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to fetch metrics history",
        variant: "destructive",
      });
    }
  };

  const startMonitoring = async (monitorUrl: string, intervalMinutes: number = 5) => {
    try {
      await apiRequest('/api/metrics/monitor/start', {
        method: 'POST',
        body: JSON.stringify({ url: monitorUrl, intervalMinutes }),
      });

      setMonitoring(prev => ({
        ...prev,
        [monitorUrl]: { isMonitoring: true, intervalMinutes }
      }));

      toast({
        title: "Monitoring Started",
        description: `Now monitoring ${monitorUrl} every ${intervalMinutes} minutes`,
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to start monitoring",
        variant: "destructive",
      });
    }
  };

  const stopMonitoring = async (monitorUrl: string) => {
    try {
      await apiRequest('/api/metrics/monitor/stop', {
        method: 'POST',
        body: JSON.stringify({ url: monitorUrl }),
      });

      setMonitoring(prev => {
        const updated = { ...prev };
        delete updated[monitorUrl];
        return updated;
      });

      toast({
        title: "Monitoring Stopped",
        description: `Stopped monitoring ${monitorUrl}`,
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to stop monitoring",
        variant: "destructive",
      });
    }
  };

  const renderMetricsCard = (metricsData: SocialMetrics, index?: number) => {
    const { platform, metrics: data, timestamp, success, error } = metricsData;
    
    if (!success) {
      return (
        <Card key={index} className="border-red-200">
          <CardHeader>
            <CardTitle className="text-red-600">Error - {platform}</CardTitle>
            <CardDescription>{error}</CardDescription>
          </CardHeader>
        </Card>
      );
    }

    const getPlatformIcon = () => {
      switch (platform) {
        case 'reddit':
          return <MessageCircle className="h-5 w-5 text-orange-500" />;
        case 'quora':
          return <Eye className="h-5 w-5 text-red-500" />;
        case 'twitter':
          return <Heart className="h-5 w-5 text-blue-500" />;
        default:
          return <Activity className="h-5 w-5" />;
      }
    };

    return (
      <Card key={index} className="hover:shadow-md transition-shadow">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            {getPlatformIcon()}
            {platform.charAt(0).toUpperCase() + platform.slice(1)} Metrics
          </CardTitle>
          <CardDescription>
            Updated: {new Date(timestamp).toLocaleString()}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {/* Reddit Metrics */}
            {platform === 'reddit' && (
              <>
                {data.upvotes !== undefined && (
                  <div className="flex items-center gap-2">
                    <TrendingUp className="h-4 w-4 text-green-500" />
                    <div>
                      <div className="text-2xl font-bold text-green-600">{data.upvotes}</div>
                      <div className="text-sm text-gray-500">Upvotes</div>
                    </div>
                  </div>
                )}
                {data.comments !== undefined && (
                  <div className="flex items-center gap-2">
                    <MessageCircle className="h-4 w-4 text-blue-500" />
                    <div>
                      <div className="text-2xl font-bold text-blue-600">{data.comments}</div>
                      <div className="text-sm text-gray-500">Comments</div>
                    </div>
                  </div>
                )}
                {data.awards !== undefined && (
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="h-4 w-4 text-yellow-500" />
                    <div>
                      <div className="text-2xl font-bold text-yellow-600">{data.awards}</div>
                      <div className="text-sm text-gray-500">Awards</div>
                    </div>
                  </div>
                )}
              </>
            )}

            {/* Quora Metrics */}
            {platform === 'quora' && (
              <>
                {data.views !== undefined && (
                  <div className="flex items-center gap-2">
                    <Eye className="h-4 w-4 text-purple-500" />
                    <div>
                      <div className="text-2xl font-bold text-purple-600">{data.views.toLocaleString()}</div>
                      <div className="text-sm text-gray-500">Views</div>
                    </div>
                  </div>
                )}
                {data.upvotes_quora !== undefined && (
                  <div className="flex items-center gap-2">
                    <TrendingUp className="h-4 w-4 text-green-500" />
                    <div>
                      <div className="text-2xl font-bold text-green-600">{data.upvotes_quora}</div>
                      <div className="text-sm text-gray-500">Upvotes</div>
                    </div>
                  </div>
                )}
                {data.shares !== undefined && (
                  <div className="flex items-center gap-2">
                    <Share className="h-4 w-4 text-indigo-500" />
                    <div>
                      <div className="text-2xl font-bold text-indigo-600">{data.shares}</div>
                      <div className="text-sm text-gray-500">Shares</div>
                    </div>
                  </div>
                )}
              </>
            )}

            {/* Twitter Metrics */}
            {platform === 'twitter' && (
              <>
                {data.likes !== undefined && (
                  <div className="flex items-center gap-2">
                    <Heart className="h-4 w-4 text-red-500" />
                    <div>
                      <div className="text-2xl font-bold text-red-600">{data.likes}</div>
                      <div className="text-sm text-gray-500">Likes</div>
                    </div>
                  </div>
                )}
                {data.retweets !== undefined && (
                  <div className="flex items-center gap-2">
                    <Repeat2 className="h-4 w-4 text-green-500" />
                    <div>
                      <div className="text-2xl font-bold text-green-600">{data.retweets}</div>
                      <div className="text-sm text-gray-500">Retweets</div>
                    </div>
                  </div>
                )}
                {data.replies !== undefined && (
                  <div className="flex items-center gap-2">
                    <MessageCircle className="h-4 w-4 text-blue-500" />
                    <div>
                      <div className="text-2xl font-bold text-blue-600">{data.replies}</div>
                      <div className="text-sm text-gray-500">Replies</div>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>

          {/* Monitoring Controls */}
          <div className="mt-4 pt-4 border-t flex items-center gap-2">
            {!monitoring[metricsData.url]?.isMonitoring ? (
              <Button
                size="sm"
                variant="outline"
                onClick={() => startMonitoring(metricsData.url)}
                className="flex items-center gap-1"
              >
                <Play className="h-3 w-3" />
                Start Monitoring
              </Button>
            ) : (
              <Button
                size="sm"
                variant="outline"
                onClick={() => stopMonitoring(metricsData.url)}
                className="flex items-center gap-1"
              >
                <Pause className="h-3 w-3" />
                Stop Monitoring
              </Button>
            )}
            <Button
              size="sm"
              variant="ghost"
              onClick={() => fetchHistory(metricsData.url)}
              className="flex items-center gap-1"
            >
              <BarChart3 className="h-3 w-3" />
              View History
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="container mx-auto py-8 space-y-8">
      <div className="flex items-center gap-3">
        <Activity className="h-8 w-8 text-blue-600" />
        <div>
          <h1 className="text-3xl font-bold">Real-time Social Media Metrics</h1>
          <p className="text-gray-600">
            Track engagement metrics for Reddit, Quora, and Twitter posts in real-time
          </p>
        </div>
      </div>

      <Tabs defaultValue="single" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="single">Single URL</TabsTrigger>
          <TabsTrigger value="bulk">Bulk URLs</TabsTrigger>
          <TabsTrigger value="history">History</TabsTrigger>
          <TabsTrigger value="monitoring">Monitoring</TabsTrigger>
        </TabsList>

        <TabsContent value="single" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Get Real-time Metrics</CardTitle>
              <CardDescription>
                Enter a Reddit, Quora, or Twitter URL to fetch live engagement metrics
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="url">Social Media URL</Label>
                <Input
                  id="url"
                  placeholder="https://reddit.com/r/programming/comments/..."
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                />
              </div>
              <Button onClick={fetchSingleMetrics} disabled={loading} className="w-full">
                {loading ? (
                  <>
                    <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                    Fetching Metrics...
                  </>
                ) : (
                  <>
                    <Activity className="mr-2 h-4 w-4" />
                    Get Metrics
                  </>
                )}
              </Button>
            </CardContent>
          </Card>

          {metrics && renderMetricsCard(metrics)}
        </TabsContent>

        <TabsContent value="bulk" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Bulk Metrics Collection</CardTitle>
              <CardDescription>
                Enter multiple URLs (one per line) to fetch metrics for up to 20 posts at once
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="bulkUrls">URLs (one per line)</Label>
                <textarea
                  id="bulkUrls"
                  className="min-h-[120px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  placeholder={`https://reddit.com/r/programming/comments/example1
https://quora.com/example-question
https://twitter.com/user/status/example3`}
                  value={bulkUrls}
                  onChange={(e) => setBulkUrls(e.target.value)}
                />
              </div>
              <Button onClick={fetchBulkMetrics} disabled={loading} className="w-full">
                {loading ? (
                  <>
                    <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                    Processing URLs...
                  </>
                ) : (
                  <>
                    <BarChart3 className="mr-2 h-4 w-4" />
                    Get Bulk Metrics
                  </>
                )}
              </Button>
            </CardContent>
          </Card>

          <div className="grid gap-6">
            {bulkMetrics.map((metric, index) => renderMetricsCard(metric, index))}
          </div>
        </TabsContent>

        <TabsContent value="history" className="space-y-6">
          {history.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Metrics History</CardTitle>
                <CardDescription>
                  Historical engagement data for the selected URL
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {history.map((metric, index) => renderMetricsCard(metric, index))}
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="monitoring" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Active Monitoring</CardTitle>
              <CardDescription>
                Currently monitored URLs and their status
              </CardDescription>
            </CardHeader>
            <CardContent>
              {Object.keys(monitoring).length === 0 ? (
                <p className="text-gray-500 text-center py-8">
                  No URLs are currently being monitored. Use the "Start Monitoring" button on any metrics card to begin.
                </p>
              ) : (
                <div className="space-y-4">
                  {Object.entries(monitoring).map(([monitorUrl, status]) => (
                    <div
                      key={monitorUrl}
                      className="flex items-center justify-between p-4 border rounded-lg"
                    >
                      <div>
                        <div className="font-medium truncate max-w-md">{monitorUrl}</div>
                        <div className="text-sm text-gray-500">
                          Checking every {status.intervalMinutes} minutes
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="bg-green-50">
                          <Clock className="h-3 w-3 mr-1" />
                          Active
                        </Badge>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => stopMonitoring(monitorUrl)}
                        >
                          Stop
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
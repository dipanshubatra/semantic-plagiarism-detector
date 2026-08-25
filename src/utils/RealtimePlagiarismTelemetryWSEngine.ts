/**
 * Realtime Plagiarism Telemetry WebSocket Engine
 * Provides live streaming telemetry for incoming document scan results, instant similarity flags,
 * and teacher notification routing across active web socket client connections.
 */

export interface TelemetryClient {
  clientId: string;
  teacherId: string;
  subscribedCourses: string[];
  connectedAt: string;
  isAlive: boolean;
}

export interface TelemetryBatchPayload {
  eventId: string;
  courseId: string;
  assignmentId: string;
  incidentType: 'CRITICAL_PLAGIARISM' | 'HIGH_RISK' | 'MODERATE_SUSPICION' | 'LOW_RISK';
  studentA: string;
  studentB: string;
  similarityScore: number;
  timestamp: string;
}

export interface TelemetryMetrics {
  totalEventsDispatched: number;
  activeClientCount: number;
  lastDispatchedEventId: string | null;
  channelSubscribersCount: Record<string, number>;
}

export class RealtimePlagiarismTelemetryWSEngine {
  private clients: Map<string, TelemetryClient>;
  private eventHistory: TelemetryBatchPayload[];
  private totalDispatched: number;

  constructor() {
    this.clients = new Map<string, TelemetryClient>();
    this.eventHistory = [];
    this.totalDispatched = 0;
  }

  public registerClient(client: TelemetryClient): void {
    this.clients.set(client.clientId, client);
  }

  public unregisterClient(clientId: string): boolean {
    return this.clients.delete(clientId);
  }

  public getActiveClients(): TelemetryClient[] {
    return Array.from(this.clients.values()).filter(c => c.isAlive);
  }

  public subscribeToCourse(clientId: string, courseId: string): boolean {
    const client = this.clients.get(clientId);
    if (!client) return false;

    if (!client.subscribedCourses.includes(courseId)) {
      client.subscribedCourses.push(courseId);
    }
    return true;
  }

  public broadcastTelemetryEvent(payload: TelemetryBatchPayload): number {
    this.eventHistory.push(payload);
    let dispatchedToClients = 0;

    for (const client of this.clients.values()) {
      if (client.isAlive && client.subscribedCourses.includes(payload.courseId)) {
        // Simulated WebSocket dispatch logic
        dispatchedToClients++;
      }
    }

    this.totalDispatched++;
    return dispatchedToClients;
  }

  public getTelemetryMetrics(): TelemetryMetrics {
    const channelCounts: Record<string, number> = {};

    for (const client of this.clients.values()) {
      for (const course of client.subscribedCourses) {
        channelCounts[course] = (channelCounts[course] || 0) + 1;
      }
    }

    const lastEvent = this.eventHistory.length > 0 ? this.eventHistory[this.eventHistory.length - 1].eventId : null;

    return {
      totalEventsDispatched: this.totalDispatched,
      activeClientCount: this.clients.size,
      lastDispatchedEventId: lastEvent,
      channelSubscribersCount: channelCounts,
    };
  }

  public getRecentEventHistory(limit = 20): TelemetryBatchPayload[] {
    return this.eventHistory.slice(-limit);
  }
}

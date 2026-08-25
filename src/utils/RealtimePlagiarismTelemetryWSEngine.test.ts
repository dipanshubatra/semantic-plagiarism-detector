import { describe, it, expect, beforeEach } from 'vitest';
import {
  RealtimePlagiarismTelemetryWSEngine,
  TelemetryClient,
  TelemetryBatchPayload,
} from './RealtimePlagiarismTelemetryWSEngine';

describe('RealtimePlagiarismTelemetryWSEngine', () => {
  let telemetryEngine: RealtimePlagiarismTelemetryWSEngine;

  const mockClient1: TelemetryClient = {
    clientId: 'client_001',
    teacherId: 'teacher_101',
    subscribedCourses: ['CS-401', 'CS-502'],
    connectedAt: '2026-08-25T12:00:00Z',
    isAlive: true,
  };

  const mockClient2: TelemetryClient = {
    clientId: 'client_002',
    teacherId: 'teacher_102',
    subscribedCourses: ['ENG-101'],
    connectedAt: '2026-08-25T12:05:00Z',
    isAlive: true,
  };

  beforeEach(() => {
    telemetryEngine = new RealtimePlagiarismTelemetryWSEngine();
  });

  it('should register connected WebSocket clients and handle channel subscriptions', () => {
    telemetryEngine.registerClient(mockClient1);
    telemetryEngine.registerClient(mockClient2);

    const activeClients = telemetryEngine.getActiveClients();
    expect(activeClients.length).toBe(2);
    expect(activeClients[0].subscribedCourses).toContain('CS-401');
  });

  it('should broadcast telemetry events to relevant course subscribers', () => {
    telemetryEngine.registerClient(mockClient1);
    telemetryEngine.registerClient(mockClient2);

    const eventPayload: TelemetryBatchPayload = {
      eventId: 'evt_991',
      courseId: 'CS-401',
      assignmentId: 'ASSIGN-2',
      incidentType: 'CRITICAL_PLAGIARISM',
      studentA: 'Alice',
      studentB: 'Bob',
      similarityScore: 0.92,
      timestamp: '2026-08-25T12:10:00Z',
    };

    const dispatchedCount = telemetryEngine.broadcastTelemetryEvent(eventPayload);
    expect(dispatchedCount).toBe(1); // Only mockClient1 is subscribed to CS-401
  });

  it('should calculate telemetry throughput metrics and event logs', () => {
    telemetryEngine.registerClient(mockClient1);

    telemetryEngine.broadcastTelemetryEvent({
      eventId: 'evt_992',
      courseId: 'CS-401',
      assignmentId: 'ASSIGN-2',
      incidentType: 'MODERATE_SUSPICION',
      studentA: 'Charlie',
      studentB: 'David',
      similarityScore: 0.55,
      timestamp: '2026-08-25T12:11:00Z',
    });

    const metrics = telemetryEngine.getTelemetryMetrics();
    expect(metrics.totalEventsDispatched).toBe(1);
    expect(metrics.activeClientCount).toBe(1);
    expect(metrics.lastDispatchedEventId).toBe('evt_992');
  });
});

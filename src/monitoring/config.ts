export const monitoringConfig = {
  requestLogging: {
    enabled: process.env.REQUEST_LOGGING_ENABLED !== 'false',
    excludePaths: [
      '/_next/',
      '/favicon.ico',
      '/api/health',
      '/api/media/',
      '/api/llms.txt',
      '/manifest.webmanifest',
    ],
    slowRequestThresholdMs: 1000,
  },
  retention: {
    securityEventsDays: Number(process.env.SECURITY_EVENTS_RETENTION_DAYS) || 180,
    adminAuditLogsDays: Number(process.env.ADMIN_AUDIT_LOGS_RETENTION_DAYS) || 90,
  },
  cleanup: {
    batchSize: 1000,
  },
}

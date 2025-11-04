type LogLevel = 'debug' | 'info' | 'warn' | 'error';

function emit(level: LogLevel, args: unknown[]) {
  // Silence debug logs in production builds
  if (level === 'debug' && !__DEV__) return;
  // eslint-disable-next-line no-console
  (console as any)[level](...args);
}

export const logger = {
  debug: (...args: unknown[]) => emit('debug', args),
  info: (...args: unknown[]) => emit('info', args),
  warn: (...args: unknown[]) => emit('warn', args),
  error: (...args: unknown[]) => emit('error', args),
};



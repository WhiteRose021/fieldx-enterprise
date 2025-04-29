export class Logger {
    static info(message: string, meta: Record<string, any> = {}) {
      console.info(`ℹ️  ${message}`, meta);
    }
  
    static warn(message: string, meta: Record<string, any> = {}) {
      console.warn(`⚠️  ${message}`, meta);
    }
  
    static error(message: string, meta: Record<string, any> = {}) {
      console.error(`❌ ${message}`, meta);
    }
  
    static debug(message: string, meta: Record<string, any> = {}) {
      if (process.env.NODE_ENV === 'development') {
        console.debug(`🐛 ${message}`, meta);
      }
    }
  }
  
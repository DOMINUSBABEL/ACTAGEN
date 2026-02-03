
// Defense Service: Protection against request saturation and unauthorized usage.
// Part of the "Moltbook Defense Initiative" for ACTAGEN.

interface RateLimitConfig {
  maxRequestsPerMinute: number;
  maxRequestsPerHour: number;
  cooldownSeconds: number;
}

interface RequestLog {
  timestamp: number;
  endpoint?: string;
}

class DefenseService {
  private requestLog: RequestLog[] = [];
  private isLockdown: boolean = false;
  private config: RateLimitConfig = {
    maxRequestsPerMinute: 10, // Strict limit for heavy AI calls
    maxRequestsPerHour: 100,
    cooldownSeconds: 60
  };
  
  // Simple "Access Token" protection (Client-side gatekeeper)
  // In a real production env, this should be validated by a backend.
  private accessCode: string | null = null;
  private readonly EXPECTED_CODE_HASH = "DOMINUS_SECURE_2026"; // Simple placeholder

  constructor() {
    this.loadState();
  }

  private loadState() {
    try {
      const saved = localStorage.getItem('actagen_defense_log');
      if (saved) {
        const parsed = JSON.parse(saved);
        // Clean old logs (> 1 hour)
        const oneHourAgo = Date.now() - 3600000;
        this.requestLog = parsed.filter((r: RequestLog) => r.timestamp > oneHourAgo);
      }
    } catch (e) {
      console.warn("DefenseService: Could not load state", e);
    }
  }

  private saveState() {
    try {
      localStorage.setItem('actagen_defense_log', JSON.stringify(this.requestLog));
    } catch (e) {
      // Ignore storage errors
    }
  }

  /**
   * AUTHORIZATION GATE
   * Ensures only authorized users (who know the code) can trigger requests.
   */
  public setAccessCode(code: string): boolean {
    if (code === this.EXPECTED_CODE_HASH || code === "admin") { // "admin" is a fallback for dev
      this.accessCode = code;
      this.isLockdown = false;
      return true;
    }
    return false;
  }

  public isAuthenticated(): boolean {
    // If running in dev mode (localhost), we might bypass, but for safety we default to secure.
    // For now, allow if on localhost, block if on public URL unless auth.
    const isLocal = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
    if (isLocal) return true;
    return !!this.accessCode;
  }

  /**
   * RATE LIMITER
   * Returns true if request is allowed, false if blocked.
   */
  public canProceed(): { allowed: boolean; reason?: string } {
    if (this.isLockdown) {
      return { allowed: false, reason: "SYSTEM_LOCKDOWN_ACTIVE" };
    }

    if (!this.isAuthenticated()) {
        return { allowed: false, reason: "UNAUTHORIZED_ACCESS_REQUIRED" };
    }

    const now = Date.now();
    const oneMinuteAgo = now - 60000;
    const oneHourAgo = now - 3600000;

    // Filter logs for windows
    const requestsLastMinute = this.requestLog.filter(r => r.timestamp > oneMinuteAgo).length;
    const requestsLastHour = this.requestLog.filter(r => r.timestamp > oneHourAgo).length;

    if (requestsLastMinute >= this.config.maxRequestsPerMinute) {
      return { 
        allowed: false, 
        reason: `RATE_LIMIT_EXCEEDED: Max ${this.config.maxRequestsPerMinute} req/min. Wait a moment.` 
      };
    }

    if (requestsLastHour >= this.config.maxRequestsPerHour) {
      return { 
        allowed: false, 
        reason: `HOURLY_QUOTA_EXCEEDED: Max ${this.config.maxRequestsPerHour} req/hour. Take a break.` 
      };
    }

    return { allowed: true };
  }

  /**
   * Log a successful request attempt
   */
  public logRequest() {
    this.requestLog.push({ timestamp: Date.now() });
    this.saveState();
  }

  /**
   * Trigger Circuit Breaker (Panic Mode)
   * Call this when receiving consecutive 429s or 500s.
   */
  public triggerCircuitBreaker() {
    this.isLockdown = true;
    console.warn("DefenseService: Circuit Breaker TRIPPED. System locked.");
    
    // Auto-reset after cooldown
    setTimeout(() => {
      this.isLockdown = false;
      console.log("DefenseService: Circuit Breaker RESET.");
    }, this.config.cooldownSeconds * 1000);
  }
}

export const defenseService = new DefenseService();

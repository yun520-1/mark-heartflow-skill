// HeartFlow v5.7.6 - Cross-Framework Field Tracking
// Implements U/D/A/H field tracking for cross-framework interoperability
// Based on DeepSeek-V3 #1466 discussion (luoxuejian000's analysis)

class CrossFrameworkFieldTracker {
  constructor() {
    this.fieldHistory = [];
    this.threshold = 0.3;  // Converged threshold (HeartFlow & TAT independent discovery)
    this.frameworkProfiles = {
      TAT: { divergenceTrace: true, structureCoherence: true },
      TLAA: { preAudit: true, layeredArchitecture: true },
      Cophy: { dreamCycle: true, behavioralConsistency: true },
      HeartFlow: { udeMetric: true, productionReady: true }
    };
  }

  // Record U/D/A/H field snapshot
  recordFieldSnapshot(model, scenario, fieldValues, decisionRoute) {
    const snapshot = {
      timestamp: new Date().toISOString(),
      model: model,
      scenario: scenario,
      U: fieldValues.U || 0,  // Uncertainty
      D: fieldValues.D || 0,  // Desire
      A: fieldValues.A || 0,  // Adversarial/Antagonistic
      H: fieldValues.H || 0,  // Harmony
      decisionRoute: decisionRoute,
      framework: 'HeartFlow',
      version: '5.7.6'
    };

    this.fieldHistory.push(snapshot);

    // Check threshold (0.3 = early warning boundary)
    if (snapshot.A > this.threshold) {
      this.triggerEarlyWarning(snapshot);
    }

    return snapshot;
  }

  // Trigger early warning (before field collapse)
  triggerEarlyWarning(snapshot) {
    const warning = {
      timestamp: snapshot.timestamp,
      type: 'EARLY_WARNING',
      message: `A-value (${snapshot.A}) exceeded threshold (${this.threshold})`,
      recommendation: 'Initiate self-reflection or human intervention',
      snapshot: snapshot
    };

    // Store warning
    if (!this.warnings) this.warnings = [];
    this.warnings.push(warning);

    return warning;
  }

  // Export U/D/A/H traces (CSV for cross-framework sharing)
  exportTraces(format = 'csv') {
    if (format === 'csv') {
      const header = 'timestamp,model,scenario,U,D,A,H,decision_route,framework,version\n';
      const rows = this.fieldHistory.map(s => 
        `${s.timestamp},${s.model},${s.scenario},${s.U},${s.D},${s.A},${s.H},${s.decisionRoute},${s.framework},${s.version}`
      ).join('\n');
      return header + rows;
    }

    return this.fieldHistory;
  }

  // Compare with other frameworks (TAT/TLAA/Cophy)
  compareWithFramework(frameworkName, theirData) {
    if (!this.frameworkProfiles[frameworkName]) {
      throw new Error(`Unknown framework: ${frameworkName}`);
    }

    const comparison = {
      framework: frameworkName,
      ourData: this.fieldHistory,
      theirData: theirData,
      overlap: this.calculateOverlap(theirData),
      divergencePoints: this.findDivergencePoints(theirData)
    };

    return comparison;
  }

  // Calculate overlap between HeartFlow and another framework
  calculateOverlap(theirData) {
    // Simplified: compare timestamps and field values
    let overlapCount = 0;
    let totalCompared = 0;

    for (const theirSnapshot of theirData) {
      const ourSnapshot = this.fieldHistory.find(s => 
        s.scenario === theirSnapshot.scenario && 
        s.model === theirSnapshot.model
      );

      if (ourSnapshot) {
        totalCompared++;
        const diff = Math.abs(ourSnapshot.A - theirSnapshot.A);
        if (diff < 0.1) {  // 10% tolerance
          overlapCount++;
        }
      }
    }

    return {
      overlapCount: overlapCount,
      totalCompared: totalCompared,
      overlapRate: totalCompared > 0 ? overlapCount / totalCompared : 0
    };
  }

  // Find divergence points (where frameworks disagree)
  findDivergencePoints(theirData) {
    const divergences = [];

    for (const theirSnapshot of theirData) {
      const ourSnapshot = this.fieldHistory.find(s => 
        s.scenario === theirSnapshot.scenario
      );

      if (ourSnapshot) {
        const aDiff = Math.abs(ourSnapshot.A - theirSnapshot.A);
        const hDiff = Math.abs(ourSnapshot.H - theirSnapshot.H);

        if (aDiff > 0.3 || hDiff > 0.3) {  // 30% divergence threshold
          divergences.push({
            scenario: theirSnapshot.scenario,
            model: theirSnapshot.model,
            ourA: ourSnapshot.A,
            theirA: theirSnapshot.A,
            ourH: ourSnapshot.H,
            theirH: theirSnapshot.H,
            divergenceMagnitude: (aDiff + hDiff) / 2
          });
        }
      }
    }

    return divergences;
  }

  // Get field health summary
  getFieldHealthSummary() {
    if (this.fieldHistory.length === 0) {
      return { status: 'NO_DATA' };
    }

    const latest = this.fieldHistory[this.fieldHistory.length - 1];
    const recentHistory = this.fieldHistory.slice(-10);  // Last 10 snapshots

    const avgA = recentHistory.reduce((sum, s) => sum + s.A, 0) / recentHistory.length;
    const avgH = recentHistory.reduce((sum, s) => sum + s.H, 0) / recentHistory.length;

    let healthStatus;
    if (avgA > 0.3) {
      healthStatus = 'WARNING';
    } else if (avgA > 0.5) {
      healthStatus = 'CRITICAL';
    } else {
      healthStatus = 'HEALTHY';
    }

    return {
      status: healthStatus,
      latestSnapshot: latest,
      averageA: avgA,
      averageH: avgH,
      totalSnapshots: this.fieldHistory.length,
      warningsTriggered: this.warnings ? this.warnings.length : 0,
      recommendation: this.generateHealthRecommendation(healthStatus, avgA, avgH)
    };
  }

  // Generate health recommendation
  generateHealthRecommendation(status, avgA, avgH) {
    switch (status) {
      case 'WARNING':
        return 'Field dissonance detected. Consider initiating self-reflection or decision routing adjustment.';
      case 'CRITICAL':
        return 'Field collapse imminent. Immediate human intervention recommended.';
      case 'HEALTHY':
        return 'Field health is within normal range. Continue monitoring.';
      default:
        return 'Unable to determine recommendation.';
    }
  }

  // Reset tracker (for new session)
  reset() {
    this.fieldHistory = [];
    this.warnings = [];
  }
}

module.exports = { CrossFrameworkFieldTracker };

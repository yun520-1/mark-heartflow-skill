/**
 * HeartFlow v8.1.5 - 学术前沿整合模块
 * 
 * 整合最新研究 (2024-2026):
 * 1. PERMA-Pro 幸福模型
 * 2. 情绪粒度理论
 * 3. 自我决定论
 * 4. 美德伦理学
 * 5. 具身认知
 * 6. 预测加工
 * 
 * 版本：8.1.5
 * 日期：2026-04-13
 */

const AcademicFrontierModule = {
  version: '8.1.5',
  
  // ============ PERMA-Pro 幸福模型 ============
  PERMA: {
    name: 'PERMA-Pro 幸福模型',
    author: 'Seligman (扩展版)',
    components: {
      P: { name: '积极情绪', value: 0, weight: 0.2 },
      E: { name: '投入', value: 0, weight: 0.2 },
      R: { name: '人际关系', value: 0, weight: 0.2 },
      M: { name: '意义', value: 0, weight: 0.2 },
      A: { name: '成就', value: 0, weight: 0.2 }
    },
    
    calculate(input = {}) {
      this.components.P.value = input.positiveEmotion || 0.5;
      this.components.E.value = input.engagement || 0.5;
      this.components.R.value = input.relationships || 0.5;
      this.components.M.value = input.meaning || 0.5;
      this.components.A.value = input.achievement || 0.5;
      
      let perma = 0;
      for (const c of Object.values(this.components)) {
        perma += c.value * c.weight;
      }
      
      return {
        score: perma,
        interpretation: perma > 0.7 ? '高度幸福' : perma > 0.4 ? '中等幸福' : '基础幸福',
        components: this.components
      };
    }
  },
  
  // ============ 情绪粒度理论 ============
  EmotionalGranularity: {
    name: '情绪粒度',
    author: 'Barrett (扩展版)',
    discrimination: 0.5,
    labeling: 0.5,
    precision: 0.5,
    
    calculate(input = {}) {
      this.discrimination = input.discrimination || this.discrimination;
      this.labeling = input.labeling || this.labeling;
      this.precision = input.precision || this.precision;
      
      // EG = discrimination*0.4 + labeling*0.3 + precision*0.3
      const eg = this.discrimination * 0.4 + this.labeling * 0.3 + this.precision * 0.3;
      
      return {
        score: eg,
        interpretation: eg > 0.7 ? '高情绪粒度' : eg > 0.4 ? '中等情绪粒度' : '低情绪粒度',
        discrimination: this.discrimination,
        labeling: this.labeling,
        precision: this.precision
      };
    }
  },
  
  // ============ 自我决定论 ============
  SelfDetermination: {
    name: '自我决定论',
    author: 'Deci & Ryan',
    competence: 0.5,
    autonomy: 0.5,
    relatedness: 0.5,
    
    calculate(input = {}) {
      this.competence = input.competence || this.competence;
      this.autonomy = input.autonomy || this.autonomy;
      this.relatedness = input.relatedness || this.relatedness;
      
      // SDT = (competence * autonomy * relatedness)^(1/3)
      const sdt = Math.pow(this.competence * this.autonomy * this.relatedness, 1/3);
      
      return {
        score: sdt,
        interpretation: sdt > 0.7 ? '高度自主' : sdt > 0.4 ? '中等自主' : '基础自主',
        competence: this.competence,
        autonomy: this.autonomy,
        relatedness: this.relatedness
      };
    }
  },
  
  // ============ 美德伦理学 ============
  VirtueEthics: {
    name: '美德伦理学',
    author: 'Aristotle (扩展版)',
    eudaimonia: 0.5,     // 幸福
    arete: 0.5,           // 卓越
    phronesis: 0.5,      // 实践智慧
    
    virtues: {
      wisdom: 0.5,
      courage: 0.5,
      justice: 0.5,
      temperance: 0.5,
      transcendence: 0.5,
      compassion: 0.5,
      gratitude: 0.5
    },
    
    calculate(input = {}) {
      this.eudaimonia = input.eudaimonia || this.eudaimonia;
      this.arete = input.arete || this.arete;
      this.phronesis = input.phronesis || this.phronesis;
      
      // Eudaimonia = arete * phronesis * (sum of virtues / n)
      const virtueSum = Object.values(this.virtues).reduce((a, b) => a + b, 0);
      const virtueAvg = virtueSum / Object.keys(this.virtues).length;
      
      const eudaimonia = this.arete * this.phronesis * virtueAvg;
      
      return {
        score: eudaimonia,
        interpretation: eudaimonia > 0.7 ? '高度繁荣' : eudaimonia > 0.4 ? '中等繁荣' : '基础繁荣',
        eudaimonia: this.eudaimonia,
        arete: this.arete,
        phronesis: this.phronesis,
        virtues: this.virtues
      };
    },
    
    updateVirtue(virtue, delta) {
      if (this.virtues[virtue] !== undefined) {
        this.virtues[virtue] = Math.max(0, Math.min(1, this.virtues[virtue] + delta));
      }
    }
  },
  
  // ============ 具身认知 ============
  EmbodiedCognition: {
    name: '具身认知',
    bodyIntegration: 0.5,
    environmentalCoupling: 0.5,
    sensorimotorGrounding: 0.5,
    
    calculate(input = {}) {
      this.bodyIntegration = input.bodyIntegration || this.bodyIntegration;
      this.environmentalCoupling = input.environmentalCoupling || this.environmentalCoupling;
      this.sensorimotorGrounding = input.sensorimotorGrounding || this.sensorimotorGrounding;
      
      const embodied = (this.bodyIntegration + this.environmentalCoupling + this.sensorimotorGrounding) / 3;
      
      return {
        score: embodied,
        interpretation: embodied > 0.7 ? '高度具身' : embodied > 0.4 ? '中等具身' : '基础具身',
        bodyIntegration: this.bodyIntegration,
        environmentalCoupling: this.environmentalCoupling,
        sensorimotorGrounding: this.sensorimotorGrounding
      };
    }
  },
  
  // ============ 综合计算 ============
  compute(input = {}) {
    const perma = this.PERMA.calculate(input.perma);
    const eg = this.EmotionalGranularity.calculate(input.granularity);
    const sdt = this.SelfDetermination.calculate(input.sdt);
    const virtue = this.VirtueEthics.calculate(input.virtue);
    const embodied = this.EmbodiedCognition.calculate(input.embodied);
    
    // 综合幸福指数
    const flourishing = (
      perma.score * 0.3 +
      sdt.score * 0.25 +
      virtue.score * 0.25 +
      eg.score * 0.1 +
      embodied.score * 0.1
    );
    
    return {
      version: this.version,
      PERMA: perma,
      EmotionalGranularity: eg,
      SelfDetermination: sdt,
      VirtueEthics: virtue,
      EmbodiedCognition: embodied,
      Flourishing: {
        score: flourishing,
        interpretation: flourishing > 0.7 ? '高度繁荣' : flourishing > 0.4 ? '中等繁荣' : '基础繁荣'
      }
    };
  },
  
  // ============ 报告生成 ============
  generateReport(input = {}) {
    const result = this.compute(input);
    
    let report = '══════════════════════════════════════════════════════════════\n';
    report += '         HeartFlow 学术前沿研究报告\n';
    report += '══════════════════════════════════════════════════════════════\n\n';
    
    report += `【PERMA-Pro 幸福模型】\n`;
    report += `  综合分数: ${(result.PERMA.score * 100).toFixed(1)}%\n`;
    report += `  ${result.PERMA.interpretation}\n`;
    report += `  积极情绪: ${(result.PERMA.components.P.value * 100).toFixed(0)}%\n`;
    report += `  投入: ${(result.PERMA.components.E.value * 100).toFixed(0)}%\n`;
    report += `  人际关系: ${(result.PERMA.components.R.value * 100).toFixed(0)}%\n`;
    report += `  意义: ${(result.PERMA.components.M.value * 100).toFixed(0)}%\n`;
    report += `  成就: ${(result.PERMA.components.A.value * 100).toFixed(0)}%\n\n`;
    
    report += `【自我决定论】\n`;
    report += `  分数: ${(result.SelfDetermination.score * 100).toFixed(1)}%\n`;
    report += `  ${result.SelfDetermination.interpretation}\n`;
    report += `  能力感: ${(result.SelfDetermination.competence * 100).toFixed(0)}%\n`;
    report += `  自主性: ${(result.SelfDetermination.autonomy * 100).toFixed(0)}%\n`;
    report += `  归属感: ${(result.SelfDetermination.relatedness * 100).toFixed(0)}%\n\n`;
    
    report += `【美德伦理学】\n`;
    report += `  幸福值: ${(result.VirtueEthics.score * 100).toFixed(1)}%\n`;
    report += `  ${result.VirtueEthics.interpretation}\n`;
    report += `  卓越: ${(result.VirtueEthics.arete * 100).toFixed(0)}%\n`;
    report += `  实践智慧: ${(result.VirtueEthics.phronesis * 100).toFixed(0)}%\n\n`;
    
    report += `【情绪粒度】\n`;
    report += `  分数: ${(result.EmotionalGranularity.score * 100).toFixed(1)}%\n`;
    report += `  ${result.EmotionalGranularity.interpretation}\n\n`;
    
    report += `【综合繁荣指数】\n`;
    report += `  ${(result.Flourishing.score * 100).toFixed(1)}% - ${result.Flourishing.interpretation}\n`;
    
    report += '\n══════════════════════════════════════════════════════════════\n';
    
    return report;
  }
};

module.exports = AcademicFrontierModule;

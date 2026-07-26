const fs = require('fs');
const path = process.argv[2] || 'src/index.js';
let src = fs.readFileSync(path, 'utf8');

const startMarker = '// ─── 反语/讽刺标记检测（Sarcasm / Verbal Irony Markers）────────────────';
const endMarker = 'function checkSarcasm';

const startIdx = src.indexOf(startMarker);
const endIdx = src.indexOf(endMarker, startIdx);

if (startIdx === -1 || endIdx === -1) {
  console.error('Could not find SARCASM_MARKERS block');
  process.exit(1);
}

const newBlock = `// ─── 反语/讽刺标记检测（Sarcasm / Verbal Irony Markers）────────────────
// 基于语言学标记：引号反用、夸张同意、明褒暗贬
const SARCASM_MARKERS = {
  zh: [
    // ── 反语引用 ──
    [/[「『"][^「『"」』]{1,10}[」』"][^。]*?(真是|太好了|太棒了|聪明|了不起|厉害|高明)/i, 'scare_quotes'],
    // ── 讽刺夸奖 ──
    [/[^。]*?真是[^。]*?[太超好][^。]*?(棒|好|聪明|厉害|行|有水平|有出息)/i, 'ironic_praise'],
    [/[^。]*?说得[^。]*?好[^。]*?啊[^。]*?鼓掌/i, 'mock_applause'],
    // ── 虚伪感谢/服从 ──
    [/我[^。]*?真是[^。]*?(谢谢|感谢|服了|佩服)[^。]*?(啊|呀|哦)/i, 'mock_gratitude'],
    // ── 嘲讽假设 ──
    [/[当真以为][^。]*?我[^。]*?会[^。]*?(相信|觉得|认为|在乎)/i, 'ironic_rhetorical'],
    // ── 反讽简单 ──
    [/[^。]*?这么[^。]*?(简单|容易|明显|清楚)[^。]*?怎么[^。]*?不/i, 'mock_simplicity'],
    // ── 恍然大悟(假的) ──
    [/哦[^。]*?原来[^。]*?如此[^。]*?啊/i, 'mock_realization'],
    // ── 条件性敷衍同意 ──
    [/你(开心|高兴)[^。!]*?就[。!]*(好|行|成)/i, 'condescending_dismissal'],
    [/你说[的得][^。!]*?[都全][^。!]*?对/i, 'sarcastic_agreement'],
    [/[啊哦]?(?:对对对|是是是)[。！!]?/i, 'mock_agreement'],
    // ── 讽刺佩服/推崇 ──
    [/你最[^。!]*?(?:有(?:理|道理)|懂)[^。!]*?[了!]?/i, 'sarcastic_deference'],
    // ── 虚伪认输/让步 ──
    [/你[真]?(厉害|行|牛[逼叉]?)[！!。]?/i, 'fake_concession'],
    [/你赢了[！!。]?/i, 'fake_concession'],
    [/我(输|服|认输)[了]?[。！!]?/i, 'fake_concession'],
    // ── 讽刺笑 ──
    [/呵呵/i, 'sarcastic_laugh'],
    [/笑[死疯][了]?[。！!]?/i, 'sarcastic_laugh'],
    // ── 假惊讶/不信 ──
    [/真的[^。!]*?假[的得][。！!]?/i, 'mock_disbelief'],
    [/不(?:会|是|至于)[^。!]*?吧/i, 'mock_disbelief'],
    // ── 不屑嘲讽 ──
    [/就这[就这]*[。！!]?/i, 'dismissive'],
    [/真(?:是)?服了[。！!]?/i, 'mock_frustration'],
    [/不至于|至于[吗么]/i, 'mock_dismissive'],
    [/说[的得]话[。！!]?/i, 'ironic_comment'],
  ],
  en: [
    // ── Mock enthusiasm ──
    [/\\boh (really|wow|great|fantastic|wonderful|perfect)['!]*/i, 'mock_enthusiasm'],
    [/\\bsure thing\\b/i, 'mock_enthusiasm'],
    [/\\babsolutely[.!]*$/i, 'mock_enthusiasm'],
    // ── Mock agreement ──
    [/\\b(yeah|sure|right|okay),? (because|like|as if|sure)/i, 'mock_agreement'],
    [/\\b(sure|yeah),? (because that|as if that|like that)('s| is) going to (work|help|fix|solve)/i, 'mock_agreement'],
    [/\\bwhatever you say\\b/i, 'dismissive_agreement'],
    [/\\bif you say so\\b/i, 'reluctant_agreement'],
    // ── Ironic praise ──
    [/\\bfascinating['!]*(?![^.]*?(genuinely|truly|actually|really|quite|most|very|extremely))/i, 'faux_admiration'],
    [/\\bgenius move\\b/i, 'ironic_praise'],
    [/\\bbrilliant (idea|move|plan)\\b/i, 'ironic_praise'],
    [/\\bmasterful[.!]*$/i, 'ironic_praise'],
    [/\\bwell played\\b/i, 'ironic_praise'],
    [/\\banother (brilliant|amazing|genius|incredible)[^.!]*[- ]?/i, 'mock_another'],
    // ── Mock excitement / fake sentiment ──
    [/\\bi (can'?t|couldn'?t) wait['!]*(?![^.]*?(genuinely|truly|excited|looking forward))/i, 'mock_excitement'],
    [/\\bi'?m so (thrilled|happy|excited)[.!]*$/i, 'sarcastic_sentiment'],
    // ── Mock disbelief ──
    [/\\b(oh|no|wow),? really\\?['!]*(?!\\s*(yes|indeed|certainly|absolutely|tell me more))/i, 'mock_disbelief'],
    [/\\byou don'?t say\\b/i, 'mock_surprise'],
    [/\\bfancy that\\b/i, 'mock_surprise'],
    [/\\bwhat a (surprise|shock)[.!]*$/i, 'mock_surprise'],
    [/\\bbig (deal|whoop)[.!]*$/i, 'mock_minimization'],
    // ── Mock appreciation / understatement ──
    [/\\b(well|oh) (isn'?t that|ain'?t that) (nice|pretty|special|convenient|something)['!?]/i, 'mock_appreciation'],
    [/\\bthat went well\\b/i, 'ironic_understatement'],
    [/\\bthat'?s rich\\b/i, 'ironic_audacity'],
    // ── Ironic complaint ──
    [/\\bi (just )?love (how|the way|when|that)[^.]*?(not|never|couldn'?t|didn'?t|won'?t)/i, 'ironic_complaint'],
    [/\\btell me about it\\b/i, 'sarcastic_solidarity'],
    // ── Mock inevitability ──
    [/\\bof course you (did|are|would|have)[.!]*/i, 'mock_inevitability'],
    [/\\bgo figure\\b/i, 'mock_inevitability'],
    // ── Dismissive / fake assurance ──
    [/\\bi'?m sure[.!]*$/i, 'fake_assurance'],
    [/\\bobviously[.!]*$/i, 'mock_obviousness'],
    [/\\bclearly[.!]*$/i, 'mock_obviousness'],
    [/\\bas if[.!]*$/i, 'mock_dismissal'],
    [/\\bwhat a (joke|farce)[.!]*$/i, 'mock_dismissal'],
    [/\\bhow dare you\\b/i, 'mock_outrage'],
    [/\\bi (just )?could(n'?t)? care less\\b/i, 'ironic_indifference'],
    [/\\bi live to serve\\b/i, 'mock_servitude'],
    [/\\bby all means\\b/i, 'mock_permission'],
    [/\\bnice try\\b/i, 'dismissive_nice_try'],
  ],
};
`;

const before = src.substring(0, startIdx);
const after = src.substring(endIdx);
const result = before + newBlock.trimStart() + '\n' + after;

fs.writeFileSync(path, result, 'utf8');
console.log('Patch applied successfully');
console.log('Length before:', src.length);
console.log('Length after:', result.length);

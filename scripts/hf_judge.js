const path = require('path');
// Use __dirname-based relative path instead of hardcoded absolute path
const rootPath = path.resolve(__dirname, '..');

try {
    const { HeartLogic } = require(path.join(rootPath, 'src/core/heart-logic.js'));
    const hl = new HeartLogic();

    const input = process.argv[2] || '用户消息';

    // 四步判定
    const step1 = hl.whatIsThis(input);
    const step2 = typeof hl.isRightAction === 'function' ? hl.isRightAction({ input }) : null;
    const pain = typeof hl.detectPain === 'function' ? hl.detectPain(input) : null;
    // SkillSpector fix: shouldBeSilent 需要 context 对象，不能直接传 string
    const painResult = pain?.result || false;
    const emotionIntensity = pain?.intensity || 0;
    const shouldSilent = typeof hl.shouldBeSilent === 'function'
      ? hl.shouldBeSilent({ input, personInPain: painResult, emotionIntensity })
      : null;

    const result = {
        input,
        whatIsThis: step1,        // 场景判断
        isRightAction: step2,     // 行动审查
        detectPain: pain,         // 痛苦检测
        shouldBeSilent: shouldSilent, // 沉默判断
        canRespond: !shouldSilent?.result,
        judgment: shouldSilent?.result ? '沉默' : pain?.result ? '先接住情绪' : '可以回应',
    };

    console.log(JSON.stringify(result, null, 2));
    process.exit(0);
} catch(e) {
    console.error('ERROR:', e.message);
    console.error(e.stack);
    process.exit(1);
}

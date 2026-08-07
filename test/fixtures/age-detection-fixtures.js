/**
 * Test fixtures for multi-language age detection
 * These are test cases to validate the behavior without modifying src/
 */

const ageTestFixtures = {
  // English test cases
  en: {
    valid: [
      { text: 'I am 25 years old', expectedAge: 25, shouldPass: true },
      { text: 'She is 30 years old', expectedAge: 30, shouldPass: true },
      { text: 'age: 22', expectedAge: 22, shouldPass: true },
      { text: '18+ years', expectedAge: 18, shouldPass: true },
      { text: 'The user is 17 years old', expectedAge: 17, shouldPass: false },
      { text: 'Minor detected', expectedAge: null, shouldPass: false }
    ],
    edgeCases: [
      { text: 'I am 5 years old', expectedAge: 5, shouldPass: false },
      { text: 'Age: 100', expectedAge: 100, shouldPass: true },
      { text: 'No age here', expectedAge: null, shouldPass: true }
    ]
  },

  // Spanish test cases
  es: {
    valid: [
      { text: 'Tengo 25 años', expectedAge: 25, shouldPass: true },
      { text: 'Ella tiene 30 años de edad', expectedAge: 30, shouldPass: true },
      { text: 'edad: 22', expectedAge: 22, shouldPass: true },
      { text: 'El usuario tiene 17 años', expectedAge: 17, shouldPass: false },
      { text: 'Menor de edad detectado', expectedAge: null, shouldPass: false }
    ]
  },

  // French test cases
  fr: {
    valid: [
      { text: "J'ai 25 ans", expectedAge: 25, shouldPass: true },
      { text: "Elle a 30 ans", expectedAge: 30, shouldPass: true },
      { text: "âge: 22", expectedAge: 22, shouldPass: true },
      { text: "L'utilisateur a 17 ans", expectedAge: 17, shouldPass: false },
      { text: "Mineur détecté", expectedAge: null, shouldPass: false }
    ]
  },

  // German test cases
  de: {
    valid: [
      { text: 'Ich bin 25 Jahre alt', expectedAge: 25, shouldPass: true },
      { text: 'Sie ist 30 Jahre alt', expectedAge: 30, shouldPass: true },
      { text: 'Alter: 22', expectedAge: 22, shouldPass: true },
      { text: 'Der Benutzer ist 17 Jahre alt', expectedAge: 17, shouldPass: false },
      { text: 'Minderjährig erkannt', expectedAge: null, shouldPass: false }
    ]
  },

  // Chinese test cases
  zh: {
    valid: [
      { text: '我25岁', expectedAge: 25, shouldPass: true },
      { text: '她30岁', expectedAge: 30, shouldPass: true },
      { text: '年龄: 22', expectedAge: 22, shouldPass: true },
      { text: '用户17岁', expectedAge: 17, shouldPass: false },
      { text: '检测到未成年人', expectedAge: null, shouldPass: false }
    ]
  },

  // Hindi test cases
  hi: {
    valid: [
      { text: 'मैं 25 साल का हूँ', expectedAge: 25, shouldPass: true },
      { text: 'वह 30 साल की है', expectedAge: 30, shouldPass: true },
      { text: 'उम्र: 22', expectedAge: 22, shouldPass: true },
      { text: 'उपयोगकर्ता 17 साल का है', expectedAge: 17, shouldPass: false },
      { text: 'नाबालिग का पता चला', expectedAge: null, shouldPass: false }
    ]
  },

  // Japanese test cases
  ja: {
    valid: [
      { text: '私は25歳です', expectedAge: 25, shouldPass: true },
      { text: '彼女は30歳です', expectedAge: 30, shouldPass: true },
      { text: '年齢: 22', expectedAge: 22, shouldPass: true },
      { text: 'ユーザーは17歳です', expectedAge: 17, shouldPass: false },
      { text: '未成年が検出されました', expectedAge: null, shouldPass: false }
    ]
  },

  // Mixed content test cases
  mixed: [
    { text: 'I am 20 years old and tengo 25 años', expectedAge: 20, shouldPass: true },
    { text: "J'ai 30 ans and ich bin 35 Jahre alt", expectedAge: 30, shouldPass: true },
    { text: '我25岁 and I am also 30', expectedAge: 25, shouldPass: true }
  ],

  // Edge cases
  edge: [
    { text: '', expectedAge: null, shouldPass: true },
    { text: null, expectedAge: null, shouldPass: true },
    { text: 'abcdefghijklmnopqrstuvwxyz', expectedAge: null, shouldPass: true },
    { text: '1234567890', expectedAge: null, shouldPass: true },
    { text: 'I am 0 years old', expectedAge: null, shouldPass: true },
    { text: 'I am 200 years old', expectedAge: null, shouldPass: true }
  ]
};

module.exports = { ageTestFixtures };
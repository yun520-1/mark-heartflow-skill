const MAD_ROLES = {
  proposer: { name: 'proposer', bias: 'supportive', goal: 'defend_with_evidence' },
  challenger: { name: 'challenger', bias: 'critical', goal: 'falsify_assumptions' },
  scientist: { name: 'scientist', bias: 'neutral', goal: 'judge_by_evidence' },
};
module.exports = { MAD_ROLES };

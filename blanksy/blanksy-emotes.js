// Emotes for Blanksy — looping dance/hype moves so he can groove on the stage
// while you work. Built on the model's own rig API (set / aim / rig), the same
// primitives setPose uses, so moves respect his ball body: arms swing from the
// forearm and aim in character space (+X his left, +Y up, +Z forward) so hands
// always clear the torso. Each emote is a pure function of time and loops
// forever; JAM MODE shuffles through them hands-free.
//
// This layers ON TOP of the model: every frame we reset to bind (setPose tpose)
// then re-pose, so turning an emote off hands control straight back to the
// normal pose system with no residue.

export function createEmotes(blanksy) {
  const { set, aim, setPose, rig } = blanksy;

  // resting arms, lifted from the model's private armsDown/handRoll so emotes
  // share the exact same neutral the idle pose uses.
  const handRoll = (side, roll) => aim(side + 'hand', side + 'handmiddle1', null, null, null, roll);
  function armsDown(swing = 0, splay = 0.5) {
    aim('leftforearm', 'lefthand', splay, -1, 0.22 + swing);
    aim('rightforearm', 'righthand', -splay, -1, 0.22 - swing);
    handRoll('left', 0.35); handRoll('right', 0.35);
  }
  const clamp01 = v => v < 0 ? 0 : v;

  // ---------------- moves ----------------
  // t is seconds. Omegas are tuned to a ~110-120bpm feel.
  const MOVES = {
    // side-to-side groove: torso twist + tilt, arms swing counter, knees dip,
    // a little heel bounce on each step.
    twostep: (t) => {
      const w = 3.05, s = Math.sin(t * w), c = Math.cos(t * w);
      set('spine', 0, s * 0.11, 0);
      set('spine1', 0, 0, s * 0.07);
      set('head', 0, s * 0.13, s * 0.05);
      armsDown(s * 0.55);
      set('leftupleg', clamp01(s) * 0.22, 0, 0);
      set('rightupleg', clamp01(-s) * 0.22, 0, 0);
      set('leftleg', -clamp01(s) * 0.28, 0, 0);
      set('rightleg', -clamp01(-s) * 0.28, 0, 0);
      rig.position.y = Math.abs(c) * 0.016;
    },

    // full-body hype bounce with both arms pumping the roof.
    bounce: (t) => {
      const w = 4.2, b = Math.abs(Math.sin(t * w));      // 0..1 bounce
      rig.position.y = b * 0.055;
      const bend = (1 - b) * 0.42;                        // knees dip at the bottom
      set('leftupleg', bend * 0.55, 0, 0); set('rightupleg', bend * 0.55, 0, 0);
      set('leftleg', -bend, 0, 0); set('rightleg', -bend, 0, 0);
      const up = 0.45 + b * 0.6;
      aim('leftforearm', 'lefthand', 0.5, up, 0.2);
      aim('rightforearm', 'righthand', -0.5, up, 0.2);
      handRoll('left', 0.2); handRoll('right', 0.2);
      set('spine', 0, 0, Math.sin(t * w) * 0.03);
      set('head', -b * 0.06, 0, 0);
    },

    // the robot: stiff, quantized arm and head steps. On brand — he IS a robot.
    robot: (t) => {
      const w = 2.6;
      const step = Math.round(Math.sin(t * w) * 2) / 2;      // -1..1 in .5 steps
      const step2 = Math.round(Math.cos(t * w) * 2) / 2;
      aim('leftforearm', 'lefthand', 0.35, step, 0.55);
      aim('rightforearm', 'righthand', -0.35, -step, 0.55);
      handRoll('left', 0.1); handRoll('right', 0.1);
      set('head', 0, Math.round(Math.sin(t * w)) * 0.22, 0);
      set('spine', 0, step2 * 0.09, 0);
      rig.position.y = 0;
    },

    // hands up / raise the roof: both arms pushing overhead, hip sway, knee dip.
    handsup: (t) => {
      const w = 3.4, p = Math.sin(t * w);
      const push = 0.7 + clamp01(p) * 0.32;
      aim('leftforearm', 'lefthand', 0.42, push, 0.1);
      aim('rightforearm', 'righthand', -0.42, push, 0.1);
      handRoll('left', 0.15); handRoll('right', 0.15);
      set('hips', 0, p * 0.07, 0);
      set('head', 0, 0, p * 0.05);
      const dip = clamp01(-p) * 0.3;
      set('leftleg', -dip, 0, 0); set('rightleg', -dip, 0, 0);
      rig.position.y = clamp01(p) * 0.03;
    },

    // a big friendly wave (matches the model's wave pose, kept here so JAM can
    // include it in the shuffle).
    wave: (t) => {
      armsDown();
      aim('rightforearm', 'righthand', -0.5, 1, 0.12);
      aim('righthand', 'righthandmiddle1', -0.5 + Math.sin(t * 5.2) * 0.42, 1, 0.12);
      set('spine', 0, 0.05, 0.03);
      set('head', 0, -0.08, 0);
      rig.position.y = Math.sin(t * 2) * 0.006;
    }
  };

  const LIST = [
    { id: 'twostep', label: 'TWO-STEP' },
    { id: 'bounce', label: 'BOUNCE' },
    { id: 'robot', label: 'THE ROBOT' },
    { id: 'handsup', label: 'HANDS UP' },
    { id: 'wave', label: 'WAVE' }
  ];
  const IDS = LIST.map(m => m.id);
  const SWITCH = 6.5;                       // seconds per move in JAM shuffle

  // Apply one move at local time t. Resets to bind first so nothing from the
  // prior frame or the pose system lingers.
  function apply(id, t) {
    setPose('tpose', 0);                    // reset all bones to bind
    (MOVES[id] || MOVES.twostep)(t);
  }

  // Which move JAM is on at elapsed time t. Walks the list in order, looping.
  function jamMoveAt(t) {
    return IDS[Math.floor(t / SWITCH) % IDS.length];
  }

  return { LIST, apply, jamMoveAt, SWITCH };
}

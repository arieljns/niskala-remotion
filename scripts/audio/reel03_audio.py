"""
Synthesises Reel03's (Mora Jaya showcase) sound effects and music. No samples,
no licences. Reuses the Reel02 recipes, writes to public/reels/reel03/audio/.

    python scripts/audio/reel03_audio.py   (needs numpy + scipy)

The hook must work muted and must NOT lean on bass (brief): the four hits are
bright, mid-range stabs plus a noise crack, so they cut through phone speakers.
Timing matches src/reels/reel03/timeline.ts: 140 BPM, 43 beats =
18.43 s, every cut on a beat. Re-run this if those cuts move.
"""

from pathlib import Path
import sys

import numpy as np

sys.path.insert(0, str(Path(__file__).resolve().parent))
import reel02_audio as r  # noqa: E402

r.OUT = Path(__file__).resolve().parents[2] / "public/reels/reel03/audio"
SR = r.SR
BPM = 140
BEAT = 60 / BPM
TOTAL_BEATS = 59
TOTAL = TOTAL_BEATS * BEAT

# Beat numbers, mirrored from timeline.ts (B(n) = round(n * 30 * 60 / 140) frames).
HITS = [0, 1, 2, 3]      # "This." "Is how." "Niskala." "Works."
LAND = 3                 # "Works." + the phone sweeps in: the groove DROPS here
MID = 15                 # cart scene (dark): stabs and the lead join
FULL = 19                # orders / fan / report: everything in
CTA = 43                 # logo scene: release into the warm bed
END = 50                 # black end card: one last stab, then the fade


def T(beat):
    return beat * BEAT


def stab(freqs, dur=0.34, bright=1.0):
    """A short, bright chord stab: detuned saws through a high-ish lowpass. Mid-range, no sub."""
    t = r.t_axis(dur)
    x = np.zeros_like(t)
    for f in freqs:
        for det in (0.994, 1.0, 1.006):
            x += sum(np.sin(2 * np.pi * f * det * k * t) / k for k in range(1, 7))
    x = r.filt(x, "lowpass", 2600 + 2200 * bright)
    return x * r.env(dur, 0.002, dur * 0.35)


def crack(dur=0.12):
    return r.filt(r.noise(dur), "bandpass", [1500, 7500]) * r.env(dur, 0.0004, 0.02)


def hook_hits():
    # Pitch climbs a step each word, so the four hits read as one phrase.
    roots = [329.63, 369.99, 415.30, 493.88]
    for i, f in enumerate(roots):
        chord = [f, f * 1.2599, f * 1.4983]  # minor-ish triad, tight and bright
        x = stab(chord, 0.36 if i < 3 else 0.7, 1.0 + 0.2 * i)
        d = len(x) / SR
        buf = np.zeros(len(x))
        r.place(buf, x, 0, 1.0)
        r.place(buf, crack(), 0, 0.9)
        r.place(buf, r.filt(r.glide(900, 260, 0.1) * r.env(0.1, 0.001, 0.03), "highpass", 150), 0, 0.5)
        r.write(f"hit{i + 1}", buf, 0.9)

    # Riser under the last word, into the morph (1.2 -> 1.6).
    d = 0.8
    t = r.t_axis(d)
    rise = (t / d) ** 2
    x = r.sweep_filter(r.noise(d), 800, 9000, "highpass") * rise * 0.7 + r.glide(500, 2400, d) * rise * 0.3
    r.write("hook_riser", x, 0.6)

    # Phone lands: a bright thunk plus glass-y tick, not a sub drop.
    d = 0.5
    land = r.glide(420, 160, d) * r.env(d, 0.002, 0.1) + 0.5 * crack(d) * 0.6 + 0.3 * r.tone(3136, d, 0.05)
    r.write("land", land, 0.8)

    # Success chime for "Pesanan terkirim".
    d = 0.9
    x = np.zeros(int(SR * d))
    for i, f in enumerate([1046.5, 1318.5, 1568.0]):
        x += r.tone(f, d - i * 0.09, 0.22, i * 0.09, d) * (0.8 - 0.15 * i)
    r.write("chime", x, 0.6)



# ------------------------------------------------------------------ music
# Elegant, bass-forward bed at 140 BPM (see music() below). The old funk groove helpers (BASS_STEPS, RIFF, ...) are unused.

PROG = [  # (bass root, chord) per bar: Am F C G
    (110.0, [220.0, 261.63, 329.63]),
    (87.31, [174.61, 220.0, 261.63]),
    (130.81, [261.63, 329.63, 392.0]),
    (98.0, [196.0, 246.94, 293.66]),
]
BASS_STEPS = [(0, 1), (3, 1), (6, 2), (8, 1), (11, 1), (14, 2)]
STAB_STEPS = [2, 6, 10]
RIFF = [
    [(0, 659.25), (3, 783.99), (6, 659.25), (8, 587.33), (10, 523.25), (12, 587.33)],
    [(0, 659.25), (3, 880.0), (6, 783.99), (8, 659.25), (11, 587.33), (14, 523.25)],
]
BAR_STARTS = [3, 7, 11, 15, 19, 23, 27, 31, 35, 39, 43, 47, 51, 55]


def kick2():
    d = 0.32
    body = r.glide(190, 48, d) * r.env(d, 0.001, 0.09)
    click = r.filt(r.noise(d), "bandpass", [1800, 6000]) * r.env(d, 0.0003, 0.008)
    return body + 0.35 * click


def snare():
    d = 0.22
    return 0.6 * r.filt(r.noise(d), "bandpass", [1400, 9000]) * r.env(d, 0.0005, 0.07) + 0.5 * r.glide(230, 170, d) * r.env(d, 0.001, 0.05)


def open_hat():
    d = 0.18
    return r.filt(r.noise(d), "highpass", 6500) * r.env(d, 0.0008, 0.05)


def bass2(f, dur):
    t = r.t_axis(dur)
    x = sum(np.sin(2 * np.pi * f * k * t) / k for k in range(1, 9))
    return r.filt(x, "lowpass", 900) * r.env(dur, 0.004, dur * 0.7)


def lead_note(f, dur=0.22):
    t = r.t_axis(dur)
    x = np.zeros_like(t)
    for det in (0.996, 1.0, 1.004):
        x += np.sign(np.sin(2 * np.pi * f * det * t)) * 0.4 + np.sin(2 * np.pi * f * det * t)
    return r.filt(x, "lowpass", 4200) * r.env(dur, 0.002, dur * 0.45)


def crash(dur=1.6):
    return r.filt(r.noise(dur), "highpass", 4500) * r.env(dur, 0.002, 0.45)


def reverse_swell(dur):
    t = r.t_axis(dur)
    return r.filt(r.noise(dur), "highpass", 3500) * (t / dur) ** 3


def snare_roll(start, end, buf, gain=0.35):
    """Accelerating snare roll: 8ths, then 16ths, then 32nds, louder as it goes."""
    t = start
    while t < end - 1e-6:
        frac = (t - start) / (end - start)
        step = BEAT / (2 if frac < 0.4 else 4 if frac < 0.75 else 8)
        r.place(buf, snare(), t, gain * (0.4 + 0.9 * frac))
        t += step


def sub_bass(f, dur):
    """Deep, round bass: a sine fundamental with a touch of 2nd harmonic and soft saturation so it also reads on phone speakers."""
    t = r.t_axis(dur)
    x = np.sin(2 * np.pi * f * t) + 0.35 * np.sin(2 * np.pi * f * 2 * t) + 0.12 * np.sin(2 * np.pi * f * 3 * t)
    x = np.tanh(1.6 * x) / 1.6
    return x * r.env(dur, 0.03, dur * 0.35)


def bell(f, dur=0.9):
    """A soft, glassy note: sine plus quiet upper partials, long decay, no edge."""
    t = r.t_axis(dur)
    x = np.sin(2 * np.pi * f * t) + 0.28 * np.sin(2 * np.pi * f * 2 * t) + 0.1 * np.sin(2 * np.pi * f * 3.01 * t)
    return r.filt(x, "lowpass", 3200) * r.env(dur, 0.006, dur * 0.8)


# Elegant bed: one chord per bar (Am9, Fmaj7, Cmaj7, G add9), a long deep bass under it, a soft kick that only marks the
# beat, warm pads, and a sparse bell melody. No syncopation, no claps, no stabs. Bass-forward on purpose.
VOICINGS = [
    [220.0, 261.63, 329.63, 493.88],
    [174.61, 220.0, 261.63, 329.63],
    [261.63, 329.63, 392.0, 493.88],
    [196.0, 246.94, 293.66, 440.0],
]
ROOTS = [55.0, 43.65, 65.41, 49.0]
BELLS = [  # (beat offset in bar, frequency) per chord, high register
    [(0, 659.25), (2, 783.99)],
    [(0, 880.0), (2, 659.25)],
    [(0, 783.99), (2, 987.77)],
    [(0, 880.0), (2, 587.33)],
]


def music():
    n = int(SR * TOTAL)
    drums = np.zeros(n)
    bass = np.zeros(n)
    harm = np.zeros(n)
    lead = np.zeros(n)
    fx = np.zeros(n)
    kicks = []

    def kick_at(b, gain):
        r.place(drums, kick2(), T(b), gain)
        kicks.append(T(b))

    # ---- intro: a low drone swells under the four hook hits, then the bed opens on the landing
    drone = sub_bass(55.0, T(LAND) + 0.2)
    drone *= np.linspace(0.15, 1.0, len(drone)) ** 1.5
    r.place(bass, drone, 0.0, 0.7)
    r.place(fx, reverse_swell(T(1.6)), T(LAND - 1.6), 0.25)

    section = lambda bar_b: "A" if bar_b < MID else "B" if bar_b < FULL else "D" if bar_b < CTA else "E"

    for bar_i, b0 in enumerate(BAR_STARTS):
        sec = section(b0)
        k = bar_i % 4
        root, chord = ROOTS[k], VOICINGS[k]
        # --- bass: the whole bar, re-struck softly at the half bar
        for half in (0, 2):
            r.place(bass, sub_bass(root, T(2) - 0.02), T(b0 + half), 0.9 if half == 0 else 0.7)
        if sec in ("B", "D"):
            r.place(bass, sub_bass(root * 2, T(1) - 0.02), T(b0 + 3), 0.22)
        # --- kick: marks the beat gently
        if sec == "A":
            kick_at(b0, 0.5)
            kick_at(b0 + 2, 0.42)
        elif sec in ("B", "D"):
            for beat in range(4):
                kick_at(b0 + beat, 0.55 if beat % 2 == 0 else 0.4)
        else:
            kick_at(b0, 0.45)
        # --- soft offbeat tick in the fuller sections only
        if sec == "D":
            for beat in range(4):
                r.place(drums, r.hat(0.03), T(b0 + beat + 0.5), 0.07)
        # --- pad: one long chord per bar
        r.place(harm, r.pad(chord, T(4) + 0.4, cutoff=1900, attack=0.28, release=0.6), T(b0), 0.16 if sec == "A" else 0.22)
        # --- bell melody: sparse, two notes a bar, in the later sections
        if sec in ("D", "E"):
            for off, f in BELLS[k]:
                r.place(lead, bell(f, 1.1), T(b0 + off), 0.12 if sec == "D" else 0.09)

    # ---- section changes: a reverse swell into a soft crash and a deeper kick
    for roll_from, roll_to in ((MID - 2, MID), (FULL - 2, FULL), (CTA - 2, CTA)):
        r.place(fx, reverse_swell(T(roll_to - roll_from)), T(roll_from), 0.3)
    for b in (LAND, MID, FULL, CTA, END):
        r.place(fx, crash(), T(b), 0.26)
        kick_at(b, 0.8)
    r.place(fx, stab([261.63, 329.63, 392.0, 523.25], 1.6, 0.4), T(CTA), 0.28)
    r.place(fx, stab([261.63, 329.63, 392.0, 523.25], 1.8, 0.4), T(END), 0.26)
    r.place(bass, sub_bass(55.0, T(4)), T(END), 0.9)

    # ---- the end card: the bed thins out and fades over the last beats
    for arr in (drums, harm, lead):
        arr[int(SR * T(END)) + int(SR * T(1)) :] *= 0.0

    # ---- gentle sidechain: everything but the drums breathes under each kick
    duck = np.ones(n)
    tail = int(SR * 0.3)
    curve = 1 - 0.5 * np.exp(-np.arange(tail) / SR / 0.09)
    for kt in kicks:
        s0 = int(SR * kt)
        if s0 < n:
            seg = min(tail, n - s0)
            duck[s0 : s0 + seg] = np.minimum(duck[s0 : s0 + seg], curve[:seg])
    # ---- bell echo
    echo = lead.copy()
    for delay, g in ((0.75, 0.35), (1.5, 0.18)):
        k = int(SR * T(delay))
        echo[k:] += lead[:-k] * g

    mix = drums + (bass * 1.4 + harm + echo) * duck + fx
    fade = int(SR * T(3))
    mix[-fade:] *= np.linspace(1, 0.0, fade)
    r.write("music", np.tanh(mix * 1.1), 0.85)


if __name__ == "__main__":
    r.sfx()
    hook_hits()
    music()
    # Reel02-only SFX that Reel03 never uses.
    for unused in ("bite", "fall", "thud", "impact", "tick", "riser", "whoosh_up", "sparkle"):
        (r.OUT / f"{unused}.wav").unlink(missing_ok=True)
    print("wrote", sorted(p.name for p in r.OUT.glob("*.wav")))

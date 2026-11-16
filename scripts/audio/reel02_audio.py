"""
Synthesises Reel02's sound effects and background music. No samples, so no
licences: every sound is built from sines and filtered noise.

    python scripts/audio/reel02_audio.py   (needs numpy + scipy)

Writes public/reels/reel02/audio/{notif,whoosh,whoosh_soft,impact,thud,fall,
tick,bite,pop,whoosh_up,sparkle,riser,tap}.wav and music.wav.
The music's timing (drop at 4.40 s, groove back at 6.20 s, length 43.27 s)
matches src/reels/reel02/timeline.ts; re-run this if those cuts move.
"""

from pathlib import Path
import wave

import numpy as np
from scipy.signal import butter, sosfilt

SR = 48000
OUT = Path(__file__).resolve().parents[2] / "public/reels/reel02/audio"
RNG = np.random.default_rng(7)


def t_axis(dur):
    return np.arange(int(SR * dur)) / SR


def noise(dur):
    return RNG.uniform(-1, 1, int(SR * dur))


def filt(x, kind, freq, order=2):
    sos = butter(order, freq, btype=kind, fs=SR, output="sos")
    return sosfilt(sos, x)


def sweep_filter(x, f0, f1, kind="lowpass", blocks=64):
    """Time-varying filter, done in blocks: good enough for whooshes and risers."""
    out = np.zeros_like(x)
    edges = np.linspace(0, len(x), blocks + 1).astype(int)
    for i in range(blocks):
        f = f0 * (f1 / f0) ** (i / (blocks - 1))
        seg = x[max(0, edges[i] - 2000) : edges[i + 1]]
        out[edges[i] : edges[i + 1]] = filt(seg, kind, min(f, SR / 2 - 100))[-(edges[i + 1] - edges[i]) :]
    return out


def glide(f0, f1, dur, curve="exp"):
    t = t_axis(dur)
    if curve == "exp":
        f = f0 * (f1 / f0) ** (t / dur)
    else:
        f = f0 + (f1 - f0) * t / dur
    return np.sin(2 * np.pi * np.cumsum(f) / SR)


def env(dur, attack, decay_tau):
    t = t_axis(dur)
    a = np.clip(t / max(attack, 1e-4), 0, 1)
    return a * np.exp(-np.maximum(t - attack, 0) / decay_tau)


def bell(dur):
    """Swells in and out over `dur`."""
    t = t_axis(dur)
    return np.sin(np.pi * t / dur) ** 2


def norm(x, peak=0.85):
    m = np.max(np.abs(x))
    return x / m * peak if m > 0 else x


def fade_edges(x, ms=4):
    k = int(SR * ms / 1000)
    x = x.copy()
    x[:k] *= np.linspace(0, 1, k)
    x[-k:] *= np.linspace(1, 0, k)
    return x


def write(name, x, peak=0.85):
    x = fade_edges(norm(x, peak))
    OUT.mkdir(parents=True, exist_ok=True)
    with wave.open(str(OUT / f"{name}.wav"), "w") as w:
        w.setnchannels(1)
        w.setsampwidth(2)
        w.setframerate(SR)
        w.writeframes((np.clip(x, -1, 1) * 32767).astype(np.int16).tobytes())


# --------------------------------------------------------------------------- SFX


def tone(f, dur, tau, start=0.0, total=None):
    total = total or dur + start
    x = np.zeros(int(SR * total))
    t = t_axis(dur)
    s = int(SR * start)
    x[s : s + len(t)] = np.sin(2 * np.pi * f * t) * np.exp(-t / tau)
    return x


def sfx():
    # Order notification: two bright partials, like a shop app ping.
    d = 0.45
    write("notif", 0.55 * tone(1568, d, 0.09) + 0.25 * tone(3136, d, 0.05) + 0.5 * tone(2093, d - 0.07, 0.12, 0.07, d) + 0.2 * tone(4186, d - 0.07, 0.06, 0.07, d), 0.8)

    # Whoosh: noise through a sweeping band, swelling then gone.
    d = 0.5
    w = sweep_filter(noise(d), 300, 5000, "lowpass") * bell(d)
    write("whoosh", filt(w, "highpass", 150), 0.7)
    write("whoosh_soft", filt(sweep_filter(noise(0.35), 400, 3000) * bell(0.35), "highpass", 200), 0.45)
    d = 0.55
    write("whoosh_up", filt(sweep_filter(noise(d), 600, 9000, "highpass"), "lowpass", 12000) * bell(d), 0.6)

    # Impact: sub drop plus a short noise crack, for "uangnya nggak ada".
    d = 1.1
    sub = glide(110, 38, d) * env(d, 0.004, 0.35)
    crack = filt(noise(d), "lowpass", 2500) * env(d, 0.001, 0.03)
    write("impact", sub + 0.5 * crack, 0.9)

    # Thud: a smaller, shorter hit for "nggak segitu" and "kontrol".
    d = 0.45
    write("thud", glide(140, 55, d) * env(d, 0.003, 0.12) + 0.25 * filt(noise(d), "lowpass", 1800) * env(d, 0.001, 0.02), 0.75)

    # Fall: a falling tone for the chart dropping.
    d = 0.6
    write("fall", (glide(900, 160, d) * 0.6 + glide(1800, 320, d) * 0.15) * env(d, 0.01, 0.25), 0.55)

    # Tick: a nervous click for the card wobbling on "digigit".
    d = 0.12
    write("tick", filt(noise(d), "bandpass", [1800, 4500]) * env(d, 0.0005, 0.008) + 0.4 * tone(2400, d, 0.015), 0.5)

    # Bite: a big chomp then a long crunch. Lives in 1.5-8 kHz, above most of
    # the voice, so it still cuts through when it lands on "admin"/"iklan".
    d = 0.55
    x = np.zeros(int(SR * d))
    chomp = glide(220, 90, 0.18) * env(0.18, 0.002, 0.05) + 0.6 * glide(520, 260, 0.18) * env(0.18, 0.002, 0.03)
    place(x, chomp, 0.0, 1.0)
    for k in range(18):
        grain = filt(noise(0.03), "bandpass", [1500, 8000]) * env(0.03, 0.0005, 0.006)
        place(x, grain, 0.01 + k * 0.022 + RNG.uniform(-0.006, 0.006), RNG.uniform(0.5, 1.0) * (1 - k / 22))
    snap = filt(noise(0.05), "highpass", 3000) * env(0.05, 0.0003, 0.008)
    place(x, snap, 0.0, 1.2)
    write("bite", x, 0.95)

    # Pop: a quick bubble for chips and the follow state.
    d = 0.16
    write("pop", glide(500, 1300, d) * env(d, 0.002, 0.035), 0.6)

    # Sparkle: staggered high sines for the bone's glow.
    d = 0.9
    x = np.zeros(int(SR * d))
    for i, f in enumerate([2637, 3136, 3951, 5274]):
        x += tone(f, d - i * 0.07, 0.18, i * 0.07, d) * (0.8 - i * 0.12)
    write("sparkle", x, 0.5)

    # Riser: noise and a tone climbing into "kontrol".
    d = 1.5
    t = t_axis(d)
    rise = (t / d) ** 2
    x = sweep_filter(noise(d), 300, 8000) * rise * 0.8 + glide(180, 900, d) * rise * 0.35
    write("riser", x, 0.6)

    # Tap: a soft UI click for the Follow button.
    d = 0.15
    write("tap", filt(noise(d), "bandpass", [2000, 6000]) * env(d, 0.0005, 0.006) + 0.6 * glide(320, 180, d) * env(d, 0.001, 0.025), 0.6)


# ------------------------------------------------------------------------- music
# A score cut to the edit, not a loop. Times are video seconds, from
# src/reels/reel02/timeline.ts (VO starts at 40 f = 1.333 s).

BPM = 120
BEAT = 60 / BPM
VO0 = 40 / 30
TOTAL = 1298 / 30
POV = VO0
DROP = 132 / 30            # "tapi uangnya nggak ada": tape stop, on a downbeat
GROOVE = 186 / 30          # Iklan: tension starts
SEPI_WORD = VO0 + 15.45    # chart falls: the pulse drops out for a beat
GIGIT = 594 / 30           # money card: tension rises
TULANG = 790 / 30          # black beat: near silence
TEASER = 883 / 30          # suspense build
KONTROL = VO0 + 33.54      # build cuts dead on "kontrol"
CTA = 1066 / 30            # release
GRID = DROP % BEAT         # every beat lands on DROP - n * BEAT


def place(buf, x, at, gain=1.0):
    s = int(SR * at)
    if s < 0 or s >= len(buf):
        return
    e = min(len(buf), s + len(x))
    buf[s:e] += x[: e - s] * gain


def beats(start, end, step=1.0):
    """Grid times between start and end, `step` in beats."""
    first = GRID + np.ceil((start - GRID) / (BEAT * step) - 1e-9) * BEAT * step
    return np.arange(first, end - 1e-6, BEAT * step)


def kick(punch=1.0):
    d = 0.35
    return glide(160, 45, d) * env(d, 0.002, 0.1) + 0.2 * punch * filt(noise(d), "lowpass", 3000) * env(d, 0.0005, 0.006)


def clap():
    d = 0.2
    x = np.zeros(int(SR * d))
    for s in (0, 0.011, 0.022):
        place(x, filt(noise(0.15), "bandpass", [900, 4000]) * env(0.15, 0.0005, 0.03), s)
    return x


def hat(dur=0.05):
    return filt(noise(dur), "highpass", 7000) * env(dur, 0.0005, dur / 4)


def bass_note(f, dur):
    t = t_axis(dur)
    x = sum(np.sin(2 * np.pi * f * k * t) / k for k in range(1, 6))
    return filt(x, "lowpass", 700) * env(dur, 0.005, dur * 0.6)


def pad(freqs, dur, cutoff=2000, attack=0.3, release=0.4):
    t = t_axis(dur)
    x = sum(np.sin(2 * np.pi * f * t) + 0.5 * np.sin(2 * np.pi * f * 1.005 * t) + 0.3 * np.sin(2 * np.pi * f * 2 * t) for f in freqs)
    a = np.clip(t / attack, 0, 1) * np.clip((dur - t) / release, 0, 1)
    return filt(x, "lowpass", cutoff) * a


def drone(dur, f=55.0):
    t = t_axis(dur)
    x = np.sin(2 * np.pi * f * t) + 0.5 * np.sin(2 * np.pi * f * 2 * t + 0.3) + 0.25 * filt(noise(dur), "lowpass", 200)
    return x * np.clip(t / 0.8, 0, 1) * np.clip((dur - t) / 0.3, 0, 1)


def tape_stop(x, start, dur):
    """Slows the audio to a halt over `dur`, like a turntable losing power."""
    s, n = int(SR * start), int(SR * dur)
    src = x[s : s + n].copy()
    t = np.arange(n) / SR
    pos = (t - t**2 / (2 * dur)) * SR
    y = np.interp(pos, np.arange(n), src) * np.linspace(1, 0, n) ** 0.5
    x = x.copy()
    x[s : s + n] = y
    x[s + n :] = 0
    return x


def music():
    n = int(SR * TOTAL)

    # Hook: nothing under the notification burst; a light groove once the voice
    # starts, with a snare build into the drop, then the tape stop.
    hook = np.zeros(n)
    for t in beats(POV, DROP + 0.5):
        place(hook, kick(), t, 0.8)
        place(hook, bass_note(110, BEAT * 0.45), t + BEAT / 2, 0.45)
        place(hook, hat(), t + BEAT / 2, 0.18)
    for t in beats(POV, DROP, 2)[1:]:
        place(hook, clap(), t - BEAT, 0.35)
    for i, t in enumerate(beats(DROP - BEAT, DROP, 0.25)):
        place(hook, clap(), t, 0.15 + 0.08 * i)
    hook = tape_stop(hook, DROP, 0.4)

    # Problem beats: low A drone, a heartbeat, a ticking clock.
    tense = np.zeros(n)
    place(tense, drone(GIGIT - GROOVE), GROOVE, 0.35)
    place(tense, pad([220.0, 261.63, 329.63], GIGIT - GROOVE, cutoff=900, attack=1.5), GROOVE, 0.08)
    for t in beats(GROOVE, GIGIT, 2):
        if SEPI_WORD - 0.05 < t < SEPI_WORD + BEAT * 2:
            continue  # the floor drops out when the chart falls
        place(tense, kick(0.3), t, 0.55)
        place(tense, kick(0.3), t + 0.16, 0.35)
    for t in beats(GROOVE, GIGIT, 0.5):
        if not (SEPI_WORD - 0.05 < t < SEPI_WORD + BEAT * 2):
            place(tense, hat(0.03), t, 0.07)

    # The chart falls: the whole bed dips out for two beats.
    d0, d1 = int(SR * (SEPI_WORD - 0.05)), int(SR * (SEPI_WORD + BEAT * 2))
    dip = np.ones(d1 - d0) * 0.08
    dip[-int(SR * 0.3) :] = np.linspace(0.08, 1, int(SR * 0.3))
    tense[d0:d1] *= dip

    # Money gets eaten: same pulse, faster and brighter, rising to the cut.
    rise = np.zeros(n)
    dur = TULANG - GIGIT
    place(rise, drone(dur), GIGIT, 0.4)
    place(rise, pad([220.0, 261.63, 311.13], dur, cutoff=1400, attack=0.5), GIGIT, 0.1)
    for t in beats(GIGIT, TULANG):
        place(rise, kick(0.6), t, 0.6)
    for i, t in enumerate(beats(GIGIT, TULANG, 0.25)):
        place(rise, hat(0.025), t, 0.05 + 0.08 * i / len(beats(GIGIT, TULANG, 0.25)))

    # Bone: almost nothing, a dark low tone under the black beat.
    dark = np.zeros(n)
    place(dark, drone(TEASER - TULANG, 41.2), TULANG, 0.3)

    # Teaser: suspense that builds and stops dead on "kontrol".
    build = np.zeros(n)
    place(build, drone(KONTROL - TEASER), TEASER, 0.35)
    place(build, pad([220.0, 261.63, 329.63, 440.0], KONTROL - TEASER, cutoff=1800, attack=2.5, release=0.02), TEASER, 0.1)
    steps = beats(TEASER, KONTROL, 0.5)
    for i, t in enumerate(steps):
        place(build, kick(0.4), t, 0.2 + 0.5 * (i / len(steps)) ** 2)
    build[int(SR * KONTROL) :] = 0

    # CTA: release into C major, warm and steady to the end.
    warm = np.zeros(n)
    prog = [(130.81, [261.63, 329.63, 392.0]), (98.0, [196.0, 246.94, 293.66]), (110.0, [220.0, 261.63, 329.63]), (87.31, [174.61, 220.0, 261.63])]
    bar = BEAT * 4
    for b, t0 in enumerate(beats(CTA, TOTAL, 4)):
        root, chord = prog[b % 4]
        place(warm, pad(chord, bar, cutoff=2600, attack=0.05), t0, 0.12)
        for t in beats(t0, min(t0 + bar, TOTAL)):
            place(warm, kick(), t, 0.6)
            place(warm, bass_note(root, BEAT * 0.45), t + BEAT / 2, 0.4)
            place(warm, hat(), t + BEAT / 2, 0.15)
        place(warm, clap(), t0 + BEAT, 0.3)
        place(warm, clap(), t0 + 3 * BEAT, 0.3)
    warm[-int(SR * 1.0) :] *= np.linspace(1, 0, int(SR * 1.0))

    mix = hook + tense + rise + dark + build + warm
    write("music", np.tanh(mix * 1.3), 0.85)


if __name__ == "__main__":
    sfx()
    music()
    print("wrote", sorted(p.name for p in OUT.glob("*.wav")))

import {clamp01, mapProgress} from './motion-core.mjs';

// Pure chapter sampling, not a DOM controller or camera interpolation engine.
export function createChapterSampler(input) {
  if (!Array.isArray(input) || !input.length) throw new TypeError('Need chapters');
  const ids = new Set();
  const chapters = input.map((item, index) => {
    if (!item || typeof item !== 'object') throw new TypeError('Invalid chapter');
    const {id, anchor, start, end, enterUntil, exitFrom} = item;
    if (typeof id !== 'string' || !id.trim() || ids.has(id)) throw new TypeError('Need unique ID');
    if (typeof anchor !== 'string' || !anchor.startsWith('#') || anchor.length < 2) throw new TypeError('Need anchor');
    if (![start,end,enterUntil,exitFrom].every(Number.isFinite)) throw new TypeError('Need finite progress');
    if (start < 0 || end > 1 || end <= start || enterUntil <= 0 || exitFrom >= 1 || enterUntil >= exitFrom)
      throw new RangeError('Need ordered range with nonempty enter, hold and exit');
    if (start !== (index ? input[index-1].end : 0)) throw new RangeError('Chapters must be contiguous');
    ids.add(id);
    return {id, anchor, start, end, enterUntil, exitFrom};
  });
  if (chapters.at(-1).end !== 1) throw new RangeError('Chapters must cover 0..1');
  return function sample(value, {reduced = false} = {}) {
    if (typeof reduced !== 'boolean') throw new TypeError('reduced must be boolean');
    const progress = clamp01(value);
    const chapter = chapters.find(item => progress < item.end) ?? chapters.at(-1);
    const local = mapProgress(progress, chapter.start, chapter.end);
    const phase = local < chapter.enterUntil ? 'enter' : local < chapter.exitFrom ? 'hold' : 'exit';
    const phaseProgress = phase === 'enter' ? mapProgress(local,0,chapter.enterUntil)
      : phase === 'hold' ? mapProgress(local,chapter.enterUntil,chapter.exitFrom)
      : mapProgress(local,chapter.exitFrom,1);
    return {chapterId:chapter.id, anchor:chapter.anchor, progress, localProgress:local,
      phase, phaseProgress, presentation:reduced?'static':'motion'};
  };
}

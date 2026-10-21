// pomocník: dotykový ťah prstom cez Input.dispatchTouchEvent (synthesizeScrollGesture s dotykom v headless neskroluje)
export const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
// dy > 0 = nadol po stránke; fling = pustenie v pohybe
export async function swipe(cdp, { dy, dx = 0, speed = 1200, x = 195, y0 = 600, fling = false } = {}) {
  const s = Math.sign(dy) || 1, dist = Math.abs(dy) || 0;
  const steps = Math.max(2, Math.round(Math.max(dist, Math.abs(dx)) / (speed * 0.016)));
  const sent = [cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x, y: y0 }] })];
  for (let k = 1; k <= steps; k++) {
    await sleep(16);
    sent.push(cdp.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [{ x: Math.round(x - dx * k / steps), y: Math.round(y0 - s * dist * k / steps) }] }));
  }
  if (!fling) await sleep(120);
  sent.push(cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] }));
  await Promise.all(sent);
}

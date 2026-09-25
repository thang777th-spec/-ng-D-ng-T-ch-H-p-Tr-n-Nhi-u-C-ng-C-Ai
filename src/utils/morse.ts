// Morse code dictionary for telegraphic atmosphere
const MORSE_MAP: Record<string, string> = {
  A: '.-', B: '-...', C: '-.-.', D: '-..', E: '.', F: '..-.',
  G: '--.', H: '....', I: '..', J: '.---', K: '-.-', L: '.-..',
  M: '--', N: '-.', O: '---', P: '.--.', Q: '--.-', R: '.-.',
  S: '...', T: '-', U: '..-', V: '...-', W: '.--', X: '-..-',
  Y: '-.--', Z: '--..', '1': '.----', '2': '..---', '3': '...--',
  '4': '....-', '5': '.....', '6': '-....', '7': '--...', '8': '---..',
  '9': '----.', '0': '-----', '.': '.-.-.-', ',': '--..--', '?': '..--..',
  ':': '---...', '-': '-....-', '/': '-..-.',
};

// Normalize Vietnamese accented characters to plain ASCII for Morse rendering
function removeVietnameseTones(str: string): string {
  return str
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
    .replace(/Đ/g, 'D');
}

export function textToMorse(text: string): string {
  const clean = removeVietnameseTones(text).toUpperCase();
  return clean
    .split('')
    .map((char) => {
      if (char === ' ' || char === '\n') return ' / ';
      return MORSE_MAP[char] || '';
    })
    .filter(Boolean)
    .join(' ');
}

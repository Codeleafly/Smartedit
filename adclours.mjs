// adclours.mjs
/**
 * @fileoverview A highly powerful, comprehensive, and chainable module for coloring terminal text.
 * This module uses a Proxy to create a fluent, chainable API. It includes over 50 features.
 * @author Smart Tell Line
 * @license Open Source
 */

const styleCodes = {
  // Styles and Reset Codes
  reset: "\x1b[0m",
  bold: "\x1b[1m",
  dim: "\x1b[2m",
  italic: "\x1b[3m",
  underline: "\x1b[4m",
  inverse: "\x1b[7m",
  hidden: "\x1b[8m",
  strikethrough: "\x1b[9m",
  overline: "\x1b[53m",

  // Foreground Colors (Basic)
  black: "\x1b[30m",
  red: "\x1b[31m",
  green: "\x1b[32m",
  yellow: "\x1b[33m",
  blue: "\x1b[34m",
  magenta: "\x1b[35m",
  cyan: "\x1b[36m",
  white: "\x1b[37m",

  // Foreground Colors (Bright/Hi-intensity)
  gray: "\x1b[90m",
  brightRed: "\x1b[91m",
  brightGreen: "\x1b[92m",
  brightYellow: "\x1b[93m",
  brightBlue: "\x1b[94m",
  brightMagenta: "\x1b[95m",
  brightCyan: "\x1b[96m",
  brightWhite: "\x1b[97m",

  // Background Colors (Basic)
  bgBlack: "\x1b[40m",
  bgRed: "\x1b[41m",
  bgGreen: "\x1b[42m",
  bgYellow: "\x1b[43m",
  bgBlue: "\x1b[44m",
  bgMagenta: "\x1b[45m",
  bgCyan: "\x1b[46m",
  bgWhite: "\x1b[47m",

  // Background Colors (Bright/Hi-intensity)
  bgGray: "\x1b[100m",
  bgBrightRed: "\x1b[101m",
  bgBrightGreen: "\x1b[102m",
  bgBrightYellow: "\x1b[103m",
  bgBrightBlue: "\x1b[104m",
  bgBrightMagenta: "\x1b[105m",
  bgBrightCyan: "\x1b[106m",
  bgBrightWhite: "\x1b[107m",
};

/**
 * Extended color list for convenience. Over 50 colors.
 */
const extendedColors = {
  // Named Colors
  maroon: '#800000',
  darkred: '#8B0000',
  firebrick: '#B22222',
  crimson: '#DC143C',
  tomato: '#FF6347',
  coral: '#FF7F50',
  indianred: '#CD5C5C',
  lightcoral: '#F08080',
  salmon: '#FA8072',
  darksalmon: '#E9967A',
  lightsalmon: '#FFA07A',
  orangered: '#FF4500',
  darkorange: '#FF8C00',
  orange: '#FFA500',
  gold: '#FFD700',
  yellowgreen: '#9ACD32',
  olivedrab: '#6B8E23',
  olive: '#808000',
  darkolivegreen: '#556B2F',
  forestgreen: '#228B22',
  seagreen: '#2E8B57',
  mediumseagreen: '#3CB371',
  darkcyan: '#008B8B',
  teal: '#008080',
  darkturquoise: '#00CED1',
  turquoise: '#40E0D0',
  lightseagreen: '#20B2AA',
  cadetblue: '#5F9EA0',
  steelblue: '#4682B4',
  cornflowerblue: '#6495ED',
  royalblue: '#4169E1',
  mediumblue: '#0000CD',
  darkblue: '#00008B',
  navy: '#000080',
  midnightblue: '#191970',
  indigo: '#4B0082',
  darkmagenta: '#8B008B',
  purple: '#800080',
  mediumorchid: '#BA55D3',
  orchid: '#DA70D6',
  violet: '#EE82EE',
  plum: '#DDA0DD',
  thistle: '#D8BFD8',
  silver: '#C0C0C0',
  lightgray: '#D3D3D3',
  darkgray: '#A9A9A9',
  dimgray: '#696969',
  slategray: '#708090',
  lightslategray: '#778899',
  rosybrown: '#BC8F8F',
  palevioletred: '#D87093',
  hotpink: '#FF69B4',
  deeppink: '#FF1493',
  fuchsia: '#FF00FF',
  paleturquoise: '#AFEEEE',
  lightblue: '#ADD8E6',
  skyblue: '#87CEEB',
  deepskyblue: '#00BFFF',
  dodgerblue: '#1E90FF',
  azure: '#F0FFFF',
  aliceblue: '#F0F8FF',
  ghostwhite: '#F8F8FF',
};

// Combine all named colors into a single map for easier lookup.
const allNamedColors = {
  ...extendedColors,
  black: '#000000',
  red: '#FF0000',
  green: '#008000',
  yellow: '#FFFF00',
  blue: '#0000FF',
  magenta: '#FF00FF',
  cyan: '#00FFFF',
  white: '#FFFFFF',
  gray: '#808080',
  brightRed: '#FF0000',
  brightGreen: '#00FF00',
  brightYellow: '#FFFF00',
  brightBlue: '#0000FF',
  brightMagenta: '#FF00FF',
  brightCyan: '#00FFFF',
  brightWhite: '#FFFFFF'
};

/**
 * Box border characters and styles.
 */
const boxStyles = {
  single: ['╭', '─', '╮', '│', '╰', '╯'],
  double: ['╔', '═', '╗', '║', '╚', '╝'],
  triple: ['╓', '─', '╖', '║', '╙', '╜'],
};

/**
 * ASCII Font characters.
 */
const asciiFont = {
  'A': [" ███ ", "█   █", "█████", "█   █", "█   █"],
  'B': ["████ ", "█   █", "████ ", "█   █", "████ "],
  'C': [" ███ ", "█   █", "█    ", "█   █", " ███ "],
  'D': ["████ ", "█   █", "█   █", "█   █", "████ "],
  'E': ["█████", "█    ", "███  ", "█    ", "█████"],
  'L': ["█    ", "█    ", "█    ", "█    ", "█████"],
  'O': [" ███ ", "█   █", "█   █", "█   █", " ███ "],
  'R': ["████ ", "█   █", "████ ", "█ █  ", "█  ██"],
  'S': [" ████", "█    ", " ███ ", "    █", "████ "],
  'P': ["████ ", "█   █", "████ ", "█    ", "█    "],
  'I': ["█████", "  █  ", "  █  ", "  █  ", "█████"],
  'T': ["█████", "  █  ", "  █  ", "  █  ", "  █  "],
  'M': ["█   █", "██ ██", "█ █ █", "█   █", "█   █"],
  ' ': ["     ", "     ", "     ", "     ", "     "],
};

// Global regex for stripping ANSI codes
const ansiRegex = /[\u001b\u009b][[\]()#;?]*(?:(?:(?:[a-zA-Z\d]*(?:;[a-zA-Z\d]*)*)?\u0007)|(?:\d+;)*\d+[a-zA-Z]|[a-zA-Z])/g;

function getVisualWidth(str) {
    let width = 0;
    for (let i = 0; i < str.length; i++) {
        const charCode = str.charCodeAt(i);
        // Basic check for common full-width characters (e.g., CJK, some symbols)
        if (charCode >= 0x1100 && (charCode <= 0x115F || // Hangul Jamo
                                   charCode == 0x2329 || charCode == 0x232A || // < >
                                   (charCode >= 0x2E80 && charCode <= 0xA4C6 && charCode != 0x303F) || // CJK, etc.
                                   (charCode >= 0xAC00 && charCode <= 0xD7A3) || // Hangul Syllables
                                   (charCode >= 0xF900 && charCode <= 0xFAFF) || // CJK Compatibility Ideographs
                                   (charCode >= 0xFE10 && charCode <= 0xFE19) || // Vertical forms
                                   (charCode >= 0xFE30 && charCode <= 0xFE6B) || // CJK Compatibility Forms
                                   (charCode >= 0xFF01 && charCode <= 0xFF60) || // Full-width ASCII, half-width Katakana
                                   (charCode >= 0xFFE0 && charCode <= 0xFFE6))) { // Full-width symbols
            width += 2;
        } else {
            width += 1;
        }
    }
    return width;
}

/**
 * Creates a new style object with a given ANSI code prefix.
 * This function is the core of the chainable API, using a Proxy.
 *
 * @private
 * @param {string} prefix - The ANSI escape code prefix.
 * @returns {object} A proxy object that allows chaining.
 */
function createStyleObject(prefix = "") {
  return new Proxy(
    // The target function that applies the final color/style
    (text) => prefix + text + styleCodes.reset,
    {
      get: (target, prop) => {
        // --- Special Color Functions ---
        
        // RGB Colors (24-bit true color)
        if (prop === "rgb") {
          return (r, g, b) => {
            const rgbPrefix = `\x1b[38;2;${r};${g};${b}m`;
            return createStyleObject(prefix + rgbPrefix);
          };
        }
        if (prop === "bgRgb") {
          return (r, g, b) => {
            const bgRgbPrefix = `\x1b[48;2;${r};${g};${b}m`;
            return createStyleObject(prefix + bgRgbPrefix);
          };
        }

        // HEX Colors (6-digit hex code)
        if (prop === "hex") {
          return (hex) => {
            const sanitizedHex = hex.startsWith('#') ? hex.slice(1) : hex;
            const [r, g, b] = sanitizedHex.match(/\w{2}/g).map(h => parseInt(h, 16));
            const hexPrefix = `\x1b[38;2;${r};${g};${b}m`;
            return createStyleObject(prefix + hexPrefix);
          };
        }
        if (prop === "bgHex") {
          return (hex) => {
            const sanitizedHex = hex.startsWith('#') ? hex.slice(1) : hex;
            const [r, g, b] = sanitizedHex.match(/\w{2}/g).map(h => parseInt(h, 16));
            const bgHexPrefix = `\x1b[48;2;${r};${g};${b}m`;
            return createStyleObject(prefix + bgHexPrefix);
          };
        }

        // 256-color palette support
        if (prop === "color256") {
          return (code) => {
            if (code < 0 || code > 255) throw new Error("256-color code must be between 0 and 255.");
            const prefix256 = `\x1b[38;5;${code}m`;
            return createStyleObject(prefix + prefix256);
          };
        }
        if (prop === "bg256") {
          return (code) => {
            if (code < 0 || code > 255) throw new Error("256-color code must be between 0 and 255.");
            const prefix256 = `\x1b[48;5;${code}m`;
            return createStyleObject(prefix + prefix256);
          };
        }

        // --- Styles and Basic Colors ---
        
        // If the property is a known style or extended color, add it to the prefix
        if (styleCodes[prop]) {
          const newPrefix = prefix + styleCodes[prop];
          return createStyleObject(newPrefix);
        }

        if (allNamedColors[prop]) {
          const hex = allNamedColors[prop];
          const sanitizedHex = hex.startsWith('#') ? hex.slice(1) : hex;
          const [r, g, b] = sanitizedHex.match(/\w{2}/g).map(h => parseInt(h, 16));
          const hexPrefix = `\x1b[38;2;${r};${g};${b}m`;
          return createStyleObject(prefix + hexPrefix);
        }

        // If not a known property, return the original target
        return target[prop];
      },
    }
  );
}

const color = createStyleObject();

/**
 * Parses a color input (name, hex, or rgb tuple) into an RGB array.
 * @private
 * @param {string|number[]} c - The color to parse.
 * @returns {number[]} The [r, g, b] array.
 */
function toRgb(c) {
  if (typeof c === 'string') {
    // Check if it's a named color first
    const namedColorHex = allNamedColors[c];
    if (namedColorHex) {
        c = namedColorHex;
    }
    // Handle hex string
    if (c.startsWith('#')) {
      const sanitizedHex = c.slice(1);
      if (sanitizedHex.length === 3) { // Handle shorthand hex codes like #F00
        const [r, g, b] = sanitizedHex.split('').map(h => parseInt(h.repeat(2), 16));
        return [r, g, b];
      }
      const hexMatch = sanitizedHex.match(/\w{2}/g);
      if (hexMatch && hexMatch.length === 3) {
        return hexMatch.map(h => parseInt(h, 16));
      }
    }
  }
  // Handle array of numbers
  if (Array.isArray(c) && c.length === 3) {
    return c;
  }
  // Default to black for invalid input
  return [0, 0, 0];
}

/**
 * Blends two colors together based on a ratio and a blending mode.
 * @param {string} text - The text to apply the blended color to.
 * @param {string|number[]} color1 - The first color (name, hex, or rgb tuple).
 * @param {string|number[]} color2 - The second color (name, hex, or rgb tuple).
 * @param {number} [ratio=0.5] - The blending ratio (0.0 to 1.0). 0.0 is pure color1, 1.0 is pure color2.
 * @param {string} [mode='normal'] - The blending mode ('normal', 'multiply', 'screen').
 * @returns {string} The colored text with the blended color.
 */
function blend(text, color1, color2, ratio = 0.5, mode = 'normal') {
    const [r1, g1, b1] = toRgb(color1);
    const [r2, g2, b2] = toRgb(color2);

    let r, g, b;

    switch (mode) {
        case 'multiply':
            r = Math.round((r1 / 255) * (r2 / 255) * 255);
            g = Math.round((g1 / 255) * (g2 / 255) * 255);
            b = Math.round((b1 / 255) * (b2 / 255) * 255);
            break;
        case 'screen':
            r = 255 - Math.round((255 - r1) * (255 - r2) / 255);
            g = 255 - Math.round((255 - g1) * (255 - g2) / 255);
            b = 255 - Math.round((255 - b1) * (255 - b2) / 255);
            break;
        case 'normal':
        default:
            r = Math.round(r1 * (1 - ratio) + r2 * ratio);
            g = Math.round(g1 * (1 - ratio) + g2 * ratio);
            b = Math.round(b1 * (1 - ratio) + b2 * ratio);
            break;
    }

    return color.rgb(r, g, b)(text);
}


/**
 * Calculates the Euclidean distance between two colors in RGB space.
 * @private
 * @param {number[]} c1 - RGB array for color 1.
 * @param {number[]} c2 - RGB array for color 2.
 * @returns {number} The distance.
 */
function colorDistance(c1, c2) {
  return Math.sqrt(Math.pow(c1[0] - c2[0], 2) + Math.pow(c1[1] - c2[1], 2) + Math.pow(c1[2] - c2[2], 2));
}

/**
 * Finds the nearest named color to a given RGB or HEX value.
 * @param {string|number[]} inputColor - The color to find the nearest match for.
 * @returns {string} The name of the nearest color.
 */
function findNearestColor(inputColor) {
  const targetRgb = toRgb(inputColor);
  let nearestColorName = '';
  let minDistance = Infinity;

  for (const name in allNamedColors) {
    const hexValue = allNamedColors[name];
    const currentRgb = toRgb(hexValue);
    const distance = colorDistance(targetRgb, currentRgb);

    if (distance < minDistance) {
      minDistance = distance;
      nearestColorName = name;
    }
  }

  return nearestColorName;
}

/**
 * Strips all ANSI escape codes from a string.
 * @param {string} text - The string to strip of ANSI codes.
 * @returns {string} The stripped string.
 */
function strip(text) {
  return text.replace(ansiRegex, '');
}

/**
 * Formats text with rainbow colors.
 * @param {string} text - The text to make colorful.
 * @returns {string} The rainbow-colored string.
 */
function rainbow(text) {
  const colors = [
    color.red, color.yellow, color.green, color.cyan, color.blue, color.magenta
  ];
  return text.split('').map((char, i) => {
    return colors[i % colors.length](char);
  }).join('');
}

/**
 * Formats text in a gradient between two hex colors.
 * @param {string} text - The text to apply the gradient to.
 * @param {string} startHex - Starting HEX color.
 * @param {string} endHex - Ending HEX color.
 * @returns {string} The gradient-colored string.
 */
function gradient(text, startHex, endHex) {
  const startR = parseInt(startHex.slice(1, 3), 16);
  const startG = parseInt(startHex.slice(3, 5), 16);
  const startB = parseInt(startHex.slice(5, 7), 16);
  const endR = parseInt(endHex.slice(1, 3), 16);
  const endG = parseInt(endHex.slice(3, 5), 16);
  const endB = parseInt(endHex.slice(5, 7), 16);

  const length = text.length;
  return text.split('').map((char, i) => {
    const r = Math.round(startR + (endR - startR) * i / length);
    const g = Math.round(startG + (endG - startG) * i / length);
    const b = Math.round(startB + (endB - startB) * i / length);
    return color.rgb(r, g, b)(char);
  }).join('');
}

/**
 * Creates a progress bar in the terminal.
 * @param {number} value - The current value.
 * @param {number} total - The total value.
 * @param {object} [options] - Optional settings.
 * @param {number} [options.width=50] - The total width of the bar.
 * @param {string} [options.filledChar='█'] - The character for the filled portion.
 * @param {string} [options.emptyChar='░'] - The character for the empty portion.
 * @returns {string} The formatted progress bar string.
 */
function progressBar(value, total, options = {}) {
  const { width = 50, filledChar = '█', emptyChar = '░' } = options;
  const progress = Math.min(Math.max(value / total, 0), 1);
  const filled = Math.round(width * progress);
  const empty = width - filled;
  const percentage = Math.round(progress * 100);

  let filledColor = color.red;
  if (percentage >= 70) {
    filledColor = color.green;
  } else if (percentage >= 30) {
    filledColor = color.yellow;
  }

  const filledBar = filledColor(filledChar.repeat(filled));
  const emptyBar = color.dim(emptyChar.repeat(empty));
  
  return `${filledBar}${emptyBar} ${percentage}%`;
}

/**
 * Creates a box around the given text.
 * @param {string} text - The text to be boxed.
 * @param {object} [options] - Options for the box.
 * @param {string} [options.borderColor='white'] - The border color.
 * @param {string} [options.style='single'] - The border style (single, double, or triple).
 * @param {number} [options.padding=1] - Padding around the text inside the box.
 * @returns {string} The boxed text string.
 */
function box(text, options = {}) {
  const { borderColor = 'white', style = 'single', padding = 1 } = options;
  const [topLeft, horizontal, topRight, vertical, bottomLeft, bottomRight] = boxStyles[style];
  
  const [r, g, b] = toRgb(borderColor);
  const borderCls = color.rgb(r, g, b);

  const lines = text.split('\n');
  const maxLen = lines.reduce((max, line) => Math.max(max, getVisualWidth(strip(line))), 0);
  const borderTop = borderCls(topLeft + horizontal.repeat(maxLen + 2 + padding * 2) + topRight);
  const borderBottom = borderCls(bottomLeft + horizontal.repeat(maxLen + 2 + padding * 2) + bottomRight);
  
  const paddedLines = lines.map(line => {
    const strippedLen = getVisualWidth(strip(line));
    const paddingStr = ' '.repeat(maxLen - strippedLen + padding);
    const sidePadding = ' '.repeat(padding);
    return borderCls(vertical + sidePadding) + line + paddingStr + borderCls(sidePadding + vertical);
  });
  
  return [borderTop, ...paddedLines, borderBottom].join('\n');
}

/**
 * Centers text in the terminal.
 * @param {string} text - The text to center.
 * @param {number} width - The total width of the terminal.
 * @returns {string} The centered text.
 */
function center(text, width) {
  const padding = Math.max(0, Math.floor((width - strip(text).length) / 2));
  return ' '.repeat(padding) + text;
}

/**
 * Wraps text to fit the terminal width.
 * @param {string} text - The text to wrap.
 * @param {number} width - The total width of the terminal.
 * @returns {string} The wrapped text.
 */
function wrap(text, width) {
  const words = text.split(' ');
  let line = '';
  let result = '';
  
  words.forEach(word => {
    if (strip(line + ' ' + word).length <= width) {
      line += (line.length > 0 ? ' ' : '') + word;
    } else {
      result += line + '\n';
      line = word;
    }
  });
  result += line;
  return result;
}

/**
 * Creates ASCII art from text.
 * @param {string} text - The text to convert to ASCII art.
 * @returns {string} The ASCII art string.
 */
function asciiArt(text) {
  const lines = [];
  const fallbackChar = '?';
  for (let i = 0; i < 5; i++) {
    let line = '';
    for (let char of text.toUpperCase()) {
      if (asciiFont[char]) {
        line += asciiFont[char][i] + ' ';
      } else {
        line += ' '.repeat(asciiFont['A'][0].length) + ' '; // Fallback to spaces for a clean output
      }
    }
    lines.push(line);
  }
  return lines.join('\n');
}

/**
 * Pads text to the left or right.
 * @param {string} text - Text to pad.
 * @param {number} width - Total width.
 * @param {string} [side='right'] - Side to pad on ('left' or 'right').
 * @param {string} [char=' '] - Padding character.
 * @returns {string} Padded text.
 */
function pad(text, width, side = 'right', char = ' ') {
  const strippedLen = strip(text).length;
  const padding = char.repeat(Math.max(0, width - strippedLen));
  return side === 'left' ? padding + text : text + padding;
}

/**
 * Creates a simple table in the terminal.
 * @param {string[][]} rows - Rows of data.
 * @param {object} [options] - Table options.
 * @param {string[]} [options.align=['left']] - Alignment for each column ('left', 'right', 'center').
 * @returns {string} The formatted table string.
 */
function table(rows, options = {}) {
  const { align = [] } = options;
  if (!rows || rows.length === 0) return '';
  
  const widths = rows[0].map((_, colIndex) =>
    rows.reduce((maxWidth, row) => Math.max(maxWidth, strip(row[colIndex]).length), 0)
  );

  const formatLine = (row, separator) => {
    const formattedCells = row.map((cell, i) => {
      const alignment = align[i] || 'left';
      const strippedLen = strip(cell).length;
      const padding = widths[i] - strippedLen;
      if (alignment === 'right') return ' '.repeat(padding) + cell;
      if (alignment === 'center') {
        const leftPad = Math.floor(padding / 2);
        const rightPad = padding - leftPad;
        return ' '.repeat(leftPad) + cell + ' '.repeat(rightPad);
      }
      return cell + ' '.repeat(padding);
    });
    return formattedCells.join(` ${separator} `);
  };

  const header = rows[0];
  const body = rows.slice(1);
  const horizontalLine = widths.map(w => '─'.repeat(w)).join('─┼─');
  
  let result = color.bold(formatLine(header, '│'));
  result += `\n${color.dim(horizontalLine)}`;
  body.forEach(row => {
    result += `\n${formatLine(row, '│')}`;
  });
  return result;
}

/**
 * Creates a horizontal line with optional text.
 * @param {number} width - The total width of the line.
 * @param {string} [text=''] - Optional text in the middle of the line.
 * @returns {string} The formatted line.
 */
function line(width, text = '') {
  const char = '─';
  const strippedText = strip(text);
  const textLen = strippedText.length;
  
  if (textLen === 0) {
    return char.repeat(width);
  }
  
  const sideWidth = Math.max(0, Math.floor((width - textLen - 2) / 2));
  const sideChars = char.repeat(sideWidth);
  const fullLine = sideChars + ` ${text} ` + sideChars;
  
  // Add an extra character if the width is odd
  if (strip(fullLine).length < width) {
    return fullLine + char;
  }
  
  return fullLine;
}

/**
 * Creates a formatted title and subtitle block.
 * @param {string} title - The main title.
 * @param {string} [subtitle=''] - The subtitle.
 * @param {number} width - The total width.
 * @returns {string} The formatted title block.
 */
function title(title, subtitle = '', width) {
  const lines = [
    color.bold(center(title, width)),
  ];
  if (subtitle) {
    lines.push(color.dim(center(subtitle, width)));
  }
  return lines.join('\n');
}

/**
 * Formats a list with custom symbols.
 * @param {string[]} items - An array of list items.
 * @param {object} [options] - List options.
 * @param {string} [options.symbol='•'] - The bullet symbol.
 * @returns {string} The formatted list string.
 */
function list(items, options = {}) {
  const { symbol = '•' } = options;
  return items.map(item => `${color.cyan(symbol)} ${item}`).join('\n');
}

/**
 * Generates an array of shades from a base color.
 * @param {string|number[]} baseColor - The base color to generate shades from.
 * @param {number} [count=5] - The number of shades to generate (including the base color).
 * @param {string} [direction='darken'] - 'darken' or 'lighten'.
 * @returns {string[]} An array of color-formatted strings.
 */
function generateShades(baseColor, count = 5, direction = 'darken') {
  const [r, g, b] = toRgb(baseColor);
  const shades = [];
  for (let i = 0; i < count; i++) {
    const ratio = i / (count - 1);
    const finalR = Math.round(r * (1 - ratio) + (direction === 'lighten' ? 255 : 0) * ratio);
    const finalG = Math.round(g * (1 - ratio) + (direction === 'lighten' ? 255 : 0) * ratio);
    const finalB = Math.round(b * (1 - ratio) + (direction === 'lighten' ? 255 : 0) * ratio);
    shades.push(color.rgb(finalR, finalG, finalB));
  }
  return shades;
}

/**
 * An advanced spinner utility with start/stop control.
 * @class
 */
class Spinner {
  constructor(frames, text, interval, styleFn = color.white) {
    this.frames = frames;
    this.text = text;
    this.interval = interval;
    this.styleFn = styleFn;
    this.handle = null;
    this.frameIndex = 0;
  }

  /**
   * Starts the spinner animation.
   */
  start() {
    process.stdout.write(`\x1b[?25l`); // Hide cursor
    this.handle = setInterval(() => {
      process.stdout.write(`\r${this.styleFn(this.frames[this.frameIndex])} ${this.text}`);
      this.frameIndex = (this.frameIndex + 1) % this.frames.length;
    }, this.interval);
  }

  /**
   * Stops the spinner animation.
   * @param {string} finalChar - The character to replace the spinner with.
   * @param {string} finalText - The text to display after stopping.
   * @param {string} finalColor - The color for the final text.
   */
  stop(finalChar = '✔', finalText = 'Done!', finalColor = 'green') {
    if (this.handle) {
      clearInterval(this.handle);
      process.stdout.write(`\r${color[finalColor](finalChar)} ${color[finalColor].bold(finalText)}\x1b[?25h\n`); // Show cursor again and print final line
      this.handle = null;
    }
  }
}

/**
 * Creates a text animation (e.g., blinking, fading).
 * @param {string} text - The text to animate.
 * @param {object} [options] - Animation options.
 * @param {string} [options.effect='blink'] - The animation effect ('blink' or 'pulse').
 * @param {number} [options.interval=500] - The interval for the animation in milliseconds.
 * @param {number} [options.duration=3000] - The total duration of the animation in milliseconds.
 */
function animate(text, options = {}) {
    const { effect = 'blink', interval = 500, duration = 3000 } = options;
    
    // Ensure terminal cursor is shown on unexpected exit
    const restoreCursor = () => {
        process.stdout.write(`\x1b[?25h`);
    };
    
    process.on('exit', restoreCursor);
    process.on('SIGINT', restoreCursor);

    if (effect === 'blink') {
        let isVisible = true;
        const blinkInterval = setInterval(() => {
            if (isVisible) {
                process.stdout.write(`\r${text}`);
            } else {
                process.stdout.write(`\r${' '.repeat(strip(text).length)}`);
            }
            isVisible = !isVisible;
        }, interval);

        setTimeout(() => {
            clearInterval(blinkInterval);
            process.stdout.write(`\r${text}\n`); // Final state: visible
            process.removeListener('exit', restoreCursor);
            process.removeListener('SIGINT', restoreCursor);
        }, duration);
    } else if (effect === 'pulse') {
        const pulseInterval = setInterval(() => {
            process.stdout.write(`\r${color.dim(text)}`);
            setTimeout(() => {
                process.stdout.write(`\r${color.white(text)}`);
            }, interval / 2);
        }, interval);

        setTimeout(() => {
            clearInterval(pulseInterval);
            process.stdout.write(`\r${text}\n`); // Final state: normal
            process.removeListener('exit', restoreCursor);
            process.removeListener('SIGINT', restoreCursor);
        }, duration);
    }
}

/**
 * Formats a timestamp string.
 * @private
 * @returns {string} The formatted timestamp.
 */
function timestamp() {
  const now = new Date();
  const time = now.toLocaleTimeString('en-US', { hour12: false });
  return `[${time}]`;
}

/**
 * A structured logging system for the CLI.
 * Provides methods for info, success, warning, and error messages.
 */
const log = {
  /**
   * Prints an informational message.
   * @param {string} msg - The message to log.
   */
  info: (msg) => {
    console.log(color.dim(timestamp()) + ' ' + color.blue('ⓘ ') + msg);
  },
  /**
   * Prints a success message.
   * @param {string} msg - The message to log.
   */
  success: (msg) => {
    console.log(color.dim(timestamp()) + ' ' + color.green('✔ ') + msg);
  },
  /**
   * Prints a warning message.
   * @param {string} msg - The message to log.
   */
  warn: (msg) => {
    console.log(color.dim(timestamp()) + ' ' + color.yellow('▲ ') + color.yellow(msg));
  },
  /**
   * Prints an error message.
   * @param {string} msg - The message to log.
   */
  error: (msg) => {
    console.error(color.dim(timestamp()) + ' ' + color.red('✖ ') + color.red.bold(msg));
  },
  /**
   * Prints a debug message (only if debug mode is enabled).
   * @param {string} msg - The message to log.
   */
  debug: (msg) => {
    if (process.env.DEBUG === 'true') {
      console.log(color.dim(timestamp()) + ' ' + color.dim('🐛 [DEBUG] ') + color.dim(msg));
    }
  }
};

// --- Export all public functions and objects here for clean imports ---
export {
  color,
  styleCodes,
  extendedColors,
  strip,
  rainbow,
  gradient,
  progressBar,
  box,
  center,
  wrap,
  asciiArt,
  pad,
  table,
  line,
  title,
  list,
  blend,
  generateShades,
  Spinner,
  animate,
  log,
  findNearestColor
};

document.getElementById('converter-form').addEventListener('submit', function(e) {
  e.preventDefault();
  
  const inputValue = document.getElementById('inputValue').value.trim();
  const fromBase = parseInt(document.getElementById('fromBase').value);
  const toBase = parseInt(document.getElementById('toBase').value);

  let decimalValue;
  try {
    decimalValue = parseInt(inputValue, fromBase);
    if (isNaN(decimalValue)) throw new Error('Invalid input');
  } catch (error) {
    showResult('Invalid input for selected base', true);
    return;
  }

  let result;
  if (toBase === 10) {
    result = decimalValue.toString();
  } else {
    result = decimalValue.toString(toBase).toUpperCase();
  }

  showResult(result);
  
  updateInfo(fromBase, toBase);
});

function showResult(message, isError = false) {
  const solutionContainer = document.querySelector('.solution-container');
  const solutionHeader = document.querySelector('.solution-header');
  const solution = document.getElementById('solution');
  const copyBtn = document.getElementById('copy-solution');
  
  // Update solution content
  solution.textContent = isError ? message : message;
  
  // Update styling based on error state
  if (isError) {
    solutionContainer.style.borderColor = 'var(--danger-color)';
    solutionHeader.style.backgroundColor = 'var(--danger-color)';
    copyBtn.style.display = 'none';
  } else {
    solutionContainer.style.borderColor = 'var(--border-color)';
    solutionHeader.style.backgroundColor = 'var(--primary-color)';
    copyBtn.style.display = 'flex';
  }
}

const conversionInfo = {
  '2-8': 'Binary to Octal:\nGroup binary digits into sets of 3 (from right)\nand convert each group to octal.\nExample: 101011 → 101 011 → 5 3 → 53.',
  '2-10': 'Binary to Decimal:\nMultiply each digit by 2 raised to its position power\n(from right, starting at 0) and sum.\nExample: 1011 → 1×2³ + 0×2² + 1×2¹ + 1×2⁰ → 11.',
  '2-16': 'Binary to Hexadecimal:\nGroup binary digits into sets of 4 (from right)\nand convert each group to hex.\nExample: 101111 → 10 1111 → 2 F → 2F.',
  '8-2': 'Octal to Binary:\nConvert each octal digit to its 3-digit binary equivalent.\nExample: 27 → 2 = 010, 7 = 111 → 010111.',
  '8-10': 'Octal to Decimal:\nMultiply each digit by 8 raised to its position power\n(from right, starting at 0) and sum.\nExample: 37 → 3×8¹ + 7×8⁰ → 31.',
  '8-16': 'Octal to Hexadecimal:\nFirst convert to binary, then group into sets of 4\nand convert to hex.\nExample: 27 → 010111 → 0001 0111 → 17.',
  '10-2': 'Decimal to Binary:\nRepeatedly divide by 2 and record remainders\nin reverse order.\nExample: 13 → 1101.',
  '10-8': 'Decimal to Octal:\nRepeatedly divide by 8 and record remainders\nin reverse order.\nExample: 59 → 73.',
  '10-16': 'Decimal to Hexadecimal:\nRepeatedly divide by 16 and record remainders\n(10=A, 11=B, etc.) in reverse order.\nExample: 43 → 2B.',
  '16-2': 'Hexadecimal to Binary:\nConvert each hex digit to its 4-digit binary equivalent.\nExample: 2F → 00101111.',
  '16-8': 'Hexadecimal to Octal:\nFirst convert to binary, then group into sets of 3\nand convert to octal.\nExample: 2F → 27.',
  '16-10': 'Hexadecimal to Decimal:\nMultiply each digit by 16 raised to its position power\n(from right, starting at 0) and sum.\nExample: 2F → 47.'
};

function updateInfo(fromBase, toBase) {
  const infoDiv = document.getElementById('info');
  const key = `${fromBase}-${toBase}`;
  infoDiv.innerHTML = `
    <h3>Conversion Method</h3>
    <pre>${conversionInfo[key] || 'Select different bases to see conversion methods.'}</pre>
  `;
}

document.getElementById('fromBase').addEventListener('change', function() {
  updateInfo(this.value, document.getElementById('toBase').value);
});

document.getElementById('toBase').addEventListener('change', function() {
  updateInfo(document.getElementById('fromBase').value, this.value);
});

// Initial info update
const initialFrom = document.getElementById('fromBase').value;
const initialTo = document.getElementById('toBase').value;
updateInfo(initialFrom, initialTo);

// Copy to clipboard functionality
const copyBtn = document.getElementById('copy-solution');
const solution = document.getElementById('solution');

copyBtn.addEventListener('click', async () => {
  try {
    await navigator.clipboard.writeText(solution.textContent);
    const originalText = solution.textContent;
    solution.textContent = 'Copied to clipboard!';
    setTimeout(() => {
      solution.textContent = originalText;
    }, 2000);
  } catch (err) {
    showResult('Failed to copy!', true);
  }
});

// Theme Management
const themeBtn = document.getElementById('theme-btn');
const root = document.documentElement;

const lightTheme = {
  '--bg-main': '#f5f5f5',
  '--bg-surface': '#f8f9fa',
  '--border-color': '#ccc',
  '--text-primary': '#000',
  '--text-secondary': '#777',
  '--shadow': '0 2px 8px rgba(0,0,0,0.1)'
};

const darkTheme = {
  '--bg-main': '#121212',
  '--bg-surface': '#1E1E1E',
  '--border-color': '#333',
  '--text-primary': '#FFFFFF',
  '--text-secondary': '#AAAAAA',
  '--shadow': '0 2px 8px rgba(0,0,0,0.3)'
};

function toggleTheme() {
  const isDark = root.classList.toggle('dark-theme');
  themeBtn.textContent = isDark ? '☀️' : '🌙';
  const theme = isDark ? darkTheme : lightTheme;
  Object.entries(theme).forEach(([key, value]) => {
    root.style.setProperty(key, value);
  });
  localStorage.setItem('theme', isDark ? 'dark' : 'light');
}

// Initialize theme
const savedTheme = localStorage.getItem('theme') || 'light';
if (savedTheme === 'dark') toggleTheme();

themeBtn.addEventListener('click', toggleTheme);

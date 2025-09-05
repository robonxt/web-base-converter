document.getElementById('converter-form').addEventListener('submit', function(e) {
  e.preventDefault();
  
  const inputValue = document.getElementById('inputValue').value.trim();
  const fromBase = parseInt(document.getElementById('fromBase').value);
  const toBase = parseInt(document.getElementById('toBase').value);
  let result;
  try {
    result = BaseConverter.convert(inputValue, fromBase, toBase);
  } catch (error) {
    showResult('Invalid input for selected base', true);
    return;
  }

  showResult(result);
  
  updateInfo(fromBase, toBase);
});

function showResult(message, isError = false) {
  const solution = document.querySelector('.solution');
  const copyBtn = document.getElementById('copy-solution');

  if (isError) {
    showToast(message, 'error');
  } else {
    solution.textContent = message;
  }
} 

function showToast(message, type = 'info') {
  const toast = document.getElementById('toast');
  toast.textContent = message;
  toast.className = `toast ${type}`;
  toast.classList.add('show');
  setTimeout(() => {
    toast.classList.remove('show');
  }, 3000);
}

const conversionInfo = {
  '2-8': 'Binary to Octal:\nGroup binary digits into sets of 3 (from right) and convert each group to octal.\nExample: 101011\nGroup into threes: 101 011\n101 = 5, 011 = 3\nResult: 53',
  '2-10': 'Binary to Decimal:\nMultiply each binary digit by 2 raised to its position power (from right, starting at 0) and sum.\nExample: 1011\n1×2³ + 0×2² + 1×2¹ + 1×2⁰\n8 + 0 + 2 + 1 = 11',
  '2-16': 'Binary to Hexadecimal:\nGroup binary digits into sets of 4 (from right) and convert each group to hex.\nExample: 101111\nGroup into fours: 10 1111\n10 = 2, 1111 = F\nResult: 2F',
  '8-2': 'Octal to Binary:\nConvert each octal digit to its 3-digit binary equivalent.\nExample: 27\n2 → 010, 7 → 111\nResult: 010111',
  '8-10': 'Octal to Decimal:\nMultiply each octal digit by 8 raised to its position power (from right, starting at 0) and sum.\nExample: 37\n3×8¹ + 7×8⁰\n24 + 7 = 31',
  '8-16': 'Octal to Hexadecimal:\nFirst convert to binary, then group into sets of 4 and convert to hex.\nExample: 27\n27 → 010111 → Group into fours: 0010 1111\n0010 = 2, 1111 = F\nResult: 2F',
  '10-2': 'Decimal to Binary:\nRepeatedly divide by 2 and record remainders in reverse order.\nExample: 13\n13 ÷ 2 = 6 remainder 1\n6 ÷ 2 = 3 remainder 0\n3 ÷ 2 = 1 remainder 1\n1 ÷ 2 = 0 remainder 1\nResult (reading remainders bottom-up): 1101',
  '10-8': 'Decimal to Octal:\nRepeatedly divide by 8 and record remainders in reverse order.\nExample: 59\n59 ÷ 8 = 7 remainder 3\n7 ÷ 8 = 0 remainder 7\nResult (reading remainders bottom-up): 73',
  '10-16': 'Decimal to Hexadecimal:\nRepeatedly divide by 16 and record remainders (10=A, 11=B, 12=C, 13=D, 14=E, 15=F) in reverse order.\nExample: 43\n43 ÷ 16 = 2 remainder 11(B)\n2 ÷ 16 = 0 remainder 2\nResult (reading remainders bottom-up): 2B',
  '16-2': 'Hexadecimal to Binary:\nConvert each hex digit to its 4-digit binary equivalent.\nExample: 2F\n2 → 0010, F → 1111\nResult: 00101111',
  '16-8': 'Hexadecimal to Octal:\nFirst convert to binary, then group into sets of 3 and convert to octal.\nExample: 2F\n2F → 00101111 → Group into threes: 000 101 111\n000 = 0, 101 = 5, 111 = 7\nResult: 057',
  '16-10': 'Hexadecimal to Decimal:\nMultiply each hex digit by 16 raised to its position power (from right, starting at 0) and sum.\nExample: 2F\n2×16¹ + F(15)×16⁰\n32 + 15 = 47'
};

function updateConversionInfo(steps) {
    const stepsContainer = document.getElementById('conversionSteps');
    stepsContainer.innerHTML = steps
        .map(step => `<div class="conversion-step">${step}</div>`)
        .join('');
}

function updateInfo(fromBase, toBase) {
  const key = `${fromBase}-${toBase}`;
  const steps = conversionInfo[key] ? conversionInfo[key].split('\n') : ['Select different bases to see conversion methods.'];
  updateConversionInfo(steps);
}

document.getElementById('fromBase').addEventListener('change', function() {
  updateInfo(this.value, document.getElementById('toBase').value);
});

document.getElementById('toBase').addEventListener('change', function() {
  updateInfo(document.getElementById('fromBase').value, this.value);
});

// Initial info update
updateInfo(document.getElementById('fromBase').value, document.getElementById('toBase').value);

// Copy to clipboard functionality
function copyTextFallback(text) {
    const textArea = document.createElement('textarea');
    textArea.value = text;
    textArea.style.position = 'fixed';
    textArea.style.left = '-9999px';
    textArea.style.top = '0';
    document.body.appendChild(textArea);

    try {
        textArea.select();
        document.execCommand('copy');
        showToast('Copied to clipboard', 'success');
    } catch (err) {
        console.error('Failed to copy text: ', err);
    } finally {
        document.body.removeChild(textArea);
    }
}

document.getElementById('copy-solution').addEventListener('click', () => {
    const solution = document.querySelector('.solution').innerText;
    if (navigator.clipboard && window.isSecureContext) {
        navigator.clipboard.writeText(solution)
            .then(() => showToast('Copied to clipboard', 'success'))
            .catch(() => copyTextFallback(solution));
    } else {
        copyTextFallback(solution);
    }
});

// Theme Management
const prefersLightScheme = window.matchMedia('(prefers-color-scheme: light)');
const prefersDarkScheme = window.matchMedia('(prefers-color-scheme: dark)');
const themeToggle = document.getElementById('theme-toggle');

function initializeTheme() {
    const storedTheme = localStorage.getItem('theme');
    let theme = 'light'; // Default theme

    if (storedTheme) {
        theme = storedTheme;
    } else if (prefersLightScheme.matches) {
        theme = 'light';
    } else if (prefersDarkScheme.matches) {
        theme = 'dark';
    }

    document.body.setAttribute('data-theme', theme);
    themeToggle.setAttribute('data-theme', theme);
}

// Initialize theme on page load
initializeTheme();

// Handle theme toggle click
themeToggle.addEventListener('click', () => {
    const currentTheme = document.body.getAttribute('data-theme');
    const newTheme = currentTheme === 'light' ? 'dark' : 'light';

    document.body.setAttribute('data-theme', newTheme);
    themeToggle.setAttribute('data-theme', newTheme);
    localStorage.setItem('theme', newTheme);
});

// Handle system theme changes
prefersLightScheme.addEventListener('change', (e) => {
    if (!localStorage.getItem('theme')) {
        const theme = e.matches ? 'light' : 'dark';
        document.body.setAttribute('data-theme', theme);
        themeToggle.setAttribute('data-theme', theme);
    }
});

// Info popup functionality
const infoBtn = document.getElementById('info-btn');
const closeBtn = document.getElementById('close-btn');
const infoPopup = document.getElementById('info-popup');
if (infoBtn && infoPopup) {
  infoBtn.addEventListener('click', () => infoPopup.classList.add('active'));
}
if (closeBtn && infoPopup) {
  closeBtn.addEventListener('click', () => infoPopup.classList.remove('active'));
}
if (infoPopup) {
  infoPopup.addEventListener('click', (e) => {
    if (e.target === e.currentTarget) e.currentTarget.classList.remove('active');
  });
}

// Service Worker Registration
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js')
      .then(registration => {
        console.log('ServiceWorker registration successful');
      })
      .catch(err => {
        console.log('ServiceWorker registration failed: ', err);
      });
  });
}

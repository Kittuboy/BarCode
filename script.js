// DOM Elements
const tabBtns = document.querySelectorAll('.tab-btn');
const tabContents = document.querySelectorAll('.tab-content');
const typeBtns = document.querySelectorAll('.type-btn');
const textInput = document.getElementById('text-input');
const generateBtn = document.getElementById('generate-btn');
const qrContainer = document.getElementById('qr-container');
const barcodeElement = document.getElementById('barcode');
const downloadBtn = document.getElementById('download-btn');
const saveBtn = document.getElementById('save-btn');
const reader = document.getElementById('reader');
const scanResult = document.getElementById('scan-result');
const resultText = document.getElementById('result-text');
const themeBtn = document.getElementById('theme-btn');
const settingsBtn = document.getElementById('settings-btn');
const settingsMenu = document.querySelector('.settings-menu');
const historyModal = document.getElementById('history-modal');
const savedCodesModal = document.getElementById('saved-codes-modal');
const closeModalBtns = document.querySelectorAll('.close-modal');
const menuItems = document.querySelectorAll('.menu-item');
const shareBtn = document.getElementById('share-btn');
const helpBtn = document.getElementById('help-btn');
const shareModal = document.getElementById('share-modal');
const helpModal = document.getElementById('help-modal');
const shareBtns = document.querySelectorAll('.share-btn');
const burgerMenu = document.getElementById('burger-menu');
const navControls = document.querySelector('.nav-controls');
const cameraScanBtn = document.getElementById('camera-scan-btn');
const fileScanBtn = document.getElementById('file-scan-btn');
const fileUploadContainer = document.getElementById('file-upload-container');
const uploadArea = document.getElementById('upload-area');
const fileInput = document.getElementById('file-input');

// Current state
let currentType = 'qr';
let qrCode = null;
let html5QrcodeScanner = null;
let isScanning = false;

// Load history and saved codes from localStorage
let history = JSON.parse(localStorage.getItem('codeHistory') || '[]');
let savedCodes = JSON.parse(localStorage.getItem('savedCodes') || '[]');

// Theme handling
function initializeTheme() {
    const savedTheme = localStorage.getItem('theme') || 'light';
    document.documentElement.setAttribute('data-theme', savedTheme);
    updateThemeIcon(savedTheme);
}

function toggleTheme() {
    const currentTheme = document.documentElement.getAttribute('data-theme');
    const newTheme = currentTheme === 'light' ? 'dark' : 'light';
    
    document.documentElement.setAttribute('data-theme', newTheme);
    localStorage.setItem('theme', newTheme);
    updateThemeIcon(newTheme);

    // Reinitialize scanner if it's active
    if (isScanning) {
        setTimeout(() => {
            stopScanner();
            initializeScanner();
        }, 300); // Small delay to allow theme transition
    }
}

function updateThemeIcon(theme) {
    const icon = themeBtn.querySelector('i');
    if (theme === 'light') {
        icon.className = 'fas fa-moon';
    } else {
        icon.className = 'fas fa-sun';
    }
}

// Initialize theme
initializeTheme();

// Theme toggle event listener
themeBtn.addEventListener('click', toggleTheme);

// Settings menu toggle
settingsBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    
    // Toggle menu visibility with animation
    if (settingsMenu.classList.contains('hidden')) {
        settingsMenu.classList.remove('hidden');
        requestAnimationFrame(() => {
            settingsMenu.classList.add('active');
        });
    } else {
        settingsMenu.classList.remove('active');
        setTimeout(() => {
            settingsMenu.classList.add('hidden');
        }, 300);
    }
    
    // Don't close mobile menu when opening settings
    if (window.innerWidth <= 768) {
        e.stopPropagation();
    }
});

// Close settings menu when clicking outside
document.addEventListener('click', () => {
    if (settingsMenu.classList.contains('active')) {
        settingsMenu.classList.remove('active');
        setTimeout(() => {
            settingsMenu.classList.add('hidden');
        }, 300);
    }
});

// Prevent menu from closing when clicking inside
settingsMenu.addEventListener('click', (e) => {
    e.stopPropagation();
});

// Add focus trap for accessibility
if (!settingsMenu.classList.contains('hidden')) {
    const menuItems = settingsMenu.querySelectorAll('button, [tabindex="0"]');
    if (menuItems.length > 0) {
        setTimeout(() => {
            menuItems[0].focus();
        }, 100);
    }
}

// Menu items click handler
menuItems.forEach(item => {
    item.addEventListener('click', () => {
        const action = item.dataset.action;
        if (action === 'new-tab') {
            window.open(window.location.href, '_blank');
        } else if (action === 'history') {
            showHistory();
        } else if (action === 'saved-codes') {
            showSavedCodes();
        }
        settingsMenu.classList.add('hidden');
    });
});

// Close modals
closeModalBtns.forEach(btn => {
    btn.addEventListener('click', () => {
        const modal = btn.closest('.modal');
        modal.classList.add('hidden');
    });
});

// Show history
function showHistory() {
    const historyList = document.getElementById('history-list');
    historyList.innerHTML = '';
    
    history.slice().reverse().forEach(item => {
        const historyItem = document.createElement('div');
        historyItem.className = 'history-item';
        historyItem.innerHTML = `
            <div>
                <div>${item.text}</div>
                <small>${new Date(item.timestamp).toLocaleString()}</small>
            </div>
            <button class="icon-btn" onclick="regenerateCode('${encodeURIComponent(item.text)}', '${item.type}')">
                <i class="fas fa-redo"></i>
            </button>
        `;
        historyList.appendChild(historyItem);
    });
    
    historyModal.classList.remove('hidden');
}

// Show saved codes
function showSavedCodes() {
    const savedCodesList = document.getElementById('saved-codes-list');
    savedCodesList.innerHTML = '';
    
    savedCodes.forEach(item => {
        const savedItem = document.createElement('div');
        savedItem.className = 'saved-code-item';
        savedItem.innerHTML = `
            <div>
                <div>${item.text}</div>
                <small>${item.type.toUpperCase()} Code</small>
            </div>
            <div class="saved-item-actions">
                <button class="icon-btn" onclick="regenerateCode('${encodeURIComponent(item.text)}', '${item.type}')">
                    <i class="fas fa-redo"></i>
                </button>
                <button class="icon-btn" onclick="deleteSavedCode('${encodeURIComponent(item.text)}')">
                    <i class="fas fa-trash"></i>
                </button>
            </div>
        `;
        savedCodesList.appendChild(savedItem);
    });
    
    savedCodesModal.classList.remove('hidden');
}

// Regenerate code from history or saved codes
function regenerateCode(encodedText, type) {
    const text = decodeURIComponent(encodedText);
    textInput.value = text;
    
    // Switch to correct type if needed
    if (type !== currentType) {
        const typeBtn = document.querySelector(`[data-type="${type}"]`);
        if (typeBtn) {
            typeBtn.click();
        }
    }
    
    // Generate the code
    generateBtn.click();
    
    // Close modals
    historyModal.classList.add('hidden');
    savedCodesModal.classList.add('hidden');
}

// Delete saved code
function deleteSavedCode(encodedText) {
    const text = decodeURIComponent(encodedText);
    savedCodes = savedCodes.filter(item => item.text !== text);
    localStorage.setItem('savedCodes', JSON.stringify(savedCodes));
    showSavedCodes();
}

// Add to history
function addToHistory(text, type) {
    const historyItem = {
        text,
        type,
        timestamp: new Date().toISOString()
    };
    
    history = [historyItem, ...history.slice(0, 19)]; // Keep only last 20 items
    localStorage.setItem('codeHistory', JSON.stringify(history));
}

// Save code
saveBtn.addEventListener('click', () => {
    const text = textInput.value.trim();
    if (!text) return;
    
    const savedCode = {
        text,
        type: currentType,
        timestamp: new Date().toISOString()
    };
    
    if (!savedCodes.some(item => item.text === text)) {
        savedCodes.push(savedCode);
        localStorage.setItem('savedCodes', JSON.stringify(savedCodes));
        alert('Code saved successfully!');
    } else {
        alert('This code is already saved!');
    }
});

// Tab switching
tabBtns.forEach(btn => {
    btn.addEventListener('click', () => {
        const tabId = btn.dataset.tab;
        
        // Update active states
        tabBtns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        
        // Show/hide content
        tabContents.forEach(content => {
            content.classList.add('hidden');
            if (content.id === tabId) {
                content.classList.remove('hidden');
            }
        });

        // Initialize scanner if switching to scan tab
        if (tabId === 'scan') {
            isScanning = true;
            initializeScanner();
        } else {
            isScanning = false;
            stopScanner();
        }
    });
});

// Type switching
typeBtns.forEach(btn => {
    btn.addEventListener('click', () => {
        currentType = btn.dataset.type;
        typeBtns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        
        // Clear previous results
        qrContainer.innerHTML = '';
        barcodeElement.innerHTML = '';
        downloadBtn.classList.add('hidden');
    });
});

// Generate code
generateBtn.addEventListener('click', () => {
    const text = textInput.value.trim();
    if (!text) {
        alert('Please enter some text or URL');
        return;
    }

    if (currentType === 'qr') {
        generateQRCode(text);
    } else {
        generateBarcode(text);
    }
    
    downloadBtn.classList.remove('hidden');
    addToHistory(text, currentType);
});

// Generate QR Code
function generateQRCode(text) {
    qrContainer.innerHTML = '';
    barcodeElement.innerHTML = '';
    
    qrCode = new QRCode(qrContainer, {
        text: text,
        width: 200,
        height: 200,
        colorDark: '#000000',
        colorLight: '#ffffff',
        correctLevel: QRCode.CorrectLevel.H
    });
}

// Generate Barcode
function generateBarcode(text) {
    qrContainer.innerHTML = '';
    
    JsBarcode('#barcode', text, {
        format: 'CODE128',
        width: 2,
        height: 100,
        displayValue: true,
        background: '#ffffff'
    });
}

// Download functionality
downloadBtn.addEventListener('click', () => {
    if (currentType === 'qr') {
        const element = qrContainer.querySelector('img');
        if (element) {
            downloadImage(element.src, 'qr-code.png');
        }
    } else {
        // For barcode (SVG)
        const svgData = new XMLSerializer().serializeToString(barcodeElement);
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        const img = new Image();
        
        img.onload = function() {
            canvas.width = img.width;
            canvas.height = img.height;
            
            // Fill white background
            ctx.fillStyle = '#ffffff';
            ctx.fillRect(0, 0, canvas.width, canvas.height);
            
            // Draw the image
            ctx.drawImage(img, 0, 0);
            
            // Convert to PNG and download
            downloadImage(canvas.toDataURL('image/png'), 'barcode.png');
        };
        
        img.src = 'data:image/svg+xml;base64,' + btoa(svgData);
    }
});

// Helper function to download image
function downloadImage(dataUrl, filename) {
    const link = document.createElement('a');
    link.download = filename;
    link.href = dataUrl;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}

// Stop QR Code scanner
function stopScanner() {
    if (html5QrcodeScanner) {
        html5QrcodeScanner.clear().catch(error => console.error('Error stopping scanner:', error));
        html5QrcodeScanner = null;
    }
    // Clear the reader div to ensure clean restart
    reader.innerHTML = '';
}

// Initialize QR Code scanner
function initializeScanner() {
    stopScanner(); // Ensure clean state

    html5QrcodeScanner = new Html5QrcodeScanner(
        "reader",
        {
            fps: 10,
            qrbox: { width: 250, height: 250 },
            aspectRatio: 1.0,
            showTorchButtonIfSupported: true,
            showZoomSliderIfSupported: true,
            defaultZoomValueIfSupported: 2,
            rememberLastUsedCamera: true,
            videoConstraints: {
                facingMode: { ideal: "environment" }
            }
        }
    );

    html5QrcodeScanner.render(onScanSuccess, onScanError);
}

// Handle successful scan
function onScanSuccess(decodedText, decodedResult) {
    if (cameraScanBtn.classList.contains('active')) {
        showScanResult(decodedText, true);
        saveToHistory('scan', decodedText);
    }
}

// Handle scan error
function onScanError(error) {
    console.warn(`Code scan error = ${error}`);
}

// Share button click handler
shareBtn.addEventListener('click', () => {
    shareModal.classList.remove('hidden');
});

// Help button click handler
helpBtn.addEventListener('click', () => {
    helpModal.classList.remove('hidden');
});

// Close modals when clicking outside
document.addEventListener('click', (e) => {
    if (e.target.classList.contains('modal')) {
        e.target.classList.add('hidden');
    }
});

// Share buttons click handlers
shareBtns.forEach(btn => {
    btn.addEventListener('click', () => {
        const platform = btn.dataset.platform;
        const currentUrl = window.location.href;
        const text = "Check out this awesome QR & Barcode Generator!";
        
        let shareUrl;
        switch (platform) {
            case 'whatsapp':
                shareUrl = `https://wa.me/?text=${encodeURIComponent(text + ' ' + currentUrl)}`;
                window.open(shareUrl, '_blank');
                break;
            case 'facebook':
                shareUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(currentUrl)}`;
                window.open(shareUrl, '_blank');
                break;
            case 'twitter':
                shareUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(currentUrl)}`;
                window.open(shareUrl, '_blank');
                break;
            case 'email':
                shareUrl = `mailto:?subject=${encodeURIComponent(text)}&body=${encodeURIComponent('Check out this link: ' + currentUrl)}`;
                window.location.href = shareUrl;
                break;
            case 'copy':
                navigator.clipboard.writeText(currentUrl).then(() => {
                    showToast('Link copied to clipboard!');
                }).catch(err => {
                    showToast('Failed to copy link');
                });
                break;
        }
        shareModal.classList.add('hidden');
    });
});

// Toast notification function
function showToast(message) {
    const toast = document.createElement('div');
    toast.className = 'toast';
    toast.textContent = message;
    document.body.appendChild(toast);
    
    // Remove toast after animation
    setTimeout(() => {
        document.body.removeChild(toast);
    }, 3000);
}

// Add mobile overlay element
const mobileOverlay = document.createElement('div');
mobileOverlay.className = 'mobile-overlay';
document.body.appendChild(mobileOverlay);

// Burger menu click handler
burgerMenu.addEventListener('click', () => {
    burgerMenu.classList.toggle('active');
    navControls.classList.toggle('active');
    mobileOverlay.classList.toggle('active');
    document.body.style.overflow = navControls.classList.contains('active') ? 'hidden' : '';
});

// Close mobile menu when clicking overlay
mobileOverlay.addEventListener('click', () => {
    burgerMenu.classList.remove('active');
    navControls.classList.remove('active');
    mobileOverlay.classList.remove('active');
    document.body.style.overflow = '';
});

// Close mobile menu when clicking menu items
navControls.addEventListener('click', (e) => {
    if (e.target.closest('.menu-item') || e.target.closest('.icon-btn')) {
        burgerMenu.classList.remove('active');
        navControls.classList.remove('active');
        mobileOverlay.classList.remove('active');
        document.body.style.overflow = '';
    }
});

// Add URL detection for textarea
function isValidURL(string) {
    try {
        new URL(string);
        return true;
    } catch (_) {
        return false;
    }
}

// Text input handlers
textInput.addEventListener('input', (e) => {
    const text = textInput.value;
    const containerWidth = textInput.offsetWidth;
    const charWidth = getAverageCharWidth(textInput);
    const charsPerLine = Math.floor((containerWidth * 0.8) / charWidth);
    
    // Add line breaks when text exceeds 80% width
    if (text.length > charsPerLine && !text.includes('\n')) {
        const lines = [];
        for (let i = 0; i < text.length; i += charsPerLine) {
            lines.push(text.slice(i, i + charsPerLine));
        }
        textInput.value = lines.join('\n');
    }
    
    // Check if input is URL
    if (isValidURL(text.trim())) {
        textInput.classList.add('url-input');
    } else {
        textInput.classList.remove('url-input');
    }
});

// Helper function to calculate average character width
function getAverageCharWidth(element) {
    const testString = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    const testDiv = document.createElement('div');
    testDiv.style.position = 'absolute';
    testDiv.style.visibility = 'hidden';
    testDiv.style.whiteSpace = 'nowrap';
    testDiv.style.font = window.getComputedStyle(element).font;
    testDiv.textContent = testString;
    document.body.appendChild(testDiv);
    const width = testDiv.offsetWidth / testString.length;
    document.body.removeChild(testDiv);
    return width;
}

// Keep existing keydown handler for Enter key
textInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
        e.preventDefault();
        generateBtn.click();
        return false;
    }
});

// Prevent height changes and handle input
textInput.addEventListener('input', (e) => {
    // Remove any newline characters immediately
    textInput.value = textInput.value.replace(/\n/g, '');
    
    // Handle scroll behavior
    if (textInput.value.length > 20) {
        textInput.style.overflowY = 'auto';
    } else {
        textInput.style.overflowY = 'hidden';
    }
    
    // Force height
    textInput.style.height = '60px';
});

// Prevent paste from changing height
textInput.addEventListener('paste', (e) => {
    setTimeout(() => {
        textInput.value = textInput.value.replace(/\n/g, '');
        textInput.style.height = '60px';
    }, 0);
});

// Add scan option switching and file upload handling
cameraScanBtn.addEventListener('click', () => {
    cameraScanBtn.classList.add('active');
    fileScanBtn.classList.remove('active');
    reader.style.display = 'block';
    fileUploadContainer.classList.add('hidden');
    startScanner();
});

fileScanBtn.addEventListener('click', () => {
    fileScanBtn.classList.add('active');
    cameraScanBtn.classList.remove('active');
    reader.style.display = 'none';
    fileUploadContainer.classList.remove('hidden');
    if (html5QrcodeScanner) {
        html5QrcodeScanner.clear();
    }
});

// File Upload Handling
uploadArea.addEventListener('dragover', (e) => {
    e.preventDefault();
    uploadArea.classList.add('drag-over');
});

uploadArea.addEventListener('dragleave', () => {
    uploadArea.classList.remove('drag-over');
});

uploadArea.addEventListener('drop', (e) => {
    e.preventDefault();
    uploadArea.classList.remove('drag-over');
    const file = e.dataTransfer.files[0];
    if (file) {
        processImage(file);
    }
});

fileInput.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (file) {
        processImage(file);
    }
});

function processImage(file) {
    if (!file.type.startsWith('image/')) {
        showScanResult('Please upload an image file', false);
        return;
    }

    const html5qrcode = new Html5Qrcode("reader");
    const imageUrl = URL.createObjectURL(file);

    html5qrcode.scanFile(file, true)
        .then(decodedText => {
            showScanResult(decodedText, true);
            saveToHistory('scan', decodedText);
        })
        .catch(err => {
            showScanResult('Could not decode QR code from image', false);
        })
        .finally(() => {
            URL.revokeObjectURL(imageUrl);
        });
}

function showScanResult(text, success = true) {
    scanResult.textContent = text;
    scanResult.className = success ? 'success' : 'error';
    scanResult.style.display = 'block';
}

// Update existing scanner initialization
function startScanner() {
    if (html5QrcodeScanner) {
        html5QrcodeScanner.render(onScanSuccess, onScanError);
    }
}

// Update the onScanSuccess callback
function onScanSuccess(decodedText, decodedResult) {
    if (cameraScanBtn.classList.contains('active')) {
        showScanResult(decodedText, true);
        saveToHistory('scan', decodedText);
    }
}

function saveToHistory(type, text) {
    const historyItem = {
        text,
        type,
        timestamp: new Date().toISOString()
    };
    
    history = [historyItem, ...history.slice(0, 19)]; // Keep only last 20 items
    localStorage.setItem('codeHistory', JSON.stringify(history));
}

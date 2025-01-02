// Configurare worker PDF.js
pdfjsLib.GlobalWorkerOptions.workerSrc = pdfjsLib.pdfjsWorker;

// Variabile globale
let pdfDoc = null;
let pdfScale = 1;
let pdfHeight = 0;
let pdfWidth = 0;
let qrPosition = { x: 50, y: 50 };
let currentPdfFile = null;
let originalPdfBytes = null;
let isLoading = false;

// Initialize everything when the document is loaded
document.addEventListener('DOMContentLoaded', function() {
    // Initialize PDF.js
    pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
    
    // Initialize file input handler
    initializeFileInput();
    
    // Initialize QR size change handler
    const qrSizeSelect = document.getElementById('qrSize');
    if (qrSizeSelect) {
        qrSizeSelect.addEventListener('change', updateQRPreviewSize);
    }
});

// Event listener pentru încărcarea fișierului PDF
function initializeFileInput() {
    const pdfFileInput = document.getElementById('pdfFile');
    if (pdfFileInput) {
        pdfFileInput.addEventListener('change', async function(e) {
            const file = e.target.files[0];
            if (file) {
                try {
                    isLoading = false;
                    currentPdfFile = file;
                    originalPdfBytes = await file.arrayBuffer();
                    
                    // Reset the preview section
                    const previewSection = document.getElementById('previewSection');
                    previewSection.classList.add('hidden');
                    
                    // Reset canvas
                    const canvas = document.getElementById('pdfPreview');
                    const context = canvas.getContext('2d');
                    context.clearRect(0, 0, canvas.width, canvas.height);
                    
                } catch (error) {
                    console.error('Eroare la citirea fișierului:', error);
                    alert('Eroare la citirea fișierului PDF');
                }
            }
        });
    }
}

// Funcție pentru validări
function initializeValidations() {
    const putereInput = document.getElementById('putereInstalata');
    if (putereInput) {
        putereInput.addEventListener('input', function(e) {
            validatePutereInstalata(this);
        });
        putereInput.addEventListener('blur', formatPutereInstalata);
    }

    const cnpCifInput = document.getElementById('cnpCif');
    if (cnpCifInput) {
        cnpCifInput.addEventListener('input', function() {
            validateCNPCIF(this);
        });
    }
}

// Funcție pentru validarea puterii instalate
function validatePutereInstalata(input) {
    let value = input.value.replace(/[^0-9,]/g, '');
    
    const parts = value.split(',');
    if (parts.length > 2) {
        value = parts[0] + ',' + parts.slice(1).join('');
    }
    
    if (parts.length === 2 && parts[1].length > 2) {
        parts[1] = parts[1].substring(0, 2);
        value = parts[0] + ',' + parts[1];
    }
    
    input.value = value;
}

// Funcție pentru formatarea puterii instalate
function formatPutereInstalata() {
    const value = this.value;
    if (value && value.includes(',')) {
        const parts = value.split(',');
        if (parts[1].length < 2) {
            parts[1] = parts[1].padEnd(2, '0');
            this.value = parts[0] + ',' + parts[1];
        }
    } else if (value && !value.includes(',')) {
        this.value = value + ',00';
    }
}

// Funcție pentru validarea CNP/CIF
function validateCNPCIF(input) {
    input.value = input.value.replace(/[^\d]/g, '');
}

async function loadAndRenderPDF() {
    try {
        // Read the PDF file
        const arrayBuffer = await currentPdfFile.arrayBuffer();
        
        // Load the PDF document
        const loadingTask = pdfjsLib.getDocument(arrayBuffer);
        pdfDoc = await loadingTask.promise;
        
        // Get the first page
        const page = await pdfDoc.getPage(1);
        
        // Get the canvas
        const canvas = document.getElementById('pdfPreview');
        const context = canvas.getContext('2d');
        
        // Calculate the scaling
        const container = document.querySelector('.preview-container');
        const containerWidth = container.clientWidth - 40;
        
        // Get viewport at scale 1.0
        const viewport = page.getViewport({ scale: 1.0 });
        
        // Calculate scale to fit container width
        pdfScale = containerWidth / viewport.width;
        
        // Get scaled viewport
        const scaledViewport = page.getViewport({ scale: pdfScale });
        
        // Set canvas size
        canvas.width = scaledViewport.width;
        canvas.height = scaledViewport.height;
        
        // Store PDF dimensions
        pdfWidth = viewport.width;
        pdfHeight = viewport.height;
        
        // Render PDF page
        const renderContext = {
            canvasContext: context,
            viewport: scaledViewport,
            enableWebGL: true,
            renderInteractiveForms: true
        };
        
        await page.render(renderContext).promise;
        
    } catch (error) {
        console.error('Eroare la încărcarea PDF:', error);
        throw error;
    }
}

// Funcție pentru preview
async function handlePreview() {
    if (isLoading) {
        return;
    }

    if (!currentPdfFile) {
        alert('Vă rugăm să selectați un fișier PDF');
        return;
    }

    const qrData = document.getElementById('qrData').value;
    if (!qrData) {
        alert('Vă rugăm să introduceți datele pentru codul QR');
        return;
    }

    try {
        isLoading = true;
        const previewSection = document.getElementById('previewSection');
        previewSection.classList.remove('hidden');

        await loadAndRenderPDF();
        initializeQRPreview();
    } catch (error) {
        console.error('Eroare la previzualizare:', error);
        alert('Eroare la încărcarea PDF-ului: ' + error.message);
    } finally {
        isLoading = false;
    }
}

// Funcție pentru afișarea preview-ului PDF
async function showPdfPreview(pdfFile) {
    try {
        const arrayBuffer = await pdfFile.arrayBuffer();
        pdfDoc = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
        
        const page = await pdfDoc.getPage(1);
        const canvas = document.getElementById('pdfPreview');
        const context = canvas.getContext('2d');
        
        // Calculează scala pentru potrivire în container
        const container = canvas.parentElement;
        const containerWidth = container.clientWidth - 40;
        const viewport = page.getViewport({ scale: 1 });
        
        // Salvăm dimensiunile originale ale PDF-ului
        pdfWidth = viewport.width;
        pdfHeight = viewport.height;
        
        pdfScale = containerWidth / viewport.width;
        
        const scaledViewport = page.getViewport({ scale: pdfScale });
        canvas.height = scaledViewport.height;
        canvas.width = scaledViewport.width;
        
        await page.render({
            canvasContext: context,
            viewport: scaledViewport
        }).promise;

        initializeQRPreview();
    } catch (error) {
        console.error('Eroare la încărcarea PDF:', error);
        throw error;
    }
}

// Funcție pentru actualizarea dimensiunii QR
function updateQRPreviewSize() {
    const qrPreview = document.getElementById('qrPreview');
    const sizeSelect = document.getElementById('qrSize');
    if (!qrPreview || !sizeSelect) return;

    const newSize = parseInt(sizeSelect.value);
    qrPreview.style.width = `${newSize}px`;
    qrPreview.style.height = `${newSize}px`;

    // Repoziționare în centru
    const container = document.querySelector('.preview-container');
    if (container) {
        const containerRect = container.getBoundingClientRect();
        qrPreview.style.left = `${(containerRect.width - newSize) / 2}px`;
        qrPreview.style.top = `${(containerRect.height - newSize) / 2}px`;
    }
}

// Funcție pentru inițializarea preview-ului QR
function initializeQRPreview() {
    const preview = document.getElementById('qrPreview');
    const container = document.querySelector('.preview-container');
    if (!preview || !container) return;

    const size = parseInt(document.getElementById('qrSize').value);
    
    preview.style.width = `${size}px`;
    preview.style.height = `${size}px`;
    preview.style.display = 'block';

    // Poziționare inițială în centru
    const containerRect = container.getBoundingClientRect();
    preview.style.left = `${(containerRect.width - size) / 2}px`;
    preview.style.top = `${(containerRect.height - size) / 2}px`;

    interact(preview)
        .draggable({
            inertia: false,
            modifiers: [
                interact.modifiers.restrictRect({
                    restriction: container,
                    endOnly: true
                })
            ],
            listeners: {
                move: dragMoveListener
            }
        });

    generateQRPreview();
}

// Funcție pentru gestionarea drag & drop
function dragMoveListener(event) {
    const target = event.target;
    // Get the current position
    const x = (parseFloat(target.getAttribute('data-x')) || 0) + event.dx;
    const y = (parseFloat(target.getAttribute('data-y')) || 0) + event.dy;

    // Update the position
    target.style.transform = `translate(${x}px, ${y}px)`;
    target.setAttribute('data-x', x);
    target.setAttribute('data-y', y);

    // Store the absolute position
    const rect = target.getBoundingClientRect();
    const container = document.querySelector('.preview-container');
    const containerRect = container.getBoundingClientRect();

    qrPosition = {
        x: rect.left - containerRect.left,
        y: rect.top - containerRect.top
    };
}

// Funcție pentru generarea preview-ului QR
function generateQRPreview() {
    const qrData = document.getElementById('qrData').value;
    const qrPreview = document.getElementById('qrPreview');
    if (!qrData || !qrPreview) return;

    qrPreview.innerHTML = '';
    
    new QRCode(qrPreview, {
        text: qrData,
        width: parseInt(document.getElementById('qrSize').value),
        height: parseInt(document.getElementById('qrSize').value),
        colorDark: "#000000",
        colorLight: "#ffffff",
        correctLevel: QRCode.CorrectLevel[document.getElementById('errorCorrection').value]
    });
}

// Funcție pentru procesarea PDF-ului final
async function processPDF() {
    if (!currentPdfFile || !pdfDoc) {
        alert('Vă rugăm să încărcați un PDF');
        return;
    }

    try {
        const qrData = document.getElementById('qrData').value;
        const qrSize = parseInt(document.getElementById('qrSize').value);
        
        // Create QR code in a container
        const qrContainer = document.createElement('div');
        new QRCode(qrContainer, {
            text: qrData,
            width: qrSize,
            height: qrSize,
            correctLevel: QRCode.CorrectLevel[document.getElementById('errorCorrection').value]
        });

        // Wait for QR code generation
        await new Promise(resolve => setTimeout(resolve, 100));

        // Get the QR code image
        const qrImage = qrContainer.querySelector('img');
        if (!qrImage) {
            throw new Error('Eroare la generarea codului QR');
        }

        // Load the original PDF
        const pdfDoc = await PDFLib.PDFDocument.load(originalPdfBytes);
        const pages = pdfDoc.getPages();
        const firstPage = pages[0];
        const { width, height } = firstPage.getSize();

        // Get QR code as base64 and convert to bytes
        const qrBase64 = qrImage.src.split(',')[1];
        const qrImageBytes = Uint8Array.from(atob(qrBase64), c => c.charCodeAt(0));
        const qrPngImage = await pdfDoc.embedPng(qrImageBytes);

        // Calculate the QR code position
        // Get the preview container dimensions for scale calculation
        const previewContainer = document.querySelector('.preview-container');
        const containerWidth = previewContainer.clientWidth - 40;
        const scale = width / containerWidth;

        // Calculate the actual position on the PDF
        const qrPreview = document.getElementById('qrPreview');
        const transform = qrPreview.style.transform;
        const translateX = transform ? parseInt(transform.split('(')[1]) : 0;
        const translateY = transform ? parseInt(transform.split(',')[1]) : 0;

        const baseX = parseFloat(qrPreview.style.left) || 0;
        const baseY = parseFloat(qrPreview.style.top) || 0;

        const scaledX = (baseX + translateX) * scale;
        const scaledY = height - ((baseY + translateY) * scale) - (qrSize * scale);

        // Add QR code to the PDF
        firstPage.drawImage(qrPngImage, {
            x: scaledX,
            y: scaledY,
            width: qrSize * scale,
            height: qrSize * scale
        });

        // Save and download the PDF
        const pdfBytes = await pdfDoc.save();
        const blob = new Blob([pdfBytes], { type: 'application/pdf' });
        const url = URL.createObjectURL(blob);

        const a = document.createElement('a');
        a.href = url;
        a.download = 'factura_cu_qr.pdf';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);

    } catch (error) {
        console.error('Eroare la procesare:', error);
        alert('Eroare la generarea PDF-ului: ' + error.message);
    }
}

// Funcție pentru resetare formular
function resetForm() {
    isLoading = false;
    document.getElementById('pdfFile').value = '';
    document.getElementById('qrData').value = '';
    document.getElementById('previewSection').classList.add('hidden');
    
    const canvas = document.getElementById('pdfPreview');
    const context = canvas.getContext('2d');
    context.clearRect(0, 0, canvas.width, canvas.height);
    
    const qrPreview = document.getElementById('qrPreview');
    if (qrPreview) {
        qrPreview.style.transform = 'none';
        qrPreview.removeAttribute('data-x');
        qrPreview.removeAttribute('data-y');
    }
    
    currentPdfFile = null;
    pdfDoc = null;
    originalPdfBytes = null;
    qrPosition = { x: 50, y: 50 };
}
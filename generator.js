// generator.js

// La încărcarea documentului
document.addEventListener('DOMContentLoaded', function() {
    // Adaugă panourile inițiale
    addPanel();
    addPanel();

    // Inițializează validările
    initializeValidations();
	
    addRequiredLabels();
    
    // Adăugăm validare la blur pentru toate câmpurile obligatorii
    document.querySelectorAll('[required]').forEach(field => {
        field.addEventListener('blur', function() {
            const parent = field.closest('.form-group') || field.closest('.panel-series');
            if (!this.value.trim()) {
                parent?.classList.add('error');
            } else {
                parent?.classList.remove('error');
            }
        });

        // Eliminăm clasa de eroare când utilizatorul începe să tasteze
        field.addEventListener('input', function() {
            const parent = field.closest('.form-group') || field.closest('.panel-series');
            parent?.classList.remove('error');
        });
    });	
});

// Funcție pentru adăugarea unui nou panou
function addPanel() {
    const container = document.getElementById('panouriContainer');
    if (!container) return;

    const panelCount = container.children.length + 1;
    
    const panelDiv = document.createElement('div');
    panelDiv.className = 'panel-series';
    
    panelDiv.innerHTML = `
        <div class="panel-number">P${panelCount}</div>
        <input type="text" 
               class="form-control panel-input" 
               placeholder="Serie panou ${panelCount}"
               required
               ${panelCount <= 2 ? 'required' : ''}>
        ${panelCount > 2 ? `
            <button type="button" 
                    class="btn-remove" 
                    onclick="removePanel(this)">
                Șterge
            </button>
        ` : ''}
    `;
    
    container.appendChild(panelDiv);
    renumberPanels();
}

// Funcție pentru ștergerea unui panou
function removePanel(button) {
    if (button?.parentElement) {
        button.parentElement.remove();
        renumberPanels();
    }
}

// Funcție pentru renumerotarea panourilor
function renumberPanels() {
    const panels = document.querySelectorAll('.panel-series');
    panels.forEach((panel, index) => {
        const numberElement = panel.querySelector('.panel-number');
        const inputElement = panel.querySelector('input');
        if (numberElement) {
            numberElement.textContent = `P${index + 1}`;
        }
        if (inputElement) {
            inputElement.placeholder = `Serie panou ${index + 1}`;
            // Setează required pentru primele două panouri
            if (index < 2) {
                inputElement.setAttribute('required', '');
            } else {
                inputElement.removeAttribute('required');
            }
        }
    });
}

// Funcție pentru inițializarea validărilor
function initializeValidations() {
    // Validare putere instalată
    const putereInput = document.getElementById('putereInstalata');
    if (putereInput) {
        putereInput.addEventListener('input', function(e) {
            let value = e.target.value.replace(/[^0-9,]/g, '');
            
            const parts = value.split(',');
            if (parts.length > 2) {
                value = parts[0] + ',' + parts.slice(1).join('');
            }
            
            if (parts.length === 2 && parts[1].length > 2) {
                parts[1] = parts[1].substring(0, 2);
                value = parts[0] + ',' + parts[1];
            }
            
            e.target.value = value;
        });

        putereInput.addEventListener('blur', function(e) {
            const value = e.target.value;
            if (value && value.includes(',')) {
                const parts = value.split(',');
                if (parts[1].length < 2) {
                    parts[1] = parts[1].padEnd(2, '0');
                    e.target.value = parts[0] + ',' + parts[1];
                }
            } else if (value && !value.includes(',')) {
                e.target.value = value + ',00';
            }
        });
    }

    // Validare CNP/CIF
    const cnpCifInput = document.getElementById('cnpCif');
    if (cnpCifInput) {
        cnpCifInput.addEventListener('input', function(e) {
            e.target.value = e.target.value.replace(/[^\d]/g, '');
        });
    }
}

// Funcție pentru formatarea datei
function formatDate(dateString) {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('ro-RO', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
    }).replace(/\./g, '/');
}

// Funcție pentru generarea textului QR
function generateQRText() {
    // Validare formular
    if (!validateForm()) {
        return;
    }
	
    const form = document.getElementById('qrDataForm');
    if (!form.checkValidity()) {
        alert('Vă rugăm să completați toate câmpurile obligatorii!');
        return;
    }

    // Colectare date
    const panelInputs = document.querySelectorAll('.panel-input');
    if (panelInputs.length < 2) {
        alert('Sunt necesare minimum 2 panouri fotovoltaice!');
        return;
    }

    const seriiPanouri = Array.from(panelInputs).map(input => input.value);
    
    // Construire string QR
    const qrString = [
        document.getElementById('tipSolicitant').value,
        document.getElementById('numarFactura').value,
        formatDate(document.getElementById('dataFactura').value),
        document.getElementById('judet').value,
        document.getElementById('comuna').value,
        document.getElementById('sector').value,
        document.getElementById('strada').value,
        document.getElementById('numarStrada').value,
        document.getElementById('numePrenume').value,
        document.getElementById('cnpCif').value,
        document.getElementById('putereInstalata').value,
        document.getElementById('serieInvertor').value,
        document.getElementById('indicatorPanou').value,
        ...seriiPanouri
    ].join('|');

    // Trimite datele înapoi către fereastra principală
    if (window.opener && !window.opener.closed) {
        window.opener.document.getElementById('qrData').value = qrString;
        window.close();
    } else {
        // Pentru testare
        alert('Text generat pentru QR:\n\n' + qrString);
    }
}

function validateForm() {
    const form = document.getElementById('qrDataForm');
    const requiredFields = form.querySelectorAll('[required]');
    let isValid = true;
    
    // Resetăm toate mesajele de eroare anterioare
    document.querySelectorAll('.form-group.error').forEach(group => {
        group.classList.remove('error');
    });
    document.querySelectorAll('.panel-series.error').forEach(panel => {
        panel.classList.remove('error');
    });

    // Validăm fiecare câmp obligatoriu
    requiredFields.forEach(field => {
        if (!field.value.trim()) {
            isValid = false;
            // Găsim părinte form-group sau panel-series
            const parent = field.closest('.form-group') || field.closest('.panel-series');
            if (parent) {
                parent.classList.add('error');
            }
        }
    });

    // Verificăm special pentru panouri (minimum 2 sunt obligatorii)
    const panelInputs = document.querySelectorAll('.panel-input');
    const validPanels = Array.from(panelInputs).filter(input => input.value.trim()).length;
    if (validPanels < 2) {
        isValid = false;
        panelInputs.forEach((input, index) => {
            if (index < 2 && !input.value.trim()) {
                const parent = input.closest('.panel-series');
                if (parent) {
                    parent.classList.add('error');
                }
            }
        });
    }

    if (!isValid) {
        alert('Vă rugăm să completați toate câmpurile obligatorii marcate cu *');
    }

    return isValid;
}

function addRequiredLabels() {
    document.querySelectorAll('[required]').forEach(field => {
        const label = field.previousElementSibling;
        if (label && label.tagName === 'LABEL') {
            label.classList.add('required-field');
        }
    });
}
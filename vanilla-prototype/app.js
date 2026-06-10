document.addEventListener('DOMContentLoaded', () => {
    
    // ==========================================================================
    // 1. MANEJO DE LA PANTALLA DE INTRODUCCIÓN (SPLASH SCREEN)
    // ==========================================================================
    const splashScreen = document.getElementById('splash-screen');
    const appContainer = document.getElementById('app-container');

    // Desvanecer a los 1.8s exactos (1800ms) y revelar el contenido de la app
    setTimeout(() => {
        if (splashScreen) {
            splashScreen.classList.add('fade-out');
        }
        if (appContainer) {
            appContainer.classList.remove('app-hidden');
            appContainer.classList.add('app-visible');
        }
    }, 1800);

    // Ocultar por completo del DOM tras terminar la transición (2.4s totales)
    setTimeout(() => {
        if (splashScreen) {
            splashScreen.style.display = 'none';
        }
    }, 2400);

    // ==========================================================================
    // 2. LOGICA DE OCULTAR / MOSTRAR CONTRASEÑA
    // ==========================================================================
    function setupPasswordToggle(buttonId, inputId) {
        const button = document.getElementById(buttonId);
        const input = document.getElementById(inputId);
        if (!button || !input) return;

        const eyeIcon = button.querySelector('.eye-icon');
        const eyeOffIcon = button.querySelector('.eye-off-icon');

        button.addEventListener('click', (e) => {
            e.preventDefault(); // Evitar que envíe el formulario
            
            // Alternar tipo de input
            if (input.type === 'password') {
                input.type = 'text';
                eyeIcon.classList.add('hidden');
                eyeOffIcon.classList.remove('hidden');
                button.setAttribute('aria-label', 'Ocultar contraseña');
            } else {
                input.type = 'password';
                eyeIcon.classList.remove('hidden');
                eyeOffIcon.classList.add('hidden');
                button.setAttribute('aria-label', 'Mostrar contraseña');
            }
        });
    }

    setupPasswordToggle('toggle-password', 'reg-password');
    setupPasswordToggle('toggle-confirm', 'reg-confirm');

    // ==========================================================================
    // 3. VALIDACIÓN DEL FORMULARIO Y REGISTRO
    // ==========================================================================
    const form = document.getElementById('register-form');
    const nameInput = document.getElementById('reg-name');
    const emailInput = document.getElementById('reg-email');
    const passwordInput = document.getElementById('reg-password');
    const confirmInput = document.getElementById('reg-confirm');
    const termsCheckbox = document.getElementById('reg-terms');
    const btnSubmit = document.getElementById('btn-submit');

    // Elementos de error
    const nameError = document.getElementById('name-error');
    const emailError = document.getElementById('email-error');
    const passwordError = document.getElementById('password-error');
    const confirmError = document.getElementById('confirm-error');
    const termsError = document.getElementById('terms-error');

    // Expresión regular para validar emails
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    // Utilidades para mostrar/limpiar errores
    function showError(inputElement, errorElement, message) {
        const group = inputElement.closest('.input-group') || inputElement.closest('.checkbox-group');
        if (group) {
            group.classList.add('invalid');
        }
        if (errorElement) {
            errorElement.textContent = message;
        }
    }

    function clearError(inputElement) {
        const group = inputElement.closest('.input-group') || inputElement.closest('.checkbox-group');
        if (group) {
            group.classList.remove('invalid');
        }
    }

    // Limpiar errores en tiempo real conforme el usuario escribe
    if (nameInput) nameInput.addEventListener('input', () => {
        if (nameInput.value.trim().length >= 3) clearError(nameInput);
    });
    
    if (emailInput) emailInput.addEventListener('input', () => {
        if (emailRegex.test(emailInput.value.trim())) clearError(emailInput);
    });

    if (passwordInput) passwordInput.addEventListener('input', () => {
        if (passwordInput.value.length >= 6) {
            clearError(passwordInput);
            // Si el confirmador ya tiene valor, re-validar la coincidencia
            if (confirmInput && confirmInput.value) {
                if (confirmInput.value === passwordInput.value) clearError(confirmInput);
            }
        }
    });

    if (confirmInput) confirmInput.addEventListener('input', () => {
        if (confirmInput.value === passwordInput.value) clearError(confirmInput);
    });

    if (termsCheckbox) termsCheckbox.addEventListener('change', () => {
        if (termsCheckbox.checked) clearError(termsCheckbox);
    });

    // Envío del formulario
    if (form) {
        form.addEventListener('submit', (e) => {
            e.preventDefault();
            
            let isFormValid = true;

            // 1. Validar Nombre
            const nameVal = nameInput.value.trim();
            if (!nameVal) {
                showError(nameInput, nameError, 'El nombre completo es requerido');
                isFormValid = false;
            } else if (nameVal.length < 3) {
                showError(nameInput, nameError, 'El nombre debe tener al menos 3 caracteres');
                isFormValid = false;
            } else {
                clearError(nameInput);
            }

            // 2. Validar Email
            const emailVal = emailInput.value.trim();
            if (!emailVal) {
                showError(emailInput, emailError, 'El correo electrónico es requerido');
                isFormValid = false;
            } else if (!emailRegex.test(emailVal)) {
                showError(emailInput, emailError, 'Por favor, ingresa un correo electrónico válido');
                isFormValid = false;
            } else {
                clearError(emailInput);
            }

            // 3. Validar Contraseña
            const passwordVal = passwordInput.value;
            if (!passwordVal) {
                showError(passwordInput, passwordError, 'La contraseña es requerida');
                isFormValid = false;
            } else if (passwordVal.length < 6) {
                showError(passwordInput, passwordError, 'La contraseña debe tener al menos 6 caracteres');
                isFormValid = false;
            } else {
                clearError(passwordInput);
            }

            // 4. Validar Confirmar Contraseña
            const confirmVal = confirmInput.value;
            if (!confirmVal) {
                showError(confirmInput, confirmError, 'Debes confirmar tu contraseña');
                isFormValid = false;
            } else if (confirmVal !== passwordVal) {
                showError(confirmInput, confirmError, 'Las contraseñas no coinciden');
                isFormValid = false;
            } else {
                clearError(confirmInput);
            }

            // 5. Validar Términos
            if (!termsCheckbox.checked) {
                showError(termsCheckbox, termsError, 'Debes aceptar los términos y condiciones');
                isFormValid = false;
            } else {
                clearError(termsCheckbox);
            }

            // Si todo está correcto, simular registro exitoso
            if (isFormValid) {
                simulateRegistration(nameVal);
            }
        });
    }

    // Simular el proceso de registro con loading spinner
    function simulateRegistration(userName) {
        // Deshabilitar todos los controles
        const inputs = form.querySelectorAll('input, button');
        inputs.forEach(input => input.disabled = true);
        
        // Mostrar spinner en el botón de envío
        const btnText = btnSubmit.querySelector('.btn-text');
        const spinner = btnSubmit.querySelector('.spinner-icon');
        
        if (btnText && spinner) {
            btnText.textContent = 'Creando cuenta...';
            spinner.classList.remove('hidden');
        }

        // Simular llamada de API (2 segundos de retraso)
        setTimeout(() => {
            // Mostrar notificación de éxito premium
            showSuccessNotification(userName);
            
            // Reestablecer controles
            inputs.forEach(input => input.disabled = false);
            if (btnText && spinner) {
                btnText.textContent = 'Registrarse';
                spinner.classList.add('hidden');
            }
            form.reset();
        }, 2000);
    }

    // Notificación flotante de éxito
    function showSuccessNotification(name) {
        const notification = document.createElement('div');
        notification.className = 'success-toast';
        notification.innerHTML = `
            <div class="toast-content">
                <svg class="toast-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3">
                    <polyline points="20 6 9 17 4 12" />
                </svg>
                <div class="toast-text">
                    <h5>¡Registro Exitoso!</h5>
                    <p>Bienvenido(a), ${name}. Tu cuenta ha sido creada.</p>
                </div>
            </div>
        `;
        document.body.appendChild(notification);

        // Estilos dinámicos para el toast
        Object.assign(notification.style, {
            position: 'fixed',
            bottom: '24px',
            right: '24px',
            backgroundColor: '#ffffff',
            borderLeft: '6px solid var(--success)',
            borderRadius: '12px',
            boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
            padding: '16px 20px',
            zIndex: '10000',
            transform: 'translateY(100px)',
            opacity: '0',
            transition: 'all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275)'
        });

        // Configuración de estilos para los elementos internos del toast
        const toastContent = notification.querySelector('.toast-content');
        const toastIcon = notification.querySelector('.toast-icon');
        const toastText = notification.querySelector('.toast-text');
        
        if (toastContent) {
            toastContent.style.display = 'flex';
            toastContent.style.alignItems = 'center';
            toastContent.style.gap = '12px';
        }
        if (toastIcon) {
            toastIcon.style.color = 'var(--success)';
            toastIcon.style.width = '24px';
            toastIcon.style.height = '24px';
            toastIcon.style.backgroundColor = '#f0fdf4';
            toastIcon.style.borderRadius = '50%';
            toastIcon.style.padding = '4px';
        }
        if (toastText) {
            const h5 = toastText.querySelector('h5');
            const p = toastText.querySelector('p');
            if (h5) {
                h5.style.margin = '0 0 2px 0';
                h5.style.fontSize = '0.95rem';
                h5.style.fontWeight = '700';
                h5.style.color = 'var(--slate-900)';
            }
            if (p) {
                p.style.margin = '0';
                p.style.fontSize = '0.825rem';
                p.style.fontWeight = '500';
                p.style.color = 'var(--slate-500)';
            }
        }

        // Animar entrada
        setTimeout(() => {
            notification.style.transform = 'translateY(0)';
            notification.style.opacity = '1';
        }, 100);

        // Animar salida y remover después de 4 segundos
        setTimeout(() => {
            notification.style.transform = 'translateY(100px)';
            notification.style.opacity = '0';
            setTimeout(() => {
                notification.remove();
            }, 400);
        }, 4000);
    }

    // Acción para botones Google / Redirecciones ficticias
    const btnGoogle = document.getElementById('btn-google');
    if (btnGoogle) {
        btnGoogle.addEventListener('click', () => {
            alert('Integrando el registro seguro con Google...');
        });
    }

    const switchLinks = document.querySelectorAll('.form-link-action');
    switchLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            alert('Redirigiendo a la pantalla de Inicio de Sesión...');
        });
    });
});

document.addEventListener('DOMContentLoaded', function() {
    initializeBookingForm();
    setMinDate();
    addFormValidation();
    initializePhotoUpload();
    updateTotalAmount();
});

function initializeBookingForm() {
    const bookingForm = document.getElementById('bookingForm');
    
    if (bookingForm) {
        bookingForm.addEventListener('submit', handleBookingSubmit);
    }
}

function setMinDate() {
    const dateInput = document.getElementById('pickupDate');
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    const minDate = tomorrow.toISOString().split('T')[0];
    dateInput.setAttribute('min', minDate);
    
    // Set default date to tomorrow
    dateInput.value = minDate;
}

function handleBookingSubmit(e) {
    e.preventDefault();
    
    const formData = new FormData(e.target);
    const bookingData = {
        fullName: formData.get('fullName'),
        email: formData.get('email'),
        phone: formData.get('phone'),
        whatsapp: formData.get('whatsapp'),
        pickupDate: formData.get('pickupDate'),
        pickupTime: formData.get('pickupTime'),
        address: formData.get('address'),
        serviceType: formData.get('serviceType'),
        quantity: formData.get('quantity'),
        clothesPhoto: formData.get('clothesPhoto') ? 'Photo uploaded' : 'No photo',
        additionalNote: formData.get('additionalNote')
    };
    
    // Validate form
    if (!validateBookingForm(bookingData)) {
        return;
    }
    
    // Show loading state
    const submitButton = e.target.querySelector('.submit-button');
    showLoadingState(submitButton);
    
    // Simulate API call
    setTimeout(() => {
        hideLoadingState(submitButton);
        showSuccessMessage();
    }, 2000);
}

function validateBookingForm(data) {
    let isValid = true;
    
    // Clear previous errors
    clearFormErrors();
    
    // Validate required fields
    const requiredFields = [
        { field: 'fullName', message: 'Full name is required' },
        { field: 'email', message: 'Email is required' },
        { field: 'phone', message: 'Phone number is required' },
        { field: 'pickupDate', message: 'Pickup date is required' },
        { field: 'pickupTime', message: 'Pickup time is required' },
        { field: 'address', message: 'Address is required' },
        { field: 'serviceType', message: 'Service type is required' },
        { field: 'quantity', message: 'Quantity is required' }
    ];
    
    requiredFields.forEach(({ field, message }) => {
        if (!data[field] || data[field].trim() === '') {
            showFieldError(field, message);
            isValid = false;
        }
    });
    
    // Validate email format
    if (data.email && !isValidEmail(data.email)) {
        showFieldError('email', 'Please enter a valid email address');
        isValid = false;
    }
    
    // Validate phone format
    if (data.phone && !isValidPhone(data.phone)) {
        showFieldError('phone', 'Please enter a valid phone number');
        isValid = false;
    }
    
    // Validate pickup date (not in the past)
    if (data.pickupDate) {
        const selectedDate = new Date(data.pickupDate);
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        if (selectedDate < today) {
            showFieldError('pickupDate', 'Pickup date cannot be in the past');
            isValid = false;
        }
    }
    
    // Validate quantity
    if (data.quantity && (isNaN(data.quantity) || data.quantity < 0.5)) {
        showFieldError('quantity', 'Quantity must be at least 0.5 kg');
        isValid = false;
    }
    
    return isValid;
}

function isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}

function isValidPhone(phone) {
    const cleanPhone = phone.replace(/[\s\-]/g, '');
    const phoneRegex = /^(?:\+234\d{10}|0\d{10})$/;
    return phoneRegex.test(cleanPhone);
}

function showFieldError(fieldName, message) {
    const field = document.getElementById(fieldName);
    if (field) {
        field.classList.add('error');
        
        // Remove existing error message
        const existingError = field.parentNode.querySelector('.error-message');
        if (existingError) {
            existingError.remove();
        }
        
        // Add new error message
        const errorDiv = document.createElement('div');
        errorDiv.className = 'error-message';
        errorDiv.textContent = message;
        field.parentNode.appendChild(errorDiv);
    }
}

function clearFormErrors() {
    document.querySelectorAll('.error').forEach(field => {
        field.classList.remove('error');
    });
    
    document.querySelectorAll('.error-message').forEach(error => {
        error.remove();
    });
}

function showLoadingState(button) {
    button.classList.add('loading');
    button.disabled = true;
}

function hideLoadingState(button) {
    button.classList.remove('loading');
    button.disabled = false;
}

function showSuccessMessage() {
    const form = document.querySelector('.booking-form');
    const successMessage = document.getElementById('successMessage');
    
    form.style.display = 'none';
    successMessage.style.display = 'block';
    
    successMessage.scrollIntoView({ behavior: 'smooth', block: 'center' });
}

function resetForm() {
    const form = document.querySelector('.booking-form');
    const successMessage = document.getElementById('successMessage');
    const photoPreview = document.getElementById('photoPreview');
    const previewImage = document.getElementById('previewImage');
    const totalAmount = document.getElementById('totalAmount');
    
    // Reset form
    document.getElementById('bookingForm').reset();
    clearFormErrors();
    setMinDate();
    
    // Reset photo preview
    photoPreview.style.display = 'none';
    previewImage.src = '#';
    
    // Reset total amount
    totalAmount.textContent = '$0.00';
    
    // Show form, hide success message
    form.style.display = 'flex';
    successMessage.style.display = 'none';
    
    document.querySelector('.booking-card').scrollIntoView({ behavior: 'smooth', block: 'start' });
}

function addFormValidation() {
    const inputs = document.querySelectorAll('input, select, textarea');
    
    inputs.forEach(input => {
        input.addEventListener('blur', function() {
            validateSingleField(this);
        });
        
        input.addEventListener('input', function() {
            if (this.classList.contains('error')) {
                this.classList.remove('error');
                const errorMessage = this.parentNode.querySelector('.error-message');
                if (errorMessage) {
                    errorMessage.remove();
                }
            }
            
            // Update total amount on service type or quantity change
            if (this.id === 'serviceType' || this.id === 'quantity') {
                updateTotalAmount();
            }
        });
    });
}

function validateSingleField(field) {
    const value = field.value.trim();
    const fieldName = field.name;
    
    field.classList.remove('error');
    const existingError = field.parentNode.querySelector('.error-message');
    if (existingError) {
        existingError.remove();
    }
    
    switch (fieldName) {
        case 'email':
            if (value && !isValidEmail(value)) {
                showFieldError(fieldName, 'Please enter a valid email address');
            }
            break;
        case 'phone':
            if (value && !isValidPhone(value)) {
                showFieldError(fieldName, 'Please enter a valid phone number');
            }
            break;
        case 'pickupDate':
            if (value) {
                const selectedDate = new Date(value);
                const today = new Date();
                today.setHours(0, 0, 0, 0);
                
                if (selectedDate < today) {
                    showFieldError(fieldName, 'Pickup date cannot be in the past');
                }
            }
            break;
        case 'quantity':
            if (value && (isNaN(value) || value < 0.5)) {
                showFieldError(fieldName, 'Quantity must be at least 0.5 kg');
            }
            break;
    }
}

function initializePhotoUpload() {
    const photoInput = document.getElementById('clothesPhoto');
    const photoPreview = document.getElementById('photoPreview');
    const previewImage = document.getElementById('previewImage');
    
    photoInput.addEventListener('change', function() {
        const file = this.files[0];
        if (file && file.type.startsWith('image/')) {
            const reader = new FileReader();
            reader.onload = function(e) {
                previewImage.src = e.target.result;
                photoPreview.style.display = 'block';
            };
            reader.readAsDataURL(file);
        } else {
            photoPreview.style.display = 'none';
            previewImage.src = '#';
        }
    });
}

function updateTotalAmount() {
    const serviceType = document.getElementById('serviceType').value;
    const quantity = parseFloat(document.getElementById('quantity').value) || 0;
    const totalAmount = document.getElementById('totalAmount');
    
    const pricing = {
        'dry-cleaning': 10, // $10/kg
        'wash-fold': 5,    // $5/kg
        'ironing': 2       // $2/kg
    };
    
    const total = serviceType && quantity >= 0.5 ? (pricing[serviceType] * quantity).toFixed(2) : '0.00';
    totalAmount.textContent = `N${total}`;
}

// Auto-fill WhatsApp with phone number
document.addEventListener('DOMContentLoaded', function() {
    const phoneInput = document.getElementById('phone');
    const whatsappInput = document.getElementById('whatsapp');
    
    phoneInput.addEventListener('blur', function() {
        if (this.value && !whatsappInput.value) {
            whatsappInput.value = this.value;
        }
    });
});

// Time slot availability
document.addEventListener('DOMContentLoaded', function() {
    const dateInput = document.getElementById('pickupDate');
    const timeSelect = document.getElementById('pickupTime');
    
    dateInput.addEventListener('change', function() {
        updateAvailableTimeSlots(this.value);
    });
});

function updateAvailableTimeSlots(selectedDate) {
    const timeSelect = document.getElementById('pickupTime');
    const options = timeSelect.querySelectorAll('option');
    
    options.forEach(option => {
        if (option.value) {
            option.disabled = false;
            option.textContent = option.textContent.replace(' (Unavailable)', '');
        }
    });
    
    const today = new Date().toISOString().split('T')[0];
    if (selectedDate === today) {
        const currentHour = new Date().getHours();
        
        options.forEach(option => {
            if (option.value) {
                const optionHour = parseInt(option.value.split(':')[0]);
                if (optionHour <= currentHour + 2) {
                    option.disabled = true;
                    option.textContent += ' (Unavailable)';
                }
            }
        });
    }
}

// Keyboard shortcuts
document.addEventListener('keydown', function(e) {
    if (e.key === 'Escape') {
        window.location.href = 'index.html';
    }
    
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
        const submitButton = document.querySelector('.submit-button');
        if (submitButton && !submitButton.disabled) {
            submitButton.click();
        }
    }
});
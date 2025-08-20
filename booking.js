// Initialize Appwrite client
const client = new Appwrite.Client();
client
    .setEndpoint('https://cloud.appwrite.io/v1') // Your Appwrite endpoint
    .setProject('68a5ade7003695fd5dd2'); // Your Appwrite project ID

// Initialize services
const databases = new Appwrite.Databases(client);
const storage = new Appwrite.Storage(client);

document.addEventListener('DOMContentLoaded', function () {
    initializeBookingForm();
    setMinDate();
    addFormValidation();
    initializePhotoUpload();
    updateTotalAmount();

    const dateInput = document.getElementById('pickupDate');
    const timeSelect = document.getElementById('pickupTime');

    dateInput.addEventListener('change', function () {
        updateAvailableTimeSlots(this.value);
    });
});
setupOrderIdPrompt();

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







function setupOrderIdPrompt() {
    const orderIdPrompt = document.getElementById('orderIdPrompt');
    const orderIdInput = document.getElementById('orderIdInput');
    const orderIdSubmit = document.getElementById('orderIdSubmit');
    const orderIdError = document.getElementById('orderIdError');
    const bookingForm = document.getElementById('bookingForm');

    orderIdSubmit.addEventListener('click', async function () {
        console.log("Order ID Submit Clicked");
        const orderId = orderIdInput.value.trim();
        const id = localStorage.setItem("orderId", orderId);
        console.log("Order ID:", orderId);
        if (!orderId) {
            orderIdError.textContent = "Please enter your Order ID.";
            orderIdError.style.display = "block";
            return;
        }

        // Fetch order data (replace with Appwrite fetch if needed)
        const orderData = await fetchOrderData(orderId);

        if (orderData) {
            localStorage.setItem("status", orderData.status)
            autofillBookingForm(orderData);
            orderIdPrompt.style.display = "none";
            bookingForm.style.display = "flex";
        } else {
            orderIdError.textContent = "Order not found. Please check your Order ID.";
            orderIdError.style.display = "block";
        }
    });
}

// Example: Fetch order data from localStorage (replace with Appwrite API if needed)
async function fetchOrderData(orderId) {
    const databaseId = '68a5af3c0024830bff08'; // Your database ID
    const ordersCollectionId = '68a5b25900162c67fe51'; // Your orders collection ID

    try {
        const response = await databases.getDocument(databaseId, ordersCollectionId, orderId);
        return response;
    } catch (error) {
        // If not found or error, return null
        return null;
    }
}

function autofillBookingForm(orderData) {
    // Fill fields
    document.getElementById('fullName').value = orderData.customers || orderData.fullName || "";
    document.getElementById('email').value = orderData.email || "";
    document.getElementById('phone').value = orderData.phone || "";
    document.getElementById('whatsapp').value = orderData.phone || "";
    document.getElementById('serviceType').value = orderData.items || orderData.serviceType || "";
    document.getElementById('quantity').value = orderData.quantity || "";
    document.getElementById('address').value = orderData.address || "";
    document.getElementById('totalAmount').textContent = orderData.total || "";
    console.log(orderData.total)

    // Disable all except pickupDate, pickupTime, address
    ['fullName', 'email', 'phone', 'whatsapp', 'serviceType', 'quantity'].forEach(id => {
        document.getElementById(id).setAttribute('disabled', 'disabled');
    });

    document.getElementById('pickupDate').removeAttribute('disabled');
    document.getElementById('pickupTime').removeAttribute('disabled');
    document.getElementById('address').removeAttribute('disabled');
}









async function handleBookingSubmit(e) {
    e.preventDefault();

    console.log("Booking form submitted");

    const orderId = localStorage.getItem("orderId");

    // Get values directly from form fields
    const bookingData = {
        Customer: document.getElementById('fullName').value,
        email: document.getElementById('email').value,
        phone: document.getElementById('phone').value,
        date: document.getElementById('pickupDate').value,
        time: document.getElementById('pickupTime').value,
        address: document.getElementById('address').value,
        // items: document.getElementById('serviceType').value,
        // quantity: document.getElementById('quantity').value,
        status: "pending",
        orderId: orderId
    };

    // Validate form
    // if (!validateBookingForm(bookingData)) {
    //     return;
    // }

    // Show loading state
    const submitButton = e.target.querySelector('.submit-button');
    showLoadingState(submitButton);
    console.log("Booking data:", bookingData);

    // Save booking data to Appwrite orders collection
    const databaseId = '68a5af3c0024830bff08';
    const ordersCollectionId = '68a5af8a0036e23e8910';

    try {
    console.log("Saving booking data to Appwrite");
    await databases.createDocument(
        databaseId,
        ordersCollectionId,
        Appwrite.ID.unique(), // <-- This generates a unique ID for the new document
        bookingData
    );
    hideLoadingState(submitButton);
    showSuccessMessage();
    console.log("Booking saved successfully");
    localStorage.removeItem("orderId");
} catch (error) {
    hideLoadingState(submitButton);
    showNotification("Failed to save booking: " + error.message, "error");
    console.error("Error saving booking:", error);
}
}

function validateBookingForm(data) {
    let isValid = true;

    // Clear previous errors
    clearFormErrors();

    // Validate required fields
    const requiredFields = [
        // { field: 'customer', message: 'Full name is required' },
        // { field: 'email', message: 'Email is required' },
        // { field: 'phone', message: 'Phone number is required' },
        // { field: 'date', message: 'Pickup date is required' },
        // { field: 'time', message: 'Pickup time is required' },
        // { field: 'address', message: 'Address is required' },
        // { field: 'serviceType', message: 'Service type is required' },
        // { field: 'quantity', message: 'Quantity is required' }
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
        input.addEventListener('blur', function () {
            validateSingleField(this);
        });

        input.addEventListener('input', function () {
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

    photoInput.addEventListener('change', function () {
        const file = this.files[0];
        if (file && file.type.startsWith('image/')) {
            const reader = new FileReader();
            reader.onload = function (e) {
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
document.addEventListener('DOMContentLoaded', function () {
    const phoneInput = document.getElementById('phone');
    const whatsappInput = document.getElementById('whatsapp');

    phoneInput.addEventListener('blur', function () {
        if (this.value && !whatsappInput.value) {
            whatsappInput.value = this.value;
        }
    });
});

// Time slot availability
// document.addEventListener('DOMContentLoaded', function() {
//     const dateInput = document.getElementById('pickupDate');
//     const timeSelect = document.getElementById('pickupTime');

//     dateInput.addEventListener('change', function() {
//         updateAvailableTimeSlots(this.value);
//     });
// });

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
document.addEventListener('keydown', function (e) {
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

function showNotification(message, type = "info") {
    document.querySelectorAll(".notification").forEach((n) => n.remove());

    const notification = document.createElement("div");
    notification.className = `notification ${type}`;
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        padding: 1rem 1.5rem;
        border-radius: 8px;
        color: white;
        font-weight: 500;
        z-index: 3000;
        opacity: 0;
        transform: translateX(100%);
        transition: all 0.3s ease;
        box-shadow: 0 4px 12px rgba(0,0,0,0.1);
    `;

    const colors = {
        success: "#10b981",
        error: "#ef4444",
        warning: "#f59e0b",
        info: "#2563eb",
    };

    notification.style.background = colors[type] || colors.info;

    // Render HTML for success, else plain text
    if (type === "success") {
        notification.innerHTML = message;
    } else {
        notification.textContent = message;
    }

    document.body.appendChild(notification);

    setTimeout(() => {
        notification.style.opacity = "1";
        notification.style.transform = "translateX(0)";
    }, 100);

    // Only auto-dismiss if not success
    if (type !== "success") {
        setTimeout(() => {
            notification.style.opacity = "0";
            notification.style.transform = "translateX(100%)";
            setTimeout(() => {
                if (document.body.contains(notification)) {
                    document.body.removeChild(notification);
                }
            }, 300);
        }, 3000);
    }
}
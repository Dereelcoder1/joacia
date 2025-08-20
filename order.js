// Initialize Appwrite client
const client = new Appwrite.Client();
client
    .setEndpoint('https://cloud.appwrite.io/v1') // Your Appwrite endpoint
    .setProject('68a5ade7003695fd5dd2'); // Your Appwrite project ID

// Initialize services
const databases = new Appwrite.Databases(client);
const storage = new Appwrite.Storage(client);
let uploadedFiles = [];

document.addEventListener("DOMContentLoaded", () => {
    setupOrderForm();
    setupFileUpload("fileUploadArea", "orderImages", "uploadedFiles", true);
});

function setupOrderForm() {
    const orderForm = document.getElementById("customerOrderForm");
    orderForm.addEventListener("submit", handleOrderSubmission);
}

async function handleOrderSubmission(event) {
    event.preventDefault();

    const customerName = document.getElementById("customerName").value;
    const customerEmail = document.getElementById("customerEmail").value;
    const customerPhone = document.getElementById("customerPhone").value;
    const serviceType = document.getElementById("serviceType").value;
    const quantity = parseInt(document.getElementById("quantity").value);
    const specialInstructions = document.getElementById("specialInstructions").value;

    const uploadedFilesElements = document.querySelectorAll("#uploadedFiles .uploaded-file");


    // Upload the first file if available
    let fileId = null;
    if (uploadedFiles.length > 0) {
        fileId = await uploadImageToAppwrite(uploadedFiles[0]);
        console.log("Uploaded file ID:", fileId);
    }

    // const attachments = Array.from(uploadedFilesElements).map(el => el.getAttribute("data-file-src"));

    const orderData = {
        id: Date.now(), // Simple unique ID
        customers: customerName,
        email: customerEmail,
        phone: customerPhone,
        items: serviceType,
        quantity: quantity,
        total: calculateOrderTotal(serviceType, quantity),
        instructions: specialInstructions,
        status: "pending", // Default status for new orders
        createdDate: new Date().toISOString(),
        fileId: fileId ? [fileId] : []
    };

    // uploadImageToAppwrite(uploadedFilesElements[0].getAttribute("data-file-src"))

    console.log("Order Data:", orderData);

    // Retrieve existing orders from localStorage (same key as admin dashboard)
    let orders = JSON.parse(localStorage.getItem("joacia_orders") || "[]");
    orders.push(orderData);
    localStorage.setItem("joacia_orders", JSON.stringify(orders));

    // Update customer data (similar to admin dashboard logic)
    updateCustomerData(customerName, customerEmail, customerPhone);

    showNotification("Your order has been placed successfully!", "success");
    document.getElementById("customerOrderForm").reset();
    document.getElementById("uploadedFiles").innerHTML = ""; // Clear uploaded files display
}



async function uploadImageToAppwrite(file) {
    // Assumes 'storage' is already initialized with: const storage = new Appwrite.Storage(client);
    try {
        // Create a unique ID for the file (or use 'unique()' if available)
        const response = await storage.createFile(
            '68a5ba56002f5fe885f5', // Replace with your Appwrite bucket ID
            Appwrite.ID.unique(),
            file
        );
        console.log("File uploaded successfully:", response);
        // Returns the file ID
        return response.$id;
    } catch (error) {
        showNotification("Upload failed: " + error.message, "error");
        console.error("Error uploading file:", error);
        return null;
    }
}








// Reused utility functions from admin-script.js
function calculateOrderTotal(serviceType, quantity) {
    const prices = {
        "wash-fold": 2.5,
        "dry-cleaning": 8.99,
        ironing: 3.5,
    };
    return (prices[serviceType] || 0) * quantity;
}

function updateCustomerData(name, email, phone = "") {
    const customers = JSON.parse(localStorage.getItem("joacia_customers") || "[]");
    const customer = customers.find((c) => c.email === email);

    if (customer) {
        customer.totalOrders = (customer.totalOrders || 0) + 1;
        customer.lastOrder = new Date().toISOString();
        if (phone && !customer.phone) customer.phone = phone; // Update phone if missing
    } else {
        customers.push({
            id: Date.now(),
            name: name,
            email: email,
            phone: phone,
            totalOrders: 1,
            lastOrder: new Date().toISOString(),
            createdDate: new Date().toISOString(),
        });
    }
    localStorage.setItem("joacia_customers", JSON.stringify(customers));
}

function setupFileUpload(areaId, inputId, filesContainerId, multiple) {
    const uploadArea = document.getElementById(areaId);
    const fileInput = document.getElementById(inputId);
    const filesContainer = document.getElementById(filesContainerId);

    uploadArea.addEventListener("click", () => {
        fileInput.click();
    });

    uploadArea.addEventListener("dragover", (e) => {
        e.preventDefault();
        uploadArea.classList.add("dragover");
    });

    uploadArea.addEventListener("dragleave", () => {
        uploadArea.classList.remove("dragover");
    });

    uploadArea.addEventListener("drop", (e) => {
        e.preventDefault();
        uploadArea.classList.remove("dragover");
        const files = Array.from(e.dataTransfer.files);
        handleFileUpload(files, filesContainer, multiple);
    });

    fileInput.addEventListener("change", (e) => {
        const files = Array.from(e.target.files);
        handleFileUpload(files, filesContainer, multiple);
    });
}

function handleFileUpload(files, container, multiple) {
    if (!multiple) {
        container.innerHTML = "";
        uploadedFiles = [];
    }

    files.forEach((file) => {
        if (file.type.startsWith("image/")) {
            const reader = new FileReader();
            reader.onload = (e) => {
                const dataUrl = e.target.result;
                const fileElement = createFileElement(file, dataUrl);
                container.appendChild(fileElement);
            };
            reader.readAsDataURL(file);
            uploadedFiles.push(file); // Store the File object
        } else {
            showNotification(`File type not supported: ${file.name}`, "warning");
        }
    });
}

function createFileElement(file, dataUrl) {
    const fileDiv = document.createElement("div");
    fileDiv.className = "uploaded-file";
    fileDiv.setAttribute("data-file-name", file.name);
    fileDiv.setAttribute("data-file-src", dataUrl);

    fileDiv.innerHTML = `
        <img src="${dataUrl}" alt="${file.name}" />
        <span>${file.name}</span>
        <button type="button" class="file-remove" onclick="removeFile(this)">×</button>
    `;
    return fileDiv;
}

function removeFile(button) {
    button.closest(".uploaded-file").remove();
}

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
    notification.textContent = message;

    document.body.appendChild(notification);

    setTimeout(() => {
        notification.style.opacity = "1";
        notification.style.transform = "translateX(0)";
    }, 100);

    setTimeout(() => {
        notification.style.opacity = "0";
        notification.style.transform = "translateX(100%)";
        setTimeout(() => {
            document.body.removeChild(notification);
        }, 300);
    }, 3000);
}

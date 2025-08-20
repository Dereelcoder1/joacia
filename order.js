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
    const address = document.getElementById("address").value;

    const uploadedFilesElements = document.querySelectorAll("#uploadedFiles .uploaded-file");


    // Upload the first file if available
    let fileId = null;
    if (uploadedFiles.length > 0) {
        fileId = await uploadImageToAppwrite(uploadedFiles[0]);
        console.log("Uploaded file ID:", fileId);
    }

    // const attachments = Array.from(uploadedFilesElements).map(el => el.getAttribute("data-file-src"));

    const orderData = {
        // id: Date.now(), // Simple unique ID
        customers: customerName,
        email: customerEmail,
        phone: customerPhone,
        items: serviceType,
        quantity: quantity,
        total: calculateOrderTotal(serviceType, quantity),
        instructions: specialInstructions,
        status: "pending", // Default status for new orders
        createdDate: new Date().toISOString().toString(),
        fileId: fileId ? fileId : "",
        address: address,
    };

    // uploadImageToAppwrite(uploadedFilesElements[0].getAttribute("data-file-src"))

    console.log("Order Data:", orderData);

    if (orderData) {
        const response = await writeOrderToDatabase(orderData);
        console.log("Database Response:", response);
    }

    // Retrieve existing orders from localStorage (same key as admin dashboard)
    // let orders = JSON.parse(localStorage.getItem("joacia_orders") || "[]");
    // orders.push(orderData);
    // localStorage.setItem("joacia_orders", JSON.stringify(orders));

    // // Update customer data (similar to admin dashboard logic)
    // updateCustomerData(customerName, customerEmail, customerPhone);

    // showNotification("Your order has been placed successfully!", "success");
    // document.getElementById("customerOrderForm").reset();
    // document.getElementById("uploadedFiles").innerHTML = ""; // Clear uploaded files display
}


//To Upload Image to Appwrite
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

// order.js - Handles customer order submissions and file uploads
async function writeOrderToDatabase(orderData) {
    try {
        const databaseId = '68a5af3c0024830bff08';
        const ordersCollectionId = '68a5b25900162c67fe51';
        const customersCollectionId = '68a5b34c0009d8b43e5f';

        // Check if customer exists by email
        const customers = await databases.listDocuments(databaseId, customersCollectionId, [
            Appwrite.Query.equal('email', orderData.email)
        ]);

        let totalOrders = 1;
        let customerId = null;

        if (customers.total > 0) {
            // Customer exists, update totalOrders and lastOrder
            const customer = customers.documents[0];
            customerId = customer.$id;
            totalOrders = (customer.totalOrders || 0) + 1;
            await databases.updateDocument(databaseId, customersCollectionId, customerId, {
                totalOrders: totalOrders,
                lastOrder: orderData.createdDate
            });
        } else {
            // Customer does not exist, create new customer
            const newCustomer = await databases.createDocument(databaseId, customersCollectionId, Appwrite.ID.unique(), {
                name: orderData.customers,
                email: orderData.email,
                phone: orderData.phone,
                totalOrders: totalOrders,
                lastOrder: orderData.createdDate,
                // createdDate: orderData.createdDate
            });
            customerId = newCustomer.$id;
        }

        // Save order data in orders collection
        // orderData.totalOrders = totalOrders;
        // orderData.customerId = customerId;
        const response = await databases.createDocument(
            databaseId,
            ordersCollectionId,
            Appwrite.ID.unique(),
            orderData
        );
        console.log("Order written to database:", response);
        // showNotification("Order saved to database!", "success");
        showNotification(
            `Order saved to database!<br>Your Order ID: <b id="orderIdText">${response.$id}</b> <button onclick="copyOrderId('${response.$id}')">Copy</button>`,
            "success"
        );
        document.getElementById("customerOrderForm").reset();
        document.getElementById("uploadedFiles").innerHTML = "";
        return response;
    } catch (error) {
        console.error("Error writing order to database:", error);
        showNotification("Failed to save order to database: " + error.message, "error");
        return null;
    }
}

function copyOrderId(orderId) {
    navigator.clipboard.writeText(orderId)
        .then(() => {
            showNotification("Order ID copied!", "info");
        })
        .catch(() => {
            showNotification("Failed to copy Order ID.", "error");
        });
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
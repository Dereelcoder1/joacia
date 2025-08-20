document.addEventListener("DOMContentLoaded", () => {
  initializeDashboard()
  loadDashboardData()
  setupEventListeners()
  setupFileUploads()
})

// Initialize Dashboard
function initializeDashboard() {
  // Load saved data from localStorage
  loadBookingsData()
  loadOrdersData()
  loadCustomersData()
  loadInventoryData() // Load inventory data
  updateDashboardStats()
  loadRecentActivity()
}

// Navigation
function setupEventListeners() {
  // Sidebar navigation
  const navLinks = document.querySelectorAll(".nav-link")
  const sidebar = document.querySelector(".sidebar")
  const sidebarToggle = document.getElementById("sidebarToggle")
  const sidebarClose = document.getElementById("sidebarClose")
  const mainContent = document.querySelector(".main-content")

  navLinks.forEach((link) => {
    link.addEventListener("click", function (e) {
      e.preventDefault()
      const section = this.dataset.section
      showSection(section)
      updateActiveNav(this)
      updatePageTitle(section)
      // Close sidebar on mobile when clicking nav links
      if (window.innerWidth <= 1024) {
        sidebar.classList.remove("active")
        mainContent.classList.remove("sidebar-active")
      }
    })
  })

  // Sidebar toggle for mobile
  sidebarToggle.addEventListener("click", () => {
    sidebar.classList.toggle("active")
    mainContent.classList.toggle("sidebar-active")
  })

  // Close sidebar when clicking close button
  sidebarClose.addEventListener("click", () => {
    sidebar.classList.remove("active")
    mainContent.classList.remove("sidebar-active")
  })

  // Close sidebar when clicking outside on mobile
  document.addEventListener("click", (e) => {
    if (window.innerWidth <= 1024) {
      if (!sidebar.contains(e.target) && !sidebarToggle.contains(e.target)) {
        sidebar.classList.remove("active")
        mainContent.classList.remove("sidebar-active")
      }
    }
  })

  // Global search
  const globalSearch = document.getElementById("globalSearch")
  globalSearch.addEventListener("input", function () {
    performGlobalSearch(this.value)
  })

  // Form submissions
  document.getElementById("bookingForm").addEventListener("submit", function (e) {
    e.preventDefault()
    handleBookingSubmission(this)
  })
  document.getElementById("orderForm").addEventListener("submit", function (e) {
    e.preventDefault()
    handleOrderSubmission(this)
  })
  document.getElementById("customerForm").addEventListener("submit", function (e) {
    e.preventDefault()
    handleCustomerSubmission(this)
  })
  document.getElementById("inventoryForm").addEventListener("submit", function (e) {
    e.preventDefault()
    handleInventorySubmission(this)
  })
}

function showSection(sectionId) {
  // Hide all sections
  const sections = document.querySelectorAll(".content-section")
  sections.forEach((section) => {
    section.classList.remove("active")
  })

  // Show selected section
  const targetSection = document.getElementById(sectionId)
  if (targetSection) {
    targetSection.classList.add("active")
  }
}

function updateActiveNav(activeLink) {
  const navLinks = document.querySelectorAll(".nav-link")
  navLinks.forEach((link) => {
    link.classList.remove("active")
  })
  activeLink.classList.add("active")
}

function updatePageTitle(section) {
  const titles = {
    dashboard: "Dashboard",
    bookings: "Bookings Management",
    orders: "Orders Management",
    customers: "Customer Management",
    inventory: "Inventory Management",
    settings: "Settings",
  }

  document.getElementById("pageTitle").textContent = titles[section] || "Dashboard"
}

// Dashboard Data Loading
function loadDashboardData() {
  // Simulate loading dashboard stats
  setTimeout(() => {
    updateDashboardStats()
    loadRecentActivity()
  }, 500)
}

function updateDashboardStats() {
  const bookings = getBookingsFromStorage()
  const orders = getOrdersFromStorage()
  const customers = getCustomersFromStorage()

  // Update stats
  document.getElementById("todayBookings").textContent = bookings.filter((b) => isToday(b.pickupDate)).length
  document.getElementById("activeOrders").textContent = orders.filter(
    (o) => o.status !== "completed" && o.status !== "cancelled",
  ).length
  document.getElementById("totalCustomers").textContent = customers.length

  // Calculate total revenue from completed orders
  const totalRevenue = orders
    .filter((o) => o.status === "completed")
    .reduce((sum, order) => sum + (order.total || 0), 0)
  document.getElementById("todayRevenue").textContent = `₦${totalRevenue.toFixed(2)}`
}

function loadRecentActivity() {
  const activityList = document.getElementById("activityList")
  const bookings = getBookingsFromStorage()
  const orders = getOrdersFromStorage()
  const customers = getCustomersFromStorage()

  const activities = []

  // Add recent bookings
  bookings.forEach((b) =>
    activities.push({
      type: "booking",
      icon: "📅",
      title: `New booking from ${b.fullName}`,
      description: `Pickup on ${formatDate(b.pickupDate)} at ${b.pickupTime}`,
      time: timeAgo(b.timestamp),
      color: "#2563eb",
      timestamp: b.timestamp,
    }),
  )

  // Add recent orders
  orders.forEach((o) =>
    activities.push({
      type: "order",
      icon: "👕",
      title: `Order #${o.id} ${o.status}`,
      description: `${o.customerName}'s ${o.serviceType} order`,
      time: timeAgo(o.createdDate),
      color: o.status === "completed" ? "#10b981" : "#f59e0b",
      timestamp: o.createdDate,
    }),
  )

  // Add recent customers
  customers.forEach((c) =>
    activities.push({
      type: "customer",
      icon: "👤",
      title: `New customer: ${c.name}`,
      description: `Registered with email ${c.email}`,
      time: timeAgo(c.createdDate),
      color: "#8b5cf6",
      timestamp: c.createdDate,
    }),
  )

  // Sort activities by timestamp (most recent first)
  activities.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())

  activityList.innerHTML = activities
    .slice(0, 5)
    .map(
      (activity) => `
      <div class="activity-item">
          <div class="activity-icon" style="background: ${activity.color}">
              ${activity.icon}
          </div>
          <div class="activity-content">
              <h4>${activity.title}</h4>
              <p>${activity.description} • ${activity.time}</p>
          </div>
      </div>
  `,
    )
    .join("")
}

// Bookings Management
// Add this helper function for Appwrite bookings
async function getBookingsFromAppwrite() {
    const databaseId = '68a5af3c0024830bff08'; // Your database ID
    const bookingsCollectionId = '68a5af8a0036e23e8910'; // Replace with your bookings collection ID

    try {
        const response = await databases.listDocuments(databaseId, bookingsCollectionId);
        return response.documents;
    } catch (error) {
        showNotification("Failed to load bookings: " + error.message, "error");
        return [];
    }
}

// Update loadBookingsData to use Appwrite
async function loadBookingsData() {
    const bookings = await getBookingsFromAppwrite();
    const tableBody = document.getElementById("bookingsTableBody");

    tableBody.innerHTML = bookings
        .map(
            (booking) => `
      <tr>
          <td>#${booking.$id}</td>
          <td>${booking.fullName || booking.Customer || booking.customers || ""}</td>
          <td>${formatDate(booking.pickupDate || booking.date || "")}</td>
          <td>${booking.pickupTime || booking.time || ""}</td>
          <td>${booking.address || ""}</td>
          <td><span class="status-badge ${booking.status || "pending"}">${booking.status || "pending"}</span></td>
          <td>
              <button class="btn btn-secondary btn-sm" onclick="editBooking('${booking.$id}')">Edit</button>
              <button class="btn btn-danger btn-sm" onclick="deleteBooking('${booking.$id}')">Delete</button>
          </td>
      </tr>
  `,
        )
        .join("");
}

// Orders Management
// Add this helper function for Appwrite orders
async function getOrdersFromAppwrite() {
    const databaseId = '68a5af3c0024830bff08'; // Your database ID
    const ordersCollectionId = '68a5b25900162c67fe51'; // Your orders collection ID

    try {
        const response = await databases.listDocuments(databaseId, ordersCollectionId);
        return response.documents;
    } catch (error) {
        showNotification("Failed to load orders: " + error.message, "error");
        return [];
    }
}

// Update loadOrdersData to use Appwrite
async function loadOrdersData() {
    const orders = await getOrdersFromAppwrite();
    const tableBody = document.getElementById("ordersTableBody");

    tableBody.innerHTML = orders
        .map(
            (order) => `
      <tr>
          <td>#${order.$id}</td>
          <td>${order.customerName || order.customers || ""}</td>
          <td>
              ${order.serviceType || order.items || ""}
              ${order.attachments && order.attachments.length > 0 ? `<img src="${order.attachments[0]}" alt="Order item" class="order-item-thumbnail" />` : ""}
          </td>
          <td>${order.quantity || ""}</td>
          <td>₦${order.total ? Number(order.total).toFixed(2) : "0.00"}</td>
          <td><span class="status-badge ${order.status}">${order.status}</span></td>
          <td>
              <button class="btn btn-secondary btn-sm" onclick="editOrder('${order.$id}')">Edit</button>
              <button class="btn btn-danger btn-sm" onclick="deleteOrder('${order.$id}')">Delete</button>
          </td>
      </tr>
  `,
        )
        .join("");
}

// Customers Management
// Add your Appwrite client initialization at the top if not already present
const client = new Appwrite.Client();
client
    .setEndpoint('https://cloud.appwrite.io/v1')
    .setProject('68a5ade7003695fd5dd2');
const databases = new Appwrite.Databases(client);

// Replace getCustomersFromStorage with Appwrite API
async function getCustomersFromAppwrite() {
    const databaseId = '68a5af3c0024830bff08'; // Your database ID
    const customersCollectionId = '68a5b34c0009d8b43e5f'; // Your customers collection ID

    try {
        const response = await databases.listDocuments(databaseId, customersCollectionId);
        return response.documents;
    } catch (error) {
        showNotification("Failed to load customers: " + error.message, "error");
        return [];
    }
}

// Update loadCustomersData to use the new function
async function loadCustomersData() {
    const customers = await getCustomersFromAppwrite();
    const tableBody = document.getElementById("customersTableBody");

    tableBody.innerHTML = customers
        .map(
            (customer) => `
      <tr>
          <td>#${customer.$id}</td>
          <td>${customer.name}</td>
          <td>${customer.email}</td>
          <td>${customer.phone || "N/A"}</td>
          <td>${customer.totalOrders || 0}</td>
          <td>${customer.lastOrder ? formatDate(customer.lastOrder) : "Never"}</td>
          <td>
              <button class="btn btn-secondary btn-sm" onclick="editCustomer('${customer.$id}')">Edit</button>
              <button class="btn btn-danger btn-sm" onclick="deleteCustomer('${customer.$id}')">Delete</button>
          </td>
      </tr>
  `,
        )
        .join("");
}

// Inventory Management
function loadInventoryData() {
  const inventory = getInventoryFromStorage()
  const inventoryGrid = document.getElementById("inventoryGrid") // Changed to getElementById
  inventoryGrid.innerHTML = "" // Clear existing content

  const categories = {}
  inventory.forEach((item) => {
    if (!categories[item.category]) {
      categories[item.category] = []
    }
    categories[item.category].push(item)
  })

  for (const category in categories) {
    const card = document.createElement("div")
    card.className = "inventory-card"
    card.innerHTML = `<h3>${category.charAt(0).toUpperCase() + category.slice(1)}</h3>`

    categories[category].forEach((item) => {
      const itemDiv = document.createElement("div")
      itemDiv.className = "inventory-item"
      itemDiv.innerHTML = `
              <div class="inventory-item-details">
                  ${item.image ? `<img src="${item.image}" alt="${item.name}" class="inventory-item-thumbnail" />` : ""}
                  <span>${item.name}</span>
              </div>
              <span class="quantity ${item.quantity <= item.minStock ? "low" : ""}">${item.quantity} units</span>
              <button class="btn btn-secondary btn-sm" onclick="editInventoryItem(${item.id})">Edit</button>
          `
      card.appendChild(itemDiv)
    })
    inventoryGrid.appendChild(card)
  }
}

// Modal Functions
function openBookingModal(booking = null) {
  const modal = document.getElementById("bookingModal")
  const form = document.getElementById("bookingForm")
  document.getElementById("bookingModalTitle").textContent = booking ? "Edit Booking" : "Add New Booking"
  form.reset()
  document.getElementById("bookingId").value = ""

  if (booking) {
    document.getElementById("bookingId").value = booking.id
    document.getElementById("bookingFullName").value = booking.fullName
    document.getElementById("bookingEmail").value = booking.email
    document.getElementById("bookingPhone").value = booking.phone
    document.getElementById("bookingWhatsapp").value = booking.whatsapp || ""
    document.getElementById("bookingPickupDate").value = booking.pickupDate
    document.getElementById("bookingPickupTime").value = booking.pickupTime
    document.getElementById("bookingAddress").value = booking.address
    document.getElementById("bookingAdditionalNote").value = booking.additionalNote || ""
    document.getElementById("bookingStatus").value = booking.status || "pending"
  }
  modal.classList.add("active")
}

function openOrderModal(order = null) {
  const modal = document.getElementById("orderModal")
  const form = document.getElementById("orderForm")
  document.getElementById("orderModalTitle").textContent = order ? "Edit Order" : "Create New Order"
  form.reset()
  document.getElementById("uploadedFiles").innerHTML = "" // Clear uploaded files

  if (order) {
    document.getElementById("orderId").value = order.id
    document.getElementById("orderCustomerName").value = order.customerName
    document.getElementById("orderCustomerEmail").value = order.customerEmail
    document.getElementById("orderServiceType").value = order.serviceType
    document.getElementById("orderQuantity").value = order.quantity
    document.getElementById("orderInstructions").value = order.instructions || ""
    // Re-populate uploaded files if any (assuming they are base64 strings)
    if (order.attachments && order.attachments.length > 0) {
      order.attachments.forEach((dataUrl) => {
        const fileDiv = createFileElement({ name: "uploaded_image.png" }, dataUrl) // Pass dummy file object, actual dataUrl
        document.getElementById("uploadedFiles").appendChild(fileDiv)
      })
    }
  }
  modal.classList.add("active")
}

function openCustomerModal(customer = null) {
  const modal = document.getElementById("customerModal")
  const form = document.getElementById("customerForm")
  document.getElementById("customerModalTitle").textContent = customer ? "Edit Customer" : "Add New Customer"
  form.reset()
  document.getElementById("customerId").value = ""

  if (customer) {
    document.getElementById("customerId").value = customer.id
    document.getElementById("customerName").value = customer.name
    document.getElementById("customerEmail").value = customer.email
    document.getElementById("customerPhone").value = customer.phone || ""
  }
  modal.classList.add("active")
}

function openInventoryModal(item = null) {
  const modal = document.getElementById("inventoryModal")
  const form = document.getElementById("inventoryForm")
  document.getElementById("inventoryModalTitle").textContent = item ? "Edit Inventory Item" : "Add New Item"
  form.reset()
  document.getElementById("itemUploadedFiles").innerHTML = "" // Clear uploaded files

  if (item) {
    document.getElementById("inventoryItemId").value = item.id
    document.getElementById("itemName").value = item.name
    document.getElementById("itemCategory").value = item.category
    document.getElementById("itemQuantity").value = item.quantity
    document.getElementById("itemMinStock").value = item.minStock
    // Re-populate item image if any (assuming it's a base64 string)
    if (item.image) {
      const fileDiv = createFileElement({ name: "uploaded_image.png" }, item.image) // Pass dummy file object, actual dataUrl
      document.getElementById("itemUploadedFiles").appendChild(fileDiv)
    }
  }
  modal.classList.add("active")
}

function closeModal(modalId) {
  document.getElementById(modalId).classList.remove("active")
}

// File Upload Setup
function setupFileUploads() {
  setupFileUpload("fileUploadArea", "orderImages", "uploadedFiles", true)
  setupFileUpload("itemImageUpload", "itemImage", "itemUploadedFiles", false)
}

function setupFileUpload(areaId, inputId, filesContainerId, multiple) {
  const uploadArea = document.getElementById(areaId)
  const fileInput = document.getElementById(inputId)
  const filesContainer = document.getElementById(filesContainerId)

  // Click to upload
  uploadArea.addEventListener("click", () => {
    fileInput.click()
  })

  // Drag and drop
  uploadArea.addEventListener("dragover", (e) => {
    e.preventDefault()
    uploadArea.classList.add("dragover")
  })

  uploadArea.addEventListener("dragleave", () => {
    uploadArea.classList.remove("dragover")
  })

  uploadArea.addEventListener("drop", (e) => {
    e.preventDefault()
    uploadArea.classList.remove("dragover")

    const files = Array.from(e.dataTransfer.files)
    handleFileUpload(files, filesContainer, multiple)
  })

  // File input change
  fileInput.addEventListener("change", (e) => {
    const files = Array.from(e.target.files)
    handleFileUpload(files, filesContainer, multiple)
  })
}

function handleFileUpload(files, container, multiple) {
  if (!multiple) {
    container.innerHTML = "" // Clear previous files if not multiple
  }

  files.forEach((file) => {
    if (file.type.startsWith("image/")) {
      const reader = new FileReader()
      reader.onload = (e) => {
        const dataUrl = e.target.result
        const fileElement = createFileElement(file, dataUrl)
        container.appendChild(fileElement)
      }
      reader.readAsDataURL(file)
    } else {
      showNotification(`File type not supported: ${file.name}`, "warning")
    }
  })
}

function createFileElement(file, dataUrl) {
  const fileDiv = document.createElement("div")
  fileDiv.className = "uploaded-file"
  fileDiv.setAttribute("data-file-name", file.name) // Store original file name
  fileDiv.setAttribute("data-file-src", dataUrl) // Store base64 data

  fileDiv.innerHTML = `
      <img src="${dataUrl}" alt="${file.name}" />
      <span>${file.name}</span>
      <button type="button" class="file-remove" onclick="removeFile(this)">×</button>
  `
  return fileDiv
}

function removeFile(button) {
  button.closest(".uploaded-file").remove()
}

// Form Submissions
function handleBookingSubmission(form) {
  const bookingId = document.getElementById("bookingId").value
  const isEdit = !!bookingId
  let bookings = getBookingsFromStorage()

  const bookingData = {
    id: isEdit ? Number.parseInt(bookingId) : Date.now(),
    fullName: document.getElementById("bookingFullName").value,
    email: document.getElementById("bookingEmail").value,
    phone: document.getElementById("bookingPhone").value,
    whatsapp: document.getElementById("bookingWhatsapp").value,
    pickupDate: document.getElementById("bookingPickupDate").value,
    pickupTime: document.getElementById("bookingPickupTime").value,
    address: document.getElementById("bookingAddress").value,
    additionalNote: document.getElementById("bookingAdditionalNote").value,
    status: document.getElementById("bookingStatus").value,
    timestamp: isEdit ? bookings.find((b) => b.id == bookingId).timestamp : new Date().toISOString(),
  }

  if (isEdit) {
    bookings = bookings.map((b) => (b.id == bookingId ? bookingData : b))
  } else {
    bookings.push(bookingData)
  }
  localStorage.setItem("Joacia cleaning services_bookings", JSON.stringify(bookings))

  updateCustomerData(bookingData.fullName, bookingData.email, bookingData.phone)

  loadBookingsData()
  updateDashboardStats()
  loadRecentActivity()
  closeModal("bookingModal")
  showNotification(`Booking ${isEdit ? "updated" : "created"} successfully!`, "success")
}

function handleOrderSubmission(form) {
  const orderId = document.getElementById("orderId").value
  const isEdit = !!orderId
  let orders = getOrdersFromStorage()

  const uploadedFilesElements = document.querySelectorAll("#uploadedFiles .uploaded-file")
  const attachments = Array.from(uploadedFilesElements).map((el) => el.getAttribute("data-file-src"))

  const orderData = {
    id: isEdit ? Number.parseInt(orderId) : Date.now(),
    customerName: document.getElementById("orderCustomerName").value,
    customerEmail: document.getElementById("orderCustomerEmail").value,
    serviceType: document.getElementById("orderServiceType").value,
    quantity: Number.parseInt(document.getElementById("orderQuantity").value),
    instructions: document.getElementById("orderInstructions").value,
    status: isEdit ? orders.find((o) => o.id == orderId).status : "pending", // Keep status if editing
    createdDate: isEdit ? orders.find((o) => o.id == orderId).createdDate : new Date().toISOString(),
    total: calculateOrderTotal(
      document.getElementById("orderServiceType").value,
      Number.parseInt(document.getElementById("orderQuantity").value),
    ),
    attachments: attachments,
  }

  if (isEdit) {
    orders = orders.map((o) => (o.id == orderId ? orderData : o))
  } else {
    orders.push(orderData)
  }
  localStorage.setItem("Joacia cleaning services_orders", JSON.stringify(orders))

  updateCustomerData(orderData.customerName, orderData.customerEmail)

  loadOrdersData()
  updateDashboardStats()
  loadRecentActivity()
  closeModal("orderModal")
  showNotification(`Order ${isEdit ? "updated" : "created"} successfully!`, "success")
}

function handleCustomerSubmission(form) {
  const customerId = document.getElementById("customerId").value
  const isEdit = !!customerId
  let customers = getCustomersFromStorage()

  const customerData = {
    id: isEdit ? Number.parseInt(customerId) : Date.now(),
    name: document.getElementById("customerName").value,
    email: document.getElementById("customerEmail").value,
    phone: document.getElementById("customerPhone").value,
    totalOrders: isEdit ? customers.find((c) => c.id == customerId).totalOrders : 0,
    lastOrder: isEdit ? customers.find((c) => c.id == customerId).lastOrder : null,
    createdDate: isEdit ? customers.find((c) => c.id == customerId).createdDate : new Date().toISOString(),
  }

  if (isEdit) {
    customers = customers.map((c) => (c.id == customerId ? customerData : c))
  } else {
    customers.push(customerData)
  }
  localStorage.setItem("Joacia cleaning services_customers", JSON.stringify(customers))

  loadCustomersData()
  updateDashboardStats()
  loadRecentActivity()
  closeModal("customerModal")
  showNotification(`Customer ${isEdit ? "updated" : "added"} successfully!`, "success")
}

function handleInventorySubmission(form) {
  const inventoryItemId = document.getElementById("inventoryItemId").value
  const isEdit = !!inventoryItemId
  let inventory = getInventoryFromStorage()

  const uploadedImageElement = document.querySelector("#itemUploadedFiles .uploaded-file")
  const image = uploadedImageElement ? uploadedImageElement.getAttribute("data-file-src") : null

  const inventoryData = {
    id: isEdit ? Number.parseInt(inventoryItemId) : Date.now(),
    name: document.getElementById("itemName").value,
    category: document.getElementById("itemCategory").value,
    quantity: Number.parseInt(document.getElementById("itemQuantity").value),
    minStock: Number.parseInt(document.getElementById("itemMinStock").value),
    image: image,
    createdDate: isEdit ? inventory.find((i) => i.id == inventoryItemId).createdDate : new Date().toISOString(),
  }

  if (isEdit) {
    inventory = inventory.map((i) => (i.id == inventoryItemId ? inventoryData : i))
  } else {
    inventory.push(inventoryData)
  }
  localStorage.setItem("Joacia cleaning services_inventory", JSON.stringify(inventory))

  loadInventoryData()
  closeModal("inventoryModal")
  showNotification(`Inventory item ${isEdit ? "updated" : "added"} successfully!`, "success")
}

function calculateOrderTotal(serviceType, quantity) {
  const prices = {
    "wash-fold": 2.5,
    "dry-cleaning": 8.99,
    ironing: 3.5,
  }

  return (prices[serviceType] || 0) * quantity
}

function updateCustomerData(name, email, phone = "") {
  const customers = getCustomersFromStorage()
  const customer = customers.find((c) => c.email === email)

  if (customer) {
    customer.totalOrders = (customer.totalOrders || 0) + 1
    customer.lastOrder = new Date().toISOString()
    if (phone && !customer.phone) customer.phone = phone // Update phone if missing
  } else {
    customers.push({
      id: Date.now(),
      name: name,
      email: email,
      phone: phone,
      totalOrders: 1,
      lastOrder: new Date().toISOString(),
      createdDate: new Date().toISOString(),
    })
  }

  localStorage.setItem("Joacia cleaning services_customers", JSON.stringify(customers))
  loadCustomersData()
}

// Settings Functions
function saveBusinessSettings() {
  const businessData = {
    name: document.getElementById("businessName").value,
    email: document.getElementById("contactEmail").value,
    phone: document.getElementById("phoneNumber").value,
  }

  localStorage.setItem("Joacia cleaning services_business_settings", JSON.stringify(businessData))
  showNotification("Business settings saved successfully!", "success")
}

function savePricingSettings() {
  const pricingData = {
    washFold: Number.parseFloat(document.getElementById("washFoldPrice").value),
    dryCleaning: Number.parseFloat(document.getElementById("dryCleanPrice").value),
    ironing: Number.parseFloat(document.getElementById("ironingPrice").value),
  }

  localStorage.setItem("Joacia cleaning services_pricing_settings", JSON.stringify(pricingData))
  showNotification("Pricing settings saved successfully!", "success")
}

// Data Management Functions
function getBookingsFromStorage() {
  const bookings = JSON.parse(localStorage.getItem("Joacia cleaning services_bookings") || "[]")
  if (bookings.length === 0) {
    const sampleBookings = [
      {
        id: 2001,
        fullName: "Alice Wonderland",
        email: "alice@example.com",
        phone: "(555) 111-2222",
        whatsapp: "",
        pickupDate: "2025-08-06",
        pickupTime: "10:00",
        address: "123 Rabbit Hole, Wonderland",
        additionalNote: "Please use hypoallergenic detergent.",
        status: "pending",
        timestamp: new Date(Date.now() - 3600000).toISOString(), // 1 hour ago
      },
      {
        id: 2002,
        fullName: "Bob The Builder",
        email: "bob@example.com",
        phone: "(555) 333-4444",
        whatsapp: "(555) 333-4444",
        pickupDate: "2025-08-07",
        pickupTime: "14:30",
        address: "456 Construction Site, Builderville",
        additionalNote: "Heavy duty work clothes.",
        status: "confirmed",
        timestamp: new Date(Date.now() - 7200000).toISOString(), // 2 hours ago
      },
      {
        id: 2003,
        fullName: "Charlie Chaplin",
        email: "charlie@example.com",
        phone: "(555) 555-6666",
        whatsapp: "",
        pickupDate: "2025-08-08",
        pickupTime: "09:00",
        address: "789 Silent Film Studio, Hollywood",
        additionalNote: "Handle with care, vintage items.",
        status: "picked-up",
        timestamp: new Date(Date.now() - 10800000).toISOString(), // 3 hours ago
      },
    ]
    localStorage.setItem("Joacia cleaning services_bookings", JSON.stringify(sampleBookings))
    return sampleBookings
  }
  return bookings
}

function getOrdersFromStorage() {
  const orders = JSON.parse(localStorage.getItem("Joacia cleaning services_orders") || "[]")
  // Add sample data if empty
  if (orders.length === 0) {
    const sampleOrders = [
      {
        id: 1001,
        customerName: "John Doe",
        customerEmail: "john@example.com",
        serviceType: "wash-fold",
        quantity: 5,
        total: 12.5,
        status: "in-progress",
        createdDate: new Date(Date.now() - 86400000 * 2).toISOString(), // 2 days ago
        attachments: [],
      },
      {
        id: 1002,
        customerName: "Jane Smith",
        customerEmail: "jane@example.com",
        serviceType: "dry-cleaning",
        quantity: 2,
        total: 17.98,
        status: "completed",
        createdDate: new Date(Date.now() - 86400000 * 5).toISOString(), // 5 days ago
        attachments: [],
      },
      {
        id: 1003,
        customerName: "Mike Johnson",
        customerEmail: "mike@example.com",
        serviceType: "ironing",
        quantity: 8,
        total: 28.0,
        status: "pending",
        createdDate: new Date(Date.now() - 86400000).toISOString(), // 1 day ago
        attachments: [],
      },
    ]
    localStorage.setItem("Joacia cleaning services_orders", JSON.stringify(sampleOrders))
    return sampleOrders
  }
  return orders
}

function getCustomersFromStorage() {
  const customers = JSON.parse(localStorage.getItem("Joacia cleaning services_customers") || "[]")
  // Add sample data if empty
  if (customers.length === 0) {
    const sampleCustomers = [
      {
        id: 1,
        name: "John Doe",
        email: "john@example.com",
        phone: "(555) 123-4567",
        totalOrders: 12,
        lastOrder: new Date(Date.now() - 86400000 * 2).toISOString(),
        createdDate: new Date(Date.now() - 2592000000).toISOString(),
      },
      {
        id: 2,
        name: "Jane Smith",
        email: "jane@example.com",
        phone: "(555) 987-6543",
        totalOrders: 8,
        lastOrder: new Date(Date.now() - 86400000 * 5).toISOString(),
        createdDate: new Date(Date.now() - 1728000000).toISOString(),
      },
      {
        id: 3,
        name: "Mike Johnson",
        email: "mike@example.com",
        phone: "(555) 456-7890",
        totalOrders: 15,
        lastOrder: new Date(Date.now() - 86400000).toISOString(),
        createdDate: new Date(Date.now() - 5184000000).toISOString(),
      },
    ]
    localStorage.setItem("Joacia cleaning services_customers", JSON.stringify(sampleCustomers))
    return sampleCustomers
  }
  return customers
}

function getInventoryFromStorage() {
  const inventory = JSON.parse(localStorage.getItem("Joacia cleaning services_inventory") || "[]")
  if (inventory.length === 0) {
    const sampleInventory = [
      {
        id: 1,
        name: "Premium Detergent",
        category: "detergents",
        quantity: 45,
        minStock: 10,
        createdDate: new Date().toISOString(),
        image: "/istockphoto-1639553609-612x612", // Placeholder image
      },
      {
        id: 2,
        name: "Eco-Friendly Detergent",
        category: "detergents",
        quantity: 12,
        minStock: 15,
        createdDate: new Date().toISOString(),
        image: "/placeholder-e8igh.png", // Placeholder image
      },
      {
        id: 3,
        name: "Spring Fresh",
        category: "softeners",
        quantity: 28,
        minStock: 5,
        createdDate: new Date().toISOString(),
        image: "/fabric-softener.png", // Placeholder image
      },
      {
        id: 4,
        name: "Lavender Scent",
        category: "softeners",
        quantity: 33,
        minStock: 5,
        createdDate: new Date().toISOString(),
        image: "/lavender-softener.png", // Placeholder image
      },
      {
        id: 5,
        name: "Laundry Bags",
        category: "supplies",
        quantity: 156,
        minStock: 50,
        createdDate: new Date().toISOString(),
        image: "/woven-laundry-bag.png", // Placeholder image
      },
      {
        id: 6,
        name: "Hangers",
        category: "supplies",
        quantity: 8,
        minStock: 20,
        createdDate: new Date().toISOString(),
        image: "/various-hangers.png", // Placeholder image
      },
    ]
    localStorage.setItem("Joacia cleaning services_inventory", JSON.stringify(sampleInventory))
    return sampleInventory
  }
  return inventory
}

// Edit Functions
function editBooking(id) {
  const bookings = getBookingsFromStorage()
  const booking = bookings.find((b) => b.id == id)
  if (booking) {
    openBookingModal(booking)
  }
}

function editOrder(id) {
  const orders = getOrdersFromStorage()
  const order = orders.find((o) => o.id == id)
  if (order) {
    openOrderModal(order)
  }
}

function editCustomer(id) {
  const customers = getCustomersFromStorage()
  const customer = customers.find((c) => c.id == id)
  if (customer) {
    openCustomerModal(customer)
  }
}

function editInventoryItem(id) {
  const inventory = getInventoryFromStorage()
  const item = inventory.find((i) => i.id == id)
  if (item) {
    openInventoryModal(item)
  }
}

// Delete Functions
function deleteBooking(id) {
  if (confirm("Are you sure you want to delete this booking?")) {
    let bookings = getBookingsFromStorage()
    bookings = bookings.filter((b) => b.id != id)
    localStorage.setItem("Joacia cleaning services_bookings", JSON.stringify(bookings))
    loadBookingsData()
    updateDashboardStats()
    loadRecentActivity()
    showNotification("Booking deleted successfully!", "success")
  }
}

function deleteOrder(id) {
  if (confirm("Are you sure you want to delete this order?")) {
    let orders = getOrdersFromStorage()
    orders = orders.filter((o) => o.id != id)
    localStorage.setItem("Joacia cleaning services_orders", JSON.stringify(orders))
    loadOrdersData()
    updateDashboardStats()
    loadRecentActivity()
    showNotification("Order deleted successfully!", "success")
  }
}

function deleteCustomer(id) {
  if (confirm("Are you sure you want to delete this customer?")) {
    let customers = getCustomersFromStorage()
    customers = customers.filter((c) => c.id != id)
    localStorage.setItem("Joacia cleaning services_customers", JSON.stringify(customers))
    loadCustomersData()
    updateDashboardStats()
    loadRecentActivity()
    showNotification("Customer deleted successfully!", "success")
  }
}

// Utility Functions
function isToday(dateString) {
  const today = new Date()
  const date = new Date(dateString)
  return date.toDateString() === today.toDateString()
}

function formatDate(dateString) {
  const date = new Date(dateString)
  return date.toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  })
}

function timeAgo(dateString) {
  const seconds = Math.floor((new Date().getTime() - new Date(dateString).getTime()) / 1000)
  let interval = seconds / 31536000
  if (interval > 1) return Math.floor(interval) + " years ago"
  interval = seconds / 2592000
  if (interval > 1) return Math.floor(interval) + " months ago"
  interval = seconds / 86400
  if (interval > 1) return Math.floor(interval) + " days ago"
  interval = seconds / 3600
  if (interval > 1) return Math.floor(interval) + " hours ago"
  interval = seconds / 60
  if (interval > 1) return Math.floor(interval) + " minutes ago"
  return Math.floor(seconds) + " seconds ago"
}

function performGlobalSearch(query) {
  const lowerCaseQuery = query.toLowerCase()

  // Filter Bookings Table
  const bookingsTableBody = document.getElementById("bookingsTableBody")
  if (bookingsTableBody) {
    Array.from(bookingsTableBody.children).forEach((row) => {
      const textContent = row.textContent.toLowerCase()
      row.style.display = textContent.includes(lowerCaseQuery) ? "" : "none"
    })
  }

  // Filter Orders Table
  const ordersTableBody = document.getElementById("ordersTableBody")
  if (ordersTableBody) {
    Array.from(ordersTableBody.children).forEach((row) => {
      const textContent = row.textContent.toLowerCase()
      row.style.display = textContent.includes(lowerCaseQuery) ? "" : "none"
    })
  }

  // Filter Customers Table
  const customersTableBody = document.getElementById("customersTableBody")
  if (customersTableBody) {
    Array.from(customersTableBody.children).forEach((row) => {
      const textContent = row.textContent.toLowerCase()
      row.style.display = textContent.includes(lowerCaseQuery) ? "" : "none"
    })
  }
}

function showNotification(message, type = "info") {
  // Remove existing notifications to prevent stacking
  document.querySelectorAll(".notification").forEach((n) => n.remove())

  const notification = document.createElement("div")
  notification.className = `notification ${type}`
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
    `

  const colors = {
    success: "#10b981",
    error: "#ef4444",
    warning: "#f59e0b",
    info: "#2563eb",
  }

  notification.style.background = colors[type] || colors.info
  notification.textContent = message

  document.body.appendChild(notification)

  setTimeout(() => {
    notification.style.opacity = "1"
    notification.style.transform = "translateX(0)"
  }, 100)

  setTimeout(() => {
    notification.style.opacity = "0"
    notification.style.transform = "translateX(100%)"
    setTimeout(() => {
      document.body.removeChild(notification)
    }, 300)
  }, 3000)
}

function logout() {
  if (confirm("Are you sure you want to logout?")) {
    // In a real application, you would clear authentication tokens here
    showNotification("Logged out successfully!", "success")
    setTimeout(() => {
      window.location.href = "index.html" // Redirect to main page or login
    }, 1000)
  }
}

// Auto-refresh dashboard data every 30 seconds
setInterval(() => {
  updateDashboardStats()
  loadRecentActivity()
}, 30000)

// Handle window resize
window.addEventListener("resize", () => {
  if (window.innerWidth > 1024) {
    document.querySelector(".sidebar").classList.remove("active")
    document.querySelector(".main-content").classList.remove("sidebar-active")
  }
})
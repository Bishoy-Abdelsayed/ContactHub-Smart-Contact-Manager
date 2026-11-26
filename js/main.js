// 1. VARIABLES
var contactList = [];
var activeEditId = null;
var selectedAvatarData = "";
var photoReadVersion = 0;

// 2. REGULAR EXPRESSIONS
var NAME_RE = /^[a-zA-Z\u0600-\u06FF\s]{2,50}$/;
var PHONE_RE = /^(\+20|0020|20)?0?1[0125][0-9]{8}$/;
var EMAIL_RE = /^[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}$/;

// 3. CONTACT GROUPS
var GROUPS = {
  family: true,
  friends: true,
  work: true,
  school: true,
  other: true,
};

// 4. HTML ELEMENTS
var openContactFormButton = document.getElementById("openContactFormButton");
var closeContactEditorButton = document.getElementById("closeContactEditorButton");
var cancelContactEditorButton = document.getElementById("cancelContactEditorButton");
var contactEditorBackdrop = document.getElementById("contactEditorBackdrop");

var contactEditorForm = document.getElementById("contactEditorForm");
var contactPhotoInput = document.getElementById("contactPhotoInput");
var contactSearchInput = document.getElementById("contactSearchInput");

var contactFullName = document.getElementById("contactFullName");
var contactPhoneNumber = document.getElementById("contactPhoneNumber");
var contactEmailAddress = document.getElementById("contactEmailAddress");
var contactStreetAddress = document.getElementById("contactStreetAddress");
var contactNotesField = document.getElementById("contactNotesField");

var contactCategory = document.getElementById("contactCategory");
var markAsFavorite = document.getElementById("markAsFavorite");
var markAsEmergency = document.getElementById("markAsEmergency");

var contactPhotoPreview = document.getElementById("contactPhotoPreview");

var contactEditorTitle = document.getElementById("contactEditorTitle");
var contactEditorDialog = document.getElementById("contactEditorDialog");

var contactsGrid = document.getElementById("contactsGrid");
var contactsGridRow = document.querySelector("#contactsGrid .row");

var dashboardStatsRow = document.querySelector("#dashboardStats .row");

var contactsSubtitle = document.querySelector("#contactsHeading .section-subtitle");

var favoriteContactsPanel = document.querySelector("#favoriteContactsPanel .sidebar-panel__body");
var favoriteContactsPanelMobile = document.querySelector("#favoriteContactsPanelMobile .sidebar-panel__body");

var emergencyContactsPanel = document.querySelector("#emergencyContactsPanel .sidebar-panel__body");
var emergencyContactsPanelMobile = document.querySelector("#emergencyContactsPanelMobile .sidebar-panel__body");

// Find contact using its ID
function findContactById(id) {
  var i;

  for (i = 0; i < contactList.length; i++) {
    if (contactList[i].id === id) {
      return contactList[i];
    }
  }

  return null;
}

// Get first letters from contact name
function getInitials(name) {
  var parts;

  if (!name) {
    return "?";
  }

  parts = name.replace(/^\s+|\s+$/g, "").split(/\s+/);

  if (parts.length >= 2) {
    return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
  }

  return parts[0].charAt(0).toUpperCase();
}

// Get all contacts from local storage
function loadContacts() {
  var savedContacts;

  savedContacts = localStorage.getItem("contacts");

  if (savedContacts) {
    contactList = JSON.parse(savedContacts);

    if (!Array.isArray(contactList)) {
      contactList = [];
    }
  } else {
    contactList = [];
  }
}

// Save contacts in local storage
function saveContacts() {
  localStorage.setItem("contacts", JSON.stringify(contactList));
}

// Create contact image or initials
function createAvatar(contact, size) {
  var sizeClass;

  if (size === "lg") {
    sizeClass = "contact-avatar--large";
  } else if (size === "sm") {
    sizeClass = "contact-avatar--small";
  } else {
    sizeClass = "contact-avatar--extra-small";
  }

  if (contact.avatar) {
    return `<img src="${contact.avatar}" alt="${contact.name}" class="contact-avatar ${sizeClass}">`;
  }

  return `<div class="contact-avatar ${sizeClass} contact-avatar--color-${contact.name.length % 8}">${getInitials(contact.name)}</div>`;
}

// Update the contact photo preview
function updatePhotoPreview(contact) {
  if (contact && contact.avatar) {
    contactPhotoPreview.innerHTML = `<img src="${contact.avatar}" alt="Avatar">`;
  } else if (contact && contact.name) {
    contactPhotoPreview.textContent = getInitials(contact.name);
  } else {
    contactPhotoPreview.innerHTML = '<i class="fa-solid fa-user"></i>';
  }
}

// Create one contact card
function createContactCard(contact) {
  var favorite;
  var emergency;
  var groupName;
  var html;

  favorite = contact.isFavorite;
  emergency = contact.isEmergency;

  groupName = contact.group ? contact.group.toLowerCase().replace(/^\s+|\s+$/g, "") : "";

  html = `
    <div class="col">
      <div class="contact-card">
        <div class="contact-card__body">
          <div class="d-flex align-items-start gap-3">
            <div class="position-relative flex-shrink-0">
              ${createAvatar(contact, "lg")}
  `;

  if (emergency) {
    html += `
      <div class="contact-status-dot contact-status-dot--emergency">
        <i class="fa-solid fa-heart-pulse"></i>
      </div>
    `;
  }

  if (favorite) {
    html += `
      <div class="contact-status-dot contact-status-dot--favorite">
        <i class="fa-solid fa-star"></i>
      </div>
    `;
  }

  html += `
            </div>
            <div class="flex-fill min-width-zero pt-1">
              <h3>${contact.name}</h3>
              <div class="d-flex align-items-center gap-2 mt-1">
                <div class="contact-detail-icon contact-detail-icon--small contact-detail-icon--phone">
                  <i class="fa-solid fa-phone"></i>
                </div>
                <span class="contact-detail-text contact-detail-text--muted">${contact.phone}</span>
              </div>
            </div>
          </div>
          <div class="mt-3 d-flex flex-column gap-2">
  `;

  if (contact.email) {
    html += `
      <div class="d-flex align-items-center gap-2">
        <div class="contact-detail-icon contact-detail-icon--medium contact-detail-icon--email">
          <i class="fa-solid fa-envelope"></i>
        </div>
        <span class="contact-detail-text contact-detail-text--dark">${contact.email}</span>
      </div>
    `;
  }

  if (contact.address) {
    html += `
      <div class="d-flex align-items-center gap-2">
        <div class="contact-detail-icon contact-detail-icon--medium contact-detail-icon--address">
          <i class="fa-solid fa-location-dot"></i>
        </div>
        <span class="contact-detail-text contact-detail-text--dark">${contact.address}</span>
      </div>
    `;
  }

  html += `</div>`;

  if (contact.group || emergency) {
    html += `<div class="d-flex flex-wrap gap-1 mt-3">`;

    if (contact.group) {
      if (!GROUPS[groupName]) {
        groupName = "other";
      }

      html += `
        <span class="contact-badge contact-badge--capitalize contact-badge--group-${groupName}">
          ${contact.group}
        </span>
      `;
    }

    if (emergency) {
      html += `
        <span class="contact-badge contact-badge--emergency">
          <i class="fa-solid fa-heart-pulse"></i>Emergency
        </span>
      `;
    }

    html += `</div>`;
  }

  html += `
        </div>
        <div class="contact-card__footer">
          <div class="d-flex align-items-center gap-1">
            <a href="tel:${contact.phone}" class="contact-action contact-action--call" title="Call">
              <i class="fa-solid fa-phone"></i>
            </a>
  `;

  if (contact.email) {
    html += `
      <button class="contact-action contact-action--email" title="Email"
        data-act="email" data-id="${contact.id}">
        <i class="fa-solid fa-envelope"></i>
      </button>
    `;
  }

  html += `
          </div>
          <div class="d-flex align-items-center gap-1">
            <button class="contact-action contact-action--favorite ${favorite ? "on" : ""}"
              title="Favorite" data-act="fav" data-id="${contact.id}">
              <i class="${favorite ? "fa-solid" : "fa-regular"} fa-star"></i>
            </button>

            <button class="contact-action contact-action--emergency ${emergency ? "on" : ""}"
              title="Emergency" data-act="em" data-id="${contact.id}">
              <i class="${emergency ? "fa-solid fa-heart-pulse" : "fa-regular fa-heart"}"></i>
            </button>

            <button class="contact-action contact-action--edit"
              title="Edit" data-act="edit" data-id="${contact.id}">
              <i class="fa-solid fa-pen"></i>
            </button>

            <button class="contact-action contact-action--delete"
              title="Delete" data-act="del" data-id="${contact.id}">
              <i class="fa-solid fa-trash"></i>
            </button>
          </div>
        </div>
      </div>
    </div>
  `;

  return html;
}

// Display all contact cards
function renderContactCards(contacts) {
  var html;
  var i;

  html = "";

  if (contacts.length === 0) {
    contactsGridRow.innerHTML = `
      <div class="contacts-empty-state">
        <div class="contacts-empty-state__icon">
          <i class="fa-solid fa-address-book"></i>
        </div>
        <p>No contacts found</p>
        <p>Click "Add Contact" to get started</p>
      </div>
    `;

    return;
  }

  for (i = 0; i < contacts.length; i++) {
    html += createContactCard(contacts[i]);
  }

  contactsGridRow.innerHTML = html;
}

// Display favorites and emergency contacts
function renderContactPanel(desktopPanel, mobilePanel, contacts, type, emptyMessage) {
  var emptyHTML;
  var desktopHTML;
  var mobileHTML;
  var i;
  var contact;

  emptyHTML = `<div class="sidebar-empty">${emptyMessage}</div>`;
  desktopHTML = "";
  mobileHTML = "";

  if (contacts.length === 0) {
    desktopPanel.innerHTML = emptyHTML;
    mobilePanel.innerHTML = emptyHTML;
    return;
  }

  for (i = 0; i < contacts.length; i++) {
    contact = contacts[i];

    desktopHTML += `
      <div class="sidebar-contact ${type}">
        <div class="flex-shrink-0">
          ${createAvatar(contact, "sm")}
        </div>
        <div class="flex-fill min-width-zero">
          <h4>${contact.name}</h4>
          <p>${contact.phone}</p>
        </div>
        <a href="tel:${contact.phone}" class="call">
          <i class="fa-solid fa-phone"></i>
        </a>
      </div>
    `;

    mobileHTML += `
      <a href="tel:${contact.phone}" class="sidebar-contact--mobile ${type}">
        <div class="flex-shrink-0">
          ${createAvatar(contact, "xs")}
        </div>
        <div class="min-width-zero flex-fill">
          <h4>${contact.name}</h4>
          <p>${contact.phone}</p>
        </div>
        <div class="c">
          <i class="fa-solid fa-phone"></i>
        </div>
      </a>
    `;
  }

  desktopPanel.innerHTML = desktopHTML;
  mobilePanel.innerHTML = mobileHTML;
}

// Create dashboard stat card
function createStatCard(className, iconName, label, number) {
  return `
    <div class="col">
      <div class="stat-card">
        <div class="d-flex align-items-center gap-3 gap-sm-4">
          <div class="stat-card__icon ${className}">
            <i class="fa-solid ${iconName}"></i>
          </div>
          <div>
            <p class="stat-card__label">${label}</p>
            <p class="stat-card__value">${number}</p>
          </div>
        </div>
      </div>
    </div>
  `;
}

// Update dashboard numbers
function renderDashboardStats() {
  var favoriteCount;
  var emergencyCount;
  var i;
  var html;

  favoriteCount = 0;
  emergencyCount = 0;

  for (i = 0; i < contactList.length; i++) {
    if (contactList[i].isFavorite) {
      favoriteCount++;
    }

    if (contactList[i].isEmergency) {
      emergencyCount++;
    }
  }

  html = createStatCard("stat-card__icon--blue", "fa-users", "Total", contactList.length);

  html += createStatCard("stat-card__icon--amber", "fa-star", "Favorites", favoriteCount);

  html += createStatCard("stat-card__icon--rose", "fa-heart-pulse", "Emergency", emergencyCount);

  dashboardStatsRow.innerHTML = html;

  contactsSubtitle.textContent = `Manage and organize your ${contactList.length} contacts`;
}

// Get contacts marked as favorite or emergency
function getContactsByType(type) {
  var result;
  var i;

  result = [];

  for (i = 0; i < contactList.length; i++) {
    if (contactList[i][type]) {
      result.push(contactList[i]);
    }
  }

  return result;
}

// Search contacts by name, phone or email
function getFilteredContacts() {
  var searchText;
  var lowerSearchText;
  var result;
  var i;
  var contact;

  searchText = contactSearchInput.value.replace(/^\s+|\s+$/g, "");
  lowerSearchText = searchText.toLowerCase();
  result = [];

  if (searchText === "") {
    return contactList;
  }

  for (i = 0; i < contactList.length; i++) {
    contact = contactList[i];

    if (
      contact.name.toLowerCase().indexOf(lowerSearchText) !== -1 ||
      contact.phone.indexOf(searchText) !== -1 ||
      (contact.email || "").toLowerCase().indexOf(lowerSearchText) !== -1
    ) {
      result.push(contact);
    }
  }

  return result;
}

// Display all parts of the contacts page
function renderContactsView() {
  renderContactCards(getFilteredContacts());

  renderContactPanel(
    favoriteContactsPanel,
    favoriteContactsPanelMobile,
    getContactsByType("isFavorite"),
    "fav",
    "No favorites yet",
  );

  renderContactPanel(
    emergencyContactsPanel,
    emergencyContactsPanelMobile,
    getContactsByType("isEmergency"),
    "em",
    "No emergency contacts",
  );

  renderDashboardStats();
}

// Clear validation messages
function clearValidationErrors() {
  var fieldIds;
  var i;
  var field;

  fieldIds = ["contactFullName", "contactPhoneNumber", "contactEmailAddress"];

  for (i = 0; i < fieldIds.length; i++) {
    field = document.getElementById(fieldIds[i]);

    field.classList.remove("bad");

    document.getElementById(`${fieldIds[i]}Error`).classList.add("d-none");
  }
}

// Clear form and reset editing mode
function resetContactForm() {
  photoReadVersion++;

  contactEditorForm.reset();
  contactPhotoInput.value = "";

  selectedAvatarData = "";
  activeEditId = null;

  updatePhotoPreview(null);
  clearValidationErrors();
}

// Open dialog to add a new contact
function openNewContactDialog() {
  resetContactForm();

  contactEditorTitle.textContent = "Add New Contact";
  contactEditorDialog.classList.remove("d-none");
}

// Fill form with selected contact data
function openContactForEditing(id) {
  var contact;

  contact = findContactById(id);

  if (!contact) {
    return;
  }

  resetContactForm();

  activeEditId = id;

  contactEditorTitle.textContent = "Edit Contact";

  contactFullName.value = contact.name;
  contactPhoneNumber.value = contact.phone;
  contactEmailAddress.value = contact.email || "";
  contactStreetAddress.value = contact.address || "";
  contactNotesField.value = contact.notes || "";
  contactCategory.value = contact.group || "";

  markAsFavorite.checked = contact.isFavorite;
  markAsEmergency.checked = contact.isEmergency;

  selectedAvatarData = contact.avatar || "";

  updatePhotoPreview(contact);

  contactEditorDialog.classList.remove("d-none");
}

// Close contact dialog
function closeContactDialog() {
  contactEditorDialog.classList.add("d-none");

  resetContactForm();
}

// Read selected photo
function handlePhotoSelection(event) {
  var file;
  var token;
  var reader;

  file = event.target.files[0];

  token = photoReadVersion + 1;
  photoReadVersion = token;

  if (!file) {
    return;
  }

  reader = new FileReader();

  reader.onload = function () {
    if (token !== photoReadVersion) {
      return;
    }

    selectedAvatarData = reader.result;
    contactPhotoPreview.innerHTML = `<img src="${selectedAvatarData}" alt="Avatar">`;
  };

  reader.readAsDataURL(file);
}

// Show validation error
function showValidationError(title, message, field) {
  Swal.fire({
    icon: "error",
    title: title,
    text: message,
  });

  field.focus();
}

// Validate fields while user is typing
function validateFieldWhileTyping(id, regularExpression) {
  var input;
  var errorMessage;
  var value;
  var isValid;

  input = document.getElementById(id);
  errorMessage = document.getElementById(`${id}Error`);

  value = input.value.replace(/^\s+|\s+$/g, "");

  isValid = value === "" || regularExpression.test(value);

  if (isValid) {
    errorMessage.classList.add("d-none");
    input.classList.remove("bad");
  } else {
    errorMessage.classList.remove("d-none");
    input.classList.add("bad");
  }
}

// Save new contact or update existing contact
function handleContactFormSubmit(event) {
  var name;
  var phone;
  var email;
  var data;
  var duplicate;
  var i;
  var currentContact;
  var messageTitle;
  var messageText;

  event.preventDefault();

  name = contactFullName.value.replace(/^\s+|\s+$/g, "");
  phone = contactPhoneNumber.value.replace(/^\s+|\s+$/g, "");
  email = contactEmailAddress.value.replace(/^\s+|\s+$/g, "");

  data = {
    name: name,
    phone: phone,
    email: email,
    address: contactStreetAddress.value.replace(/^\s+|\s+$/g, ""),
    notes: contactNotesField.value.replace(/^\s+|\s+$/g, ""),
    group: contactCategory.value,
    avatar: selectedAvatarData,
    isFavorite: markAsFavorite.checked,
    isEmergency: markAsEmergency.checked,
  };

  if (name === "") {
    showValidationError("Missing Name", "Please enter a name for the contact!", contactFullName);
    return;
  }

  if (!NAME_RE.test(name)) {
    showValidationError(
      "Invalid Name",
      "Name should contain only letters and spaces (2-50 characters)",
      contactFullName,
    );
    return;
  }

  if (phone === "") {
    showValidationError("Missing Phone", "Please enter a phone number!", contactPhoneNumber);
    return;
  }

  if (!PHONE_RE.test(phone)) {
    showValidationError(
      "Invalid Phone",
      "Please enter a valid Egyptian phone number (e.g., 01012345678 or +201012345678)",
      contactPhoneNumber,
    );
    return;
  }

  if (email !== "" && !EMAIL_RE.test(email)) {
    showValidationError("Invalid Email", "Please enter a valid email address", contactEmailAddress);
    return;
  }

  duplicate = null;

  for (i = 0; i < contactList.length; i++) {
    currentContact = contactList[i];

    if (currentContact.id !== activeEditId) {
      if (currentContact.phone === phone) {
        duplicate = currentContact;
        break;
      }
    }
  }

  if (duplicate) {
    showValidationError(
      "Duplicate Phone Number",
      `A contact with this phone number already exists: ${duplicate.name}`,
      contactPhoneNumber,
    );
    return;
  }

  // UPDATE
  if (activeEditId !== null) {
    currentContact = findContactById(activeEditId);

    if (currentContact) {
      currentContact.name = data.name;
      currentContact.phone = data.phone;
      currentContact.email = data.email;
      currentContact.address = data.address;
      currentContact.notes = data.notes;
      currentContact.group = data.group;
      currentContact.avatar = data.avatar;
      currentContact.isFavorite = data.isFavorite;
      currentContact.isEmergency = data.isEmergency;
    }

    messageTitle = "Updated!";
    messageText = "Contact has been updated successfully.";

    // CREATE
  } else {
    data.id = `contact_${new Date().getTime()}_${Math.floor(Math.random() * 1000)}`;

    data.createdAt = new Date().toISOString();

    contactList.push(data);

    messageTitle = "Added!";
    messageText = "Contact has been added successfully.";
  }

  saveContacts();

  Swal.fire({
    icon: "success",
    title: messageTitle,
    text: messageText,
    timer: 1500,
    showConfirmButton: false,
  });

  closeContactDialog();
  renderContactsView();
}

// ==========================================
// 16. DELETE & CONTACT ACTIONS
// ==========================================

// Handle buttons inside contact cards
function handleContactAction(event) {
  var button;
  var id;
  var contact;
  var action;

  button = event.target;

  while (button && button !== contactsGrid && !button.getAttribute("data-act")) {
    button = button.parentNode;
  }

  if (!button || button === contactsGrid) {
    return;
  }

  id = button.getAttribute("data-id");
  action = button.getAttribute("data-act");

  contact = findContactById(id);

  if (!contact) {
    return;
  }

  // FAVORITE OR EMERGENCY
  if (action === "fav" || action === "em") {
    var property = action === "fav" ? "isFavorite" : "isEmergency";

    contact[property] = !contact[property];

    saveContacts();
    renderContactsView();

    // EDIT
  } else if (action === "edit") {
    openContactForEditing(id);

    // EMAIL
  } else if (action === "email") {
    window.location.href = `mailto:${contact.email}`;

    // DELETE
  } else if (action === "del") {
    Swal.fire({
      title: "Delete Contact?",
      text: `Are you sure you want to delete ${contact.name}? This action cannot be undone.`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#dc2626",
      cancelButtonColor: "#6b7280",
      confirmButtonText: "Yes, delete it!",
      cancelButtonText: "Cancel",
    }).then(function (result) {
      var i;
      var updatedContacts;

      if (!result.isConfirmed) {
        return;
      }

      updatedContacts = [];

      for (i = 0; i < contactList.length; i++) {
        if (contactList[i].id !== id) {
          updatedContacts.push(contactList[i]);
        }
      }

      contactList = updatedContacts;

      saveContacts();
      renderContactsView();

      Swal.fire({
        icon: "success",
        title: "Deleted!",
        text: "Contact has been deleted.",
        timer: 1500,
        showConfirmButton: false,
      });
    });
  }
}

// Open Add Contact dialog
openContactFormButton.addEventListener("click", openNewContactDialog);

// Close dialog
closeContactEditorButton.addEventListener("click", closeContactDialog);
cancelContactEditorButton.addEventListener("click", closeContactDialog);
contactEditorBackdrop.addEventListener("click", closeContactDialog);

// Submit form
contactEditorForm.addEventListener("submit", handleContactFormSubmit);

// Select photo
contactPhotoInput.addEventListener("change", handlePhotoSelection);

// Search contacts
contactSearchInput.addEventListener("input", function () {
  renderContactCards(getFilteredContacts());
});

// Validate name while typing
contactFullName.addEventListener("input", function () {
  validateFieldWhileTyping("contactFullName", NAME_RE);
});

// Validate phone while typing
contactPhoneNumber.addEventListener("input", function () {
  validateFieldWhileTyping("contactPhoneNumber", PHONE_RE);
});

// Validate email while typing
contactEmailAddress.addEventListener("input", function () {
  validateFieldWhileTyping("contactEmailAddress", EMAIL_RE);
});

// Contact card actions
contactsGrid.addEventListener("click", handleContactAction);

loadContacts();
renderContactsView();

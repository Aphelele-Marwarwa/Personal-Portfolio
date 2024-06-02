'use strict';

// Function to open the modal and show the clicked image
function openModal(imgSrc, altText) {
  const modal = document.getElementById('myModal');
  const modalImg = document.getElementById('img01');
  const captionText = document.getElementById('caption');
  modal.style.display = 'block';
  modalImg.src = imgSrc;
  captionText.innerHTML = altText;

  // Hide the navbar
  const navbar = document.querySelector('.navbar');
  navbar.style.display = 'none';

  // Get the <span> element that closes the modal
  const span = document.getElementsByClassName('close')[0];

  // When the user clicks on <span> (x), close the modal
  span.onclick = function() {
    modal.style.display = 'none';

    // Show the navbar
    navbar.style.display = 'block';
  };
}

// Add event listeners to each image to open the modal when clicked
const imageLinks = document.querySelectorAll('.hobbies-banner-box img');
imageLinks.forEach(link => {
  link.addEventListener('click', function (event) {
    event.preventDefault(); // Prevent the default behavior of the link
    openModal(this.src, this.alt);
  });
});


// Functionality for showing and hiding the sidebar on mobile
const sidebarBtn = document.querySelector("[data-sidebar-btn]");
const sidebar = document.querySelector("[data-sidebar]");
sidebarBtn.addEventListener("click", function () {
  sidebar.classList.toggle("active");
});

// Custom select functionality
const select = document.querySelector("[data-select]");
const selectItems = document.querySelectorAll("[data-select-item]");
const selectValue = document.querySelector("[data-select-value]");

select.addEventListener("click", function () {
  select.classList.toggle("active");
});

// Add event listener to each select item
selectItems.forEach(item => {
  item.addEventListener("click", function () {
    const selectedValue = this.innerText.toLowerCase();
    selectValue.innerText = this.innerText;
    select.classList.remove("active");
    filterFunc(selectedValue);
  });
});

// Filter functionality
const filterItems = document.querySelectorAll("[data-filter-item]");
const filterBtn = document.querySelectorAll("[data-filter-btn]");

function filterFunc(selectedValue) {
  filterItems.forEach(item => {
    if (selectedValue === "all" || selectedValue === item.dataset.category) {
      item.classList.add("active");
    } else {
      item.classList.remove("active");
    }
  });
}

// Add event listener to each filter button
filterBtn.forEach(btn => {
  btn.addEventListener("click", function () {
    const selectedValue = this.innerText.toLowerCase();
    selectValue.innerText = this.innerText;
    filterFunc(selectedValue);
  });
});

// Contact form functionality
const form = document.querySelector("[data-form]");
const formBtn = document.querySelector("[data-form-btn]");
const formInputs = document.querySelectorAll("[data-form-input]");

// Enable/disable form button based on form validation
formInputs.forEach(input => {
  input.addEventListener("input", function () {
    if (form.checkValidity()) {
      formBtn.removeAttribute("disabled");
    } else {
      formBtn.setAttribute("disabled", "");
    }
  });
});

// Form submission event
form.addEventListener('submit', function (event) {
  event.preventDefault();
  // Perform form submission action here
  form.reset();
});

// Page navigation functionality
const navigationLinks = document.querySelectorAll("[data-nav-link]");
const pages = document.querySelectorAll("[data-page]");

function showPage(pageName) {
  pages.forEach(page => {
    if (page.dataset.page === pageName) {
      page.classList.add("active");
    } else {
      page.classList.remove("active");
    }
  });
}

navigationLinks.forEach(navLink => {
  navLink.addEventListener("click", function () {
    const pageName = this.innerText.toLowerCase();
    showPage(pageName);

    navigationLinks.forEach(link => {
      link.classList.remove("active");
    });
    this.classList.add("active");
    window.scrollTo(0, 0);
  });
});

// Show the first page (About) by default
document.addEventListener("DOMContentLoaded", function () {
  showPage("about");
  navigationLinks[0].classList.add("active");
});



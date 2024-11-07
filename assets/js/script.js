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

    // Update active class on select items
    selectItems.forEach(item => item.classList.remove("active"));
    this.classList.add("active");
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

    // Update active class on buttons
    filterBtn.forEach(button => button.classList.remove("active"));
    this.classList.add("active");
  });
});

const form = document.getElementById('contactForm');
const inputs = form.querySelectorAll('[data-form-input]');
const submitButton = form.querySelector('[data-form-btn]');
const formMessage = document.getElementById('formMessage');

// Enable the submit button when all inputs are filled
inputs.forEach(input => {
  input.addEventListener('input', () => {
    submitButton.disabled = ![...inputs].every(input => input.value);
  });
});

// Form submission event
form.addEventListener('submit', async function (event) {
  event.preventDefault();
  
  // Optional: show loading state
  submitButton.disabled = true;
  formMessage.textContent = "Sending message...";
  formMessage.style.color = "blue";

  try {
    const response = await fetch(form.action, {
      method: 'POST',
      body: new FormData(form),
      headers: { 
        'Accept': 'application/json',
        'Content-Type': 'application/x-www-form-urlencoded'
      }
    });

    if (response.ok) {
      formMessage.textContent = "Thank you! Your message has been sent.";
      formMessage.style.color = "green";
      form.reset();
    } else {
      const errorData = await response.json();
      formMessage.textContent = `Oops! Error: ${errorData.error || "Unknown error occurred"}`;
      formMessage.style.color = "red";
    }
  } catch (error) {
    formMessage.textContent = "Oops! There was a problem sending your message. Check console for more details.";
    console.error("Submission Error:", error);
    formMessage.style.color = "red";
  } finally {
    submitButton.disabled = true; // Keep it disabled until new input
  }
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

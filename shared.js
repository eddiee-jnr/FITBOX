/**
 * FitBox Storefront Shared Logic
 * Handles: Authentication UI, Cart Synchroniation, and Navigation Guard
 */

const API_BASE = "http://localhost:3000/api";

document.addEventListener("DOMContentLoaded", () => {
    updateHeaderAuth();
    updateCartBadge();
    checkProfileGuard();
    highlightActiveLink();
});

/**
 * Highlights the active link in the navigation bar
 */
function highlightActiveLink() {
    const links = document.querySelectorAll(".nav-left a");
    const currentPath = window.location.pathname.split("/").pop() || "index.html";
    
    links.forEach(link => {
        const href = link.getAttribute("href");
        if (href === currentPath) {
            link.classList.add("active");
        }
    });
}

/**
 * Updates the Navigation Header based on login status
 */
function updateHeaderAuth() {
  const accountLink = document.getElementById("accountLink");
  const accountText = document.getElementById("accountText");
  if (!accountLink) return;

  const isLoggedIn = localStorage.getItem("customer_loggedIn") === "true";
  
  if (isLoggedIn) {
    accountLink.href = "profile.html";
    if (accountText) accountText.textContent = "MY ACCOUNT";
  } else {
    accountLink.href = "auth.html";
    if (accountText) accountText.textContent = "LOG IN";
  }
}

/**
 * Ensures the cart badge is up to date on all pages
 */
function updateCartBadge() {
    const cart = JSON.parse(localStorage.getItem('cart')) || [];
    const totalQty = cart.reduce((sum, item) => sum + item.qty, 0);
    const badge = document.getElementById('cartCount');

    if (badge) {
        if (totalQty > 0) {
            badge.style.display = 'block';
            badge.textContent = totalQty;
        } else {
            badge.style.display = 'none';
        }
    }
}

/**
 * Prevents Guest users from accessing the profile page
 */
function checkProfileGuard() {
    const isProfilePage = window.location.pathname.includes("profile.html");
    const isLoggedIn = localStorage.getItem("customer_loggedIn") === "true";

    if (isProfilePage && !isLoggedIn) {
        window.location.href = "auth.html?redirect=profile";
    }
}

/**
 * Global Logout Function
 */
function logoutCustomer() {
    localStorage.removeItem("customer_user");
    localStorage.removeItem("customer_loggedIn");
    window.location.href = "index.html";
}

// Ensure cart updates trigger the badge refresh
window.addEventListener('storage', (e) => {
    if (e.key === 'cart') updateCartBadge();
    if (e.key === 'customer_loggedIn') updateHeaderAuth();
});

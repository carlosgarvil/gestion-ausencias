(function () {
  function enhanceNav(nav) {
    if (!nav) return;

    nav.id = nav.id || "site-navigation-" + Math.random().toString(36).slice(2);

    const existingButton = document.querySelector('[aria-controls="' + nav.id + '"]');
    if (nav.dataset.enhanced === "true" && existingButton) return;

    const activeLink = nav.querySelector(".nav-link.active");
    const activeText = activeLink ? activeLink.textContent.trim() : "Menu";
    const button = document.createElement("button");
    button.type = "button";
    button.className = "top-nav-menu-button";
    button.setAttribute("aria-controls", nav.id);
    button.setAttribute("aria-expanded", "false");

    const icon = document.createElement("span");
    icon.className = "top-nav-menu-icon";
    icon.setAttribute("aria-hidden", "true");

    const label = document.createElement("span");
    label.className = "top-nav-menu-label";
    label.textContent = activeText;

    button.appendChild(icon);
    button.appendChild(label);

    if (nav.dataset.clickBound !== "true") {
      nav.dataset.clickBound = "true";
      nav.addEventListener("click", function (event) {
        if (event.target.closest(".nav-link")) {
          nav.classList.remove("is-open");
          const currentButton = document.querySelector('[aria-controls="' + nav.id + '"]');
          if (currentButton) currentButton.setAttribute("aria-expanded", "false");
        }
      });
    }

    nav.parentNode.insertBefore(button, nav);
    nav.dataset.enhanced = "true";
  }

  function enhanceAllNavs() {
    document.querySelectorAll(".top-nav").forEach(enhanceNav);
  }

  document.addEventListener("keydown", function (event) {
    if (event.key !== "Escape") return;
    document.querySelectorAll(".top-nav.is-open").forEach(function (nav) {
      nav.classList.remove("is-open");
      const button = document.querySelector('[aria-controls="' + nav.id + '"]');
      if (button) button.setAttribute("aria-expanded", "false");
    });
  });

  document.addEventListener("click", function (event) {
    const button = event.target.closest(".top-nav-menu-button");
    if (!button) return;

    const navId = button.getAttribute("aria-controls");
    const nav = navId ? document.getElementById(navId) : null;
    if (!nav) return;

    const isOpen = nav.classList.toggle("is-open");
    button.setAttribute("aria-expanded", String(isOpen));
  });

  window.addEventListener("resize", function () {
    if (!window.matchMedia("(min-width: 641px)").matches) return;
    document.querySelectorAll(".top-nav.is-open").forEach(function (nav) {
      nav.classList.remove("is-open");
      const button = document.querySelector('[aria-controls="' + nav.id + '"]');
      if (button) button.setAttribute("aria-expanded", "false");
    });
  });

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", enhanceAllNavs);
  } else {
    enhanceAllNavs();
  }

  new MutationObserver(enhanceAllNavs).observe(document.documentElement, {
    childList: true,
    subtree: true
  });
})();

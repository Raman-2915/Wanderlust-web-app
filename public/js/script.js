(() => {
  "use strict";

  const getTheme = () => document.documentElement.getAttribute("data-theme") || "light";

  const syncThemeControls = (theme) => {
    document.documentElement.setAttribute("data-theme", theme);
    localStorage.setItem("roamly-theme", theme);

    const button = document.getElementById("themeToggle");
    if (button) {
      button.innerHTML = theme === "dark"
        ? '<i class="fa-solid fa-sun"></i>'
        : '<i class="fa-solid fa-moon"></i>';
      button.setAttribute("aria-label", theme === "dark" ? "Switch to light theme" : "Switch to dark theme");
      button.setAttribute("title", theme === "dark" ? "Light theme" : "Dark theme");
    }

    const switchControl = document.getElementById("themeSwitch");
    if (switchControl) switchControl.checked = theme === "dark";
  };

  window.setRoamlyTheme = syncThemeControls;
  syncThemeControls(getTheme());

  const themeToggle = document.getElementById("themeToggle");
  if (themeToggle) {
    themeToggle.addEventListener("click", () => {
      syncThemeControls(getTheme() === "dark" ? "light" : "dark");
    });
  }

  const themeSwitch = document.getElementById("themeSwitch");
  if (themeSwitch) {
    themeSwitch.addEventListener("change", () => {
      syncThemeControls(themeSwitch.checked ? "dark" : "light");
    });
  }

  const forms = document.querySelectorAll(".needs-validation");
  Array.from(forms).forEach((form) => {
    form.addEventListener("submit", (event) => {
      if (!form.checkValidity()) {
        event.preventDefault();
        event.stopPropagation();
      }
      form.classList.add("was-validated");
    }, false);
  });
})();

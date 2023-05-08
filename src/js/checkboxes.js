const selectAllButton = document.getElementById("select-all-boxes");
const removeAllButton = document.getElementById("remove-all-boxes");
let boxesChecked = false;

selectAllButton.addEventListener("click", function () {
  const form = document.getElementById("editForm");
  const checkboxes = form.querySelectorAll('input[type="checkbox"]');

  checkboxes.forEach(checkbox => {
    checkbox.checked = !boxesChecked;
  });

  if (boxesChecked) {
    selectAllButton.innerText = "Select All Boxes";
  } else {
    selectAllButton.innerText = "Uncheck Boxes";
  }

  boxesChecked = !boxesChecked;

  if (boxesChecked) {
    removeAllButton.classList.add("show");
  } else {
    removeAllButton.classList.remove("show");
  }
});

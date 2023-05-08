// import debounce from "lodash/debounce";
import { getTeamsRequest, createTeamRequest, deleteTeamRequest, updateTeamRequest } from "./js/requests";
import { $, debounce, sleep } from "./js/utils";

let allTeams = [];
let editID;

function getTeamAsHTML(team) {
  const id = team.id;
  const url = team.url;
  let anchorURL = url;

  if (url.startsWith("https://")) {
    anchorURL = url.substring(8);
  }

  return `
    <tr>
      <td>
        <input type="checkbox" name="selected" class="row-checkbox">
      </td>
      <td class="team-promotion">${team.promotion}</td>
      <td class="team-members">${team.members}</td>
      <td>${team.name}</td>
      <td>${anchorURL}</td>
      <td>
        <a href="${url}" target="_blank" class="btn-link btn-url" >🔗</a>
        <a data-id="${id}" class="btn-link btn-edit">✏️</a>
        <a data-id="${id}" class="btn-link btn-delete">❌</a>
      </td>
    </tr>
  `;
}

let previewDisplayedTeams = [];

function showTeams(teams) {
  if (teams === previewDisplayedTeams) {
    console.warn("same teams");
    return false;
  }
  if (teams.length === previewDisplayedTeams.length) {
    var eqContent = teams.every((team, i) => team === previewDisplayedTeams[i]);
    if (eqContent) {
      console.warn("same content");
      return false;
    }
  }

  previewDisplayedTeams = teams;
  const html = teams.map(getTeamAsHTML);
  $("table tbody").innerHTML = html.join("");
  return true;
}

async function formSubmit(e) {
  e.preventDefault();
  const team = getFormValues();

  if (editID) {
    team.id = editID;
    const { success } = await updateTeamRequest(team);
    if (success) {
      allTeams = allTeams.map(t => {
        if (t.id === team.id) {
          return {
            ...t,
            ...team
          };
        }
        return t;
      });
    }
  } else {
    const { success, id } = await createTeamRequest(team);
    if (success) {
      team.id = id;
      allTeams = [...allTeams, team];
    }
  }

  showTeams(allTeams) && $("#editForm").reset();
}

function getFormValues() {
  const promotion = $("#promotion").value;
  const members = $("#members").value;
  const projectName = $("#project").value;
  const projectURL = $("#url").value;

  const team = {
    promotion,
    members,
    name: projectName,
    url: projectURL
  };
  return team;
}

function setFormValues({ promotion, members, name, url }) {
  $("#promotion").value = promotion;
  $("#members").value = members;
  $("#project").value = name;
  $("#url").value = url;
}

async function deleteTeam(id) {
  console.warn("delete:", id);
  const { success } = await deleteTeamRequest(id);
  if (success) {
    allTeams = allTeams.filter(t => t.id !== id);
    showTeams(allTeams);
  }
}

function startEditTeam(id) {
  editID = id;
  const team = allTeams.find(team => team.id === id);
  setFormValues(team);
}

function searchTeams(teams, search) {
  search = search.toLowerCase();
  return teams.filter(team => {
    return (
      team.members.toLowerCase().includes(search) ||
      team.promotion.toLowerCase().includes(search) ||
      team.name.toLowerCase().includes(search) ||
      team.url.toLowerCase().includes(search)
    );
  });
}

function removeSelected() {
  console.warn("removeSelected");
  // find id, add mask, call remove deleteTeamRequest, remove mask
}

function initEvents() {
  const form = $("#editForm");
  form.addEventListener("submit", formSubmit);
  form.addEventListener("reset", () => {
    editID = undefined;
  });

  $("#remove-all-boxes").addEventListener("click", removeSelected);

  $("#search").addEventListener(
    "input",
    debounce(function (e) {
      const search = e.target.value;
      console.warn("search:", search);
      const teams = searchTeams(allTeams, search);
      showTeams(teams);
    }, 300)
  );

  $("#editForm tbody").addEventListener("click", e => {
    if (e.target.matches("a.btn-delete")) {
      const id = e.target.dataset.id;
      deleteTeam(id);
    } else if (e.target.matches("a.btn-edit")) {
      const id = e.target.dataset.id;
      startEditTeam(id);
    }
  });
}

async function loadTeams(cb) {
  const teams = await getTeamsRequest();
  allTeams = teams;
  showTeams(teams);
  if (typeof cb === "function") {
    cb();
  }
  return teams;
}

(async () => {
  $(".wrapper").classList.add("loading-mask");
  await loadTeams();
  await sleep(100);
  $(".wrapper").classList.remove("loading-mask");
})();

const selectAllButton = document.getElementById("select-all-boxes");
const removeAllButton = document.getElementById("remove-all-boxes");
let boxesChecked = false;

selectAllButton.addEventListener("click", function () {
  const form = document.getElementById("editForm");
  const checkboxes = form.querySelectorAll("input.row-checkbox");

  checkboxes.forEach(checkbox => {
    checkbox.checked = !boxesChecked;
  });

  boxesChecked = !boxesChecked;

  selectAllButton.innerText = boxesChecked ? "Uncheck all rows" : "Check all rows";
  removeAllButton.classList.toggle("show", boxesChecked);
});

initEvents();

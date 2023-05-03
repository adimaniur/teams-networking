let allTeams = [];
let editID;

function $(selector) {
  return document.querySelector(selector);
}

function getTeamsRequest() {
  return fetch("http://localhost:3000/teams-json", {
    method: "GET",
    headers: {
      "Content-Type": "application/json"
    }
  }).then(r => {
    return r.json();
  });
}

function createTeamRequest(team) {
  return fetch("http://localhost:3000/teams-json/create", {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify(team)
  }).then(r => r.json());
}

function deleteTeamRequest(id, successDelete) {
  return fetch("http://localhost:3000/teams-json/delete", {
    method: "DELETE",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({ id })
  })
    .then(r => r.json())
    .then(status => {
      console.warn("status before delete:", status);
      if (typeof successDelete === "function") {
        successDelete(status);
      }
      return status;
    });
}

function updateTeamRequest(team) {
  return fetch("http://localhost:3000/teams-json/update", {
    method: "PUT",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify(team)
  }).then(r => r.json());
}

function getTeamAsHTML(team) {
  const id = team.id;
  const url = team.url;
  let anchorURL = url;

  if (url.startsWith("https://")) {
    anchorURL = url.substring(8);
  }

  return `
    <tr>
      <td>${team.promotion}</td>
      <td>${team.members}</td>
      <td>${team.name}</td>
      <td><a href="${url}" target="_blank">${anchorURL}</a></td>
      <td>
        <a data-id="${id}" class="btn-link btn-delete">❌</a>
        <a data-id="${id}" class="btn-link btn-edit">✏️</a>
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

function initEvents() {
  const form = $("#editForm");
  form.addEventListener("submit", formSubmit);
  form.addEventListener("reset", () => {
    editID = undefined;
  });

  $("#search").addEventListener("input", e => {
    const search = e.target.value;
    const teams = searchTeams(allTeams, search);
    showTeams(teams);
  });

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

function sleep(ms) {
  return new Promise(resolve => {
    setTimeout(() => {
      resolve();
    }, ms);
  });
}

(async () => {
  $("#editForm").classList.add("loading-mask");
  await loadTeams();
  await sleep(200);
  $("#editForm").classList.remove("loading-mask");
})();

initEvents();

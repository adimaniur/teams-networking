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
      console.warn("before remove", status);
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
  return `
    <tr>
      <td>${team.promotion}</td>
      <td>${team.members}</td>
      <td>${team.name}</td>
      <td>${team.url}</td>
      <td>
        <a data-id="${team.id}" class="btn-link btn-delete">❌</a>
        <a data-id="${team.id}" class="btn-link btn-edit">✏️</a>
      </td>
    </tr>
  `;
}

function showTeams(teams) {
  const html = teams.map(getTeamAsHTML);
  $("table tbody").innerHTML = html.join("");
}

function formSubmit(e) {
  e.preventDefault();
  console.warn("submit", e);

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

  if (editID) {
    team.id = editID;
    console.warn("update?", editID, team);
    updateTeamRequest(team).then(status => {
      console.info("updated?", status);
      if (status.success) {
        window.location.reload();
      }
    });
  } else {
    createTeamRequest(team).then(status => {
      console.info("created", status);
      if (status.success) {
        window.location.reload();
      }
    });
  }
}

function deleteTeam(id) {
  console.warn("delete", id);
  deleteTeamRequest(id, () => {
    console.info("callback success");
  }).then(status => {
    console.warn("status", status);
    if (status.success) {
      window.location.reload();
    }
  });
}

function startEditTeam(id) {
  editID = id;
  const team = allTeams.find(team => team.id === id);

  $("#promotion").value = team.promotion;
  $("#members").value = team.members;
  $("#project").value = team.name;
  $("#url").value = team.url;
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

getTeamsRequest().then(teams => {
  allTeams = teams;
  showTeams(teams);
});

initEvents();

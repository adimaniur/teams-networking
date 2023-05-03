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
  const id = team.id;
  const url = team.url;
  let anchor = url;

  if (url.startsWith("https://")) {
    anchor = url.substring(8);
  }

  return `
    <tr>
      <td>${team.promotion}</td>
      <td>${team.members}</td>
      <td>${team.name}</td>
      <td><a href="${url}" target="_blank">${anchor}</a></td>
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
    console.info("same teams");
    return;
  }
  if (teams.length === previewDisplayedTeams.length) {
    var eqContent = teams.every((team, i) => team === previewDisplayedTeams[i]);
    if (eqContent) {
      console.info("same content");
      return;
    }
  }

  previewDisplayedTeams = teams;
  const html = teams.map(getTeamAsHTML);
  $("table tbody").innerHTML = html.join("");
}

function formSubmit(e) {
  e.preventDefault();
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
        allTeams = allTeams.map(t => {
          if (t.id === team.id) {
            return {
              ...t,
              ...team
            };
          }
          return t;
        });

        showTeams(allTeams);
        $("#editForm").reset();
      }
    });
  } else {
    createTeamRequest(team).then(status => {
      console.info("created", status);
      if (status.success) {
        allTeams = [...allTeams, team];
        team.id = status.id;
        showTeams(allTeams);
        $("#editForm").reset();
      }
    });
  }
}

function deleteTeam(id) {
  console.warn("delete", id);
  deleteTeamRequest(id, () => {
    console.info("callback success");
    return id;
  }).then(status => {
    console.warn("status", status);
    if (status.success) {
      loadTeams();
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

function loadTeams(cb) {
  return getTeamsRequest().then(teams => {
    allTeams = teams;
    showTeams(teams);
    if (typeof cb === "function") {
      cb();
    }
  });
}

loadTeams();
initEvents();

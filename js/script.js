let contadorSemestres = 0;

function adicionarSemestre() {
  contadorSemestres++;
  const container = document.getElementById("semestres");

  const div = document.createElement("div");
  div.className = "semestre";
  div.innerHTML = `
    <h2>Semestre ${contadorSemestres}</h2>
    <input type="text" placeholder="Ex: 2025/01" class="input-periodo" />
    <table class="tabela">
      <thead>
        <tr>
          <th>Matéria</th>
          <th>AV-1</th>
          <th>AV-2</th>
          <th>AV-3</th>
          <th>Média N1</th>
          <th>Média N2</th>
          <th>Parcial</th>
          <th>Status</th>
          <th>Exame Final</th>
          <th>Média Final</th>
          <th>Status Final</th>
        </tr>
      </thead>
      <tbody></tbody>
    </table>
    <button onclick="adicionarMateria(this)">Adicionar Matéria</button>
  `;
  container.appendChild(div);
}

function adicionarMateria(botao) {
  const tabela = botao.parentElement.querySelector("tbody");
  const linha = document.createElement("tr");
  linha.innerHTML = `
    <td><input type="text" placeholder="Nome" /></td>
    <td><input type="number" min="0" max="5" oninput="calcular(this)" /></td>
    <td><input type="number" min="0" max="5" oninput="calcular(this)" /></td>
    <td><input type="number" min="0" max="10" oninput="calcular(this)" /></td>
    <td class="media-n1"></td>
    <td class="media-n2"></td>
    <td class="parcial"></td>
    <td class="status"></td>
    <td><input type="number" min="0" max="10" oninput="calcular(this)" disabled /></td>
    <td class="media-final"></td>
    <td class="status-final"></td>
  `;
  tabela.appendChild(linha);
}

function ajustarLarguraInput(input) {
  const span = document.createElement("span");
  span.style.visibility = "hidden";
  span.style.whiteSpace = "pre";
  span.style.font = getComputedStyle(input).font;
  span.textContent = input.value || input.placeholder;
  document.body.appendChild(span);

  input.style.width = span.offsetWidth + 20 + "px";

  document.body.removeChild(span);
}

function calcular(input) {
  const linha = input.closest("tr");
  const inputs = linha.querySelectorAll("input");
  const n1 = parseFloat(inputs[1].value) || 0; // AV-1
  const n2 = parseFloat(inputs[2].value) || 0; // AV-2
  const n3 = parseFloat(inputs[3].value) || 0; // AV-3
  const exameInput = inputs[4];
  const exame = parseFloat(exameInput.value);

  const mediaN1 = n1 + n2;
  const mediaN2 = n3 * 2;
  const parcial = ((mediaN1 + mediaN2) / 3).toFixed(2);

  linha.querySelector(".media-n1").textContent = mediaN1.toFixed(2);
  linha.querySelector(".media-n2").textContent = mediaN2.toFixed(2);
  linha.querySelector(".parcial").textContent = parcial;

  const statusCell = linha.querySelector(".status");
  statusCell.className = "status"; // reset classes

  if (parcial >= 6) {
    statusCell.textContent = "Aprovado";
    statusCell.classList.add("status-aprovado");
    exameInput.disabled = true;
    exameInput.value = "";
  } else if (parcial >= 4) {
    statusCell.textContent = "Em Exame";
    statusCell.classList.add("status-exame");
    exameInput.disabled = false;
  } else {
    statusCell.textContent = "Reprovado";
    statusCell.classList.add("status-reprovado");
    exameInput.disabled = true;
    exameInput.value = "";
  }

  const mediaFinalCell = linha.querySelector(".media-final");
  const statusFinalCell = linha.querySelector(".status-final");
  statusFinalCell.className = "status-final";

  if (!exameInput.disabled && !isNaN(exame)) {
    const mediaFinal = ((parseFloat(parcial) + exame) / 2).toFixed(2);
    mediaFinalCell.textContent = mediaFinal;
    if (mediaFinal >= 5) {
      statusFinalCell.textContent = "Aprovado";
      statusFinalCell.classList.add("status-aprovado");
    } else {
      statusFinalCell.textContent = "Reprovado";
      statusFinalCell.classList.add("status-reprovado");
    }
  } else {
    mediaFinalCell.textContent = "";
    statusFinalCell.textContent = "";
  }
}

// ---------------------------
// Local Storage: Nome e Matrícula
// ---------------------------
function salvarLocalStorage() {
  localStorage.setItem("nomeAluno", document.getElementById("nomeAluno").value);
  localStorage.setItem("matriculaAluno", document.getElementById("matriculaAluno").value);
}

function carregarDadosAluno() {
  document.getElementById("nomeAluno").value = localStorage.getItem("nomeAluno") || "";
  document.getElementById("matriculaAluno").value = localStorage.getItem("matriculaAluno") || "";
}

// ---------------------------
// Salvar com IndexedDB
// ---------------------------
function salvarDados() {
  const dbRequest = indexedDB.open("NotasDB", 1);

  dbRequest.onupgradeneeded = function (event) {
    const db = event.target.result;
    if (!db.objectStoreNames.contains("semestres")) {
      db.createObjectStore("semestres", { keyPath: "id" });
    }
  };

  dbRequest.onsuccess = function (event) {
    const db = event.target.result;
    const tx = db.transaction("semestres", "readwrite");
    const store = tx.objectStore("semestres");

    document.querySelectorAll(".semestre").forEach((sem, index) => {
      const periodo = sem.querySelector(".input-periodo").value;
      const rows = sem.querySelectorAll("tbody tr");
      const materias = [];

      rows.forEach((row) => {
        const inputs = row.querySelectorAll("input");
        materias.push({
          nome: inputs[0].value,
          av1: inputs[1].value,
          av2: inputs[2].value,
          av3: inputs[3].value,
          exame: inputs[4].value,
        });
      });

      store.put({ id: index, periodo, materias });
    });

    alert("Dados salvos com sucesso!");
  };
}

// ---------------------------
// Backup do IndexedDB
// ---------------------------
function backupIndexedDB() {
  const dbRequest = indexedDB.open("NotasDB", 1);
  dbRequest.onsuccess = function (event) {
    const db = event.target.result;
    const tx = db.transaction("semestres", "readonly");
    const store = tx.objectStore("semestres");
    const request = store.getAll();

    request.onsuccess = function () {
      const blob = new Blob([JSON.stringify(request.result, null, 2)], {
        type: "application/json",
      });
      const link = document.createElement("a");
      link.href = URL.createObjectURL(blob);
      link.download = "backup_notas.json";
      link.click();
    };
  };
}

// ---------------------------
// Exportar PDF com jsPDF
// ---------------------------
function exportarPDF() {
  const { jsPDF } = window.jspdf;
  const doc = new jsPDF({ orientation: "landscape" });
  let y = 10;

  const nome = document.getElementById("nomeAluno").value || "Não informado";
  const matricula = document.getElementById("matriculaAluno").value || "Não informado";
  const curso = document.getElementById("curso").value || "Não informado";

  // Título
  doc.setFontSize(18);
  doc.text("Nota Calc - Calculadora de Notas Fametro", 105, y, { align: "center" });
  y += 10;

  // Logo
  const img = new Image();
  img.src = "img/fametro.jpeg";

  img.onload = function () {
    doc.addImage(img, "JPEG", 240, 5, 40, 15);

    y += 10;
    doc.setFontSize(14);
    doc.text(`Aluno: ${nome}`, 14, y);
    y += 10;
    doc.text(`Matrícula: ${matricula}`, 14, y);
    y += 6;
    doc.text(`Curso: ${curso}`, 14, y);
    y += 6;


    document.querySelectorAll(".semestre").forEach((sem, index) => {
      const periodo = sem.querySelector(".input-periodo").value || `Semestre ${index + 1}`;
      const rows = sem.querySelectorAll("tbody tr");

      doc.setFontSize(12);
      doc.text(`Semestre ${index + 1} - ${periodo}`, 14, y);
      y += 6;

      const tableData = [];
      rows.forEach((row) => {
        const cells = row.querySelectorAll("td");
        const data = [
          cells[0].querySelector("input")?.value || "",
          cells[1].querySelector("input")?.value || "",
          cells[2].querySelector("input")?.value || "",
          cells[3].querySelector("input")?.value || "",
          cells[4]?.textContent || "",
          cells[5]?.textContent || "",
          cells[6]?.textContent || "",
          cells[7]?.textContent || "",
          cells[8].querySelector("input")?.value || "",
          cells[9]?.textContent || "",
          cells[10]?.textContent || "",
        ];
        tableData.push(data);
      });

      doc.autoTable({
        startY: y,
        head: [[
          "Matéria", "AV1", "AV2", "AV3", "Média N1", "Média N2",
          "Parcial", "Status", "Exame Final", "Média Final", "Status Final"
        ]],
        body: tableData,
        theme: "grid",
        styles: { fontSize: 10 },
      });

      y = doc.lastAutoTable.finalY + 10;
    });

    doc.save(`notas-${nome}.pdf`);
  };
}

// Inicializa os dados do aluno ao carregar a página
window.onload = function () {
  carregarDadosAluno();
};

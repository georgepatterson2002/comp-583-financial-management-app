let transactions = []; // Array to store all transactions
let currentPage = 1; // Track the current page
const transactionsPerPage = 3; // Number of transactions per page
let isFrozen = false; // Freeze state

function toggleFreeze() {
  isFrozen = !isFrozen;
  const freezeBtn = document.getElementById("freezeToggleBtn");
  if (freezeBtn) {
    freezeBtn.textContent = isFrozen ? "Unfreeze" : "Freeze";
  }

  const incomeSubmitBtn = document.querySelector("#incomeModal button.btn");
  const expenseSubmitBtn = document.querySelector("#expenseModal button.btn");
  const resetBalanceBtn = document.querySelector(".card-container .card:nth-child(1) .btn");
  const importBtn = document.querySelector(".export-import .btn:nth-child(2)");

  if (incomeSubmitBtn) incomeSubmitBtn.disabled = isFrozen;
  if (expenseSubmitBtn) expenseSubmitBtn.disabled = isFrozen;
  if (resetBalanceBtn) resetBalanceBtn.disabled = isFrozen;
  if (importBtn) importBtn.disabled = isFrozen;
}

function addTransaction(name, type, date, amount, tag) {
  const transaction = { name, type, date, amount, tag };
  transactions.push(transaction);
  updateTotals();
  renderTable();
}

function updateTotals() {
  const totalIncome = transactions
    .filter((transaction) => transaction.type === "income")
    .reduce((sum, transaction) => sum + transaction.amount, 0);

  const totalExpenses = transactions
    .filter((transaction) => transaction.type === "expense" || transaction.type === "transfer")
    .reduce((sum, transaction) => sum + transaction.amount, 0);

  const currentBalance = totalIncome - totalExpenses;

  document.getElementById("totalIncome").textContent = `$${totalIncome}`;
  document.getElementById("totalExpenses").textContent = `$${totalExpenses}`;
  document.getElementById("currentBalance").textContent = `$${currentBalance}`;
}

function renderTable(filter = "all") {
  const tableBody = document.querySelector("table tbody");
  tableBody.innerHTML = "";

  let filteredTransactions = transactions;
  if (filter === "income") {
    filteredTransactions = transactions.filter(t => t.type === "income");
  } else if (filter === "expense") {
    filteredTransactions = transactions.filter(t => t.type === "expense");
  } else if (filter === "transfer") {
    filteredTransactions = transactions.filter(t => t.type === "transfer");
  }

  const startIndex = (currentPage - 1) * transactionsPerPage;
  const endIndex = startIndex + transactionsPerPage;
  const transactionsToDisplay = filteredTransactions.slice(startIndex, endIndex);

  if (transactionsToDisplay.length > 0) {
    transactionsToDisplay.forEach(transaction => {
      const newRow = document.createElement("tr");
      newRow.innerHTML = `
        <td>${transaction.name}</td>
        <td>${transaction.type}</td>
        <td>${transaction.date}</td>
        <td>$${transaction.amount}</td>
        <td>${transaction.tag}</td>
      `;
      tableBody.appendChild(newRow);
    });
  } else {
    const noDataRow = document.createElement("tr");
    noDataRow.classList.add("no-data");
    noDataRow.innerHTML = `<td colspan="5">No data</td>`;
    tableBody.appendChild(noDataRow);
  }

  updatePaginationControls(filteredTransactions.length);
}

function updatePaginationControls(totalTransactions) {
  const paginationControls = document.getElementById("pagination-controls");
  const totalPages = Math.ceil(totalTransactions / transactionsPerPage);
  paginationControls.innerHTML = "";

  const prevButton = document.createElement("button");
  prevButton.textContent = "Previous";
  prevButton.disabled = currentPage === 1;
  prevButton.onclick = () => {
    if (currentPage > 1) {
      currentPage--;
      renderTable(document.querySelector(".filter-select").value);
    }
  };
  paginationControls.appendChild(prevButton);

  for (let i = 1; i <= totalPages; i++) {
    const pageButton = document.createElement("button");
    pageButton.textContent = i;
    pageButton.disabled = i === currentPage;
    pageButton.onclick = () => {
      currentPage = i;
      renderTable(document.querySelector(".filter-select").value);
    };
    paginationControls.appendChild(pageButton);
  }

  const nextButton = document.createElement("button");
  nextButton.textContent = "Next";
  nextButton.disabled = currentPage === totalPages;
  nextButton.onclick = () => {
    if (currentPage < totalPages) {
      currentPage++;
      renderTable(document.querySelector(".filter-select").value);
    }
  };
  paginationControls.appendChild(nextButton);
}

function addIncome() {
  if (isFrozen) {
    alert("Dashboard is frozen. Unfreeze to add income.");
    return;
  }
  const name = document.getElementById("incomeName").value;
  const amount = parseFloat(document.getElementById("incomeAmount").value);
  const date = document.getElementById("incomeDate").value;
  const tag = document.getElementById("incomeTag").value;

  if (!name || !amount || !date || !tag) {
    alert("Please fill all fields");
    return;
  }

  addTransaction(name, "income", date, amount, tag);
  closeIncomeModal();
  resetIncomeForm();
}

function addExpense() {
  if (isFrozen) {
    alert("Dashboard is frozen. Unfreeze to add expense.");
    return;
  }
  const name = document.getElementById("expenseName").value;
  const amount = parseFloat(document.getElementById("expenseAmount").value);
  const date = document.getElementById("expenseDate").value;
  const tag = document.getElementById("expenseTag").value;

  if (!name || !amount || !date || !tag) {
    alert("Please fill all fields");
    return;
  }

  addTransaction(name, "expense", date, amount, tag);
  closeExpenseModal();
  resetExpenseForm();
}

function closeIncomeModal() {
  document.getElementById("incomeModal").style.display = "none";
}

function closeExpenseModal() {
  document.getElementById("expenseModal").style.display = "none";
}

function resetIncomeForm() {
  document.getElementById("incomeName").value = "";
  document.getElementById("incomeAmount").value = "";
  document.getElementById("incomeDate").value = "";
  document.getElementById("incomeTag").value = "";
}

function resetExpenseForm() {
  document.getElementById("expenseName").value = "";
  document.getElementById("expenseAmount").value = "";
  document.getElementById("expenseDate").value = "";
  document.getElementById("expenseTag").value = "";
}

function resetBalance() {
  if (isFrozen) {
    alert("Dashboard is frozen. Unfreeze to reset balance.");
    return;
  }
  transactions = [];
  currentPage = 1;
  updateTotals();
  renderTable();
}

function logout() {
  alert("Logged out successfully!");
}

function showIncomeForm() {
  document.getElementById("incomeModal").style.display = "flex";
}

function showExpenseForm() {
  document.getElementById("expenseModal").style.display = "flex";
}

/* New Functions for Transfer Money */

function showTransferForm() {
  document.getElementById("transferModal").style.display = "flex";
}

function closeTransferModal() {
  document.getElementById("transferModal").style.display = "none";
}

function resetTransferForm() {
  document.getElementById("transferAccount").value = "";
  document.getElementById("transferAmount").value = "";
  document.getElementById("transferDate").value = "";
}

function addTransfer() {
  if (isFrozen) {
    alert("Dashboard is frozen. Unfreeze to perform transfer.");
    return;
  }
  const account = document.getElementById("transferAccount").value;
  const amount = parseFloat(document.getElementById("transferAmount").value);
  const date = document.getElementById("transferDate").value;

  if (!account || !amount || !date) {
    alert("Please fill all fields");
    return;
  }

  // Record the transfer as a transaction.
  // The name includes the destination account.
  addTransaction("Transfer to " + account, "transfer", date, amount, "transfer");

  closeTransferModal();
  resetTransferForm();
}

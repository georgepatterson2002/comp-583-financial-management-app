let transactions = [];
let currentPage = 1;
const transactionsPerPage = 3;
let isFrozen = false;
let selectedCurrency = "USD";
let savingsGoals = []; // store all savings goals
let editingGoalIndex = -1; // track which one is being edited
let categoryBudgets = {}; // { food: 5000, education: 3000, ... }

const currencyRates = {
  INR: 1,
  USD: 0.012,
  EUR: 0.011
};

const currencySymbols = {
  INR: "₹",
  USD: "$",
  EUR: "€"
};

let categoryChart;

function toggleFreeze() {
  isFrozen = !isFrozen;
  const freezeBtn = document.getElementById("freezeToggleBtn");
  if (freezeBtn) freezeBtn.textContent = isFrozen ? "Unfreeze" : "Freeze";

  const incomeSubmitBtn = document.querySelector("#incomeModal button.btn");
  const expenseSubmitBtn = document.querySelector("#expenseModal button.btn");
  const resetBalanceBtn = document.querySelector(".card-container .card:nth-child(1) .btn");
  const importBtn = document.querySelector(".export-import .btn:nth-child(2)");

  if (incomeSubmitBtn) incomeSubmitBtn.disabled = isFrozen;
  if (expenseSubmitBtn) expenseSubmitBtn.disabled = isFrozen;
  if (resetBalanceBtn) resetBalanceBtn.disabled = isFrozen;
  if (importBtn) importBtn.disabled = isFrozen;

  /////////
const transferSubmitBtn = document.querySelector("#transferModal button.btn");
if (transferSubmitBtn) transferSubmitBtn.disabled = isFrozen;

}

function addTransaction(name, type, date, amount, tag) {
  const transaction = { name, type, date, amount, tag };
  transactions.push(transaction);
  updateTotals();
  renderTable();
  renderCategoryChart(); // 🔥 Update pie chart
}

function updateTotals() {
  const totalIncome = transactions
    .filter((t) => t.type === "income")
    .reduce((sum, t) => sum + t.amount, 0);

  const totalExpenses = transactions
    .filter((t) => t.type === "expense" || t.type === "transfer")
    .reduce((sum, t) => sum + t.amount, 0);

  const currentBalance = totalIncome - totalExpenses;
  const rate = currencyRates[selectedCurrency];
  const symbol = currencySymbols[selectedCurrency];

  document.getElementById("totalIncome").textContent = `${symbol}${(totalIncome * rate).toFixed(2)}`;
  document.getElementById("totalExpenses").textContent = `${symbol}${(totalExpenses * rate).toFixed(2)}`;
  document.getElementById("currentBalance").textContent = `${symbol}${(currentBalance * rate).toFixed(2)}`;
}

function renderTable(filter = "all") {
  const tableBody = document.querySelector("table tbody");
  tableBody.innerHTML = "";

  let filteredTransactions = transactions;

  if (filter === "income") {
    filteredTransactions = transactions.filter(t => t.type === "income");
  } else if (filter === "expense") {
    filteredTransactions = transactions.filter(t => t.type === "expense");
  } else if (filter === "transfer") {                // <-- NEW
    filteredTransactions = transactions.filter(t => t.type === "transfer");
  }

  const startIndex = (currentPage - 1) * transactionsPerPage;
  const endIndex = startIndex + transactionsPerPage;
  const transactionsToDisplay = filteredTransactions.slice(startIndex, endIndex);

  if (transactionsToDisplay.length > 0) {
    transactionsToDisplay.forEach(transaction => {
      const newRow = document.createElement("tr");

      // 📘 Calculate converted amount
      const convertedAmount = (transaction.amount * currencyRates[selectedCurrency]).toFixed(2);

      // 📘 Create base row
      newRow.innerHTML = `
        <td>${transaction.name}</td>
        <td>${transaction.type}</td>
        <td>${transaction.date}</td>
        <td>${currencySymbols[selectedCurrency]}${convertedAmount}</td>
        <td>
          ${transaction.tag}
          ${transaction.splitWith && transaction.splitWith.length > 0 ? `
            <div style="font-size: 12px; margin-top: 5px;">
              <span style="color: red; font-weight: bold;">Split:</span>
              <span style="color: green; font-weight: bold;">
                ${transaction.splitWith.join(", ")}
              </span><br />
              ${Object.entries(transaction.splitAmounts || {}).map(
                ([person, share]) =>
                  `<span style="color: red;">${person}</span>: <span style="color: green;">${currencySymbols[selectedCurrency]}${(share * currencyRates[selectedCurrency]).toFixed(2)}</span>`
              ).join(", ")}
            </div>
          ` : ""}
          
        </td>
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


function handleSetSavingsGoal() {
  const amount = document.getElementById("goalAmount").value;
  const deadline = document.getElementById("goalDeadline").value;

  if (!amount || !deadline) {
    alert("Please enter both goal amount and deadline.");
    return;
  }

  if (editingGoalIndex >= 0) {
    savingsGoals[editingGoalIndex] = {
      target: parseFloat(amount),
      deadline
    };
    editingGoalIndex = -1;
  } else {
    savingsGoals.push({
      target: parseFloat(amount),
      deadline
    });
  }

  document.getElementById("goalAmount").value = "";
  document.getElementById("goalDeadline").value = "";
  renderSavingsGoals();
}

function renderSavingsGoals() {
  const container = document.getElementById("savingsGoal");
  container.innerHTML = "";

  const totalIncome = transactions.filter(t => t.type === "income").reduce((sum, t) => sum + t.amount, 0);
  const totalExpenses = transactions.filter(t => t.type === "expense").reduce((sum, t) => sum + t.amount, 0);
  const saved = totalIncome - totalExpenses;

  const symbol = currencySymbols[selectedCurrency];
  const rate = currencyRates[selectedCurrency];

  savingsGoals.forEach((goal, index) => {
    const percent = Math.min((saved / goal.target) * 100, 100).toFixed(1);

    const goalCard = document.createElement("div");
    goalCard.className = "goal-card";
    goalCard.innerHTML = `
      <h3>🎯 Savings Goal ${index + 1}</h3>
      <p>Target: <strong>${symbol}${(goal.target * rate).toFixed(2)}</strong></p>
      <p>Saved: <strong>${symbol}${(saved * rate).toFixed(2)}</strong></p>
      <p>Deadline: <strong>${goal.deadline}</strong></p>
      <div style="background:#eee;height:20px;border-radius:10px;overflow:hidden;margin-top:10px;">
        <div style="width:${percent}%;background:#4caf50;height:100%;color:white;text-align:center;font-size:12px;">${percent}%</div>
      </div>
      <div style="margin-top: 10px;">
        <button class="btn" onclick="editSavingsGoal(${index})">Edit</button>
        <button class="btn" onclick="deleteSavingsGoal(${index})">Delete</button>
      </div>
    `;
    container.appendChild(goalCard);
  });
}

function editSavingsGoal(index) {
  const goal = savingsGoals[index];
  document.getElementById("goalAmount").value = goal.target;
  document.getElementById("goalDeadline").value = goal.deadline;
  editingGoalIndex = index;
  window.scrollTo({ top: document.getElementById("goalAmount").offsetTop - 100, behavior: "smooth" });
}

function deleteSavingsGoal(index) {
  if (confirm("Are you sure you want to delete this savings goal?")) {
    savingsGoals.splice(index, 1);
    renderSavingsGoals();
  }
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
    alert("Please fill all income fields.");
    return;
  }

  const transaction = {
    name,
    type: "income",
    date,
    amount,
    tag
  };

  transactions.push(transaction);
  updateTotals();
  renderTable();
  renderCategoryChart();
  closeIncomeModal();
  resetIncomeForm();
  updateSnapshot()
  saveTransactionsToStorage(); 
  
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
  const splitInput = document.getElementById("expenseSplit").value;
  const payer = document.getElementById("payer").value.trim();

  if (!name || !amount || !date || !tag) {
    alert("Please fill all fields");
    return;
  }

  const splitWith = splitInput
    .split(",")
    .map(name => name.trim())
    .filter(name => name.length > 0);

  const splitAmounts = {};
  if (splitWith.length > 0) {
    const share = amount / splitWith.length;
    splitWith.forEach(person => {
      splitAmounts[person] = parseFloat(share.toFixed(2));
    });
  }

  const transaction = {
    name,
    type: "expense",
    date,
    amount,
    tag,
    payer,
    splitWith,
    splitAmounts
  };

  transactions.push(transaction);
  updateTotals();
  renderTable();
  renderCategoryChart();
  updateOwesSummary(); // 🆕 new owes list
  closeExpenseModal();
  resetExpenseForm();
  updateSnapshot();
  saveTransactionsToStorage(); 
  renderBudgetAlerts()
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
  if (categoryChart) categoryChart.destroy(); // 🔥 Clear pie chart on reset
  updateSnapshot();
  saveTransactionsToStorage();
  renderBudgetAlerts() 
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

  const account = document.getElementById("transferAccount").value.trim();
  const amount  = parseFloat(document.getElementById("transferAmount").value);
  const date    = document.getElementById("transferDate").value;

  if (!account || !amount || !date) {
    alert("Please fill all transfer fields.");
    return;
  }

  // Record as a “transfer” transaction
  addTransaction(`Transfer to ${account}`, "transfer", date, amount, "transfer");

  closeTransferModal();
  resetTransferForm();
}

function changeCurrency() {
  selectedCurrency = document.getElementById("currencySelect").value;
  updateTotals();
  renderTable(document.querySelector(".filter-select").value);
  renderCategoryChart(); // 🔥 Update chart on currency change
  renderBudgetAlerts()
}

function toggleDarkMode() {
  const isDark = document.body.classList.toggle("dark");
  localStorage.setItem("theme", isDark ? "dark" : "light");
}

window.addEventListener("DOMContentLoaded", () => {
  // 🌙 Theme setup
  const savedTheme = localStorage.getItem("theme");
  if (savedTheme === "dark") {
    document.body.classList.add("dark");
    const darkToggle = document.getElementById("darkToggle");
    if (darkToggle) darkToggle.checked = true;
  }

  // 📂 Load data
  loadTransactionsFromStorage();
  loadBillsFromStorage();
  loadBudgetsFromStorage();

  // 📊 Initial rendering
  renderTable();
  updateTotals();
  renderCategoryChart();
  renderCreditScore();
  renderCalendarView();
  renderBudgetAlerts();
  renderSavingsGoals();
  updateSnapshot();
  updateOwesSummary();
  showDailyTip();
});




function toggleSettings() {
  const menu = document.getElementById("settingsMenu");
  menu.style.display = menu.style.display === "block" ? "none" : "block";
}

window.addEventListener("click", function(event) {
  const menu = document.getElementById("settingsMenu");
  const settingsBtn = event.target.closest(".settings-dropdown");
  if (!settingsBtn && menu) {
    menu.style.display = "none";
  }
});

// ✅ Render Spending by Category (Pie Chart)
function renderCategoryChart() {
  const expenseData = transactions
    .filter(t => t.type === "expense")
    .reduce((acc, t) => {
      acc[t.tag] = (acc[t.tag] || 0) + t.amount;
      return acc;
    }, {});

  const tags = Object.keys(expenseData);
  const amounts = Object.values(expenseData);

  const ctx = document.getElementById('categoryChart').getContext('2d');

  if (categoryChart) {
    categoryChart.destroy();
  }

  categoryChart = new Chart(ctx, {
    type: 'pie',
    data: {
      labels: tags,
      datasets: [{
        label: 'Expenses by Category',
        data: amounts,
        backgroundColor: [
          '#ff6384', '#36a2eb', '#ffce56', '#4caf50', '#ff9800', '#9c27b0'
        ],
        borderWidth: 1
      }]
    },
    options: {
      responsive: true,
      plugins: {
        legend: {
          position: 'bottom'
        }
      }
    }
  });
}

let bills = []; // 🧾 All bills go here

function addBill() {
  const name = document.getElementById("billName").value;
  const amount = parseFloat(document.getElementById("billAmount").value);
  const dueDate = document.getElementById("billDueDate").value;
  const repeat = document.getElementById("billRepeat").value;
  const tag = document.getElementById("billTag").value;

  if (!name || !amount || !dueDate || !repeat || !tag) {
    alert("Please fill all bill fields.");
    return;
  }

  const newBill = {
    name,
    amount,
    dueDate,
    repeat,
    tag,
    paid: false
  };

  bills.push(newBill);
  saveBillsToStorage();
  renderBills();
  resetBillForm();
}
function renderBills() {
  const list = document.getElementById("billList");
  list.innerHTML = "";

  bills.forEach((bill, index) => {
    const li = document.createElement("li");
    li.innerHTML = `
      ${bill.name} - ₹${bill.amount} - Due: ${bill.dueDate} - ${bill.tag} 
      [<span style="color: ${bill.paid ? 'green' : 'red'}">${bill.paid ? "Paid" : "Unpaid"}</span>]
    `;
    list.appendChild(li);
  });
}

function resetBillForm() {
  document.getElementById("billName").value = "";
  document.getElementById("billAmount").value = "";
  document.getElementById("billDueDate").value = "";
  document.getElementById("billRepeat").value = "once";
  document.getElementById("billTag").value = "utilities";
}
function saveBillsToStorage() {
  localStorage.setItem("bills", JSON.stringify(bills));
}

function loadBillsFromStorage() {
  const stored = localStorage.getItem("bills");
  if (stored) {
    bills = JSON.parse(stored);
    renderBills();
  }
}



function renderBills() {
  const list = document.getElementById("billList");
  list.innerHTML = "";

  const unpaidBills = bills.filter(b => !b.paid); // 🩷 show only unpaid

  unpaidBills.forEach((bill, index) => {
    const li = document.createElement("li");
    li.innerHTML = `
      ${bill.name} - ₹${bill.amount} - Due: ${bill.dueDate} - ${bill.tag}
      [<span style="color: red;">Unpaid</span>]
    `;
    list.appendChild(li);
  });
}

let currentMonthq23 = new Date().getMonth(); // 🟡 global month state
let currentYears = new Date().getFullYear(); // 🟡 global year state


// 📅 Calendar View with Navigation – Step 2
let currentMonth = new Date().getMonth(); // 🟡 global month state
let currentYear = new Date().getFullYear(); // 🟡 global year state

function renderCalendarView() {
  const calendar = document.getElementById("calendarView");
  if (!calendar) return;

  const month = currentMonth;
  const year = currentYear;
  calendar.innerHTML = "";

  const nav = document.createElement("div");
  nav.style.display = "flex";
  nav.style.justifyContent = "center";
  nav.style.alignItems = "center";
  nav.style.gap = "10px";
  nav.style.marginBottom = "20px";

  const prevBtn = document.createElement("button");
  prevBtn.textContent = "◀️";
  prevBtn.onclick = () => {
    currentMonth--;
    if (currentMonth < 0) {
      currentMonth = 11;
      currentYear--;
    }
    renderCalendarView();
  };

  const nextBtn = document.createElement("button");
  nextBtn.textContent = "▶️";
  nextBtn.onclick = () => {
    currentMonth++;
    if (currentMonth > 11) {
      currentMonth = 0;
      currentYear++;
    }
    renderCalendarView();
  };

  const monthHeader = document.createElement("h3");
  monthHeader.textContent = `📅 ${new Date(currentYear, currentMonth).toLocaleString('default', { month: 'long' })} ${currentYear}`;

  nav.appendChild(prevBtn);
  nav.appendChild(monthHeader);
  nav.appendChild(nextBtn);
  calendar.appendChild(nav);

  // Replace grid with list-style cards like in the mobile UI example
  const billsForMonth = bills.filter(bill => {
    const billDate = new Date(bill.dueDate);
    return billDate.getMonth() === currentMonth && billDate.getFullYear() === currentYear;
  });

  if (billsForMonth.length === 0) {
    const noBills = document.createElement("p");
    noBills.textContent = "No bills due this month.";
    noBills.style.textAlign = "center";
    calendar.appendChild(noBills);
  } else {
    billsForMonth.sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate));
    billsForMonth.forEach(bill => {
      const card = document.createElement("div");
      const dueDate = new Date(bill.dueDate);
      const day = dueDate.getDate();
      const weekday = dueDate.toLocaleDateString('en-US', { weekday: 'short' }).toUpperCase();

      card.style.borderRadius = "10px";
      card.style.padding = "12px";
      card.style.margin = "10px auto";
      card.style.maxWidth = "400px";
      card.style.color = "white";
      card.style.display = "flex";
      card.style.justifyContent = "space-between";
      card.style.alignItems = "center";
      card.style.backgroundColor = bill.paid ? "#4caf50" : "#f44336";

      card.innerHTML = `
        <div>
          <strong>${bill.name}</strong><br>
          ₹${bill.amount.toFixed(2)}<br>
          <small>${bill.tag}</small>
        </div>
        <div style="text-align:right">
          <strong>${String(day).padStart(2, '0')}</strong><br>
          <span>${weekday}</span><br>
          <span>${bill.paid ? '✅ Paid' : '❌ Unpaid'}</span><br>
          ${!bill.paid ? `<button class='btn' style='margin-top: 5px;' onclick='payBill(${bills.indexOf(bill)})'>Mark as Paid</button>` : ''}
        </div>
      `;

      calendar.appendChild(card);
    });
  }
}


function payBill(index) {
  if (bills[index]) {
    bills[index].paid = true;
    localStorage.setItem("bills", JSON.stringify(bills));
    renderCalendarView();
    renderBills(); // 🩷 refresh upcoming bills after marking as paid
  }
}



function speak(text) {
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.rate = 1;
  utterance.pitch = 1;
  utterance.lang = "en-IN";
  speechSynthesis.speak(utterance);
}

function speakAmount(type) {
  let elementId = "";
  let label = "";

  if (type === "balance") {
    elementId = "currentBalance";
    label = "Your current balance is";
  } else if (type === "income") {
    elementId = "totalIncome";
    label = "Your total income is";
  } else if (type === "expense") {
    elementId = "totalExpenses";
    label = "Your total expense is";
  }

  const value = document.getElementById(elementId).textContent;
  speak(`${label} ${value}`);
}
function speak(text) {
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.rate = 1;
  utterance.pitch = 1;
  utterance.lang = "en-IN";
  speechSynthesis.speak(utterance);
}


function updateOwesSummary() {
  const owesMap = {}; // personA -> personB -> amount

  transactions.forEach(txn => {
    if (txn.type !== "expense" || !txn.payer || !txn.splitAmounts) return;

    txn.splitWith.forEach(person => {
      if (person !== txn.payer) {
        if (!owesMap[person]) owesMap[person] = {};
        if (!owesMap[person][txn.payer]) owesMap[person][txn.payer] = 0;
        owesMap[person][txn.payer] += txn.splitAmounts[person];
      }
    });
  });

  const owesDiv = document.getElementById("owesSummary");
  owesDiv.innerHTML = "<h3>💳 Who Owes Whom</h3>";

  let hasData = false;
  for (const [debtor, creditors] of Object.entries(owesMap)) {
    for (const [creditor, amount] of Object.entries(creditors)) {
      owesDiv.innerHTML += `<p><strong>${debtor}</strong> owes <strong>${creditor}</strong> ₹${amount.toFixed(2)}</p>`;
      hasData = true;
    }
  }

  if (!hasData) owesDiv.innerHTML += "<p>No debts yet.</p>";
}
function calculateCreditScore() {
  let score = 300; // base score

  // 1. Bill Payment History (35%)
  const totalBills = bills.length;
  const paidBills = bills.filter(b => b.paid).length;
  const billScore = totalBills > 0 ? (paidBills / totalBills) * 100 : 100;
  score += billScore * 1.925; // 35% weight (100 * 1.925 = 192.5)

  // 2. Income-to-Expense Ratio (30%)
  const totalIncome = transactions.filter(t => t.type === "income").reduce((sum, t) => sum + t.amount, 0);
  const totalExpenses = transactions.filter(t => t.type === "expense").reduce((sum, t) => sum + t.amount, 0);
  const ratio = totalIncome > 0 ? totalIncome / (totalExpenses || 1) : 0;
  const ratioScore = Math.min(ratio, 3) / 3 * 100; // cap at 3:1 ratio
  score += ratioScore * 1.5; // 30% weight

  // 3. Savings Goal Completion (20%)
  let goalScore = 100;
  if (savingsGoals.length > 0) {
    const saved = totalIncome - totalExpenses;
    const averageCompletion = savingsGoals.reduce((sum, g) => {
      return sum + Math.min((saved / g.target) * 100, 100);
    }, 0) / savingsGoals.length;
    goalScore = averageCompletion;
  }
  score += goalScore * 0.85; // 20% weight

  // 4. Settled Expenses (15%)
  const totalExpensesTx = transactions.filter(t => t.type === "expense").length;
  const settledTx = transactions.filter(t => t.type === "expense" && t.settled).length;
  const settleScore = totalExpensesTx > 0 ? (settledTx / totalExpensesTx) * 100 : 100;
  score += settleScore * 1.275; // 15% weight

  return Math.round(Math.min(score, 850)); // cap at 850
}
function getScoreRating(score) {
  if (score >= 750) return "Excellent";
  if (score >= 700) return "Good";
  if (score >= 650) return "Fair";
  return "Poor";
}

function renderCreditScore() {
  const score = calculateCreditScore();
  const rating = getScoreRating(score);
  const color = rating === "Excellent" ? "green" :
                rating === "Good" ? "#4caf50" :
                rating === "Fair" ? "#ffc107" :
                "red";

  document.getElementById("creditScoreText").innerHTML = `
    Your simulated credit score is: <strong style="color:${color}; font-size: 22px;">${score} (${rating})</strong>
  `;
}
let creditScoreChart = null;

function renderCreditScore() {
  const score = calculateCreditScore(); // Assume this exists
  const rating = getScoreRating(score); // Assume this exists

  const color = score >= 750 ? "#4caf50" :
                score >= 700 ? "#8bc34a" :
                score >= 650 ? "#ffc107" :
                               "#f44336";

  const ctx = document.getElementById('creditScoreChart').getContext('2d');

  if (creditScoreChart) creditScoreChart.destroy();

  creditScoreChart = new Chart(ctx, {
    type: 'doughnut',
    data: {
      labels: ['Credit Score'],
      datasets: [{
        label: 'Credit Score',
        data: [score, 850 - score],
        backgroundColor: [color, '#eee'],
        borderWidth: 0
      }]
    },
    options: {
      cutout: '75%', // smaller center
      responsive: false, // force fixed size
      plugins: {
        tooltip: { enabled: false },
        legend: { display: false },
        title: {
          display: true,
          text: `${score} (${rating})`,
          color: color,
          font: {
            size: 16, // ↓ reduced from 22
            weight: 'bold'
          },
          padding: {
            top: 10,  // ↓ reduced spacing
            bottom: 5
          }
        }
      }
    }
    
  });
}
function openScoreInfo() {
  document.getElementById("scoreInfoModal").style.display = "flex";
}

function closeScoreInfo() {
  document.getElementById("scoreInfoModal").style.display = "none";
}
function showDailyTip() {
  const tips = [
    "Track every rupee – what gets tracked gets improved.",
    "Spend less than you earn. Always.",
    "Automate your savings – pay yourself first.",
    "Impulse buying? Wait 24 hours before purchasing.",
    "Small amounts matter. ₹100 saved weekly = ₹5,200/year.",
    "Avoid lifestyle inflation. More money ≠ more spending.",
    "Review your subscriptions — you might not use them all.",
    "Build an emergency fund for 3–6 months of expenses.",
    "Invest early — compound interest is your best friend.",
    "A budget tells your money where to go, not where it went."
  ];

  const tipEl = document.getElementById("dailyTip");

  // Fade out the old tip
  tipEl.classList.add("fade-out");

  setTimeout(() => {
    // Choose a random tip
    const randomTip = tips[Math.floor(Math.random() * tips.length)];
    tipEl.textContent = randomTip;

    // Fade back in
    tipEl.classList.remove("fade-out");
  }, 500);
}

function updateSnapshot() {
  const totalIncome = transactions.filter(t => t.type === "income").reduce((sum, t) => sum + t.amount, 0);
  const totalExpenses = transactions.filter(t => t.type === "expense").reduce((sum, t) => sum + t.amount, 0);
  const net = totalIncome - totalExpenses;

  const symbol = currencySymbols[selectedCurrency];
  document.getElementById("snapshotText").textContent = `Your money in this month is ${symbol}${net.toFixed(2)}.`;
}
function saveTransactionsToStorage() {
  localStorage.setItem("transactions", JSON.stringify(transactions));
}


function saveBudgetsToStorage() {
  localStorage.setItem("budgets", JSON.stringify(categoryBudgets));
}

function loadBudgetsFromStorage() {
  const stored = localStorage.getItem("budgets");
  if (stored) {
    categoryBudgets = JSON.parse(stored);
  }
}

function setBudget() {
  const category = document.getElementById("budgetCategory").value;
  const amount = parseFloat(document.getElementById("budgetAmount").value);

  if (!category || !amount || amount <= 0) {
    alert("Please enter a valid category and a positive amount.");
    return;
  }

  categoryBudgets[category] = amount;
  saveBudgetsToStorage();
  renderBudgetAlerts();

  // Optional: Confirmation message
  alert(`Budget set: ₹${amount} for ${category}`);

  document.getElementById("budgetAmount").value = "";
}

function getMonthlyCategorySpending() {
  const now = new Date();
  const month = now.getMonth();
  const year = now.getFullYear();

  return transactions
    .filter(t => t.type === "expense")
    .filter(t => {
      const date = new Date(t.date);
      return date.getMonth() === month && date.getFullYear() === year;
    })
    .reduce((acc, t) => {
      acc[t.tag] = (acc[t.tag] || 0) + t.amount;
      return acc;
    }, {});
}

function renderBudgetAlerts() {
  const alertDiv = document.getElementById("budgetAlerts");
  alertDiv.innerHTML = "";

  const monthlySpending = getMonthlyCategorySpending();
  const symbol = currencySymbols[selectedCurrency];
  const rate = currencyRates[selectedCurrency];

  Object.entries(categoryBudgets).forEach(([category, limit]) => {
    const spent = monthlySpending[category] || 0;

    if (spent > limit) {
      const alert = document.createElement("div");
      alert.className = "alert warning";
      alert.innerHTML = `
        ⚠️ Over budget for <strong>${category}</strong>!<br />
        Spent: <strong>${symbol}${(spent * rate).toFixed(2)}</strong> / 
        Limit: <strong>${symbol}${(limit * rate).toFixed(2)}</strong>
      `;
      alertDiv.appendChild(alert);
    }
  });
}
function loadTransactionsFromStorage() {
  const stored = localStorage.getItem("transactions");
  if (stored) {
    transactions = JSON.parse(stored);
  }
}
let stocks = JSON.parse(localStorage.getItem("stocks")) || [];



function addStock() {
  const symbol = document.getElementById("stockSymbol").value.toUpperCase();
  const shares = parseFloat(document.getElementById("stockShares").value);
  const buyPrice = parseFloat(document.getElementById("stockBuyPrice").value);

  if (!symbol || isNaN(shares) || isNaN(buyPrice)) {
    alert("Please enter valid stock details.");
    return;
  }

  stocks.push({ symbol, shares, buyPrice });
  localStorage.setItem("stocks", JSON.stringify(stocks));
  renderStocks(); // ✅ Now this will work
}

async function fetchStockPrice(symbol) {
  const url = `https://www.alphavantage.co/query?function=GLOBAL_QUOTE&symbol=${symbol}&apikey=demo`;

  try {
    const res = await fetch(url);
    const data = await res.json();

    // ✅ Graceful error check
    if (!data["Global Quote"] || !data["Global Quote"]["05. price"]) {
      console.warn("Unexpected API response for symbol:", symbol, data);
      return null;
    }

    return parseFloat(data["Global Quote"]["05. price"]);
  } catch (err) {
    console.error("Error fetching stock price:", err);
    return null;
  }
}

async function renderStocks() {
  const tbody = document.querySelector("#stockTable tbody");
  tbody.innerHTML = "";

  for (const stock of stocks) {
    const row = document.createElement("tr");
    const currentPrice = await fetchStockPrice(stock.symbol);

    const profitLoss = currentPrice
      ? ((currentPrice - stock.buyPrice) * stock.shares).toFixed(2)
      : "N/A";

    row.innerHTML = `
      <td>${stock.symbol}</td>
      <td>${stock.shares}</td>
      <td>₹${stock.buyPrice.toFixed(2)}</td>
      <td>${currentPrice ? `₹${currentPrice.toFixed(2)}` : 'Loading...'}</td>
      <td>${currentPrice ? `₹${profitLoss}` : '-'}</td>
    `;
    tbody.appendChild(row);
  }
}

// Run on page load
document.addEventListener("DOMContentLoaded", renderStocks);

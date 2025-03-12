let transactions = []; // Array to store all transactions
let currentPage = 1; // Track the current page
const transactionsPerPage = 3; // Number of transactions per page

// Function to add a transaction
function addTransaction(name, type, date, amount, tag) {
  const transaction = { name, type, date, amount, tag };
  transactions.push(transaction); // Add to the transactions array
  updateTotals(); // Update total income and expenses
  renderTable(); // Update the table
}

// Function to update total income and expenses
function updateTotals() {
  const totalIncome = transactions
    .filter((transaction) => transaction.type === "income")
    .reduce((sum, transaction) => sum + transaction.amount, 0);

  const totalExpenses = transactions
    .filter((transaction) => transaction.type === "expense")
    .reduce((sum, transaction) => sum + transaction.amount, 0);

  const currentBalance = totalIncome - totalExpenses;

  // Update the UI
  document.getElementById("totalIncome").textContent = `₹${totalIncome}`;
  document.getElementById("totalExpenses").textContent = `₹${totalExpenses}`;
  document.getElementById("currentBalance").textContent = `₹${currentBalance}`;
}

// Function to render the table based on the current page and filter
function renderTable(filter = "all") {
  const tableBody = document.querySelector("table tbody");
  tableBody.innerHTML = ""; // Clear the table

  // Filter transactions based on the selected filter
  let filteredTransactions = transactions;
  if (filter === "income") {
    filteredTransactions = transactions.filter(
      (transaction) => transaction.type === "income"
    );
  } else if (filter === "expense") {
    filteredTransactions = transactions.filter(
      (transaction) => transaction.type === "expense"
    );
  }

  // Calculate the range of transactions to display
  const startIndex = (currentPage - 1) * transactionsPerPage;
  const endIndex = startIndex + transactionsPerPage;
  const transactionsToDisplay = filteredTransactions.slice(startIndex, endIndex);

  // Add transactions to the table
  if (transactionsToDisplay.length > 0) {
    transactionsToDisplay.forEach((transaction) => {
      const newRow = document.createElement("tr");
      newRow.innerHTML = `
        <td>${transaction.name}</td>
        <td>${transaction.type}</td>
        <td>${transaction.date}</td>
        <td>₹${transaction.amount}</td>
        <td>${transaction.tag}</td>
      `;
      tableBody.appendChild(newRow);
    });
  } else {
    // Show "No data" message if no transactions are available
    const noDataRow = document.createElement("tr");
    noDataRow.classList.add("no-data");
    noDataRow.innerHTML = `<td colspan="5">No data</td>`;
    tableBody.appendChild(noDataRow);
  }

  // Update pagination controls
  updatePaginationControls(filteredTransactions.length);
}

// Function to update pagination controls
function updatePaginationControls(totalTransactions) {
  const paginationControls = document.getElementById("pagination-controls");
  const totalPages = Math.ceil(totalTransactions / transactionsPerPage);

  paginationControls.innerHTML = ""; // Clear existing controls

  // Add "Previous" button
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

  // Add page numbers
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

  // Add "Next" button
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

// Function to add income
function addIncome() {
  const name = document.getElementById("incomeName").value;
  const amount = parseFloat(document.getElementById("incomeAmount").value);
  const date = document.getElementById("incomeDate").value;
  const tag = document.getElementById("incomeTag").value;

  if (!name || !amount || !date || !tag) {
    alert("Please fill all fields");
    return;
  }

  // Add the transaction
  addTransaction(name, "income", date, amount, tag);

  // Close the modal and reset the form
  closeIncomeModal();
  resetIncomeForm();
}

// Function to add expense
function addExpense() {
  const name = document.getElementById("expenseName").value;
  const amount = parseFloat(document.getElementById("expenseAmount").value);
  const date = document.getElementById("expenseDate").value;
  const tag = document.getElementById("expenseTag").value;

  if (!name || !amount || !date || !tag) {
    alert("Please fill all fields");
    return;
  }

  // Add the transaction
  addTransaction(name, "expense", date, amount, tag);

  // Close the modal and reset the form
  closeExpenseModal();
  resetExpenseForm();
}

// Function to close the income modal
function closeIncomeModal() {
  document.getElementById("incomeModal").style.display = "none";
}

// Function to close the expense modal
function closeExpenseModal() {
  document.getElementById("expenseModal").style.display = "none";
}

// Function to reset the income form
function resetIncomeForm() {
  document.getElementById("incomeName").value = "";
  document.getElementById("incomeAmount").value = "";
  document.getElementById("incomeDate").value = "";
  document.getElementById("incomeTag").value = "";
}

// Function to reset the expense form
function resetExpenseForm() {
  document.getElementById("expenseName").value = "";
  document.getElementById("expenseAmount").value = "";
  document.getElementById("expenseDate").value = "";
  document.getElementById("expenseTag").value = "";
}

// Function to reset the balance
function resetBalance() {
  transactions = []; // Clear all transactions
  currentPage = 1; // Reset to the first page
  updateTotals(); // Reset totals
  renderTable(); // Re-render the table
}

// Function to logout
function logout() {
  alert("Logged out successfully!");
}

// Function to export transactions to CSV
function exportToCSV() {
  // Create the CSV header
  let csvContent = "Name,Type,Date,Amount,Tag\n";

  // Add each transaction to the CSV
  transactions.forEach((transaction) => {
    csvContent += `${transaction.name},${transaction.type},${transaction.date},${transaction.amount},${transaction.tag}\n`;
  });

  // Create a Blob with the CSV data
  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });

  // Create a link element to trigger the download
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = "transactions.csv"; // File name
  link.style.display = "none";

  // Append the link to the document and trigger the download
  document.body.appendChild(link);
  link.click();

  // Clean up
  document.body.removeChild(link);
  URL.revokeObjectURL(link.href);
}

// Function to import transactions from CSV
function importFromCSV() {
  // Create a file input element
  const fileInput = document.createElement("input");
  fileInput.type = "file";
  fileInput.accept = ".csv"; // Only allow CSV files
  fileInput.style.display = "none";

  // Add event listener to handle file selection
  fileInput.addEventListener("change", function (event) {
    const file = event.target.files[0]; // Get the selected file
    if (file) {
      const reader = new FileReader(); // Create a FileReader to read the file

      // Define what happens when the file is read
      reader.onload = function (e) {
        const csvContent = e.target.result; // Get the file content
        const rows = csvContent.split("\n"); // Split the content into rows

        // Parse each row and add it to the transactions array
        for (let i = 1; i < rows.length; i++) { // Start from 1 to skip the header
          const row = rows[i].trim();
          if (row) {
            const [name, type, date, amount, tag] = row.split(","); // Split the row into columns
            if (name && type && date && amount && tag) {
              addTransaction(name, type, date, parseFloat(amount), tag); // Add the transaction
            }
          }
        }

        // Update the UI
        updateTotals();
        renderTable();
      };

      reader.readAsText(file); // Read the file as text
    }
  });

  // Trigger the file input dialog
  document.body.appendChild(fileInput);
  fileInput.click();

  // Clean up
  document.body.removeChild(fileInput);
}

// Add event listeners to buttons
document.addEventListener("DOMContentLoaded", function () {
  // Sort by Date button
  document
    .querySelector(".sort-buttons .btn:nth-child(2)")
    .addEventListener("click", sortByDate);

  // Sort by Amount button
  document
    .querySelector(".sort-buttons .btn:nth-child(3)")
    .addEventListener("click", sortByAmount);

  // Add Income button
  document
    .querySelector(".card-container .card:nth-child(2) .btn")
    .addEventListener("click", showIncomeForm);

  // Add Expense button
  document
    .querySelector(".card-container .card:nth-child(3) .btn")
    .addEventListener("click", showExpenseForm);

  // Filter dropdown change event
  document
    .querySelector(".filter-select")
    .addEventListener("change", function () {
      currentPage = 1; // Reset to the first page when filter changes
      renderTable(this.value);
    });

  // Export to CSV button
  document
    .querySelector(".export-import .btn:nth-child(1)")
    .addEventListener("click", exportToCSV);

  // Import from CSV button
  document
    .querySelector(".export-import .btn:nth-child(2)")
    .addEventListener("click", importFromCSV);
});

// Function to sort transactions by date (earliest to latest)
function sortByDate() {
  // Sort all transactions by date (earliest to latest)
  transactions.sort((a, b) => new Date(a.date) - new Date(b.date));

  // Re-render the table with the sorted transactions
  renderTable(document.querySelector(".filter-select").value);
}

// Function to sort transactions by amount (less to more)
function sortByAmount() {
  // Sort all transactions by amount (less to more)
  transactions.sort((a, b) => a.amount - b.amount);

  // Re-render the table with the sorted transactions
  renderTable(document.querySelector(".filter-select").value);
}

// Function to show the income modal
function showIncomeForm() {
  document.getElementById("incomeModal").style.display = "flex";
}

// Function to show the expense modal
function showExpenseForm() {
  document.getElementById("expenseModal").style.display = "flex";
}
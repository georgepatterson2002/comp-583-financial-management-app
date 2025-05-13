// Load transactions from storage
let transactions = [];

function loadTransactionsFromStorage() {
  const stored = localStorage.getItem("transactions");
  if (stored) {
    transactions = JSON.parse(stored);
  }
}

function getStartOfWeek(date) {
  const day = date.getDay();
  const diff = date.getDate() - day + (day === 0 ? -6 : 1);
  return new Date(date.setDate(diff));
}

function formatWeekRange(startDate) {
  const endDate = new Date(startDate);
  endDate.setDate(startDate.getDate() + 6);
  const options = { month: 'short', day: 'numeric' };
  return `${startDate.toLocaleDateString('en-US', options)}–${endDate.toLocaleDateString('en-US', options)}`;
}

function calculateWeeklyTotal(startDate, endDate) {
  return transactions
    .filter(t => t.type === "expense" && new Date(t.date) >= startDate && new Date(t.date) <= endDate)
    .reduce((sum, t) => sum + t.amount, 0);
}

function getTopTransactionsForWeek(startDate, endDate, limit = 3) {
  return transactions
    .filter(t =>
      t.type === "expense" &&
      new Date(t.date) >= startDate &&
      new Date(t.date) <= endDate
    )
    .sort((a, b) => b.amount - a.amount)
    .slice(0, limit);
}

function generateWeeklyRanges(count = 3) {
  const weeks = [];
  let current = getStartOfWeek(new Date());

  for (let i = 0; i < count; i++) {
    const start = new Date(current);
    const end = new Date(current);
    end.setDate(start.getDate() + 6);

    const amount = calculateWeeklyTotal(start, end);
    const label = formatWeekRange(start);
    weeks.unshift({ label, amount, start, end });

    current.setDate(current.getDate() - 7);
  }

  return weeks;
}

function generateDailyRanges(days = 5) {
  const output = [];
  const today = new Date();

  for (let i = days - 1; i >= 0; i--) {
    const date = new Date(today);
    date.setDate(today.getDate() - i);

    const amount = calculateDailyTotal(date);
    const label = date.toLocaleDateString('en-US', { weekday: 'short' });

    output.push({ label, amount, date });
  }

  return output;
}

function calculateDailyTotal(targetDate) {
  return transactions
    .filter(t => {
      if (t.type !== "expense") return false;
      const txnDate = new Date(t.date);
      return (
        txnDate.getFullYear() === targetDate.getFullYear() &&
        txnDate.getMonth() === targetDate.getMonth() &&
        txnDate.getDate() === targetDate.getDate()
      );
    })
    .reduce((sum, t) => sum + t.amount, 0);
}

function getTodaysTopTransactions(limit = 3) {
  const today = new Date();

  return transactions
    .filter(t => {
      if (t.type !== "expense") return false;
      const txnDate = new Date(t.date);
      return (
        txnDate.getFullYear() === today.getFullYear() &&
        txnDate.getMonth() === today.getMonth() &&
        txnDate.getDate() === today.getDate()
      );
    })
    .sort((a, b) => b.amount - a.amount)
    .slice(0, limit);
}

function generateMonthlySummary(count = 4) {
  const now = new Date();
  const months = [];

  for (let i = count - 1; i >= 0; i--) {
    const monthStart = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const monthEnd = new Date(monthStart.getFullYear(), monthStart.getMonth() + 1, 0);

    const label = monthStart.toLocaleString('default', { month: 'short' });
    const amount = transactions
      .filter(t => {
        if (t.type !== "expense") return false;
        const txnDate = new Date(t.date);
        return txnDate >= monthStart && txnDate <= monthEnd;
      })
      .reduce((sum, t) => sum + t.amount, 0);

    months.push({ label, amount, monthStart, monthEnd });
  }

  return months;
}

function getTopTransactionsForMonth(startDate, endDate, limit = 3) {
  return transactions
    .filter(t => t.type === "expense" && new Date(t.date) >= startDate && new Date(t.date) <= endDate)
    .sort((a, b) => b.amount - a.amount)
    .slice(0, limit);
}

function switchSummaryTab(type) {
  const buttons = document.querySelectorAll('.tab-btn');
  buttons.forEach(btn => btn.classList.remove('active'));

  const activeBtn = { daily: 0, weekly: 1, monthly: 2 }[type];
  if (buttons[activeBtn]) buttons[activeBtn].classList.add('active');

  const summary = document.getElementById('debitChartSummary');
  summary.innerHTML = '';
  const meta = document.querySelector(".summary-meta");

  if (type === 'daily') {
    const days = generateDailyRanges(5);
    let total = 0;

    days.forEach(day => {
      const div = document.createElement('div');
      div.className = 'summary-period';
      div.innerHTML = `<div>${day.label}</div><div>₹${day.amount.toFixed(2)}</div>`;
      summary.appendChild(div);
      total += day.amount;
    });

    const topToday = getTodaysTopTransactions();
    meta.innerHTML = `
      <p><strong>Daily average:</strong> ₹${(total / days.length).toFixed(2)}</p>
      <p><strong>Today's top transactions:</strong><br>
        ${topToday.length > 0
          ? topToday.map(t => `• ${t.name} - ₹${t.amount.toFixed(2)}`).join('<br>')
          : `We couldn't find any transactions today.`}
      </p>
    `;

  } else if (type === 'weekly') {
    const weeks = generateWeeklyRanges(3);
    let total = 0;

    weeks.forEach(week => {
      const div = document.createElement('div');
      div.className = 'summary-period';
      div.innerHTML = `<div>${week.label}</div><div>₹${week.amount.toFixed(2)}</div>`;
      summary.appendChild(div);
      total += week.amount;
    });

    const currentWeek = weeks[weeks.length - 1];
    const topWeekTxns = getTopTransactionsForWeek(currentWeek.start, currentWeek.end);

    meta.innerHTML = `
      <p><strong>Weekly average:</strong> ₹${(total / weeks.length).toFixed(2)}</p>
      <p><strong>This week's top transactions:</strong><br>
        ${topWeekTxns.length > 0
          ? topWeekTxns.map(t => `• ${t.name} - ₹${t.amount.toFixed(2)}`).join('<br>')
          : `No transactions found for this week.`}
      </p>
    `;

  } else if (type === 'monthly') {
    const months = generateMonthlySummary(4);
    let total = 0;

    months.forEach(month => {
      const div = document.createElement('div');
      div.className = 'summary-period';
      div.innerHTML = `<div>${month.label}</div><div>₹${month.amount.toFixed(2)}</div>`;
      summary.appendChild(div);
      total += month.amount;
    });

    const currentMonth = months[months.length - 1];
    const topTxns = getTopTransactionsForMonth(currentMonth.monthStart, currentMonth.monthEnd);

    meta.innerHTML = `
      <p><strong>Monthly average:</strong> ₹${(total / months.length).toFixed(2)}</p>
      <p><strong>This month's top transactions:</strong><br>
        ${topTxns.length > 0
          ? topTxns.map(t => `• ${t.name} - ₹${t.amount.toFixed(2)}`).join('<br>')
          : `We couldn't find any transactions this month.`}
      </p>
    `;
  }
}
// 🔴 New: Calculate category-wise totals between two dates
function getSpendingByCategory(monthStart, monthEnd) {
    const categoryMap = {};
    transactions.forEach(t => {
      if (t.type === "expense") {
        const txnDate = new Date(t.date);
        if (txnDate >= monthStart && txnDate <= monthEnd) {
          if (!categoryMap[t.tag]) {
            categoryMap[t.tag] = 0;
          }
          categoryMap[t.tag] += t.amount;
        }
      }
    });
    return categoryMap;
  }
  
  // 🔴 New: Helper to get start and end of the last month
  function getLastMonthRange() {
    const today = new Date();
    const start = new Date(today.getFullYear(), today.getMonth() - 1, 1);
    const end = new Date(today.getFullYear(), today.getMonth(), 0);
    return { start, end };
  }
  
  // 🔴 New: Render spending by category with this month vs last month comparison
  function renderCategorySpending() {
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0);
  
    const lastMonth = getLastMonthRange();
    const current = getSpendingByCategory(monthStart, monthEnd);
    const previous = getSpendingByCategory(lastMonth.start, lastMonth.end);
  
    const container = document.getElementById("categoryBreakdown");
    container.innerHTML = '<h3>Spending by category</h3>';
  
    const asOf = document.getElementById("categoryAsOf");
    asOf.textContent = `Posted debit card transactions as of ${now.toLocaleDateString("en-US", { month: 'short', day: 'numeric' })}`;
  
    const icons = {
      food: "🍽️",
      education: "🎓",
      office: "🗂️",
      other: "📁"
    };
  
    const categories = Object.keys({ ...current, ...previous });
  
    categories.forEach(cat => {
      const thisMonth = current[cat] || 0;
      const lastMonth = previous[cat] || 0;
  
      const row = document.createElement("div");
      row.className = "category-row";
      row.innerHTML = `
        <div class="cat-icon">${icons[cat] || icons.other}</div>
        <div class="cat-info">
          <strong>${cat.charAt(0).toUpperCase() + cat.slice(1)}</strong>
          <p>This month: ₹${thisMonth.toFixed(2)}<br><small>Last month: ₹${lastMonth.toFixed(2)}</small></p>
        </div>
      `;
      container.appendChild(row);
    });
  }
window.addEventListener("DOMContentLoaded", () => {
  loadTransactionsFromStorage();
  switchSummaryTab('daily');
  renderCategorySpending();
  renderCashFlowChart();           // ✅ Add this
  showCashFlowTab('income'); 
  renderBalanceOverTime(); 
});


function generateCashFlowData(monthsBack = 4) {
    const now = new Date();
    const labels = [];
    const incomeData = [];
    const expenseData = [];
  
    for (let i = monthsBack - 1; i >= 0; i--) {
      const monthStart = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthEnd = new Date(monthStart.getFullYear(), monthStart.getMonth() + 1, 0);
  
      const label = monthStart.toLocaleString('default', { month: 'short' });
      labels.push(label);
  
      const income = transactions
        .filter(t => t.type === 'income' && new Date(t.date) >= monthStart && new Date(t.date) <= monthEnd)
        .reduce((sum, t) => sum + t.amount, 0);
      incomeData.push(income);
  
      const expenses = transactions
        .filter(t => t.type === 'expense' && new Date(t.date) >= monthStart && new Date(t.date) <= monthEnd)
        .reduce((sum, t) => sum + t.amount, 0);
      expenseData.push(expenses);
    }
  
    return { labels, incomeData, expenseData };
  }
  
  // 🟢 New: Render a smaller bar chart for cash flow (income vs expense)
function renderCashFlowChart() {
    const now = new Date();
    const labels = [];
    const incomeData = [];
    const expenseData = [];
  
    for (let i = 3; i >= 0; i--) {
      const monthStart = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthEnd = new Date(now.getFullYear(), now.getMonth() - i + 1, 0);
  
      const label = monthStart.toLocaleString('default', { month: 'short' });
      labels.push(label);
  
      const income = transactions
        .filter(t => t.type === 'income' && new Date(t.date) >= monthStart && new Date(t.date) <= monthEnd)
        .reduce((sum, t) => sum + t.amount, 0);
      incomeData.push(income);
  
      const expense = transactions
        .filter(t => t.type === 'expense' && new Date(t.date) >= monthStart && new Date(t.date) <= monthEnd)
        .reduce((sum, t) => sum + t.amount, 0);
      expenseData.push(expense);
    }
  
    const canvas = document.getElementById("cashFlowChart").getContext("2d");
    if (window.cashFlowChart instanceof Chart) {
      window.cashFlowChart.destroy();
    }
  
    window.cashFlowChart = new Chart(canvas, {
      type: 'bar',
      data: {
        labels: labels,
        datasets: [
          {
            label: 'Money In',
            data: incomeData,
            backgroundColor: 'purple',
            barThickness: 12 // 🟢 Further reduce bar width
          },
          {
            label: 'Money Out',
            data: expenseData,
            backgroundColor: 'blue',
            barThickness: 20 // 🟢 Reduced bar width
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: true, // 🟢 Keep aspect ratio to reduce height
        scales: {
          y: {
            beginAtZero: true
          }
        }
      }
    });
  }
  
  function showCashFlowTab(type) {
    const container = document.getElementById("cashFlowDetails");
    const currentMonth = new Date();
    const start = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1);
    const end = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0);
  
    const topTxns = transactions
      .filter(t => t.type === type && new Date(t.date) >= start && new Date(t.date) <= end)
      .sort((a, b) => b.amount - a.amount)
      .slice(0, 3);
  
    container.innerHTML = `
      <p><strong>This month’s top ${type === 'income' ? 'income sources' : 'expenses'}:</strong></p>
      ${topTxns.length > 0
        ? topTxns.map(t => `<div>${t.name} - ₹${t.amount.toFixed(2)}</div>`).join('')
        : '<p>No data available.</p>'
      }
    `;
  
    document.querySelectorAll('.tab-switcher .tab-btn').forEach(btn => btn.classList.remove('active'));
    const activeBtn = document.querySelector(`.tab-btn[onclick*="${type}"]`);
    if (activeBtn) activeBtn.classList.add('active');
  }
  function renderBalanceOverTime() {
    const now = new Date();
    const labels = [];
    const balances = [];
  
    let runningBalance = 0;
  
    for (let i = 3; i >= 0; i--) {
      const monthStart = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthEnd = new Date(now.getFullYear(), now.getMonth() - i + 1, 0);
  
      const label = monthStart.toLocaleString('default', { month: 'short' });
      labels.push(label);
  
      const income = transactions
        .filter(t => t.type === 'income' && new Date(t.date) >= monthStart && new Date(t.date) <= monthEnd)
        .reduce((sum, t) => sum + t.amount, 0);
  
      const expense = transactions
        .filter(t => t.type === 'expense' && new Date(t.date) >= monthStart && new Date(t.date) <= monthEnd)
        .reduce((sum, t) => sum + t.amount, 0);
  
      runningBalance += income - expense;
      balances.push(runningBalance);
    }
  
    // Update current balance value
    const currentBalance = balances[balances.length - 1] || 0;
    document.getElementById("presentBalance").textContent = `₹${currentBalance.toFixed(2)}`;
  
    const ctx = document.getElementById("balanceChart").getContext("2d");
  
    if (window.balanceChart instanceof Chart) {
      window.balanceChart.destroy();
    }
  
    window.balanceChart = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: labels,
        datasets: [{
          label: 'Balance',
          data: balances,
          backgroundColor: '#2e7d32'
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: true,
        plugins: {
          legend: { display: false }
        },
        scales: {
          y: {
            beginAtZero: true
          }
        }
      }
    });
  }
  

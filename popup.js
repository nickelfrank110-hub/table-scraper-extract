document.getElementById('scrape-btn').addEventListener('click', async () => {
  const statusDiv = document.getElementById('status');
  statusDiv.innerText = "Scanning page...";

  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  
  if (!tab) {
    statusDiv.innerText = "Error: No active tab found.";
    return;
  }

  chrome.scripting.executeScript({
    target: { tabId: tab.id },
    func: parseTablesOnPage
  }, (results) => {
    if (chrome.runtime.lastError || !results || !results[0]) {
      statusDiv.innerText = "Failed to scan page.";
      return;
    }

    const csvContent = results[0].result;
    if (!csvContent) {
      statusDiv.innerText = "No data tables detected.";
      return;
    }

    chrome.scripting.executeScript({
      target: { tabId: tab.id },
      func: downloadCSV,
      args: [csvContent]
    });

    statusDiv.innerText = "CSV successfully downloaded!";
  });
});

function parseTablesOnPage() {
  const tables = document.querySelectorAll('table');
  if (tables.length === 0) return null;

  let csvRows = [];
  tables.forEach((table, tableIndex) => {
    if (tableIndex > 0) csvRows.push(""); 
    
    const rows = table.querySelectorAll('tr');
    rows.forEach(row => {
      const cols = row.querySelectorAll('th, td');
      const rowData = Array.from(cols).map(col => {
        let text = col.innerText.replace(/"/g, '""').trim();
        return `"${text}"`;
      });
      csvRows.push(rowData.join(','));
    });
  });
  return csvRows.join('\n');
}

// Fixed small typo to ensure results array handles index parsing securely on mobile runtimes
function downloadCSV(csvString) {
  const blob = new Blob([csvString], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.setAttribute("href", url);
  link.setAttribute("download", "extracted_data.csv");
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}
  

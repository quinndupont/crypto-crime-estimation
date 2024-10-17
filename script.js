// script.js

let crimeData = [];
let totalVolumeData = [];
let adjustedCrimeData = [];
let discountFactor = 0; // Discount percentage for base rates (e.g., exchange volume)
let increaseFactor = 0; // Increase percentage for estimated categories of crime

// Fetch results.csv
fetch('results.csv')
    .then(response => response.text())
    .then(csvText => {
        crimeData = Papa.parse(csvText, {
            header: true,
            dynamicTyping: true
        }).data;

        // After crime data is loaded, fetch the volume data
        fetch('Coinmarketcap-volume-24h.csv')
            .then(response => response.text())
            .then(csvText => {
                totalVolumeData = Papa.parse(csvText, {
                    header: true,
                    dynamicTyping: true
                }).data;

                // Now that both datasets are loaded, proceed to create table and plot
                createTable();
                calculateAndPlot();
            });
    })
    .catch(error => {
        console.error('Error loading CSV files:', error);
    });

// Create a set of unique crime types
let crimeTypes = new Set();

function createTable() {
    const tableContainer = document.getElementById('tableContainer');
    let tableHTML = '<table><tr><th>Include</th><th>Category</th><th>Adjustment Factor</th></tr>';

    crimeData.forEach((row) => {
        crimeTypes.add(row.type);
    });

    crimeTypes.forEach((type) => {
        tableHTML += `<tr>
            <td><input type="checkbox" data-type="${type}" checked /></td>
            <td>${type}</td>
            <td><input type="number" step="0.1" data-type="${type}" data-field="Adjustment_Factor" value="1" /></td>
        </tr>`;
    });

    tableHTML += '</table>';
    tableContainer.innerHTML = tableHTML;

    // Add event listeners
    const inputs = tableContainer.querySelectorAll('input');
    inputs.forEach(input => {
        input.addEventListener('input', () => {
            calculateAndPlot();
        });

        // Add change event listener for checkboxes
        if (input.type === 'checkbox') {
            input.addEventListener('change', () => {
                calculateAndPlot();
            });
        }
    });

    // Add event listeners for discount button and increase slider
    document.getElementById('discountButton').addEventListener('click', () => {
        discountFactor = parseFloat(document.getElementById('discountInput').value) || 0;
        calculateAndPlot();
    });

    document.getElementById('increaseSlider').addEventListener('input', () => {
        increaseFactor = parseFloat(document.getElementById('increaseSlider').value) || 0;
        document.getElementById('increaseValue').innerText = increaseFactor + '%';
        calculateAndPlot();
    });
}

function calculateAndPlot() {
    // First, parse the date strings into Date objects
    totalVolumeData.forEach(row => {
        row.DateTime = new Date(row.DateTime);
    });

    // Sort the totalVolumeData by date
    totalVolumeData.sort((a, b) => a.DateTime - b.DateTime);

    let dates = totalVolumeData.map(row => row.DateTime);
    let totalVolumes = totalVolumeData.map(row => row['Volume (24h)']);

    // Prepare crime data per year
    let crimeDataByYear = {};

    crimeData.forEach(row => {
        let year = row.year.toString();
        let type = row.type;
        let volume = parseFloat(row.volume.toString().replace(/[\$,]/g, '')); // Remove $ and commas

        if (!crimeDataByYear[year]) {
            crimeDataByYear[year] = {};
        }

        crimeDataByYear[year][type] = volume;
    });

    // Apply discount and increase factors
    adjustedCrimeData = [];

    dates.forEach((date, index) => {
        let totalVolume = totalVolumes[index];
        let year = date.getFullYear().toString();

        let crimeVolumes = crimeDataByYear[year] || {};
        let adjustedVolume = 0;

        crimeTypes.forEach(type => {
            const includeCheckbox = document.querySelector(`input[type="checkbox"][data-type="${type}"]`);
            const include = includeCheckbox ? includeCheckbox.checked : true;

            let adjustmentInput = document.querySelector(`input[type="number"][data-type="${type}"]`);
            let adjustmentFactor = adjustmentInput ? parseFloat(adjustmentInput.value) : 1;

            let volume = crimeVolumes[type] || 0;

            // Apply increase factor to estimated categories
            volume = volume * (1 + increaseFactor / 100);

            // Apply adjustment factor per category
            volume = volume * adjustmentFactor;

            if (include) {
                adjustedVolume += volume;
            }
        });

        // Apply discount factor to base rates (e.g., exchange volume)
        let discountedTotalVolume = totalVolume * (1 - discountFactor / 100);

        adjustedCrimeData.push({
            date: date,
            totalVolume: discountedTotalVolume,
            adjustedIllicitVolume: adjustedVolume
        });
    });

    // Prepare data for plotting
    let plotDates = adjustedCrimeData.map(d => d.date);
    let plotTotalVolumes = adjustedCrimeData.map(d => d.totalVolume);
    let plotIllicitVolumes = adjustedCrimeData.map(d => d.adjustedIllicitVolume);

    plotData(plotDates, plotTotalVolumes, plotIllicitVolumes);
}

function plotData(dates, totalVolumes, illicitVolumes) {
    const trace1 = {
        x: dates,
        y: totalVolumes,
        mode: 'lines',
        name: 'Total Transaction Volume (Discounted)',
        line: { color: 'blue' }
    };

    const trace2 = {
        x: dates,
        y: illicitVolumes,
        mode: 'lines',
        name: 'Adjusted Illicit Volume',
        line: { color: 'orange' }
    };

    const data = [trace1, trace2];

    const layout = {
        title: 'Cryptocurrency Transaction Volume and Adjusted Illicit Volume Over Time',
        xaxis: {
            title: 'Date',
            type: 'date',
            tickformat: '%Y-%m-%d',
            tick0: dates[0],
            dtick: 'M12' // Tick every 12 months
        },
        yaxis: {
            title: 'Volume ($)',
            tickformat: ',.0f'
        },
        legend: {
            x: 0,
            y: 1
        }
    };

    Plotly.newPlot('chart', data, layout, { responsive: true });
}

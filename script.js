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
            dynamicTyping: true,
            skipEmptyLines: true
        }).data;

        // After crime data is loaded, fetch the volume data
        fetch('Coinmarketcap-volume-24h.csv')
            .then(response => response.text())
            .then(csvText => {
                totalVolumeData = Papa.parse(csvText, {
                    header: true,
                    dynamicTyping: true,
                    skipEmptyLines: true
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
        if (row && row.type) {
            crimeTypes.add(row.type);
        }
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
        if (row && row.DateTime) {
            row.DateTime = new Date(row.DateTime);
        }
    });

    // Sort the totalVolumeData by date
    totalVolumeData.sort((a, b) => a.DateTime - b.DateTime);

    // Prepare crime data per year
    let crimeDataByYear = {};

    crimeData.forEach(row => {
        if (row && row.year != null && row.volume != null) {
            let year = row.year.toString();
            let type = row.type;
            let volume = parseFloat(row.volume.toString().replace(/[\$,]/g, '')); // Remove $ and commas

            if (!crimeDataByYear[year]) {
                crimeDataByYear[year] = {};
            }

            crimeDataByYear[year][type] = volume;
        } else {
            console.warn('Invalid row in crimeData:', row);
        }
    });

    // Calculate total transaction volume per year
    let totalVolumeByYear = {};
    totalVolumeData.forEach(row => {
        let date = row.DateTime;
        let volume = row['Volume (24h)'];
        let year = date.getFullYear().toString();

        if (!totalVolumeByYear[year]) {
            totalVolumeByYear[year] = 0;
        }
        totalVolumeByYear[year] += volume;
    });

    // Apply discount and increase factors
    adjustedCrimeData = [];

    totalVolumeData.forEach((row) => {
        let date = row.DateTime;
        let totalVolume = row['Volume (24h)'];
        let year = date.getFullYear().toString();

        let crimeVolumes = crimeDataByYear[year] || {};
        let adjustedVolume = 0;

        // Calculate proportion of day's volume to year's total volume
        let totalVolumeYear = totalVolumeByYear[year] || 1; // Avoid division by zero
        let volumeProportion = totalVolume / totalVolumeYear;

        crimeTypes.forEach(type => {
            const includeCheckbox = document.querySelector(`input[type="checkbox"][data-type="${type}"]`);
            const include = includeCheckbox ? includeCheckbox.checked : true;

            let adjustmentInput = document.querySelector(`input[type="number"][data-type="${type}"]`);
            let adjustmentFactor = adjustmentInput ? parseFloat(adjustmentInput.value) : 1;

            let categoryYearlyVolume = crimeVolumes[type] || 0;

            // Apply increase factor to estimated categories
            let adjustedCategoryVolume = categoryYearlyVolume * adjustmentFactor * (1 + increaseFactor / 100);

            // Distribute the yearly category volume to the day based on volume proportion
            let dailyCategoryVolume = adjustedCategoryVolume * volumeProportion;

            if (include) {
                adjustedVolume += dailyCategoryVolume;
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
    // Convert volumes to millions for plotting
    const totalVolumesInMillions = totalVolumes.map(value => value / 1e6);
    const illicitVolumesInMillions = illicitVolumes.map(value => value / 1e6);

    const trace1 = {
        x: dates,
        y: totalVolumesInMillions,
        mode: 'lines',
        name: 'Total Transaction Volume',
        line: { color: 'blue' },
        yaxis: 'y1',
        hovertemplate: 'Date: %{x|%b %d, %Y}<br>Total Volume: %{y:.2f}M USD<extra></extra>'
    };

    const trace2 = {
        x: dates,
        y: illicitVolumesInMillions,
        mode: 'lines',
        name: 'Adjusted Illicit Volume',
        line: { color: 'orange' },
        yaxis: 'y1',
        hovertemplate: 'Date: %{x|%b %d, %Y}<br>Illicit Volume: %{y:.2f}M USD<extra></extra>'
    };

    const data = [trace1, trace2];

    const layout = {
        title: 'Cryptocurrency Transaction Volume and Adjusted Illicit Volume Over Time',
        xaxis: {
            title: 'Date',
            type: 'date',
            tickformat: '%b %Y',
            tickangle: -45,
            tickmode: 'auto',
            nticks: 20,
            automargin: true
        },
        yaxis: {
            title: 'Volume ($ Millions)',
            type: 'log',
            autorange: true,
            tickformat: ',.0f',
            ticksuffix: 'M',
            automargin: true
        },
        legend: {
            x: 0,
            y: 1
        },
        margin: {
            t: 50,
            l: 70,
            r: 50,
            b: 100
        }
    };

    Plotly.newPlot('chart', data, layout, { responsive: true });
}

# Cryptocurrency Crime Rate Estimation

This tool is designed to estimate the proportion of cryptocurrency transactions used for illicit activities by analyzing known crime data and adjusting base rates. It provides an interactive interface where users can adjust variables and see how they impact the estimated illicit volume over time.

## Table of Contents

- [Features](#features)
- [Demo](#demo)
- [Usage](#usage)
- [Data Sources](#data-sources)

---

## Features

- **Interactive Controls**: Adjust discount rates and increase factors to see real-time updates on the plot.
- **Dynamic Plotting**: Visualize total transaction volumes and adjusted illicit volumes over time.
- **Customizable Data**: Include or exclude specific crime categories and adjust their impact.

---

## Demo

[Live Demo](https://quinndupont.github.io/crypto-crime-estimation/)

---

## Usage
1. Open the Application
Open your web browser and navigate to http://localhost:8000.
2. Interact with the Controls
Discount Base Rates (%): Input a percentage to discount the base transaction volumes and click "Apply Discount".
Increase Estimated Categories (%): Use the slider to increase the impact of estimated crime categories.
Include/Exclude Categories: Check or uncheck boxes next to each category to include or exclude them from calculations.
Adjustment Factor: Modify the adjustment factor for each category to change its weight in the calculations.
3. View the Dynamic Plot
The plot will update dynamically as you adjust the controls, displaying the total transaction volume and the adjusted illicit volume over time.
4. Understand the Data
Refer to the explanations provided on the page to understand the mathematical model and the dataset used.

## Data Sources
1. results.csv
Contains crime data with the following headers: year, type, volume.
The volume values represent the known illicit volumes for different crime categories.
2. Coinmarketcap-volume-24h.csv
Contains historical daily total transaction volumes.
Headers: DateTime, Volume (24h).
3. Data Explanation
The data is sourced from Chainalysis estimates.
In 2023, approximately $24.2 billion was received by illicit addresses, representing about 0.34% of the total on-chain transaction volume.
Included in Estimates:
Funds sent to addresses identified as illicit.
Funds stolen in cryptocurrency hacks.
Excluded from Estimates:
Funds sent to addresses not yet identified as illicit.
Funds derived from non-crypto-native crimes (unless specifically reported).
Funds associated with unconvicted crypto platforms accused of fraud.
Transaction volumes potentially linked to market manipulation.
Funds involved in cryptocurrency money laundering (to avoid double-counting).

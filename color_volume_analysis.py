import sys
from PIL import Image
import os
import re
import csv

def hex_to_rgb(hex_color):
    """Convert hex color string to an RGB tuple."""
    hex_color = hex_color.strip('#')
    return tuple(int(hex_color[i:i+2], 16) for i in (0, 2 ,4))

def get_color_category(pixel_color, color_map_multi):
    """Find the categories for a given RGB color using color distance."""
    tolerance = 30  # Adjust threshold as needed
    min_distance = float('inf')
    matched_categories = []
    for hex_color, categories in color_map_multi.items():
        rgb_color = hex_to_rgb(hex_color)
        distance = sum((c1 - c2) ** 2 for c1, c2 in zip(pixel_color, rgb_color)) ** 0.5
        if distance < min_distance:
            min_distance = distance
            matched_categories = categories
    # Accept the match if within the tolerance
    if min_distance <= tolerance:
        return matched_categories
    else:
        return []

def process_images(image_files):
    # Define the color map based on the provided hex values and categories
    color_map_multi = {
        'FCAA00': ['sanctioned jurisdiction'],
        'FDD480': ['special measures'],
        'C0E2D2': ['terrorism financing'],
        '84C7A6': ['online pharmacy'],
        '9AB9B2': ['ftx fraud'],
        '377165': ['sanctioned entity'],
        '122149': ['ransomware'],
        '5C9BA8': ['cybercriminal administrator'],
        'AECDD4': ['fraud shop'],
        'E2F2FA': ['CSAM'],
        'C5E6F6': ['malware'],
        'BCCBED': ['stolen funds'],
        '6178BA': ['scam'],
        '293972': ['darknet market'],
    }

    total_unmatched_pixels = 0
    total_pixels_processed = 0

    # Prepare the CSV file for appending data
    csv_file = 'results.csv'
    # Check if the file exists to determine if we need to write headers
    write_header = not os.path.isfile(csv_file)

    with open(csv_file, 'a', newline='', encoding='utf-8') as csvfile:
        fieldnames = ['year', 'type', 'volume']
        writer = csv.DictWriter(csvfile, fieldnames=fieldnames)
        if write_header:
            writer.writeheader()

        for image_file in image_files:
            if not os.path.isfile(image_file):
                print(f"File not found: {image_file}")
                continue

            # Extract total value and year from filename using regex
            match = re.match(r"([\d_]+)-(\d{4})\.png$", os.path.basename(image_file))
            if not match:
                print(f"Filename does not match expected pattern: {image_file}")
                continue

            total_str, year = match.groups()
            total_value = float(total_str.replace('_', '.')) * 1e9  # Convert to dollars

            # Open the image
            with Image.open(image_file) as img:
                # Convert image to RGB mode if not already
                img = img.convert('RGB')
                pixels = img.getdata()
                total_pixels = len(pixels)
                total_pixels_processed += total_pixels

                color_counts = {}
                unmatched_pixels = 0
                for pixel in pixels:
                    categories = get_color_category(pixel, color_map_multi)
                    if categories:
                        for category in categories:
                            if category not in color_counts:
                                color_counts[category] = 0
                            color_counts[category] += 1
                    else:
                        unmatched_pixels += 1

                total_unmatched_pixels += unmatched_pixels

                # Calculate percentages and volumes
                print(f"\nProcessing image: {image_file}")
                print(f"Year: {year}")
                print(f"Total Value: ${total_value:,.2f}")
                print("Category Analysis:")
                for category, count in color_counts.items():
                    percentage = (count / total_pixels) * 100
                    volume = (percentage / 100) * total_value
                    formatted_volume = f"${volume:,.2f}"
                    print(f"Category '{category}': {percentage:.2f}% - Volume: {formatted_volume}")

                    # Append the result to CSV file
                    writer.writerow({'year': year, 'type': category, 'volume': formatted_volume})

                if unmatched_pixels > 0:
                    unmatched_percentage = (unmatched_pixels / total_pixels) * 100
                    print(f"Unmatched Pixels: {unmatched_pixels} ({unmatched_percentage:.2f}% of total pixels)")

        # Optionally, print a summary of unmatched pixels
        if total_unmatched_pixels > 0:
            total_unmatched_percentage = (total_unmatched_pixels / total_pixels_processed) * 100
            print(f"\nTotal Unmatched Pixels Across All Images: {total_unmatched_pixels} ({total_unmatched_percentage:.2f}% of total pixels processed)")

if __name__ == "__main__":
    # Example usage: python script.py image1.png image2.png
    if len(sys.argv) < 2:
        print("Usage: python script.py image1.png image2.png ...")
    else:
        image_files = sys.argv[1:]
        process_images(image_files)

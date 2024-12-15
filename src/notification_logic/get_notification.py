import os
import re
import sqlite3
import subprocess
import sys

def parse_hex_data(hex_data):
    try:
        binary_data = subprocess.run(
            ['xxd', '-r', '-p'],
            input=hex_data.encode(),
            capture_output=True,
            check=True
        ).stdout

        plutil_output = subprocess.run(
            ['plutil', '-p', '-'],
            input=binary_data,
            capture_output=True,
            check=True
        ).stdout

        return plutil_output.decode()

    except subprocess.CalledProcessError as e:
        return None

def extract_field(decoded_data, field_name):
    try:
        # Use regex to extract the specified field
        match = re.search(rf'"{field_name}"\s*=>\s*"([^"]+)"', decoded_data)
        if match:
            return match.group(1)
        else:
            return None
    except Exception as e:
        return None

def get_notification():
    db_path = "/Users/nikolasvahlas/Library/Group Containers/group.com.apple.usernoted/db2/db"

    if not os.path.exists(db_path):
        return

    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()

    try:
        cursor.execute("SELECT app_id FROM app WHERE identifier LIKE '%tweetie%'")
        app_id_row = cursor.fetchone()

        if not app_id_row:
            return
        
        app_id = app_id_row[0]
        cursor.execute("""
        SELECT hex(data) 
        FROM record 
        WHERE app_id = ? 
        ORDER BY delivered_date DESC 
        LIMIT 1
        """, (app_id,))
        hex_data_row = cursor.fetchone()


        if not hex_data_row:
            return
        
        hex_data = hex_data_row[0]
        return hex_data
    finally:
        conn.close()

def get_ticker():
    database_hex_notification = get_notification()
    if not database_hex_notification:
        return

    parsed_hex_data = parse_hex_data(database_hex_notification)
    if not parsed_hex_data:
         return

    body = extract_field(parsed_hex_data, "body")
    sender = extract_field(parsed_hex_data, "titl")
    if not body or not sender:
            return

    if not sender == "Moonshot Listings":
        return

    start_keyword = "@moonshot"
    end_keyword = "$"
    start_pos = body.find(start_keyword)
    if start_pos != -1:
        start_pos += len(start_keyword)
        end_pos = body.find(end_keyword, start_pos)
        if end_pos != -1:
            contract = body[start_pos:end_pos].strip()
            return contract
    else:
        return

if __name__ == "__main__":
    contract_address = get_ticker()
    if contract_address:
        print(contract_address)

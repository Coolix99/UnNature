# replace this by mysql.connector when we scale up

import sqlite3
import os

# import mysql.connector


# Create a connection to a database file (creates the file if it doesn't exist)
# conn = sqlite3.connect("UnNature.db")

# # Connect to the MySQL server
# conn = mysql.connector.connect(
#     host="localhost",
#     user="your_username",       # Replace with your MySQL username
#     password="your_password"    # Replace with your MySQL password
# )

# Create a cursor object to execute SQL commands
# cursor = conn.cursor()

# # Create a database for mysql
# cursor.execute("CREATE DATABASE IF NOT EXISTS ./src_SQLite/UnNature.db")
# cursor.execute("USE ./src_SQLite/UnNature.db")


def initialize_database():
    directory = "./src_SQLite/"

    # Create the directory if it doesn't exist
    os.makedirs(directory, exist_ok=True)

    # Create a connection to the SQLite database
    db_path = os.path.join(directory, "UnNature.db")
    conn = sqlite3.connect(db_path)

    # Create a cursor object to execute SQL commands
    cursor = conn.cursor()

    # Create tables
    cursor.execute(
        """
    CREATE TABLE IF NOT EXISTS Users (
        user_id INTEGER PRIMARY KEY AUTOINCREMENT,
        email TEXT NOT NULL UNIQUE,
        displayed_name TEXT NOT NULL,
        password TEXT NOT NULL,
        status TEXT NOT NULL
    )
    """
    )

    cursor.execute(
        """
    CREATE TABLE IF NOT EXISTS Posts (
        post_id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        website_url TEXT NOT NULL,
        category TEXT NOT NULL,
        date_posted TEXT DEFAULT CURRENT_TIMESTAMP,
        comment TEXT NOT NULL,
        FOREIGN KEY (user_id) REFERENCES Users(user_id)
    )
    """
    )

    cursor.execute(
        """
    CREATE TABLE IF NOT EXISTS Answers (
        answer_id INTEGER PRIMARY KEY AUTOINCREMENT,
        post_id INTEGER NOT NULL,
        user_id INTEGER NOT NULL,
        date_posted TEXT DEFAULT CURRENT_TIMESTAMP,
        comment TEXT NOT NULL,
        FOREIGN KEY (post_id) REFERENCES Posts(post_id),
        FOREIGN KEY (user_id) REFERENCES Users(user_id)
    )
    """
    )

    cursor.execute(
        """
    CREATE TABLE IF NOT EXISTS Votes (
        vote_id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        post_id INTEGER NOT NULL,
        vote INTEGER NOT NULL CHECK (vote IN (-1, 1)),
        date_voted TEXT DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES Users(user_id)
    )
    """
    )

    # Commit the changes and close the connection
    conn.commit()
    conn.close()


def main():
    initialize_database()


if __name__ == "__main__":
    main()


# # Commit changes and close the connection
# conn.commit()
# print("Database and tables created successfully!")
# conn.close()

# randomly intitiliaze the database with some data

import sqlite3
import os
import random


def pick_first_name():
    names = [
        "Alice",
        "Bob",
        "Charlie",
        "Diana",
        "Eve",
        "Frank",
        "Grace",
        "Helen",
        "Ivan",
        "Jack",
        "Karl",
        "Linda",
        "Mia",
        "Nancy",
        "Oliver",
        "Pamela",
        "Quentin",
        "Rachel",
        "Steve",
        "Tina",
        "Ursula",
        "Victor",
        "Wendy",
        "Xander",
        "Yvonne",
        "Zack",
    ]
    name = random.choice(names)
    return name


def pick_last_name():
    names = [
        "Adams",
        "Brown",
        "Clark",
        "Davis",
        "Evans",
        "Fisher",
        "Garcia",
        "Harris",
        "Ivanov",
        "Johnson",
        "Klein",
        "Lopez",
        "Martinez",
        "Nelson",
        "Olsen",
        "Perez",
        "Quinn",
        "Rodriguez",
        "Smith",
        "Taylor",
        "Unger",
        "Vasquez",
        "Williams",
        "Xavier",
        "Young",
        "Zimmerman",
    ]
    name = random.choice(names)
    return name


def pick_website():
    websites = [
        "http://www.example.com",
        "http://www.example.org",
        "http://www.example.net",
        "http://www.example.edu",
        "http://www.example.gov",
        "http://www.example.biz",
        "http://www.example.info",
        "http://www.example.mil",
        "http://www.example.name",
        "http://www.example.pro",
    ]
    website = random.choice(websites)
    return website


def pick_category():
    categories = [
        "Equations",
        "Figures",
        "Protocols",
        "Data",
        "Statistics",
        "Bias",
    ]
    category = random.choice(categories)
    return category


def pick_comment():
    comments = [
        "This is a comment.",
        "This is another comment.",
        "This is yet another comment.",
        "This is a different comment.",
        "This is a new comment.",
        "This is a fresh comment.",
        "This is a stale comment.",
        "This is a boring comment.",
        "This is an exciting comment.",
        "This is a thrilling comment.",
    ]
    comment = random.choice(comments)
    return comment


def pick_vote():
    # either -1 or 1
    votes = [-1, 1]
    votes = random.choice(votes)
    return votes


def make_email(first_name, last_name):
    email = first_name.lower() + "." + last_name.lower() + "@example.com"
    return email


def make_displayed_name(first_name, last_name):
    displayed_name = first_name + " " + last_name

    alternative = "anonymous"

    if random.random() < 0.25:
        displayed_name = alternative

    return displayed_name


def make_password():
    # generate a random password
    password = ""
    for i in range(8):
        password += chr(random.randint(33, 126))

    return password


def pick_status():
    statuses = ["M.Sc.", "B.Sc.", "Ph.D.", "Postdoc", "Professor"]
    status = random.choice(statuses)
    return status


def populate_database():
    # Connect to the database
    conn = sqlite3.connect("./src_SQLite/UnNature.db")
    cursor = conn.cursor()

    # empty database
    cursor.execute("DELETE FROM Users")
    cursor.execute("DELETE FROM Posts")
    cursor.execute("DELETE FROM Answers")
    cursor.execute("DELETE FROM Votes")

    # Number of records to insert
    num_users = 50
    num_posts = 20
    num_answers = 15
    num_votes = 50

    # Insert users
    for _ in range(num_users):
        first_name = pick_first_name()
        last_name = pick_last_name()
        email = make_email(first_name, last_name)
        displayed_name = make_displayed_name(first_name, last_name)
        password = make_password()
        status = pick_status()

        cursor.execute(
            """
            INSERT INTO Users (email, displayed_name, password, status)
            VALUES (?, ?, ?, ?)
            """,
            (email, displayed_name, password, status),
        )

    # Fetch all user_ids for foreign key usage
    cursor.execute("SELECT user_id FROM Users")
    user_ids = [row[0] for row in cursor.fetchall()]

    # Insert posts
    for _ in range(num_posts):
        user_id = random.choice(user_ids)
        website_url = pick_website()
        category = pick_category()
        comment = pick_comment()

        cursor.execute(
            """
            INSERT INTO Posts (user_id, website_url, category, comment)
            VALUES (?, ?, ?, ?)
            """,
            (user_id, website_url, category, comment),
        )

    # Fetch all post_ids for foreign key usage
    cursor.execute("SELECT post_id FROM Posts")
    post_ids = [row[0] for row in cursor.fetchall()]

    # Insert answers
    for _ in range(num_answers):
        post_id = random.choice(post_ids)
        user_id = random.choice(user_ids)
        comment = pick_comment()

        cursor.execute(
            """
            INSERT INTO Answers (post_id, user_id, comment)
            VALUES (?, ?, ?)
            """,
            (post_id, user_id, comment),
        )

    # Fetch all answer_ids for foreign key usage
    cursor.execute("SELECT answer_id FROM Answers")
    # comment_ids = [row[0] for row in cursor.fetchall()]

    # insert votes for posts, based on existing user_ids and post_ids
    for _ in range(num_votes):
        user_id = random.choice(user_ids)
        post_id = random.choice(post_ids)
        vote = pick_vote()

        cursor.execute(
            """
            INSERT INTO Votes (user_id, post_id, vote)
            VALUES (?, ?, ?)
            """,
            (user_id, post_id, vote),
        )

    # add a column to Posts table that shows the total number of votes
    # that the post has received (SUM of all Votes.vote for that post_id)
    cursor.execute(
        """
        ALTER TABLE Posts
        ADD COLUMN total_votes INTEGER
        """
    )

    # update the total_votes column
    cursor.execute(
        """
        UPDATE Posts
        SET total_votes = (
            SELECT SUM(vote)
            FROM Votes
            WHERE Votes.post_id = Posts.post_id
        )
        """
    )

    # Commit and close
    conn.commit()
    conn.close()


def main():
    populate_database()


if __name__ == "__main__":
    main()

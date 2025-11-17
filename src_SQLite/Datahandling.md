# Relational Database

- Users
    - Email
    - displayed name
    - password
    - status (degree)

- website URL
- category (rubric)
- date
- Comment
- Answers
- Vote count for comments



## Tables
### Users
- user_id
- email
- displayed name
- password
- status (degree)

### Post of user 
- post_id
- user_id
- website URL
- category (rubric)
- date
- Comment

### Answer to post
- answer_id
- post_id
- user_id (who answered)
- date
- Comment

### Vote count for comments
- vote_id
- user_id (who voted)
- comment_id
- vote (+1 or -1)

## Example scenarios
1. User number 5 comments on "Equations/Typo" and writes "I think there is a typo in the equation"

### Post of user
- post_id: 1
- user_id: 5
- website URL: "https://www.example.com"
- category: "Equations/Typo"
- date: 2021-01-01
- Comment: "I think there is a typo in the equation"

2. User number 6 answers to the comment of user number 5 and writes "I think you are right" and upvotes the comment of user number 5

### Answer to post
- answer_id: 1
- post_id: 1
- user_id: 6
- date: 2021-01-02
- Comment: "I think you are right"

### Vote count for comments
- vote_id: 1
- user_id: 6
- comment_id: 1 alternatively post_id
- vote: +1

3. SQL to get the final vote count for comment_id 1

```sql
SELECT SUM(vote)
FROM vote_count_for_comments
WHERE comment_id = 1
```

4. List all answers on posts with the post_id=5, ordered by date

```sql
SELECT 
    answer_id,
    post_id,
    user_id,
    date_posted,
    comment
FROM 
    Answers
WHERE 
    post_id = 5
ORDER BY 
    date_posted ASC;

```


## Example setup

```python
import mysql.connector

# Establish the connection
conn = mysql.connector.connect(
    host="localhost",
    user="your_username",  # Replace with your database username
    password="your_password"  # Replace with your database password
)

cursor = conn.cursor()

# Create Database
cursor.execute("CREATE DATABASE IF NOT EXISTS UserPostDatabase")
cursor.execute("USE UserPostDatabase")

# Create Tables
tables = {
    "Users": """
        CREATE TABLE IF NOT EXISTS Users (
            user_id INT AUTO_INCREMENT PRIMARY KEY,
            email VARCHAR(255) NOT NULL UNIQUE,
            displayed_name VARCHAR(255) NOT NULL,
            password VARCHAR(255) NOT NULL,
            status VARCHAR(50) NOT NULL
        )
    """,
    "Posts": """
        CREATE TABLE IF NOT EXISTS Posts (
            post_id INT AUTO_INCREMENT PRIMARY KEY,
            user_id INT NOT NULL,
            website_url VARCHAR(255) NOT NULL,
            category VARCHAR(100) NOT NULL,
            date_posted DATETIME DEFAULT CURRENT_TIMESTAMP,
            comment TEXT NOT NULL,
            FOREIGN KEY (user_id) REFERENCES Users(user_id)
        )
    """,
    "Answers": """
        CREATE TABLE IF NOT EXISTS Answers (
            answer_id INT AUTO_INCREMENT PRIMARY KEY,
            post_id INT NOT NULL,
            user_id INT NOT NULL,
            date_posted DATETIME DEFAULT CURRENT_TIMESTAMP,
            comment TEXT NOT NULL,
            FOREIGN KEY (post_id) REFERENCES Posts(post_id),
            FOREIGN KEY (user_id) REFERENCES Users(user_id)
        )
    """,
    "Votes": """
        CREATE TABLE IF NOT EXISTS Votes (
            vote_id INT AUTO_INCREMENT PRIMARY KEY,
            user_id INT NOT NULL,
            comment_id INT NOT NULL,
            vote INT NOT NULL CHECK (vote IN (-1, 1)),  -- -1 for downvote, 1 for upvote
            date_voted DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES Users(user_id)
        )
    """
}

# Execute each table creation query
for table_name, table_sql in tables.items():
    cursor.execute(table_sql)

print("Database and tables created successfully!")

# Close the connection
cursor.close()
conn.close()

```

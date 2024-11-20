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
- comment_id: 1
- vote: +1

3. SQL to get the final vote count for comment_id 1

```sql
SELECT SUM(vote)
FROM vote_count_for_comments
WHERE comment_id = 1
```




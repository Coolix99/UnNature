-- SQLite

-- use Users, Posts and Votes tables and find the
-- posts that has the most upvotes

-- SELECT Posts.post_id, Posts.user_id, Posts.comment, Posts.website_url, Posts.category, Votes.vote
-- FROM Posts
--     JOIN Votes
--     ON Posts.post_id = Votes.post_id

-- -- where the SUM(Votes.vote) is the highest among all post_id
-- WHERE Posts.post_id = (
--     SELECT Posts.post_id
-- FROM Posts
--     JOIN Votes
--     ON Posts.post_id = Votes.post_id
-- GROUP BY Posts.post_id
-- ORDER BY SUM(Votes.vote) DESC
--     LIMIT 1
-- );


SELECT *
FROM USERS;

SELECT *
FROM VOTES;

SELECT *
FROM POSTS;


-- find the posts.comment that has the most upvotes, based on
-- Posts.total_votes
-- also add the Users.display_name of the user who made the post
-- as well as the Users.status
SELECT Posts.post_id, Posts.comment AS post, Posts.total_votes, Users.displayed_name, Users.status
FROM Posts
    JOIN Users
    ON Posts.user_id = Users.user_id
ORDER BY Posts.total_votes DESC
LIMIT 1;


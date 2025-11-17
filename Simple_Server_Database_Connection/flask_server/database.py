# import psycopg2

# # Database connection parameters
# DB_HOST = 'localhost'
# DB_NAME = 'page_comment_db'
# DB_USER = 'your_db_user'
# DB_PASSWORD = 'your_db_password'

# # Initialize the database and create the comments table if it doesn't exist
# def init_db():
#     conn = psycopg2.connect(
#         host=DB_HOST,
#         dbname=DB_NAME,
#         user=DB_USER,
#         password=DB_PASSWORD
#     )
#     cur = conn.cursor()
#     cur.execute("""
#         CREATE TABLE IF NOT EXISTS comments (
#             id SERIAL PRIMARY KEY,
#             url VARCHAR(2048) UNIQUE NOT NULL,
#             comment TEXT NOT NULL,
#             timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
#         );
#     """)
#     conn.commit()
#     cur.close()
#     conn.close()

# # Save a comment for a given URL
# def save_comment(url, comment):
#     conn = psycopg2.connect(
#         host=DB_HOST,
#         dbname=DB_NAME,
#         user=DB_USER,
#         password=DB_PASSWORD
#     )
#     cur = conn.cursor()
#     cur.execute("""
#         INSERT INTO comments (url, comment)
#         VALUES (%s, %s)
#         ON CONFLICT (url) DO UPDATE SET comment = EXCLUDED.comment;
#     """, (url, comment))
#     conn.commit()
#     cur.close()
#     conn.close()

# # Get a comment for a given URL
# def get_comment(url):
#     conn = psycopg2.connect(
#         host=DB_HOST,
#         dbname=DB_NAME,
#         user=DB_USER,
#         password=DB_PASSWORD
#     )
#     cur = conn.cursor()
#     cur.execute("SELECT comment FROM comments WHERE url = %s;", (url,))
#     result = cur.fetchone()
#     cur.close()
#     conn.close()
#     return result[0] if result else None
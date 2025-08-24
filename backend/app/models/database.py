# ================= Database Management Module =================
import os
import json
import sqlite3
from config.config import get_supported_languages, DATA_DIR


db_path_dict = {}


def get_db_path(lang):
    """
    Get the database path for a specific language.
    If the path is not set, it initializes the database for that language.
    """
    global db_path_dict
    return db_path_dict[lang]

# to initialize the database


def init_db():
    """
        one unified database for each language
    """
    global db_path_dict
    for lang in get_supported_languages():
        db_path = os.path.join(DATA_DIR, f"{lang}_db.sqlite")
        db_path_dict[lang] = db_path
        if not os.path.exists(db_path):
            print(f"Initializing database for {lang} at {db_path}")
            __init_db_language(db_path)
        else:
            print(f"Database for {lang} already exists at {db_path}")
    
    init_user_db()
    init_book_db()

def __init_db_language(db_path):
    """Initialize all required databases and tables into one DB file."""
    with sqlite3.connect(db_path) as conn:
        cursor = conn.cursor()

        # Image cache table
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS images (
                word TEXT PRIMARY KEY,
                urls TEXT
            )
        ''')

        # Phonetic table
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS phonetic (
                word TEXT PRIMARY KEY,
                phonetic TEXT
            )
        ''')

        # Dictionary table
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS definition (
                word TEXT PRIMARY KEY,
                definition TEXT
            )
        ''')

        conn.commit()


def save_word_imgs(lang, word, urls):
    """Save image to database."""
    with sqlite3.connect(get_db_path(lang)) as conn:
        conn.execute(
            'REPLACE INTO images (word, urls) VALUES (?, ?)',
            (word, json.dumps(urls))
        )
        conn.commit()


def save_word_phonetic(lang, word, phonetic):
    """Save phonetic to database."""
    with sqlite3.connect(get_db_path(lang)) as conn:
        conn.execute(
            'REPLACE INTO phonetic (word, phonetic) VALUES (?, ?)',
            (word, phonetic)
        )
        conn.commit()


def save_word_definition(lang, word, definition):
    """Save definition to database."""
    print(f"Saving definition for {word} to database")
    with sqlite3.connect(get_db_path(lang)) as conn:
        conn.execute(
            'REPLACE INTO definition (word, definition) VALUES (?, ?)',
            (word, definition)
        )
        conn.commit()


def get_word_imgs(lang, word):
    """Get image from database."""
    with sqlite3.connect(get_db_path(lang)) as conn:
        cursor = conn.execute('SELECT urls FROM images WHERE word=?', (word,))
        row = cursor.fetchone()
        return json.loads(row[0]) if row else None


def get_word_phonetic(lang, word):
    """Get phonetic from database."""
    with sqlite3.connect(get_db_path(lang)) as conn:
        cursor = conn.execute(
            'SELECT phonetic FROM phonetic WHERE word=?', (word,))
        row = cursor.fetchone()
        return row[0] if row else None


def get_word_definition(lang, word):
    """Get definition from database."""
    with sqlite3.connect(get_db_path(lang)) as conn:
        cursor = conn.execute(
            'SELECT definition FROM definition WHERE word=?', (word,))
        row = cursor.fetchone()
        return row[0] if row else None
    

# user part

def init_user_db():
    """
    Initialize the user database.
    """
    user_db_path = os.path.join(DATA_DIR, "user_db.sqlite")
    if not os.path.exists(user_db_path):
        print(f"Initializing user database at {user_db_path}")
        with sqlite3.connect(user_db_path) as conn:
            cursor = conn.cursor()
            cursor.execute('''
                CREATE TABLE IF NOT EXISTS users (
                    userid INTEGER PRIMARY KEY AUTOINCREMENT,
                    username TEXT NOT NULL,
                    useremail TEXT UNIQUE NOT NULL,
                    userpassword TEXT NOT NULL
                )
            ''')
            conn.commit()
    else:
        print(f"User database already exists at {user_db_path}")
    # add a new column  book_list to store user's book list
    with sqlite3.connect(user_db_path) as conn:
        cursor = conn.cursor()
        cursor.execute("PRAGMA table_info(users)")
        columns = [info[1] for info in cursor.fetchall()]
        if 'book_list' not in columns:
            cursor.execute('''
                ALTER TABLE users ADD COLUMN book_list TEXT
            ''')
            conn.commit()


def is_email_registered(useremail):
    """
    Check if the email is already registered.
    Returns True if registered, False otherwise.
    """
    user_db_path = os.path.join(DATA_DIR, "user_db.sqlite")
    with sqlite3.connect(user_db_path) as conn:
        cursor = conn.cursor()
        cursor.execute('SELECT 1 FROM users WHERE useremail=?', (useremail,))
        return cursor.fetchone() is not None

def is_username_registered(username):
    """
    Check if the username is already registered.
    Returns True if registered, False otherwise.
    """
    user_db_path = os.path.join(DATA_DIR, "user_db.sqlite")
    with sqlite3.connect(user_db_path) as conn:
        cursor = conn.cursor()
        cursor.execute('SELECT 1 FROM users WHERE username=?', (username,))
        return cursor.fetchone() is not None


def get_userinfo_by_username(username):
    """
    Get user information by username.
    Returns a dictionary with user information or None if not found.
    """
    user_db_path = os.path.join(DATA_DIR, "user_db.sqlite")
    with sqlite3.connect(user_db_path) as conn:
        cursor = conn.cursor()
        cursor.execute('SELECT * FROM users WHERE username=?', (username,))
        row = cursor.fetchone()
        if row:
            return {
                'userid': row[0],
                'username': row[1],
                'useremail': row[2],
                'userpassword': row[3]
            }
        return None

def register_user(username, useremail, userpassword):
    """
    Register a new user.
    Returns True if registration is successful, False if email or username is already registered.
    """
    user_db_path = os.path.join(DATA_DIR, "user_db.sqlite")
    if is_email_registered(useremail):
        return False, "Email is already registered."
    if is_username_registered(username):
        return False, "Username is already registered."
    
    with sqlite3.connect(user_db_path) as conn:
        cursor = conn.cursor()
        cursor.execute('''
            INSERT INTO users (username, useremail, userpassword)
            VALUES (?, ?, ?)
        ''', (username, useremail, userpassword))
        conn.commit()
    return True, "Registration successful."


# book management

def init_book_db():
    """
        book_id: 000000 （6 digits）
        book_name: EN book name
        author:  author name | cat
        user_id: 
        cover-page: string
        org-lang: zh
        total-chapters: 0

        support-language:
        [
            {
            lang: EN
            level: [A1-C2]
            }
        ]

        chapter-id:[
            
        ]
    """
    book_db_path = os.path.join(DATA_DIR, "book_db.sqlite")
    if not os.path.exists(book_db_path):
        print(f"Initializing book database at {book_db_path}")
        with sqlite3.connect(book_db_path) as conn:
            cursor = conn.cursor()
            cursor.execute('''
                CREATE TABLE IF NOT EXISTS books (
                    book_id INTEGER PRIMARY KEY AUTOINCREMENT,
                    book_name TEXT NOT NULL,
                    author TEXT NOT NULL,
                    user_id INTEGER NOT NULL,
                    cover_page TEXT,
                    org_lang TEXT NOT NULL,
                    total_chapters INTEGER NOT NULL,
                    support_language TEXT,
                    chapter_id TEXT
                )
            ''')
            conn.commit()
    else:
        print(f"Book database already exists at {book_db_path}")

# get all books in the database 
def get_all_books():
    """
    Get all books in the database.
    Returns a list of dictionaries with book information.
    """
    book_db_path = os.path.join(DATA_DIR, "book_db.sqlite")
    with sqlite3.connect(book_db_path) as conn:
        cursor = conn.cursor()
        cursor.execute('SELECT * FROM books')
        rows = cursor.fetchall()
        books = []
        for row in rows:
            books.append({
                'book_id': row[0],
                'book_name': row[1],
                'author': row[2],
                'user_id': row[3],
                'cover_page': row[4],
                'org_lang': row[5],
                'total_chapters': row[6],
                'support_language': json.loads(row[7]),
                'chapter_id': json.loads(row[8])
            })
        return books

# get all books uploaded by a specific user
def get_books_by_user(user_id):
    """
    Get all books for a specific user.
    Returns a list of dictionaries with book information.
    """
    book_db_path = os.path.join(DATA_DIR, "book_db.sqlite")
    with sqlite3.connect(book_db_path) as conn:
        cursor = conn.cursor()
        cursor.execute('SELECT * FROM books WHERE user_id=?', (user_id,))
        rows = cursor.fetchall()
        books = []
        for row in rows:
            books.append({
                'book_id': row[0],
                'book_name': row[1],
                'author': row[2],
                'user_id': row[3],
                'cover_page': row[4],
                'org_lang': row[5],
                'total_chapters': row[6],
                'support_language': json.loads(row[7]),
                'chapter_id': json.loads(row[8])
            })
        return books

# get book list from user table (user added books from library)  
def get_user_book_list(user_id):
    """
    Get the book list for a specific user.
    Returns a list of book IDs or an empty list if none found.
    """
    user_db_path = os.path.join(DATA_DIR, "user_db.sqlite")
    with sqlite3.connect(user_db_path) as conn:
        cursor = conn.cursor()
        cursor.execute('SELECT book_list FROM users WHERE userid=?', (user_id,))
        row = cursor.fetchone()
        if row and row[0]:
            return json.loads(row[0])
        return []

# get book details by a list of book ids  
def get_books_by_ids(book_ids):
    """
    Get book details for a list of book IDs.
    Returns a list of dictionaries with book information.
    """
    if not book_ids:
        return []
    
    book_db_path = os.path.join(DATA_DIR, "book_db.sqlite")
    placeholders = ','.join('?' for _ in book_ids)
    query = f'SELECT * FROM books WHERE book_id IN ({placeholders})'
    
    with sqlite3.connect(book_db_path) as conn:
        cursor = conn.cursor()
        cursor.execute(query, book_ids)
        rows = cursor.fetchall()
        books = []
        for row in rows:
            books.append({
                'book_id': row[0],
                'book_name': row[1],
                'author': row[2],
                'user_id': row[3],
                'cover_page': row[4],
                'org_lang': row[5],
                'total_chapters': row[6],
                'support_language': json.loads(row[7]),
                'chapter_id': json.loads(row[8])
            })
        return books

# get all books associated with a user (uploaded + added)    
def get_user_all_books(user_id):
    """
    Get all books associated with a user, including uploaded and added books.
    Returns a list of dictionaries with book information.
    """
    user_uploaded_books = get_books_by_user(user_id)
    user_book_list_ids = get_user_book_list(user_id)
    user_added_books = get_books_by_ids(user_book_list_ids)
    
    # Combine and remove duplicates based on book_id
    all_books_dict = {book['book_id']: book for book in user_uploaded_books + user_added_books}
    
    return list(all_books_dict.values())

# add or remove book id to/from user book list  
def append_user_book_list(user_id, book_id):
    """
    Append a book ID to the user's book list.
    """
    user_db_path = os.path.join(DATA_DIR, "user_db.sqlite")
    with sqlite3.connect(user_db_path) as conn:
        cursor = conn.cursor()
        cursor.execute('SELECT book_list FROM users WHERE userid=?', (user_id,))
        row = cursor.fetchone()
        if row and row[0]:
            book_list = json.loads(row[0])
            if book_id not in book_list:
                book_list.append(book_id)
        else:
            book_list = [book_id]
        cursor.execute('UPDATE users SET book_list=? WHERE userid=?', (json.dumps(book_list), user_id))
        conn.commit()

def remove_user_book_list(user_id, book_id):
    """
    Remove a book ID from the user's book list.
    """
    user_db_path = os.path.join(DATA_DIR, "user_db.sqlite")
    with sqlite3.connect(user_db_path) as conn:
        cursor = conn.cursor()
        cursor.execute('SELECT book_list FROM users WHERE userid=?', (user_id,))
        row = cursor.fetchone()
        if row and row[0]:
            book_list = json.loads(row[0])
            if book_id in book_list:
                book_list.remove(book_id)
                cursor.execute('UPDATE users SET book_list=? WHERE userid=?', (json.dumps(book_list), user_id))
                conn.commit()

# get user book:
#  user uploaded book
#  user added book from library

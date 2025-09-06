# ================= Database Management Module =================
import os
import json
import sqlite3
from config.config import get_supported_languages, DATA_DIR
from config.config import NOVEL_DIR

from .data_tag import init_tag_db

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
    One unified database file per target language (his design).
    We extend each language DB with our themes/words/theme_words tables.
    """
    global db_path_dict
    os.makedirs(DATA_DIR, exist_ok=True)

    for lang in get_supported_languages():
        db_path = os.path.join(DATA_DIR, f"{lang}_db.sqlite")
        db_path_dict[lang] = db_path
        if not os.path.exists(db_path):
            print(f"Initializing database for {lang} at {db_path}")
            __init_db_language(db_path)
        else:
            print(f"Database for {lang} already exists at {db_path}")
            # Ensure schema upgrades if DB already existed
            __ensure_schema_upgrades(db_path)

    init_user_db()
    init_book_db()  # assuming this exists elsewhere
    init_tag_db()


def __init_db_language(db_path):
    """Create all tables used by both codebases in a single per-language DB."""
    with sqlite3.connect(db_path) as conn:
        conn.execute("PRAGMA foreign_keys = ON")
        cursor = conn.cursor()

        cursor.execute('''
            CREATE TABLE IF NOT EXISTS images (
                word TEXT PRIMARY KEY,
                urls TEXT
            )
        ''')

        cursor.execute('''
            CREATE TABLE IF NOT EXISTS phonetic (
                word     TEXT PRIMARY KEY,
                phonetic TEXT
            )
        ''')

        # One base "definition" table with dynamic columns like definition_en, definition_pt, etc.
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS definition (
                word TEXT PRIMARY KEY
                -- language-specific columns will be added with ALTER TABLE (definition_xx)
            )
        ''')

        # ----- Your tables (added) -----
        # We keep "lang" in words/themes so your existing code can stay the same.
        # Even though each DB is per target lang, having lang here is harmless and future-proof.
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS themes (
                id           INTEGER PRIMARY KEY AUTOINCREMENT,
                name         TEXT NOT NULL,
                target_lang  TEXT NOT NULL,
                native_lang  TEXT NOT NULL,
                cefr_default TEXT NOT NULL,
                created_at   TEXT NOT NULL
            )
        ''')

        cursor.execute('''
            CREATE TABLE IF NOT EXISTS words (
                id           INTEGER PRIMARY KEY AUTOINCREMENT,
                head         TEXT NOT NULL,
                lang         TEXT NOT NULL,
                pos          TEXT,
                cefr         TEXT,
                payload_json TEXT,
                UNIQUE(head, lang)
            )
        ''')

        cursor.execute('''
            CREATE TABLE IF NOT EXISTS theme_words (
                theme_id INTEGER NOT NULL,
                word_id  INTEGER NOT NULL,
                PRIMARY KEY (theme_id, word_id),
                FOREIGN KEY (theme_id) REFERENCES themes(id) ON DELETE CASCADE,
                FOREIGN KEY (word_id)  REFERENCES words(id)  ON DELETE CASCADE
            )
        ''')

        conn.commit()


def __ensure_schema_upgrades(db_path):
    """
    If the DB already existed, ensure new tables/columns are present.
    Safe no-op if already applied.
    """
    with sqlite3.connect(db_path) as conn:
        conn.execute("PRAGMA foreign_keys = ON")
        cursor = conn.cursor()

        # Ensure 'phonetic' table
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS phonetic (
                word     TEXT PRIMARY KEY,
                phonetic TEXT
            )
        ''')

        # Ensure 'definition' base table exists
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS definition (
                word TEXT PRIMARY KEY
            )
        ''')

        cursor.execute('''
            CREATE TABLE IF NOT EXISTS themes (
                id           INTEGER PRIMARY KEY AUTOINCREMENT,
                name         TEXT NOT NULL,
                target_lang  TEXT NOT NULL,
                native_lang  TEXT NOT NULL,
                cefr_default TEXT NOT NULL,
                created_at   TEXT NOT NULL
            )
        ''')
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS words (
                id           INTEGER PRIMARY KEY AUTOINCREMENT,
                head         TEXT NOT NULL,
                lang         TEXT NOT NULL,
                pos          TEXT,
                cefr         TEXT,
                payload_json TEXT,
                UNIQUE(head, lang)
            )
        ''')
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS theme_words (
                theme_id INTEGER NOT NULL,
                word_id  INTEGER NOT NULL,
                PRIMARY KEY (theme_id, word_id),
                FOREIGN KEY (theme_id) REFERENCES themes(id) ON DELETE CASCADE,
                FOREIGN KEY (word_id)  REFERENCES words(id)  ON DELETE CASCADE
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


def save_word_definition(lang, native_lang, word, definition):
    """
    Save definition to database.
    If the column definition_{native_lang} does not exist, add it.
    Then save the definition to the corresponding column.
    """
    db_path = get_db_path(lang)
    column_name = f'definition_{native_lang}'

    with sqlite3.connect(db_path) as conn:
        cursor = conn.cursor()
        # Check if the column exists
        cursor.execute("PRAGMA table_info(definition)")
        columns = [info[1] for info in cursor.fetchall()]
        if column_name not in columns:
            cursor.execute(
                f'ALTER TABLE definition ADD COLUMN {column_name} TEXT')
            conn.commit()
        # Insert or update the definition
        cursor.execute(f'''
            INSERT INTO definition (word, {column_name})
            VALUES (?, ?)
            ON CONFLICT(word) DO UPDATE SET {column_name}=excluded.{column_name}
        ''', (word, definition))
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


def get_word_definition(lang, native_lang, word):
    """
    Get definition from database for a specific native language.
    Returns the definition if found, otherwise None.
    """
    db_path = get_db_path(lang)
    column_name = f'definition_{native_lang}'
    with sqlite3.connect(db_path) as conn:
        cursor = conn.cursor()
        # Check if the column exists
        cursor.execute("PRAGMA table_info(definition)")
        columns = [info[1] for info in cursor.fetchall()]
        if column_name not in columns:
            return None
        cursor.execute(
            f'SELECT {column_name} FROM definition WHERE word=?', (word,))
        row = cursor.fetchone()
        return row[0] if row and row[0] is not None else None

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
        cursor.execute(
            'SELECT book_list FROM users WHERE userid=?', (user_id,))
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
    all_books_dict = {
        book['book_id']: book for book in user_uploaded_books + user_added_books}

    return list(all_books_dict.values())


def get_book_chapter_info(book_id, lang, level):

    books = get_books_by_ids([book_id])
    if not books or len(books) == 0:
        return None
    book = books[0]
    chapter_ids = book['chapter_id']
    print("Found chapter ids:", chapter_ids)

    chapter_info = []
    for cid in chapter_ids:
        chapter_json_file = f"{cid}-{lang}-{level}.json"
        chapter_json_path = os.path.join(
            NOVEL_DIR, f"{book['book_id']:06d}", cid, chapter_json_file)
        # check if file exists
        if os.path.exists(chapter_json_path):
            with open(chapter_json_path, 'r', encoding='utf-8') as f:
                chapter_data = json.load(f)
                chapter_info.append(
                    {
                        'book_id': book_id,
                        'chapter_id': chapter_data['chapter_id'],
                        'chapter_title': chapter_data['chapter_title'],
                        'lang': lang,
                        'level': level
                    })
        else:
            print("Chapter file not found:", chapter_json_path)
    return chapter_info


def get_chapter_content(book_id, chapter_id, lang, level):
    chapter_path = os.path.join(
        NOVEL_DIR, f"{int(book_id):06d}", chapter_id, f"{chapter_id}-{lang}-{level}.json")
    if not os.path.exists(chapter_path):
        return None

    with open(chapter_path, 'r', encoding='utf-8') as f:
        chapter_data = json.load(f)
        return chapter_data

# add or remove book id to/from user book list


def append_user_book_list(user_id, book_id):
    """
    Append a book ID to the user's book list.
    """
    user_db_path = os.path.join(DATA_DIR, "user_db.sqlite")
    with sqlite3.connect(user_db_path) as conn:
        cursor = conn.cursor()
        cursor.execute(
            'SELECT book_list FROM users WHERE userid=?', (user_id,))
        row = cursor.fetchone()
        if row and row[0]:
            book_list = json.loads(row[0])
            if book_id not in book_list:
                book_list.append(book_id)
        else:
            book_list = [book_id]
        cursor.execute('UPDATE users SET book_list=? WHERE userid=?',
                       (json.dumps(book_list), user_id))
        conn.commit()


def remove_user_book_list(user_id, book_id):
    """
    Remove a book ID from the user's book list.
    """
    user_db_path = os.path.join(DATA_DIR, "user_db.sqlite")
    with sqlite3.connect(user_db_path) as conn:
        cursor = conn.cursor()
        cursor.execute(
            'SELECT book_list FROM users WHERE userid=?', (user_id,))
        row = cursor.fetchone()
        if row and row[0]:
            book_list = json.loads(row[0])
            if book_id in book_list:
                book_list.remove(book_id)
                cursor.execute(
                    'UPDATE users SET book_list=? WHERE userid=?', (json.dumps(book_list), user_id))
                conn.commit()

# get user book:
#  user uploaded book
#  user added book from library

# add a new book


def add_new_book(bookinfo: dict):
    """
    Add a new book to the books table.
    bookinfo should be a dict with keys:
        - book_name
        - author
        - user_id
        - cover_page
        - org_lang
        - total_chapters
        - support_language (list/dict, will be json-encoded)
        - chapter_id (list, will be json-encoded)
    Returns the new book_id.
    """
    book_db_path = os.path.join(DATA_DIR, "book_db.sqlite")
    with sqlite3.connect(book_db_path) as conn:
        cursor = conn.cursor()
        cursor.execute('''
            INSERT INTO books (
                book_name, author, user_id, cover_page, org_lang, total_chapters, support_language, chapter_id
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        ''', (
            bookinfo.get('book_name'),
            bookinfo.get('author', ''),
            bookinfo.get('user_id'),
            bookinfo.get('cover_page', ''),
            bookinfo.get('org_lang'),
            bookinfo.get('total_chapters', 0),
            json.dumps(bookinfo.get('support_language', [])),
            json.dumps(bookinfo.get('chapter_id', []))
        ))
        conn.commit()
        # return the new book_id

        # create the book directory
        book_id = cursor.lastrowid
        if not book_id:
            raise Exception("Failed to retrieve new book ID.")

        book_dir = os.path.join(NOVEL_DIR, f"{int(book_id):06d}")
        os.makedirs(book_dir, exist_ok=True)

        return book_id


def delete_book(book_id, userid):
    """
    Delete a book from the books table by book_id, only if the user is the owner.
    Returns (True, msg) on success, (False, error_msg) on failure.
    """
    book_db_path = os.path.join(DATA_DIR, "book_db.sqlite")
    with sqlite3.connect(book_db_path) as conn:
        cursor = conn.cursor()
        cursor.execute('SELECT user_id FROM books WHERE book_id=?', (book_id,))
        row = cursor.fetchone()
        if not row:
            return False, "Book not found."
        if row[0] != userid:
            return False, "You do not have permission to delete this book."
        cursor.execute('DELETE FROM books WHERE book_id=?', (book_id,))
        conn.commit()
    # remove the book directory
    book_dir = os.path.join(NOVEL_DIR, f"{int(book_id):06d}")
    if os.path.exists(book_dir):
        import shutil
        shutil.rmtree(book_dir)
    return True, "Book deleted successfully."

# add or update a chapter


def add_or_update_chapter(book_id, userid, title, src_content, dst_content, chapter_id=None):
    """
    If chapter_id is None, add a new chapter.
    If chapter_id is provided, update the existing chapter.
    """
    book_db_path = os.path.join(DATA_DIR, "book_db.sqlite")
    with sqlite3.connect(book_db_path) as conn:
        cursor = conn.cursor()
        # Check if the book exists and user is the owner
        cursor.execute(
            'SELECT user_id, chapter_id, total_chapters FROM books WHERE book_id=?', (book_id,))
        row = cursor.fetchone()
        if not row:
            return False, "Book not found."
        if row[0] != userid:
            return False, "You do not have permission to modify chapters in this book."
        chapter_ids = json.loads(row[1]) if row[1] else []
        total_chapters = row[2] if row[2] else 0

        # get book info
        books = get_books_by_ids([book_id])
        if not books:
            return False, "Book info not found."
        books = books[0]
        src_lang = books['support_language'][0]['lang']
        src_level = books['support_language'][0]['level'][0]
        dst_lang = books['support_language'][1]['lang']
        dst_level = books['support_language'][1]['level'][0]

        # Add new chapter
        if chapter_id is None:
            # chapter id is auto-generated, 6 digits
            new_chapter_id = f"{total_chapters + 1:06d}"
            chapter_dir = os.path.join(
                NOVEL_DIR, f"{int(book_id):06d}", new_chapter_id)
            os.makedirs(chapter_dir, exist_ok=True)
            cid = new_chapter_id
            # update the book record
            chapter_ids.append(new_chapter_id)
            total_chapters += 1
            cursor.execute('UPDATE books SET chapter_id=?, total_chapters=? WHERE book_id=?',
                           (json.dumps(chapter_ids), total_chapters, book_id))
            conn.commit()
            action_msg = "added"
        else:
            # Update existing chapter
            if chapter_id not in chapter_ids:
                return False, "Chapter not found in this book."
            chapter_dir = os.path.join(
                NOVEL_DIR, f"{int(book_id):06d}", chapter_id)
            if not os.path.exists(chapter_dir):
                return False, "Chapter directory not found."
            cid = chapter_id
            action_msg = "updated"

        def gen_json(lang, level, content, title):
            chapter_json_file = f"{cid}-{lang}-{level}.json"
            chapter_json_path = os.path.join(chapter_dir, chapter_json_file)
            chapter_data = {
                'book_id': book_id,
                'chapter_id': cid,
                'org_lang': src_lang,
                'translation_ai': "deepseek",
                'total_sentences': len(content),
                'chapter_title': title,
                'content': content
            }
            with open(chapter_json_path, 'w', encoding='utf-8') as f:
                json.dump(chapter_data, f, ensure_ascii=False, indent=4)

        gen_json(src_lang, src_level, src_content, title)
        gen_json(dst_lang, dst_level, dst_content, title)

        return True, f"Chapter {action_msg} successfully."

# delete a chapter


def delete_chapter(book_id, chapter_id, userid):
    book_dp_path = os.path.join(DATA_DIR, "book_db.sqlite")
    with sqlite3.connect(book_dp_path) as conn:
        #  check if the user is the owner of the book
        cursor = conn.cursor()
        cursor.execute(
            'SELECT user_id, chapter_id, total_chapters FROM books WHERE book_id=?', (book_id,))
        row = cursor.fetchone()
        if not row:
            return False, "Book not found."
        if row[0] != userid:
            return False, "You do not have permission to delete chapters from this book."
        chapter_ids = json.loads(row[1]) if row[1] else []
        total_chapters = row[2] if row[2] else 0

        if chapter_id not in chapter_ids:
            return False, "Chapter not found in this book."

        # remove chapter files
        chapter_dir = os.path.join(
            NOVEL_DIR, f"{int(book_id):06d}", chapter_id)
        if os.path.exists(chapter_dir):
            import shutil
            shutil.rmtree(chapter_dir)

        # update the book record
        chapter_ids.remove(chapter_id)
        total_chapters -= 1
        cursor.execute('UPDATE books SET chapter_id=?, total_chapters=? WHERE book_id=?',
                       (json.dumps(chapter_ids), total_chapters, book_id))
        conn.commit()

        return True, "Chapter deleted successfully."

 # tag region
# tags - User Tag Table
# | Field      | Type                | Description                |
# | ---------- | ------------------- | -------------------------- |
# | id         | BIGINT PK           | Tag ID                     |
# | user_id    | BIGINT FK users(id) | User ID                    |
# | name       | VARCHAR(50)         | Tag name                   |
# | lang       | VARCHAR(10)         | Tag language (optional)    |
# | created_at | DATETIME            | Creation time              |
# | updated_at | DATETIME            | Update time                |

# tag_words - Tag-Word Relationship Table (Many-to-Many)
# | Field       | Type                  | Description                |
# | ----------- | --------------------- | -------------------------- |
# | id          | BIGINT PK             | Tag-word record ID         |
# | tag_id      | BIGINT FK tags(id)    | Tag ID                     |
# | word        | VARCHAR(100)          | Word                       |
# | lang        | VARCHAR(10)           | Word language              |
# | has_context | BOOLEAN DEFAULT FALSE | Has context                |
# | created_at  | DATETIME              | Creation time              |
# | updated_at  | DATETIME              | Update time                |

# tag_word_context - Word Context Table
# | Field         | Type                        | Description                |
# | ------------- | --------------------------- | -------------------------- |
# | id            | BIGINT PK                   | Context record ID          |
# | tag_word_id   | BIGINT FK tag_words(id)     | Corresponding tag word     |
# | book_id       | BIGINT FK books(id) NULL    | Book ID (optional)         |
# | chapter_id    | BIGINT FK chapters(id) NULL | Chapter ID (optional)      |
# | sentence      | TEXT                        | Context sentence           |
# | lang          | VARCHAR(10)                 | Sentence language          |
# | created_at    | DATETIME                    | Creation time              |

def init_tag_db():
    """
    Initialize the tag database.
    """
    tag_db_path = os.path.join(DATA_DIR, "tag_db.sqlite")
    if not os.path.exists(tag_db_path):
        print(f"Initializing tag database at {tag_db_path}")
        with sqlite3.connect(tag_db_path) as conn:
            cursor = conn.cursor()
            cursor.execute('''
                CREATE TABLE IF NOT EXISTS tags (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    user_id INTEGER NOT NULL,
                    name TEXT NOT NULL,
                    lang TEXT,
                    created_at TEXT NOT NULL,
                    updated_at TEXT NOT NULL,
                    UNIQUE(user_id, name, lang)
                )
            ''')
            cursor.execute('''
                CREATE TABLE IF NOT EXISTS tag_words (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    tag_id INTEGER NOT NULL,
                    word TEXT NOT NULL,
                    lang TEXT NOT NULL,
                    has_context BOOLEAN DEFAULT FALSE,
                    created_at TEXT NOT NULL,
                    updated_at TEXT NOT NULL,
                    UNIQUE(tag_id, word, lang),
                    FOREIGN KEY (tag_id) REFERENCES tags(id) ON DELETE CASCADE
                )
            ''')
            cursor.execute('''
                CREATE TABLE IF NOT EXISTS tag_word_context (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    tag_word_id INTEGER NOT NULL,
                    book_id INTEGER,
                    chapter_id INTEGER,
                    sentence TEXT NOT NULL,
                    lang TEXT NOT NULL,
                    created_at TEXT NOT NULL,
                    FOREIGN KEY (tag_word_id) REFERENCES tag_words(id) ON DELETE CASCADE
                )
            ''')
            conn.commit()
    else:
        print(f"Tag database already exists at {tag_db_path}")

# user add a new tag
def add_user_tag(user_id, name, lang=None):
    """
    Add a new tag for a user.
    Returns (True, tag_id) on success, (False, error_msg) on failure.
    """
    tag_db_path = os.path.join(DATA_DIR, "tag_db.sqlite")
    from datetime import datetime
    now = datetime.utcnow().isoformat()
    with sqlite3.connect(tag_db_path) as conn:
        cursor = conn.cursor()
        try:
            cursor.execute('''
                INSERT INTO tags (user_id, name, lang, created_at, updated_at)
                VALUES (?, ?, ?, ?, ?)
            ''', (user_id, name, lang, now, now))
            conn.commit()
            return True, cursor.lastrowid
        except sqlite3.IntegrityError:
            return False, "Tag with the same name and language already exists."

# user delete a tag
def delete_user_tag(user_id, tag_id):
    """
    Delete a tag for a user.
    Returns (True, msg) on success, (False, error_msg) on failure.
    """
    tag_db_path = os.path.join(DATA_DIR, "tag_db.sqlite")
    with sqlite3.connect(tag_db_path) as conn:
        cursor = conn.cursor()
        cursor.execute('SELECT user_id FROM tags WHERE id=?', (tag_id,))
        row = cursor.fetchone()
        if not row:
            return False, "Tag not found."
        if row[0] != user_id:
            return False, "You do not have permission to delete this tag."
        cursor.execute('DELETE FROM tags WHERE id=?', (tag_id,))
        conn.commit()
        return True, "Tag deleted successfully."
    
def get_user_tags(user_id, lang):
    """
    Get all tags for a user, optionally filtered by language.
    Returns a list of dictionaries with tag information.
    """
    tag_db_path = os.path.join(DATA_DIR, "tag_db.sqlite")
    with sqlite3.connect(tag_db_path) as conn:
        cursor = conn.cursor()
        if lang:
            cursor.execute('SELECT id, name, lang, created_at, updated_at FROM tags WHERE user_id=? AND lang=?', (user_id, lang))
        else:
            cursor.execute('SELECT id, name, lang, created_at, updated_at FROM tags WHERE user_id=?', (user_id,))
        rows = cursor.fetchall()
        tags = []
        for row in rows:
            tags.append({
                'id': row[0],
                'name': row[1],
                'lang': row[2],
                'created_at': row[3],
                'updated_at': row[4]
            })
        return tags
    
# user add a word to a tag
def add_word_to_tag(user_id, tag_id, word, lang):
    """
    Add a word to a user's tag.
    Returns (True, tag_word_id) on success, (False, error_msg) on failure.
    """
    tag_db_path = os.path.join(DATA_DIR, "tag_db.sqlite")
    from datetime import datetime
    now = datetime.utcnow().isoformat()
    with sqlite3.connect(tag_db_path) as conn:
        cursor = conn.cursor()
        # check if the tag belongs to the user
        cursor.execute('SELECT user_id FROM tags WHERE id=?', (tag_id,))
        row = cursor.fetchone()
        if not row:
            return False, "Tag not found."
        if row[0] != user_id:
            return False, "You do not have permission to modify this tag."
        try:
            cursor.execute('''
                INSERT INTO tag_words (tag_id, word, lang, has_context, created_at, updated_at)
                VALUES (?, ?, ?, ?, ?, ?)
            ''', (tag_id, word, lang, False, now, now))
            conn.commit()
            return True, cursor.lastrowid
        except sqlite3.IntegrityError:
            return False, "Word already exists in this tag."

def remove_word_from_tag(user_id, tag_word_id):
    """
    Remove a word from a user's tag.
    Returns (True, msg) on success, (False, error_msg) on failure.
    """
    tag_db_path = os.path.join(DATA_DIR, "tag_db.sqlite")
    with sqlite3.connect(tag_db_path) as conn:
        cursor = conn.cursor()
        # check if the tag_word belongs to the user
        cursor.execute('''
            SELECT tw.tag_id, t.user_id 
            FROM tag_words tw 
            JOIN tags t ON tw.tag_id = t.id 
            WHERE tw.id=?
        ''', (tag_word_id,))
        row = cursor.fetchone()
        if not row:
            return False, "Tag word not found."
        if row[1] != user_id:
            return False, "You do not have permission to modify this tag word."
        cursor.execute('DELETE FROM tag_words WHERE id=?', (tag_word_id,))
        conn.commit()
        return True, "Word removed from tag successfully."
    
def get_words_in_tag(user_id, tag_id):
    """
    Get all words in a user's tag.
    Returns a list of dictionaries with tag word information.
    """
    tag_db_path = os.path.join(DATA_DIR, "tag_db.sqlite")
    with sqlite3.connect(tag_db_path) as conn:
        cursor = conn.cursor()
        # check if the tag belongs to the user
        cursor.execute('SELECT user_id FROM tags WHERE id=?', (tag_id,))
        row = cursor.fetchone()
        if not row:
            return []
        if row[0] != user_id:
            return []
        cursor.execute('SELECT id, word, lang, has_context, created_at, updated_at FROM tag_words WHERE tag_id=?', (tag_id,))
        rows = cursor.fetchall()
        tag_words = []
        for row in rows:
            tag_words.append({
                'id': row[0],
                'word': row[1],
                'lang': row[2],
                'has_context': bool(row[3]),
                'created_at': row[4],
                'updated_at': row[5]
            })
        return tag_words
    
def add_word_context(user_id, tag_word_id, book_id, chapter_id, sentence, lang):
    """
    Add context sentence for a word in a user's tag.
    Returns (True, context_id) on success, (False, error_msg) on failure.
    """
    tag_db_path = os.path.join(DATA_DIR, "tag_db.sqlite")
    from datetime import datetime
    now = datetime.utcnow().isoformat()
    with sqlite3.connect(tag_db_path) as conn:
        cursor = conn.cursor()
        # check if the tag_word belongs to the user
        cursor.execute('''
            SELECT tw.tag_id, t.user_id 
            FROM tag_words tw 
            JOIN tags t ON tw.tag_id = t.id 
            WHERE tw.id=?
        ''', (tag_word_id,))
        row = cursor.fetchone()
        if not row:
            return False, "Tag word not found."
        if row[1] != user_id:
            return False, "You do not have permission to modify this tag word."
        try:
            cursor.execute('''
                INSERT INTO tag_word_context (tag_word_id, book_id, chapter_id, sentence, lang, created_at)
                VALUES (?, ?, ?, ?, ?, ?)
            ''', (tag_word_id, book_id, chapter_id, sentence, lang, now))
            # update has_context in tag_words
            cursor.execute('UPDATE tag_words SET has_context=?, updated_at=? WHERE id=?', (True, now, tag_word_id))
            conn.commit()
            return True, cursor.lastrowid
        except sqlite3.IntegrityError as e:
            return False, str(e)

def get_word_contexts(user_id, tag_word_id):
    """
    Get all context sentences for a word in a user's tag.
    Returns a list of dictionaries with context information.
    """
    tag_db_path = os.path.join(DATA_DIR, "tag_db.sqlite")
    with sqlite3.connect(tag_db_path) as conn:
        cursor = conn.cursor()
        # check if the tag_word belongs to the user
        cursor.execute('''
            SELECT tw.tag_id, t.user_id 
            FROM tag_words tw 
            JOIN tags t ON tw.tag_id = t.id 
            WHERE tw.id=?
        ''', (tag_word_id,))
        row = cursor.fetchone()
        if not row:
            return []
        if row[1] != user_id:
            return []
        cursor.execute('SELECT id, book_id, chapter_id, sentence, lang, created_at FROM tag_word_context WHERE tag_word_id=?', (tag_word_id,))
        rows = cursor.fetchall()
        contexts = []
        for row in rows:
            contexts.append({
                'id': row[0],
                'book_id': row[1],
                'chapter_id': row[2],
                'sentence': row[3],
                'lang': row[4],
                'created_at': row[5]
            })
        return contexts
    
def delete_word_context(user_id, context_id):
    """
    Delete a context sentence for a word in a user's tag.
    Returns (True, msg) on success, (False, error_msg) on failure.
    """
    tag_db_path = os.path.join(DATA_DIR, "tag_db.sqlite")
    with sqlite3.connect(tag_db_path) as conn:
        cursor = conn.cursor()
        # check if the context belongs to the user
        cursor.execute('''
            SELECT tw.tag_id, t.user_id 
            FROM tag_word_context twc
            JOIN tag_words tw ON twc.tag_word_id = tw.id
            JOIN tags t ON tw.tag_id = t.id 
            WHERE twc.id=?
        ''', (context_id,))
        row = cursor.fetchone()
        if not row:
            return False, "Context not found."
        if row[1] != user_id:
            return False, "You do not have permission to delete this context."
        cursor.execute('DELETE FROM tag_word_context WHERE id=?', (context_id,))
        conn.commit()
        return True, "Context deleted successfully."
    
# end of tag region
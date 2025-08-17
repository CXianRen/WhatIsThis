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
import os
import sqlite3
from config.config import DATA_DIR

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
            tag_id = cursor.lastrowid

            return True, {"tag_id": tag_id,
                          "name": name,
                          "lang": lang,
                          "created_at": now,
                          "updated_at": now
                          }
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
            cursor.execute(
                'SELECT id, name, lang, created_at, updated_at FROM tags WHERE user_id=? AND lang=?', (user_id, lang))
        else:
            cursor.execute(
                'SELECT id, name, lang, created_at, updated_at FROM tags WHERE user_id=?', (user_id,))
        rows = cursor.fetchall()
        tags = []
        for row in rows:
            tags.append({
                'tag_id': row[0],
                'name': row[1],
                'lang': row[2],
                'created_at': row[3],
                'updated_at': row[4]
            })
        return tags

# user add a word to a tag

def get_word_tags(user_id, word, lang):
    """
    Get the tag_word record for a given word and language for a user.
    a word might have multiple tags. 
    """
    tag_db_path = os.path.join(DATA_DIR, "tag_db.sqlite")
    tag_words = []
    with sqlite3.connect(tag_db_path) as conn:
        cursor = conn.cursor()
        cursor.execute('''
            SELECT tw.id, tw.tag_id, tw.word, tw.lang, tw.has_context, tw.created_at, tw.updated_at
            FROM tag_words tw
            JOIN tags t ON tw.tag_id = t.id
            WHERE t.user_id=? AND tw.word=? AND tw.lang=?
        ''', (user_id, word, lang))
        rows = cursor.fetchall()
        
        for row in rows:
            tag_words.append({
                'id': row[0],
                'tag_id': row[1],
                'word': row[2],
                'lang': row[3],
                'has_context': bool(row[4]),
                'created_at': row[5],
                'updated_at': row[6]
            })
    return True, tag_words

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
            new_id = cursor.lastrowid
            return True, {
                "id": new_id,
                "tag_id": tag_id,
                "word": word,
                "lang": lang,
                "has_context": False,
                "created_at": now,
                "updated_at": now
            }
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
        cursor.execute(
            'SELECT id, word, lang, has_context, created_at, updated_at FROM tag_words WHERE tag_id=?', (tag_id,))
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
            cursor.execute(
                'UPDATE tag_words SET has_context=?, updated_at=? WHERE id=?', (True, now, tag_word_id))
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
        cursor.execute(
            'SELECT id, book_id, chapter_id, sentence, lang, created_at FROM tag_word_context WHERE tag_word_id=?', (tag_word_id,))
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
        cursor.execute(
            'DELETE FROM tag_word_context WHERE id=?', (context_id,))
        conn.commit()
        return True, "Context deleted successfully."


def filter_by_tags(user_id, tags):
    """
    Filter words by tags for a user.
    Returns a list of words that have all the specified tags.
    """
    tag_db_path = os.path.join(DATA_DIR, "tag_db.sqlite")
    if not tags:
        return []
    placeholders = ','.join('?' for _ in tags)
    query = f'''
        SELECT tw.word, tw.lang
        FROM tag_words tw
        JOIN tags t ON tw.tag_id = t.id
        WHERE t.user_id=? AND t.name IN ({placeholders})
        GROUP BY tw.word, tw.lang
        HAVING COUNT(DISTINCT t.name) = ?
    '''
    words = []
    params = [user_id] + tags + [len(tags)]
    with sqlite3.connect(tag_db_path) as conn:
        cursor = conn.cursor()
        cursor.execute(query, params)
        rows = cursor.fetchall()
        
        for row in rows:
            words.append({
                'word': row[0],
                'lang': row[1]
            })
    return True, words

# end of tag region

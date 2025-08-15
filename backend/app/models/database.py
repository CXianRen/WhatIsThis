# ================= Database Management Module =================
import os
import json
import sqlite3
from config.config import IMG_CACHE_DB, EN_PHONETIC_DB, DATA_DIR, EN_DB

# In-memory caches
img_cache_map = {}
en_phonetic_map = {}
en_dict_cache = {} 

def init_db():
    """Initialize all required databases and tables."""
    os.makedirs(DATA_DIR, exist_ok=True)
    
    # Initialize image cache database
    with sqlite3.connect(IMG_CACHE_DB) as conn:
        conn.execute('''CREATE TABLE IF NOT EXISTS cache (query TEXT PRIMARY KEY, urls TEXT)''')
    
    # Initialize phonetic database
    with sqlite3.connect(EN_PHONETIC_DB) as conn:
        conn.execute('''CREATE TABLE IF NOT EXISTS en_phonetic (word TEXT PRIMARY KEY, phonetic TEXT)''')

    # Initialize English dictionary database
    with sqlite3.connect(EN_DB) as conn:
        conn.execute('''CREATE TABLE IF NOT EXISTS en_dict (word TEXT PRIMARY KEY, definition TEXT)''')

def load_img_cache():
    """Load image cache from database into memory."""
    global img_cache_map
    with sqlite3.connect(IMG_CACHE_DB) as conn:
        for query, urls_json in conn.execute('SELECT query, urls FROM cache'):
            try:
                img_cache_map[query] = json.loads(urls_json)
            except Exception:
                continue

def load_phonetic_cache():
    """Load phonetic cache from database into memory."""
    global en_phonetic_map
    with sqlite3.connect(EN_PHONETIC_DB) as conn:
        for word, phonetic in conn.execute('SELECT word, phonetic FROM en_phonetic'):
            en_phonetic_map[word] = {'phonetic': phonetic}

def load_en_dict_cache():
    """Load English dictionary cache from database into memory."""
    global en_dict_cache
    with sqlite3.connect(EN_DB) as conn:
        for word, definition in conn.execute('SELECT word, definition FROM en_dict'):
            en_dict_cache[word] = {'definition': definition}

def save_img_cache(query, urls):
    """Save image cache to database."""
    with sqlite3.connect(IMG_CACHE_DB) as conn:
        conn.execute('REPLACE INTO cache (query, urls) VALUES (?, ?)', (query, json.dumps(urls)))

def save_phonetic_cache(word, phonetic):
    """Save phonetic cache to database."""
    with sqlite3.connect(EN_PHONETIC_DB) as conn:
        conn.execute('REPLACE INTO en_phonetic (word, phonetic) VALUES (?, ?)', (word, phonetic))

def save_en_dict_cache(word, definition):
    """Save English dictionary entry to database."""
    print(f"Saving definition for {word} to database")
    with sqlite3.connect(EN_DB) as conn:
        conn.execute('REPLACE INTO en_dict (word, definition) VALUES (?, ?)', (word, definition))

def get_img_cache(query):
    """Get image cache from memory."""
    return img_cache_map.get(query)

def set_img_cache(query, urls):
    """Set image cache in memory and save to database."""
    img_cache_map[query] = urls
    save_img_cache(query, urls)

def get_phonetic_cache(word):
    """Get phonetic cache from memory."""
    return en_phonetic_map.get(word)

def get_en_dict_cache(word):
    """Get English dictionary entry from memory."""
    return en_dict_cache.get(word)

def set_phonetic_cache(word, phonetic):
    """Set phonetic cache in memory and save to database."""
    en_phonetic_map[word] = {'phonetic': phonetic}
    save_phonetic_cache(word, phonetic)

def set_en_dict_cache(word, definition):
    """Set English dictionary entry in memory and save to database."""
    en_dict_cache[word] = {'definition': definition}
    save_en_dict_cache(word, definition)

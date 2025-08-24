# ================= Novel Management and Reading Routes =================
from flask import Blueprint, jsonify, request, g
import os
import json
from config.config import NOVEL_DIR
from routers.user import login_required
from models.database import get_all_books, \
    get_user_all_books, \
    append_user_book_list, \
    remove_user_book_list, \
    get_books_by_ids


# ================= Refactored Novel API =================
book_bp = Blueprint('book', __name__, url_prefix='/api/book')


def __parse_novel_raw_name(name: str):
    base_name = name.replace(".txt", "")
    parts = base_name.split('_')
    res = {}
    res['cid'] = int(parts[0])
    res['title'] = parts[1]
    res['basename'] = base_name
    return res


def __gen_novel_raw_name(cid: int, title: str):
    safe_title = f"{cid:03d}_{title}.txt"
    return safe_title


@book_bp.route('/list', methods=['GET'])
def get_books():
    """Get all books with basic info"""
    books = get_all_books()
    if not books:
        return jsonify([])
    return jsonify(books)


# get user books
@book_bp.route('/list/user', methods=['GET'])
@login_required
def get_user_books():
    """Get books of a specific user (login required)"""

    userid = g.user['userid']
    if not userid:
        return jsonify({'error': 'User ID not found in token'}), 400

    books = get_user_all_books(userid)
    if not books:
        return jsonify([])
    return jsonify(books)


@book_bp.route('/list/user/update', methods=['POST'])
@login_required
def update_user_books():
    """Add or remove a book from user's book list (login required)
    Data structure: {
        "action": "add|remove",
        "book_id": Book ID
    }
    """
    try:
        data = request.get_json()
        action = data.get('action', '').lower()
        book_id = data.get('book_id')

        if action not in ['add', 'remove']:
            return jsonify({'error': 'Invalid action type'}), 400

        if not book_id or not isinstance(book_id, int):
            return jsonify({'error': 'book_id must be an integer'}), 400

        userid = g.user['userid']
        if not userid:
            return jsonify({'error': 'User ID not found in token'}), 400

        print("Op: ", action)
        if action == 'add':
            # if the book is already in user's list, do nothing
            user_books = get_user_all_books(userid)
            if any(book['book_id'] == book_id for book in user_books):
                return jsonify({'success': True, 'message': 'Book already in your shelf'})

            append_user_book_list(userid, book_id)
            return jsonify({'success': True, 'message': 'Book added to your shelf'})
        elif action == 'remove':
            # if the book is uploaded by the user, do not allow removal
            user_books = get_user_all_books(userid)
            for book in user_books:
                if book['book_id'] == book_id and book['book_id'] == userid:
                    return jsonify({'error': 'Cannot remove a book you uploaded here. Plese using the manage page'}), 400

            remove_user_book_list(userid, book_id)
            return jsonify({'success': True, 'message': 'Book removed from your shelf'})

    except Exception as e:
        return jsonify({'error': str(e)}), 500


# get all chapters of a book by id
@book_bp.route('/chapters', methods=['POST'])
@login_required
def get_chapters():
    """Get all chapter names of the specified novel by book_id (POST)"""
    data = request.get_json() or {}
    book_id = data.get('book_id', None)
    lang = data.get('lang', None)
    level = data.get('level', None)
    print("Get chapters for book_id:", book_id, "lang:", lang, "level:", level)
    if lang:
        lang = lang.lower()
    else:
        return jsonify({'error': 'lang parameter is required'}), 400
    if level:
        level = str(level).lower()
    if not book_id:
        return jsonify({'error': 'book_id parameter is required'}), 400

    # todo check this books is available for this user or not

    # Find the novel directory by book_id
    books = get_books_by_ids([book_id])
    if not books or len(books) == 0:
        return jsonify({'error': 'Book not found'}), 404
    book = books[0]
    chapter_ids = book['chapter_id']

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
    return jsonify(chapter_info)


# get chapter content by book_id and chapter_id
@book_bp.route('/content', methods=['POST'])
@login_required
def get_chapter_content():
    data = request.get_json() or {}
    book_id = data.get('book_id', None)
    chapter_id = data.get('chapter_id', None)
    lang = data.get('lang', None)
    level = data.get('level', None)
    print("Get chapter content for book_id:", book_id, "chapter_id:", chapter_id,
          "lang:", lang, "level:", level)
    if lang:
        lang = lang.lower()
    else:
        return jsonify({'error': 'lang parameter is required'}), 400
    if level:
        level = str(level).lower()
    if not book_id:
        return jsonify({'error': 'book_id parameter is required'}), 400
    if not chapter_id:
        return jsonify({'error': 'chapter_id parameter is required'}), 400
    
    # todo check this books is available for this user or not
    
    chapter_path = os.path.join(
        NOVEL_DIR, f"{int(book_id):06d}", chapter_id, f"{chapter_id}-{lang}-{level}.json")
    if not os.path.exists(chapter_path):
        return jsonify({'error': 'Chapter not found'}), 404
    
    with open(chapter_path, 'r', encoding='utf-8') as f:
        chapter_data = json.load(f)
        return jsonify(chapter_data)


# @book_bp.route('/<novel_name>/chapters', methods=['GET'])
# def get_chapters(novel_name):
#     """Get all chapter names of the specified novel"""
#     chapters = []

#     novel_path = os.path.join(NOVEL_DIR, novel_name)
#     if not os.path.exists(novel_path):
#         return jsonify({'error': 'Novel does not exist'}), 404

#     # Scan txt files (original Chinese)
#     txt_files = sorted(
#         [f for f in os.listdir(novel_path) if f.endswith('.txt')])
#     print("len of texts", len(txt_files))

#     for txt_file in txt_files:
#         info = __parse_novel_raw_name(txt_file)

#         # Check available language versions
#         available_languages = []
#         for lang_code in ['en', 'sw', 'fr']:
#             lang_file = f"{info['basename']}.{lang_code}.json"
#             lang_path = os.path.join(novel_path, lang_file)
#             if os.path.exists(lang_path):
#                 available_languages.append(lang_code)

#         chapters.append({
#             'cid': info['cid'],
#             'title': info['title'],
#             'available_languages': available_languages
#         })

#     # Sort by cid
#     chapters.sort(key=lambda x: x['cid'])
#     print("len of chapters:", len(chapters))

#     return jsonify(chapters)

# Get all chapters of a book
# @book_bp.route('/<novel_name>/chapters', methods=['GET'])
# def get_chapters(novel_name):
#     """Get all chapter names of the specified novel"""
#     chapters = []

#     novel_path = os.path.join(NOVEL_DIR, novel_name)
#     if not os.path.exists(novel_path):
#         return jsonify({'error': 'Novel does not exist'}), 404

#     # Scan txt files (original Chinese)
#     txt_files = sorted(
#         [f for f in os.listdir(novel_path) if f.endswith('.txt')])
#     print("len of texts", len(txt_files))

#     for txt_file in txt_files:
#         info = __parse_novel_raw_name(txt_file)

#         # Check available language versions
#         available_languages = []
#         for lang_code in ['en', 'sw', 'fr']:
#             lang_file = f"{info['basename']}.{lang_code}.json"
#             lang_path = os.path.join(novel_path, lang_file)
#             if os.path.exists(lang_path):
#                 available_languages.append(lang_code)

#         chapters.append({
#             'cid': info['cid'],
#             'title': info['title'],
#             'available_languages': available_languages
#         })

#     # Sort by cid
#     chapters.sort(key=lambda x: x['cid'])
#     print("len of chapters:", len(chapters))

#     return jsonify(chapters)


@book_bp.route('/<novel_name>/chapters/raw/<int:cid>', methods=['GET'])
def get_raw_chapter(novel_name, cid):
    """Get the raw text of the specified chapter"""
    novel_path = os.path.join(NOVEL_DIR, novel_name)
    if not os.path.exists(novel_path):
        return jsonify({'error': 'Novel does not exist'}), 404

    # Find the txt file with the corresponding cid
    txt_files = [f for f in os.listdir(novel_path) if f.endswith('.txt')]
    target_file = None
    info = None
    for txt_file in txt_files:
        tinfo = __parse_novel_raw_name(txt_file)
        if tinfo['cid'] == cid:
            target_file = txt_file
            info = tinfo
            break

    if not target_file:
        return jsonify({'error': 'Chapter does not exist'}), 404

    txt_path = os.path.join(novel_path, target_file)
    try:
        with open(txt_path, 'r', encoding='utf-8') as f:
            content = f.read()

        return jsonify({
            'cid': cid,
            'title': info['title'],
            'content': content
        })
    except Exception as e:
        return jsonify({'error': f'Failed to read file: {str(e)}'}), 500


@book_bp.route('/<novel_name>/chapters/<int:cid>/<language>', methods=['GET'])
def get_translated_chapter(novel_name, cid, language):
    """Get the translated version of the specified chapter (en|sw|fr)"""
    if language not in ['en', 'sw', 'fr']:
        return jsonify({'error': 'Unsupported language code'}), 400

    novel_path = os.path.join(NOVEL_DIR, novel_name)
    if not os.path.exists(novel_path):
        return jsonify({'error': 'Novel does not exist'}), 404

    # Find the file with the corresponding cid
    txt_files = [f for f in os.listdir(novel_path) if f.endswith('.txt')]
    target_base_name = None

    for txt_file in txt_files:
        info = __parse_novel_raw_name(txt_file)
        if info['cid'] == cid:
            target_base_name = info['basename']
            break

    if not target_base_name:
        return jsonify({'error': 'Chapter does not exist'}), 404

    # Find the corresponding translation file
    lang_file = f"{target_base_name}.{language}.json"
    lang_path = os.path.join(novel_path, lang_file)

    if not os.path.exists(lang_path):
        return jsonify({'error': f'{language} version does not exist'}), 404

    try:
        print("load ", lang_path)
        with open(lang_path, 'r', encoding='utf-8') as f:
            data = json.load(f)

        return jsonify(data)
    except Exception as e:
        return jsonify({'error': f'Failed to read translation file: {str(e)}'}), 500

# ================= Chapter Management API (CRUD) =================


@book_bp.route('/<novel_name>/chapters/update', methods=['POST'])
def update_chapter_api(novel_name):
    """
    Update Chapter API - supports create, update, delete
    Data structure: {
        "action": "create|update|delete",
        "cid": Chapter ID,
        "title": Chapter title,
        "content": Chapter content
    }
    """
    try:
        data = request.get_json()
        action = data.get('action', '').lower()
        cid = data.get('cid')
        title = data.get('title', '').strip()
        content = data.get('content', '').strip()

        if action not in ['create', 'update', 'delete']:
            return jsonify({'error': 'Invalid action type'}), 400

        if not cid or not isinstance(cid, int):
            return jsonify({'error': 'cid must be an integer'}), 400

        novel_path = os.path.join(NOVEL_DIR, novel_name)
        if not os.path.exists(novel_path):
            return jsonify({'error': 'Novel does not exist'}), 404

        print("Op: ", action)
        if action == 'delete':
            return _delete_chapter(novel_path, novel_name, cid)
        elif action == 'create':
            if not title or not content:
                return jsonify({'error': 'Title and content cannot be empty when creating a chapter'}), 400
            return _create_chapter(novel_path, novel_name, cid, title, content)
        elif action == 'update':
            if not title or not content:
                return jsonify({'error': 'Title and content cannot be empty when updating a chapter'}), 400
            return _update_chapter(novel_path, novel_name, cid, title, content)

    except Exception as e:
        return jsonify({'error': str(e)}), 500


@book_bp.route('/create', methods=['POST'])
def create_novel():
    """Create a new novel"""
    try:
        data = request.get_json()
        novel_name = data.get('name', '').strip()

        if not novel_name:
            return jsonify({'error': 'Novel name cannot be empty'}), 400

        # Generate safe directory name
        safe_name = novel_name.lower().replace(' ', '_')
        safe_name = ''.join(
            c for c in safe_name if c.isalnum() or c in ('_', '-'))

        # Create novel directory
        novel_dir = os.path.join(NOVEL_DIR, safe_name)
        if os.path.exists(novel_dir):
            return jsonify({'error': 'Novel already exists'}), 400

        os.makedirs(novel_dir, exist_ok=True)

        return jsonify({
            'success': True,
            'message': 'Novel created successfully',
            'name': safe_name
        })

    except Exception as e:
        return jsonify({'error': str(e)}), 500


def _create_chapter(novel_path, novel_name, cid, title, content):
    """Create a new chapter"""
    # Check if cid already exists
    txt_files = [f for f in os.listdir(novel_path) if f.endswith('.txt')]
    for txt_file in txt_files:
        info = __parse_novel_raw_name(txt_file)
        if info['cid'] == cid:
            return jsonify({'error': f'Chapter CID {cid} already exists'}), 400

    # Generate file name: [novel_name]_[cid]_[title].txt
    safe_title = __gen_novel_raw_name(cid, title)
    file_path = os.path.join(novel_path, safe_title)

    # Save chapter content
    with open(file_path, 'w', encoding='utf-8') as f:
        f.write(content)

    return jsonify({
        'success': True,
        'message': f'Chapter {cid} created successfully',
        'filename': file_path
    })


def _update_chapter(novel_path, novel_name, cid, title, content):
    """Update chapter"""
    # Find the file with the corresponding cid
    txt_files = [f for f in os.listdir(novel_path) if f.endswith('.txt')]
    target_file = None

    for txt_file in txt_files:
        info = __parse_novel_raw_name(txt_file)
        if info['cid'] == cid:
            target_file = txt_file
            break

    if not target_file:
        return jsonify({'error': f'Chapter CID {cid} does not exist'}), 404

    # Update content
    target_file = os.path.join(novel_path, target_file)
    with open(target_file, 'w', encoding='utf-8') as f:
        print("writing to file:", target_file)
        f.write(content)

    return jsonify({
        'success': True,
        'message': f'Chapter {title} updated successfully',
        'filename': target_file
    })


def _delete_chapter(novel_path, novel_name, cid):
    """Delete chapter"""
    # Find the file with the corresponding cid
    txt_files = [f for f in os.listdir(novel_path) if f.endswith('.txt')]
    target_file = None

    for txt_file in txt_files:
        info = __parse_novel_raw_name(txt_file)
        if info['cid'] == cid:
            target_file = txt_file
            break

    if not target_file:
        return jsonify({'error': f'Chapter CID {cid} does not exist'}), 404

    # Delete txt file
    file_path = os.path.join(novel_path, target_file)
    os.remove(file_path)

    # Delete related translation files
    base_name = target_file.replace(".txt", "")
    for lang in ['en', 'sw', 'fr']:
        lang_file = f"{base_name}.{lang}.json"
        lang_path = os.path.join(novel_path, lang_file)
        if os.path.exists(lang_path):
            os.remove(lang_path)

    return jsonify({
        'success': True,
        'message': f'Chapter {cid} deleted successfully'
    })

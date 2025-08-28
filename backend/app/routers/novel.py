# ================= Novel Management and Reading Routes =================
from flask import Blueprint, jsonify, request, g
import os
import json
from routers.user import login_required
from models.database import get_all_books, \
    get_user_all_books, \
    get_books_by_user, \
    get_books_by_ids, \
    append_user_book_list, \
    remove_user_book_list, \
    get_book_chapter_info, \
    get_chapter_content, \
    add_new_book, \
    delete_book, \
    add_or_update_chapter,\
    delete_chapter

from service.translation_service import (
    split_sentences,
    to_content,
    translate_content)


# ================= Refactored Novel API =================
book_bp = Blueprint('book', __name__, url_prefix='/api/book')


@book_bp.route('/list', methods=['GET'])
@login_required
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

    chapter_info = get_book_chapter_info(book_id, lang, level)
    if chapter_info == None:
        return jsonify({'error': 'No chapters found for this book'}), 404
    return jsonify(chapter_info)


# get chapter content by book_id and chapter_id
@book_bp.route('/content', methods=['POST'])
@login_required
def _get_chapter_content():
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

    chapter_data = get_chapter_content(book_id, chapter_id, lang, level)
    if chapter_data == None:
        return jsonify({'error': 'Chapter content not found'}), 404
    return jsonify(chapter_data)

# ================= Chapter Management API (CRUD) =================


# get books created by the user
@book_bp.route('/manage/list', methods=['GET'])
@login_required
def manage_user_books():
    """Get books created by the user (login required)"""

    userid = g.user['userid']
    if not userid:
        return jsonify({'error': 'User ID not found in token'}), 400

    books = get_books_by_user(userid)
    if not books:
        return jsonify([])
    return jsonify(books)


@book_bp.route('/manage/create', methods=['POST'])
@login_required
def _create_book():
    """Create a new novel (login required)"""
    try:
        data = request.get_json()
        novel_name = data.get('name', None)
        if not novel_name:
            return jsonify({'error': 'Novel name cannot be empty'}), 400
        novel_name = novel_name.strip()

        org_lang = data.get('org_lang', 'en')
        if not org_lang or not isinstance(org_lang, str):
            return jsonify({'error': 'org_lang cannot be empty'}), 400
        org_lang = org_lang.strip().lower()

        supported_lang = data.get('supported_lang', None)
        if not supported_lang:
            return jsonify({'error': 'supported_lang cannot be empty'}), 400
        supported_lang = str(supported_lang).strip().lower()

        levels = data.get('levels', None)
        if not levels or not isinstance(levels, list):
            return jsonify({'error': 'levels cannot be empty'}), 400
        levels = [str(level).strip().lower()
                  for level in levels if str(level).strip()]

        userid = g.user['userid']

        if not userid:
            return jsonify({'error': 'User ID not found in token'}), 400

        if not novel_name:
            return jsonify({'error': 'Novel name cannot be empty'}), 400

        info = {
            'book_name': novel_name,
            'user_id': userid,
            'org_lang': org_lang,
            'support_language': [
                {
                    'lang': org_lang,
                    # a temporay solution
                    'level': 'c2' if org_lang == supported_lang[0] else levels
                },
                {
                    'lang': supported_lang,
                    'level': levels
                }]
        }

        print(info)
        # add new book to database
        book_id = add_new_book(info)
        if not book_id:
            return jsonify({'error': 'Failed to create novel'}), 500

        return jsonify({
            'success': True,
            'message': 'Novel created successfully',
            'book_id': book_id
        })

    except Exception as e:
        return jsonify({'error': str(e)}), 500


# delete a book
@book_bp.route('/manage/delete', methods=['POST'])
@login_required
def _delete_book():
    """Delete a novel (login required)"""
    try:
        data = request.get_json()
        book_id = data.get('book_id', None)
        if not book_id or not isinstance(book_id, int):
            return jsonify({'error': 'book_id must be an integer'}), 400

        userid = g.user['userid']

        if not userid:
            return jsonify({'error': 'User ID not found in token'}), 400

        # delete book from database
        success, msg = delete_book(book_id, userid)
        return jsonify({
            'success': success,
            'message': msg
        })

    except Exception as e:
        return jsonify({'error': str(e)}), 500


# add a new chapter
@book_bp.route('/manage/chapter/add', methods=['POST'])
@login_required
def _add_chapter():
    data = request.get_json()
    book_id = data.get('book_id', None)
    title = data.get('title', '').strip()
    # content is raw text content
    content = data.get('content', '').strip()
    if not book_id:
        return jsonify({'error': 'book_id parameter is required'}), 400
    if not title:
        return jsonify({'error': 'Chapter title cannot be empty'}), 400
    if not content:
        return jsonify({'error': 'Chapter content cannot be empty'}), 400
    userid = g.user['userid']
    if not userid:
        return jsonify({'error': 'User ID not found in token'}), 400
    # add new chapter to database

    # get book info
    book = get_books_by_ids([book_id])[0]
    if not book:
        return jsonify({'error': 'Book not found'}), 404
    
    # get book org language and level
    src_lang = book['support_language'][0]['lang']
    dst_lang = book['support_language'][1]['lang']
    dst_level = book['support_language'][1]['level']
    
    src_content = to_content(split_sentences(content))
    dst_content = src_content
    if dst_lang != src_lang:
        dst_content = translate_content(content, src_lang, dst_lang, dst_level)
    res, msg = add_or_update_chapter(book_id, userid, title, src_content, dst_content)

    if not res:
        return jsonify({'error': msg}), 500
    return jsonify({
        'success': True,
        'message': 'Chapter added successfully'
    })

# update an existing chapter
@book_bp.route('/manage/chapter/update', methods=['POST'])
@login_required
def _update_chapter():
    data = request.get_json()
    book_id = data.get('book_id', None)
    chapter_id = data.get('chapter_id', None)
    title = data.get('title', '').strip()
    # content is raw text content
    content = data.get('content', '').strip()
    if not book_id:
        return jsonify({'error': 'book_id parameter is required'}), 400
    if not chapter_id:
        return jsonify({'error': 'chapter_id parameter is required'}), 400
    if not title:
        return jsonify({'error': 'Chapter title cannot be empty'}), 400
    if not content:
        return jsonify({'error': 'Chapter content cannot be empty'}), 400
    userid = g.user['userid']
    if not userid:
        return jsonify({'error': 'User ID not found in token'}), 400
    # update chapter in database
    # get book info
    book = get_books_by_ids([book_id])[0]
    if not book:
        return jsonify({'error': 'Book not found'}), 404
    
    print("Updating chapter:", book_id, chapter_id, title)
    src_lang = book['support_language'][0]['lang']
    dst_lang = book['support_language'][1]['lang']
    dst_level = book['support_language'][1]['level']
    
    src_content = to_content(split_sentences(content))
    dst_content = src_content
    if dst_lang != src_lang:
        dst_content = translate_content(content, src_lang, dst_lang, dst_level)
    res, msg = add_or_update_chapter(book_id, userid, title, src_content, dst_content, chapter_id)

    if not res:
        return jsonify({'error': msg}), 500
    return jsonify({
        'success': True,
        'message': 'Chapter updated successfully'
    })


@book_bp.route('/manage/chapter/delete', methods=['POST'])
@login_required
def _delete_chapter():
    data = request.get_json()
    book_id = data.get('book_id', None)
    chapter_id = data.get('chapter_id', None)
    if not book_id:
        return jsonify({'error': 'book_id parameter is required'}), 400
    if not chapter_id:
        return jsonify({'error': 'chapter_id parameter is required'}), 400
    userid = g.user['userid']
    if not userid:
        return jsonify({'error': 'User ID not found in token'}), 400
    # delete chapter from database
    res, msg = delete_chapter(book_id, chapter_id, userid)

    if not res:
        return jsonify({'error': msg}), 500
    return jsonify({
        'success': True,
        'message': 'Chapter deleted successfully'
    })



# @book_bp.route('/<novel_name>/chapters/update', methods=['POST'])
# def update_chapter_api(novel_name):
#     """
#     Update Chapter API - supports create, update, delete
#     Data structure: {
#         "action": "create|update|delete",
#         "cid": Chapter ID,
#         "title": Chapter title,
#         "content": Chapter content
#     }
#     """
#     try:
#         data = request.get_json()
#         action = data.get('action', '').lower()
#         cid = data.get('cid')
#         title = data.get('title', '').strip()
#         content = data.get('content', '').strip()

#         if action not in ['create', 'update', 'delete']:
#             return jsonify({'error': 'Invalid action type'}), 400

#         if not cid or not isinstance(cid, int):
#             return jsonify({'error': 'cid must be an integer'}), 400

#         novel_path = os.path.join(NOVEL_DIR, novel_name)
#         if not os.path.exists(novel_path):
#             return jsonify({'error': 'Novel does not exist'}), 404

#         print("Op: ", action)
#         if action == 'delete':
#             return _delete_chapter(novel_path, novel_name, cid)
#         elif action == 'create':
#             if not title or not content:
#                 return jsonify({'error': 'Title and content cannot be empty when creating a chapter'}), 400
#             return _create_chapter(novel_path, novel_name, cid, title, content)
#         elif action == 'update':
#             if not title or not content:
#                 return jsonify({'error': 'Title and content cannot be empty when updating a chapter'}), 400
#             return _update_chapter(novel_path, novel_name, cid, title, content)

#     except Exception as e:
#         return jsonify({'error': str(e)}), 500


# @book_bp.route('/create', methods=['POST'])
# def create_book():
#     """Create a new novel"""
#     try:
#         data = request.get_json()
#         novel_name = data.get('name', '').strip()

#         if not novel_name:
#             return jsonify({'error': 'Novel name cannot be empty'}), 400

#         # Generate safe directory name
#         safe_name = novel_name.lower().replace(' ', '_')
#         safe_name = ''.join(
#             c for c in safe_name if c.isalnum() or c in ('_', '-'))

#         # Create novel directory
#         novel_dir = os.path.join(NOVEL_DIR, safe_name)
#         if os.path.exists(novel_dir):
#             return jsonify({'error': 'Novel already exists'}), 400

#         os.makedirs(novel_dir, exist_ok=True)

#         return jsonify({
#             'success': True,
#             'message': 'Novel created successfully',
#             'name': safe_name
#         })

#     except Exception as e:
#         return jsonify({'error': str(e)}), 500


# def _create_chapter(novel_path, novel_name, cid, title, content):
#     """Create a new chapter"""
#     # Check if cid already exists
#     txt_files = [f for f in os.listdir(novel_path) if f.endswith('.txt')]
#     for txt_file in txt_files:
#         info = __parse_novel_raw_name(txt_file)
#         if info['cid'] == cid:
#             return jsonify({'error': f'Chapter CID {cid} already exists'}), 400

#     # Generate file name: [novel_name]_[cid]_[title].txt
#     safe_title = __gen_novel_raw_name(cid, title)
#     file_path = os.path.join(novel_path, safe_title)

#     # Save chapter content
#     with open(file_path, 'w', encoding='utf-8') as f:
#         f.write(content)

#     return jsonify({
#         'success': True,
#         'message': f'Chapter {cid} created successfully',
#         'filename': file_path
#     })


# def _update_chapter(novel_path, novel_name, cid, title, content):
#     """Update chapter"""
#     # Find the file with the corresponding cid
#     txt_files = [f for f in os.listdir(novel_path) if f.endswith('.txt')]
#     target_file = None

#     for txt_file in txt_files:
#         info = __parse_novel_raw_name(txt_file)
#         if info['cid'] == cid:
#             target_file = txt_file
#             break

#     if not target_file:
#         return jsonify({'error': f'Chapter CID {cid} does not exist'}), 404

#     # Update content
#     target_file = os.path.join(novel_path, target_file)
#     with open(target_file, 'w', encoding='utf-8') as f:
#         print("writing to file:", target_file)
#         f.write(content)

#     return jsonify({
#         'success': True,
#         'message': f'Chapter {title} updated successfully',
#         'filename': target_file
#     })


# def _delete_chapter(novel_path, novel_name, cid):
#     """Delete chapter"""
#     # Find the file with the corresponding cid
#     txt_files = [f for f in os.listdir(novel_path) if f.endswith('.txt')]
#     target_file = None

#     for txt_file in txt_files:
#         info = __parse_novel_raw_name(txt_file)
#         if info['cid'] == cid:
#             target_file = txt_file
#             break

#     if not target_file:
#         return jsonify({'error': f'Chapter CID {cid} does not exist'}), 404

#     # Delete txt file
#     file_path = os.path.join(novel_path, target_file)
#     os.remove(file_path)

#     # Delete related translation files
#     base_name = target_file.replace(".txt", "")
#     for lang in ['en', 'sw', 'fr']:
#         lang_file = f"{base_name}.{lang}.json"
#         lang_path = os.path.join(novel_path, lang_file)
#         if os.path.exists(lang_path):
#             os.remove(lang_path)

#     return jsonify({
#         'success': True,
#         'message': f'Chapter {cid} deleted successfully'
#     })
